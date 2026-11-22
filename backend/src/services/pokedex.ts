import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import type { Pokemon } from '../types/pokemon.ts'

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

	const load = (): Promise<Pokemon[]> => {
		pokedex ??= loadOrBuild().catch((error: unknown) => {
			pokedex = undefined
			throw error
		})
		return pokedex
	}

	return { load }
}
