import { describe, expect, it } from 'vitest'
import { selectBattleMoves, type ApiMove, type ApiPokemonMove } from './battleMoves.ts'

const versionGroup = (id: number) => ({ name: `group-${id}`, url: `https://pokeapi.co/api/v2/version-group/${id}/` })

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

	it('falls back to struggle for a Pokémon without a damaging level-up move', () => {
		const moves = details(move('transform', null, 'status'))

		expect(selectBattleMoves([learned('transform', { 20: 1 })], moves)).toEqual([
			{ name: 'struggle', power: 50, type: 'normal', accuracy: null, damageClass: 'physical' }
		])
	})
})
