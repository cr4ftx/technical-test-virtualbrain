import { mkdir, readFile, writeFile } from 'node:fs/promises'
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
	const load = async (): Promise<Pokemon[]> => {
		const cached = await readCache(cacheFile)
		if (cached) return cached

		const pokemons = await build()
		await mkdir(dirname(cacheFile), { recursive: true })
		await writeFile(cacheFile, JSON.stringify(pokemons))
		return pokemons
	}

	return { load }
}
