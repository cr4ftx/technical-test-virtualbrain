import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBattleMoves, selectBattleMoves, type ApiMove, type ApiPokemonMove } from './battleMoves.ts'
import { pokeapi } from './pokeapi.ts'

// The real names of the groups a test depends on: PokeAPI added the Japanese Gen 1 games after Scarlet/Violet
const VERSION_GROUP_NAMES: Record<number, string> = { 25: 'scarlet-violet', 28: 'red-green-japan', 29: 'blue-japan' }

const versionGroup = (id: number) => ({
	name: VERSION_GROUP_NAMES[id] ?? `group-${id}`,
	url: `https://pokeapi.co/api/v2/version-group/${id}/`
})

/** A move as listed on a Pokémon: learned by level-up at `level` in each of the given version groups */
const learned = (name: string, levels: Record<number, number>, method = 'level-up'): ApiPokemonMove => ({
	move: { name, url: `https://pokeapi.co/api/v2/move/${name}/` },
	version_group_details: Object.entries(levels).map(([group, level]) => ({
		level_learned_at: level,
		move_learn_method: { name: method, url: '' },
		version_group: versionGroup(Number(group))
	}))
})

const move = (name: string, power: number | null, damageClass = 'physical', accuracy: number | null = 100): ApiMove => ({
	name,
	power,
	accuracy,
	type: { name: 'normal', url: '' },
	damage_class: { name: damageClass, url: '' }
})

const details = (...moves: ApiMove[]) => new Map(moves.map(m => [m.name, m]))

describe('selectBattleMoves', () => {
	it('keeps the 4 damaging level-up moves learned last, latest first', () => {
		const pokemonMoves = [
			learned('tackle', { 20: 1 }),
			learned('quick-attack', { 20: 10 }),
			learned('slam', { 20: 20 }),
			learned('thunderbolt', { 20: 30 }),
			learned('thunder', { 20: 40 })
		]
		const moves = details(
			move('tackle', 40), move('quick-attack', 40), move('slam', 80),
			{ ...move('thunderbolt', 90, 'special'), type: { name: 'electric', url: '' } },
			{ ...move('thunder', 110, 'special', 70), type: { name: 'electric', url: '' } }
		)

		expect(selectBattleMoves(pokemonMoves, moves)).toEqual([
			{ name: 'thunder', power: 110, type: 'electric', accuracy: 70, damageClass: 'special' },
			{ name: 'thunderbolt', power: 90, type: 'electric', accuracy: 100, damageClass: 'special' },
			{ name: 'slam', power: 80, type: 'normal', accuracy: 100, damageClass: 'physical' },
			{ name: 'quick-attack', power: 40, type: 'normal', accuracy: 100, damageClass: 'physical' }
		])
	})

	it('skips status moves, moves without a fixed power and moves not learned by level-up', () => {
		const pokemonMoves = [
			learned('tackle', { 20: 1 }),
			learned('growl', { 20: 5 }),
			learned('flail', { 20: 9 }),
			learned('hyper-beam', { 20: 0 }, 'machine')
		]
		const moves = details(move('tackle', 40), move('growl', null, 'status'), move('flail', null), move('hyper-beam', 150, 'special'))

		expect(selectBattleMoves(pokemonMoves, moves).map(m => m.name)).toEqual(['tackle'])
	})

	it('reads the levels of the most recent version group the Pokémon learns moves in', () => {
		const pokemonMoves = [
			learned('tackle', { 5: 40, 20: 1 }),
			learned('slam', { 5: 1, 20: 30 }),
			learned('pound', { 5: 20 })
		]
		const moves = details(move('tackle', 40), move('slam', 80), move('pound', 40))

		expect(selectBattleMoves(pokemonMoves, moves).map(m => m.name)).toEqual(['slam', 'tackle'])
	})

	it('ignores the Japanese Gen 1 games, whose version groups are numbered after the recent ones', () => {
		const pokemonMoves = [
			learned('tackle', { 25: 1, 28: 1, 29: 1 }),
			learned('hyper-fang', { 25: 10 }),
			learned('bite', { 28: 20, 29: 20 })
		]
		const moves = details(move('tackle', 40), move('hyper-fang', 80), move('bite', 60))

		expect(selectBattleMoves(pokemonMoves, moves).map(m => m.name)).toEqual(['hyper-fang', 'tackle'])
	})

	it('keeps a move learned at several levels once, at its latest level', () => {
		const pokemonMoves = [learned('tackle', { 20: 1 }), learned('slam', { 20: 10 }), learned('tackle', { 20: 30 })]
		const moves = details(move('tackle', 40), move('slam', 80))

		expect(selectBattleMoves(pokemonMoves, moves).map(m => m.name)).toEqual(['tackle', 'slam'])
	})

	it('falls back to struggle for a Pokémon without a damaging level-up move', () => {
		const moves = details(move('transform', null, 'status'))

		expect(selectBattleMoves([learned('transform', { 20: 1 })], moves)).toEqual([
			{ name: 'struggle', power: 50, type: 'normal', accuracy: null, damageClass: 'physical' }
		])
	})
})

/** Adapter answering each PokeAPI path from a fixed table, and 404 for anything else */
const routedAdapter = (routes: Record<string, unknown>) =>
	vi.fn<AxiosAdapter>(async (config: InternalAxiosRequestConfig) => {
		const path = config.url ?? ''
		if (!(path in routes)) {
			const response = { data: {}, status: 404, statusText: '', headers: {}, config }
			throw new AxiosError('Not found', AxiosError.ERR_BAD_REQUEST, config, null, response)
		}
		return { data: routes[path], status: 200, statusText: '', headers: {}, config }
	})

const requestedPaths = (adapter: ReturnType<typeof routedAdapter>) => adapter.mock.calls.map(([config]) => config.url)

const originalAdapter = pokeapi.defaults.adapter

afterEach(() => {
	pokeapi.defaults.adapter = originalAdapter
})

describe('fetchBattleMoves', () => {
	it('fetches the Pokémon\'s latest level-up moves and reuses cached move details for the next Pokémon', async () => {
		const adapter = routedAdapter({
			'/pokemon/1': { moves: [learned('vine-whip', { 20: 7 }), learned('cut', { 3: 15 }, 'machine')] },
			'/pokemon/2': { moves: [learned('vine-whip', { 20: 9 }), learned('razor-leaf', { 20: 12 })] },
			'/move/vine-whip': { ...move('vine-whip', 45), type: { name: 'grass', url: '' } },
			'/move/razor-leaf': { ...move('razor-leaf', 55, 'physical', 95), type: { name: 'grass', url: '' } }
		})
		pokeapi.defaults.adapter = adapter

		expect(await fetchBattleMoves(1)).toEqual([
			{ name: 'vine-whip', power: 45, type: 'grass', accuracy: 100, damageClass: 'physical' }
		])
		expect((await fetchBattleMoves(2)).map(m => m.name)).toEqual(['razor-leaf', 'vine-whip'])
		expect(requestedPaths(adapter)).toEqual(['/pokemon/1', '/move/vine-whip', '/pokemon/2', '/move/razor-leaf'])
	})

	it('does not cache a failed move lookup', async () => {
		const pokemon = { '/pokemon/3': { moves: [learned('ember', { 20: 4 })] } }
		pokeapi.defaults.adapter = routedAdapter(pokemon)
		await expect(fetchBattleMoves(3)).rejects.toThrow()

		const ember = { ...move('ember', 40, 'special'), type: { name: 'fire', url: '' } }
		pokeapi.defaults.adapter = routedAdapter({ ...pokemon, '/move/ember': ember })

		expect((await fetchBattleMoves(3)).map(m => m.name)).toEqual(['ember'])
	})
})
