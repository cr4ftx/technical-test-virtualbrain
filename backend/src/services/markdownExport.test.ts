import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { Pokemon } from '../types/pokemon.ts'
import { exportPokedexMarkdown } from './markdownExport.ts'

const pokemon = (id: number, name: string) => ({
	id,
	pokedexId: id,
	name,
	slug: name,
	image: '',
	sprite: '',
	stats: { HP: 1, attack: 1, defense: 1, special_attack: 1, special_defense: 1, speed: 1 },
	apiTypes: [{ name: 'grass', image: '' }],
	apiGeneration: 1,
	apiResistances: [],
	apiResistancesWithAbilities: [],
	resistanceModifyingAbilitiesForApi: { name: '', slug: '' },
	apiEvolutions: [],
	apiPreEvolution: 'none'
}) satisfies Pokemon

const bulbasaur = pokemon(1, 'bulbasaur')
const ivysaur = pokemon(2, 'ivysaur')

let dir: string
let folder: string

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), 'markdown-export-'))
	folder = join(dir, 'exports', 'pokemons')
})

afterEach(async () => {
	await rm(dir, { recursive: true, force: true })
})

describe('exportPokedexMarkdown', () => {
	it('writes one Markdown file per Pokémon and reports how many', async () => {
		expect(await exportPokedexMarkdown([bulbasaur, ivysaur], folder)).toEqual({ count: 2, folder })

		expect((await readdir(folder)).sort()).toEqual(['0001-bulbasaur.md', '0002-ivysaur.md'])
		expect(await readFile(join(folder, '0002-ivysaur.md'), 'utf8')).toMatch(/^# Ivysaur \(#0002\)\n/)
	})

	it('leaves only the latest export in the folder when run again', async () => {
		await exportPokedexMarkdown([bulbasaur, ivysaur], folder)

		expect(await exportPokedexMarkdown([bulbasaur], folder)).toEqual({ count: 1, folder })
		expect((await readdir(folder)).sort()).toEqual(['0001-bulbasaur.md'])
	})
})
