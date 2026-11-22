import { type Request, type Response, Router } from 'express'
import { HttpError } from '../errors.ts'
import { buildBattlePrompt } from '../services/battlePrompt.ts'
import { parseBattleRequest } from '../services/battleRequest.ts'
import { battleEvents, sseFrame } from '../services/battleStream.ts'
import { findPokemon } from '../services/pokedex.ts'
import { createVirtualBrainClient } from '../services/virtualbrain.ts'

const BattleController = Router()

const VIRTUALBRAIN_TOKEN = process.env.VIRTUALBRAIN_TOKEN
const virtualbrain = VIRTUALBRAIN_TOKEN ? createVirtualBrainClient({ apiKey: VIRTUALBRAIN_TOKEN }) : undefined

/**
 * Stream the chatbot's narration of a whole battle between two Pokémon, as Server-Sent Events
 * (`text`, then `end` or `error`) over the POST response
 * @route POST /battles
 * @group Battles
 * @param {object} body.required - `{ pokemonIds: [number, number] }`
 */
BattleController.post(
	'/',
	async (req: Request, res: Response) => {
		const { pokemonIds: [firstId, secondId] } = parseBattleRequest(req.body)
		if (!virtualbrain) throw new HttpError(503, 'Battles are unavailable: VIRTUALBRAIN_TOKEN is not set')
		// Resolved before the stream opens, so an unknown Pokémon or a PokeAPI outage is still a plain JSON error
		const [first, second] = await Promise.all([findPokemon(firstId), findPokemon(secondId)])

		// The client leaving (back button, closed tab) stops the chatbot request instead of streaming into the void
		const disconnected = new AbortController()
		res.on('close', () => disconnected.abort())

		res.status(200).set({ 'content-type': 'text/event-stream', 'cache-control': 'no-cache' }).flushHeaders()

		const chunks = virtualbrain.streamCompletion(buildBattlePrompt(first, second), disconnected.signal)
		for await (const event of battleEvents(chunks)) {
			if (disconnected.signal.aborted) break
			res.write(sseFrame(event))
		}
		res.end()
	}
)

export { BattleController }
