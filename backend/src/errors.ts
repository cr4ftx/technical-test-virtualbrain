/** Error carrying an HTTP status, rendered as-is by the error handler */
export class HttpError extends Error {
	constructor(public readonly status: number, message: string) {
		super(message)
		this.name = 'HttpError'
	}
}

/** Gen 1 to 8 */
export const MAX_POKEMON_ID = 898

/** Parse and validate a pokemon id route param */
export const parsePokemonId = (raw: string): number => {
	const id = Number(raw)
	if (!Number.isInteger(id) || id < 1 || id > MAX_POKEMON_ID) {
		throw new HttpError(400, `Pokemon id must be an integer between 1 and ${MAX_POKEMON_ID}`)
	}
	return id
}
