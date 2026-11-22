import { describe, expect, it } from 'vitest'
import type { BattleMove, BattleState, RoundResult } from './battleEngine.ts'
import { buildRoundPrompt } from './roundPrompt.ts'
import { testPokemon } from './testPokemon.ts'

const pikachu = testPokemon({
	id: 25,
	name: 'pikachu',
	apiTypes: [{ name: 'electric', image: '' }],
	stats: { HP: 35, attack: 55, defense: 40, special_attack: 50, special_defense: 50, speed: 90 }
})

const gyarados = testPokemon({
	id: 130,
	name: 'gyarados',
	apiTypes: [{ name: 'water', image: '' }, { name: 'flying', image: '' }],
	stats: { HP: 95, attack: 125, defense: 79, special_attack: 60, special_defense: 100, speed: 81 }
})

const thunderbolt: BattleMove = { name: 'thunderbolt', power: 90, type: 'electric', accuracy: 100, damageClass: 'special' }
const swift: BattleMove = { name: 'swift', power: 60, type: 'normal', accuracy: null, damageClass: 'special' }
const waterfall: BattleMove = { name: 'waterfall', power: 80, type: 'water', accuracy: 100, damageClass: 'physical' }

const state: BattleState = {
	round: 1,
	fighters: [
		{ pokemon: pikachu, hp: 60, maxHp: 95, moves: [thunderbolt, swift] },
		{ pokemon: gyarados, hp: 20, maxHp: 155, moves: [waterfall] }
	]
}

const previous: RoundResult = {
	round: 1,
	actions: [
		{ attacker: 0, move: 'thunderbolt', hit: true, damage: 135, ko: false },
		{ attacker: 1, move: 'waterfall', hit: false, damage: 0, ko: false }
	],
	hp: [60, 20]
}

describe('buildRoundPrompt', () => {
	it('names the round and gives each Pokémon its types, stats and current HP', () => {
		const prompt = buildRoundPrompt(state, previous)

		expect(prompt).toContain('Round 2')
		expect(prompt).toContain('Pikachu: Electric, HP 60/95, Attack 55, Defense 40, Special Attack 50, Special Defense 50, Speed 90')
		expect(prompt).toContain('Gyarados: Water/Flying, HP 20/155, Attack 125, Defense 79, Special Attack 60, Special Defense 100, Speed 81')
	})

	it('lists each Pokémon\'s moves with their type, class, power and accuracy', () => {
		const prompt = buildRoundPrompt(state, previous)

		expect(prompt).toContain('Pikachu\'s moves: thunderbolt (Electric, special, power 90, accuracy 100), swift (Normal, special, power 60, never misses)')
		expect(prompt).toContain('Gyarados\'s moves: waterfall (Water, physical, power 80, accuracy 100)')
	})

	it('reports what happened in the previous round', () => {
		const prompt = buildRoundPrompt(state, previous)

		expect(prompt).toContain('Last round: Pikachu used thunderbolt and dealt 135 damage. Gyarados used waterfall but missed.')
	})

	it('says when a move had no effect or knocked the defender out', () => {
		const prompt = buildRoundPrompt(state, {
			round: 1,
			actions: [
				{ attacker: 1, move: 'waterfall', hit: true, damage: 0, ko: false },
				{ attacker: 0, move: 'thunderbolt', hit: true, damage: 155, ko: true }
			],
			hp: [95, 0]
		})

		expect(prompt).toContain('Gyarados used waterfall but it had no effect. Pikachu used thunderbolt and dealt 155 damage, knocking Gyarados out.')
	})

	it('has no previous round to report in the first one', () => {
		const prompt = buildRoundPrompt({ ...state, round: 0 })

		expect(prompt).toContain('Round 1')
		expect(prompt).not.toContain('Last round')
	})

	it('asks for a narration ending with a MOVES line, first Pokémon first', () => {
		expect(buildRoundPrompt(state, previous)).toMatch(/MOVES: <Pikachu's move> \| <Gyarados's move>\s*$/)
	})
})
