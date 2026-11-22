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
	let pokedex: Promise<Pokemon[]> | undefined
	let loaded: Pokemon[] | undefined

	const load = (): Promise<Pokemon[]> => {
		pokedex ??= loadOrBuild().then(
			pokemons => (loaded = pokemons),
			(error: unknown) => {
				pokedex = undefined
				throw error
			}
		)
		return pokedex
	}

	/** The dataset if it is already loaded, without triggering or awaiting a build */
	const peek = (): Pokemon[] | undefined => loaded

	return { load, peek }
}

const CACHE_FILE = join(import.meta.dirname, '../../cache/pokedex.json')

/** Every gen 1–8 pokemon: requests are fired all at once, the PokeAPI client caps how many run */
const buildPokedex = (): Promise<Pokemon[]> =>
	Promise.all(Array.from({ length: MAX_POKEMON_ID }, (_, i) => fetchPokemon(i + 1)))

export const pokedex = createPokedexStore({ cacheFile: CACHE_FILE, build: buildPokedex })
