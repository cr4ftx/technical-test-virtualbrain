import { access, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Pokemon } from '../types/pokemon.ts'
import { createPokedexStore } from './pokedex.ts'

const bulbasaur = { id: 1, name: 'bulbasaur' } as Pokemon
const ivysaur = { id: 2, name: 'ivysaur' } as Pokemon

let dir: string
let cacheFile: string

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'pokedex-'))
	cacheFile = join(dir, 'cache', 'pokedex.json')
})

afterEach(async () => {
	await rm(dir, { recursive: true, force: true })
})

describe('pokedex store', () => {
	it('builds once, then later boots load the dataset from the cache file', async () => {
		const build = vi.fn(async () => [bulbasaur, ivysaur])
		expect(await createPokedexStore({ cacheFile, build }).load()).toEqual([bulbasaur, ivysaur])

		const rebuild = vi.fn(async () => [])
		const nextBoot = createPokedexStore({ cacheFile, build: rebuild })

		expect(await nextBoot.load()).toEqual([bulbasaur, ivysaur])
		expect(build).toHaveBeenCalledTimes(1)
		expect(rebuild).not.toHaveBeenCalled()
	})

	it('makes requests arriving during a build await that same build', async () => {
		const { promise, resolve } = Promise.withResolvers<Pokemon[]>()
		const build = vi.fn(() => promise)
		const store = createPokedexStore({ cacheFile, build })

		const requests = [store.load(), store.load(), store.load()]
		await vi.waitFor(() => expect(build).toHaveBeenCalled())
		resolve([bulbasaur])

		expect(await Promise.all(requests)).toEqual([[bulbasaur], [bulbasaur], [bulbasaur]])
		expect(build).toHaveBeenCalledTimes(1)
	})

	it('writes nothing when a build fails, and the next request starts a fresh build', async () => {
		const build = vi.fn<() => Promise<Pokemon[]>>()
			.mockRejectedValueOnce(new Error('PokeAPI down'))
			.mockResolvedValueOnce([bulbasaur])
		const store = createPokedexStore({ cacheFile, build })

		await expect(store.load()).rejects.toThrow('PokeAPI down')
		await expect(access(cacheFile)).rejects.toMatchObject({ code: 'ENOENT' })

		expect(await store.load()).toEqual([bulbasaur])
		expect(build).toHaveBeenCalledTimes(2)
	})

	it('peeks at the dataset only once it is loaded, without waiting for a build', async () => {
		const { promise, resolve } = Promise.withResolvers<Pokemon[]>()
		const store = createPokedexStore({ cacheFile, build: () => promise })

		const loading = store.load()
		expect(store.peek()).toBeUndefined()

		resolve([bulbasaur])
		await loading
		expect(store.peek()).toEqual([bulbasaur])
	})
})
