import { randomUUID } from 'node:crypto'
import { type Request, type Response, Router } from 'express'
import { HttpError } from '../errors.ts'
import { createFighter } from '../services/battleEngine.ts'
import { parseBattleMode } from '../services/battleMode.ts'
import { fetchBattleMoves } from '../services/battleMoves.ts'
import { buildBattlePrompt } from '../services/battlePrompt.ts'
import { parseBattleRequest } from '../services/battleRequest.ts'
import { battleEvents, sseFrame } from '../services/battleStream.ts'
import { findPokemon } from '../services/pokedex.ts'
import { buildRoundPrompt } from '../services/roundPrompt.ts'
import { playRound, type TurnBasedBattle } from '../services/turnBasedRound.ts'
import { createVirtualBrainClient } from '../services/virtualbrain.ts'

const BattleController = Router()

// Read once at import, so a typo stops the server at boot instead of failing the first battle
const BATTLE_MODE = parseBattleMode(process.env.BATTLE_MODE)

const VIRTUALBRAIN_TOKEN = process.env.VIRTUALBRAIN_TOKEN
const virtualbrain = VIRTUALBRAIN_TOKEN ? createVirtualBrainClient({ apiKey: VIRTUALBRAIN_TOKEN }) : undefined

type Conversation = ReturnType<NonNullable<typeof virtualbrain>['openConversation']>

// Turn-based battles in progress, each with the chatbot conversation picking its moves, dropped on KO.
// A battle abandoned mid-way stays until the server restarts
const battles = new Map<string, TurnBasedBattle & { conversation: Conversation }>()

const requireVirtualBrain = () => {
	if (!virtualbrain) throw new HttpError(503, 'Battles are unavailable: VIRTUALBRAIN_TOKEN is not set')
	return virtualbrain
}

const openEventStream = (res: Response) =>
	res.status(200).set({ 'content-type': 'text/event-stream', 'cache-control': 'no-cache' }).flushHeaders()

// The client leaving (back button, closed tab) stops the chatbot request instead of streaming into the void
const abortOnDisconnect = (res: Response): AbortSignal => {
	const disconnected = new AbortController()
	res.on('close', () => disconnected.abort())
	return disconnected.signal
}

const streamOneShotBattle = async (res: Response, [firstId, secondId]: [number, number]) => {
	const virtualbrain = requireVirtualBrain()
	// Resolved before the stream opens, so an unknown Pokémon or a PokeAPI outage is still a plain JSON error
	const [first, second] = await Promise.all([findPokemon(firstId), findPokemon(secondId)])

	const disconnected = abortOnDisconnect(res)
	openEventStream(res)

	const chunks = virtualbrain.streamCompletion(buildBattlePrompt(first, second), disconnected)
	for await (const event of battleEvents(chunks)) {
		if (disconnected.aborted) break
		res.write(sseFrame(event))
	}
	res.end()
}

const createTurnBasedBattle = async (res: Response, ids: [number, number]) => {
	const virtualbrain = requireVirtualBrain()
	const fighter = async (id: number) => {
		const [pokemon, moves] = await Promise.all([findPokemon(id), fetchBattleMoves(id)])
		return createFighter(pokemon, moves)
	}
	const [first, second] = await Promise.all([fighter(ids[0]), fighter(ids[1])])
	const battleId = randomUUID()
	battles.set(battleId, { state: { fighters: [first, second], round: 0 }, conversation: virtualbrain.openConversation() })

	res.status(201).json({
		battleId,
		fighters: [first, second].map(({ hp, maxHp }) => ({ hp, maxHp }))
	})
}

/**
 * How battles are played, so the frontend knows which arena to show: `{ mode: 'one-shot' | 'turn-based' }`
 * @route GET /battles/mode
 * @group Battles
 */
BattleController.get('/mode', (_req: Request, res: Response) => {
	res.json({ mode: BATTLE_MODE })
})

/**
 * Start a battle between two Pokémon, in the mode set by `BATTLE_MODE`.
 * One-shot: streams the chatbot's narration of the whole battle as Server-Sent Events (`text`, then `end` or `error`).
 * Turn-based: answers 201 with `{ battleId, fighters }`, each fighter's HP; rounds are played one by one.
 * @route POST /battles
 * @group Battles
 * @param {object} body.required - `{ pokemonIds: [number, number] }`
 */
BattleController.post(
	'/',
	async (req: Request, res: Response) => {
		const pokemonIds = parseBattleRequest(req.body)
		if (BATTLE_MODE === 'turn-based') await createTurnBasedBattle(res, pokemonIds)
		else await streamOneShotBattle(res, pokemonIds)
	}
)

/**
 * Play the next round of a turn-based battle as Server-Sent Events: the chatbot narrates and picks each Pokémon's
 * move (`text` events), the engine resolves the round (`round`), then `end`. A failed narration ends with `error`
 * and leaves the battle as it was, so the round can be asked for again
 * @route POST /battles/{battleId}/rounds
 * @group Battles
 */
BattleController.post(
	'/:battleId/rounds',
	async (req: Request<{ battleId: string }>, res: Response) => {
		const { battleId } = req.params
		const battle = battles.get(battleId)
		if (!battle) throw new HttpError(404, 'Battle not found: it may be over already')

		const disconnected = abortOnDisconnect(res)
		openEventStream(res)

		const chunks = battle.conversation.stream(buildRoundPrompt(battle.state, battle.previous), disconnected)
		const round = playRound(battle, chunks, Math.random)
		let step = await round.next()
		for (; !step.done; step = await round.next()) res.write(sseFrame(step.value))

		const next = step.value
		// No round played: the narration failed (its `error` event is sent) or the client left
		if (!next) {
			res.end()
			return
		}
		if (next.state.winner === undefined) battles.set(battleId, { ...next, conversation: battle.conversation })
		else battles.delete(battleId)
		res.write(sseFrame({ type: 'end' }))
		res.end()
	}
)

export { BattleController }
