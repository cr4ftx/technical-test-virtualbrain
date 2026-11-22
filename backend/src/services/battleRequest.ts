import { HttpError, MAX_POKEMON_ID } from '../errors.ts'

export type BattleMode = 'one-shot' | 'turn-based'

export interface BattleRequest {
	pokemonIds: [number, number]
	mode: BattleMode
}

const isPokemonId = (value: unknown): value is number =>
	typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_POKEMON_ID

const isBattleMode = (value: unknown): value is BattleMode => value === 'one-shot' || value === 'turn-based'

/** Validate a `POST /battles` body: `{ pokemonIds: [id, id], mode?: 'one-shot' | 'turn-based' }` */
export const parseBattleRequest = (body: unknown): BattleRequest => {
	const fields = typeof body === 'object' && body !== null ? body : {}
	const ids: unknown = 'pokemonIds' in fields ? fields.pokemonIds : undefined
	if (!Array.isArray(ids) || ids.length !== 2 || !ids.every(isPokemonId)) {
		throw new HttpError(400, `pokemonIds must be two integers between 1 and ${MAX_POKEMON_ID}`)
	}
	const mode: unknown = 'mode' in fields ? fields.mode : 'one-shot'
	if (!isBattleMode(mode)) throw new HttpError(400, 'mode must be "one-shot" or "turn-based"')
	return { pokemonIds: [ids[0], ids[1]], mode }
}
