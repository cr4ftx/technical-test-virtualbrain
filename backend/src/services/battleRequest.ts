import { HttpError, MAX_POKEMON_ID } from '../errors.ts'

export type BattlePokemonIds = [number, number]

const isPokemonId = (value: unknown): value is number =>
	typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= MAX_POKEMON_ID

/** Validate a `POST /battles` body: `{ pokemonIds: [id, id] }` */
export const parseBattleRequest = (body: unknown): BattlePokemonIds => {
	const ids: unknown = typeof body === 'object' && body !== null && 'pokemonIds' in body ? body.pokemonIds : undefined
	if (!Array.isArray(ids) || ids.length !== 2 || !ids.every(isPokemonId)) {
		throw new HttpError(400, `pokemonIds must be two integers between 1 and ${MAX_POKEMON_ID}`)
	}
	return [ids[0], ids[1]]
}
