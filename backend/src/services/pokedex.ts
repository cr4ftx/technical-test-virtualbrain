import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { MAX_POKEMON_ID } from '../errors.ts'
import type { Pokemon } from '../types/pokemon.ts'
import { fetchPokemon } from './pokeapi.ts'

interface PokedexStoreOptions {
	cacheFile: string
	build: () => Promise<Pokemon[]>
}

const readCache = async (cacheFile: string): Promise<Pokemon[] | undefined> => {
	try {
		return JSON.parse(await readFile(cacheFile, 'utf8')) as Pokemon[]
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
		// A corrupt cache (hand edit, disk full...) would otherwise fail every request until deleted by hand
		if (error instanceof SyntaxError) return undefined
		throw error
	}
}

/** Full Pokédex dataset, built once and persisted to a JSON cache file */
export function createPokedexStore({ cacheFile, build }: PokedexStoreOptions) {
	const loadOrBuild = async (): Promise<Pokemon[]> => {
		const cached = await readCache(cacheFile)
		if (cached) return cached

		const pokemons = await build()
		await mkdir(dirname(cacheFile), { recursive: true })
		// Rename is atomic: a crash mid-write never leaves a truncated cache for the next boot
		const tmpFile = `${cacheFile}.tmp`
		await writeFile(tmpFile, JSON.stringify(pokemons))
		await rename(tmpFile, cacheFile)
		return pokemons
	}

	// Shared by every caller, so concurrent requests never start a second build
	let pending: Promise<Pokemon[]> | undefined
	let loaded: Pokemon[] | undefined

	const load = (): Promise<Pokemon[]> => {
		pending ??= loadOrBuild().then(
			pokemons => (loaded = pokemons),
			(error: unknown) => {
				pending = undefined
				throw error
			}
		)
		return pending
	}

	/** The dataset if it is already loaded, without triggering or awaiting a build */
	const peek = (): Pokemon[] | undefined => loaded

	return { load, peek }
}

const CACHE_FILE = join(import.meta.dirname, '../../cache/pokedex.json')

/** Every gen 1–8 pokemon: requests are fired all at once, the PokeAPI client caps how many run */
const buildPokedex = async (): Promise<Pokemon[]> => {
	const controller = new AbortController()
	try {
		return await Promise.all(
			Array.from({ length: MAX_POKEMON_ID }, (_, i) => fetchPokemon(i + 1, controller.signal))
		)
	} finally {
		// Once one pokemon fails the build is lost: drop the thousands of requests still queued for a slot
		controller.abort()
	}
}

export const pokedex = createPokedexStore({ cacheFile: CACHE_FILE, build: buildPokedex })

/** A Pokémon from the Pokédex cache when it is loaded, otherwise live from PokeAPI, without waiting for a build */
export const findPokemon = async (id: number): Promise<Pokemon> =>
	pokedex.peek()?.find(p => p.id === id) ?? await fetchPokemon(id)
