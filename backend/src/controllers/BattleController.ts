import { randomUUID } from 'node:crypto'
import { type Request, type Response, Router } from 'express'
import { HttpError } from '../errors.ts'
import { createFighter, resolveRound, type BattleMove, type BattleState } from '../services/battleEngine.ts'
import { parseBattleMode } from '../services/battleMode.ts'
import { fetchBattleMoves } from '../services/battleMoves.ts'
import { buildBattlePrompt } from '../services/battlePrompt.ts'
import { parseBattleRequest } from '../services/battleRequest.ts'
import { battleEvents, sseFrame } from '../services/battleStream.ts'
import { findPokemon } from '../services/pokedex.ts'
import { createVirtualBrainClient } from '../services/virtualbrain.ts'

const BattleController = Router()

// Read once at import, so a typo stops the server at boot instead of failing the first battle
const BATTLE_MODE = parseBattleMode(process.env.BATTLE_MODE)

const VIRTUALBRAIN_TOKEN = process.env.VIRTUALBRAIN_TOKEN
const virtualbrain = VIRTUALBRAIN_TOKEN ? createVirtualBrainClient({ apiKey: VIRTUALBRAIN_TOKEN }) : undefined

// Turn-based battles in progress, dropped on KO. A battle abandoned mid-way stays until the server restarts
const battles = new Map<string, BattleState>()

const openEventStream = (res: Response) =>
	res.status(200).set({ 'content-type': 'text/event-stream', 'cache-control': 'no-cache' }).flushHeaders()

const streamOneShotBattle = async (res: Response, [firstId, secondId]: [number, number]) => {
	if (!virtualbrain) throw new HttpError(503, 'Battles are unavailable: VIRTUALBRAIN_TOKEN is not set')
	// Resolved before the stream opens, so an unknown Pokémon or a PokeAPI outage is still a plain JSON error
	const [first, second] = await Promise.all([findPokemon(firstId), findPokemon(secondId)])

	// The client leaving (back button, closed tab) stops the chatbot request instead of streaming into the void
	const disconnected = new AbortController()
	res.on('close', () => disconnected.abort())

	openEventStream(res)

	const chunks = virtualbrain.streamCompletion(buildBattlePrompt(first, second), disconnected.signal)
	for await (const event of battleEvents(chunks)) {
		if (disconnected.signal.aborted) break
		res.write(sseFrame(event))
	}
	res.end()
}

const createTurnBasedBattle = async (res: Response, ids: [number, number]) => {
	const fighter = async (id: number) => {
		const [pokemon, moves] = await Promise.all([findPokemon(id), fetchBattleMoves(id)])
		return createFighter(pokemon, moves)
	}
	const [first, second] = await Promise.all([fighter(ids[0]), fighter(ids[1])])
	const battleId = randomUUID()
	battles.set(battleId, { fighters: [first, second], round: 0 })

	res.status(201).json({
		battleId,
		fighters: [first, second].map(({ hp, maxHp }) => ({ hp, maxHp }))
	})
}

const randomMove = (moves: BattleMove[]): BattleMove => moves[Math.floor(Math.random() * moves.length)]

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
 * Play the next round of a turn-based battle, with a random move for each Pokémon, as Server-Sent Events:
 * a `round` event, then `end`
 * @route POST /battles/{battleId}/rounds
 * @group Battles
 */
BattleController.post(
	'/:battleId/rounds',
	(req: Request<{ battleId: string }>, res: Response) => {
		const { battleId } = req.params
		const battle = battles.get(battleId)
		if (!battle) throw new HttpError(404, 'Battle not found: it may be over already')

		const [first, second] = battle.fighters
		const { state, result } = resolveRound(battle, [randomMove(first.moves), randomMove(second.moves)], Math.random)
		if (state.winner === undefined) battles.set(battleId, state)
		else battles.delete(battleId)

		openEventStream(res)
		res.write(sseFrame({ type: 'round', ...result }))
		res.write(sseFrame({ type: 'end' }))
		res.end()
	}
)

export { BattleController }
