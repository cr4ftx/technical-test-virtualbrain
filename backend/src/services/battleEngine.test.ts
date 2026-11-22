import { describe, expect, it } from 'vitest'
import type { Pokemon, Resistance } from '../types/pokemon.ts'
import { computeDamage, createFighter, maxHp, resolveRound, type BattleMove, type BattleState } from './battleEngine.ts'

/** Only the attacking types a test cares about: every other type hits for neutral damage */
const resistances = (multipliers: Record<string, number>): Resistance[] =>
	Object.entries(multipliers).map(([name, damage_multiplier]) => ({ name, damage_multiplier, damage_relation: 'neutral' }))

const pokemon = (overrides: Pick<Pokemon, 'id' | 'name' | 'apiTypes' | 'stats' | 'apiResistances'>): Pokemon => ({
	pokedexId: overrides.id,
	slug: overrides.name,
	image: '',
	sprite: '',
	apiGeneration: 1,
	apiResistancesWithAbilities: overrides.apiResistances,
	resistanceModifyingAbilitiesForApi: { name: '', slug: '' },
	apiEvolutions: [],
	apiPreEvolution: 'none',
	...overrides
})

const pikachu = pokemon({
	id: 25,
	name: 'pikachu',
	apiTypes: [{ name: 'electric', image: '' }],
	stats: { HP: 35, attack: 55, defense: 40, special_attack: 50, special_defense: 50, speed: 90 },
	apiResistances: resistances({ ground: 2, electric: 0.5 })
})

const gyarados = pokemon({
	id: 130,
	name: 'gyarados',
	apiTypes: [{ name: 'water', image: '' }, { name: 'flying', image: '' }],
	stats: { HP: 95, attack: 125, defense: 79, special_attack: 60, special_defense: 100, speed: 81 },
	apiResistances: resistances({ electric: 4, ground: 0 })
})

const thunderbolt: BattleMove = { name: 'thunderbolt', power: 90, type: 'electric', accuracy: 100, damageClass: 'special' }
const tackle: BattleMove = { name: 'tackle', power: 40, type: 'normal', accuracy: 100, damageClass: 'physical' }
const earthquake: BattleMove = { name: 'earthquake', power: 100, type: 'ground', accuracy: 100, damageClass: 'physical' }

const maxRoll = () => 0
const minRoll = () => 0.999999

describe('maxHp', () => {
	it('scales the base HP stat to level 50', () => {
		expect(maxHp(pikachu)).toBe(95)
		expect(maxHp(gyarados)).toBe(155)
	})
})

describe('computeDamage', () => {
	it('uses special stats, STAB and the type multiplier for a special move', () => {
		// ((22 × 90 × 50/100) / 50 + 2) × 1.5 × 4 = 130.8
		expect(computeDamage(pikachu, gyarados, thunderbolt, maxRoll)).toBe(130)
	})

	it('uses physical stats and no STAB for a physical move of another type', () => {
		// (22 × 40 × 125/40) / 50 + 2 = 57
		expect(computeDamage(gyarados, pikachu, tackle, maxRoll)).toBe(57)
	})

	it('rolls down to 85% of the damage', () => {
		// 130.8 × 0.85 = 111.18
		expect(computeDamage(pikachu, gyarados, thunderbolt, minRoll)).toBe(111)
	})

	it('multiplies the damage by 1.5 when the move shares a type with the attacker', () => {
		const electricTackle: BattleMove = { ...tackle, type: 'electric' }
		const neutralTarget = { ...gyarados, apiResistances: [] }

		// (22 × 40 × 55/79) / 50 + 2 = 14.25..., then × 1.5 = 21.38...
		expect(computeDamage(pikachu, neutralTarget, tackle, maxRoll)).toBe(14)
		expect(computeDamage(pikachu, neutralTarget, electricTackle, maxRoll)).toBe(21)
	})

	it('deals no damage to an immune defender', () => {
		expect(computeDamage(pikachu, gyarados, earthquake, maxRoll)).toBe(0)
	})

	it('deals at least 1 damage to a defender that is not immune', () => {
		const weakPeck: BattleMove = { name: 'peck', power: 1, type: 'flying', accuracy: 100, damageClass: 'physical' }
		const wall = { ...gyarados, stats: { ...gyarados.stats, defense: 250 }, apiResistances: resistances({ flying: 0.25 }) }

		// ((22 × 1 × 55/250) / 50 + 2) × 0.25 × 0.85 ≈ 0.43
		expect(computeDamage(pikachu, wall, weakPeck, minRoll)).toBe(1)
	})
})

/** Random source answering each call with the next value, for tests that need a specific sequence */
const sequence = (...values: number[]) => () => {
	const value = values.shift()
	if (value === undefined) throw new Error('Random source exhausted')
	return value
}

const battle = (first: Pokemon, second: Pokemon): BattleState => ({
	fighters: [createFighter(first, [tackle]), createFighter(second, [tackle])],
	round: 0
})

describe('resolveRound', () => {
	it('lets the faster Pokémon act first, whatever its side', () => {
		const { result } = resolveRound(battle(gyarados, pikachu), [tackle, tackle], maxRoll)

		expect(result.actions.map(a => a.attacker)).toEqual([1, 0])
	})

	it('breaks a speed tie with the random source', () => {
		const twin = { ...pikachu, name: 'raichu' }
		// Tie roll, then accuracy and damage rolls for both attacks
		const firstGoes = (tieRoll: number) =>
			resolveRound(battle(pikachu, twin), [tackle, tackle], sequence(tieRoll, 0, 1, 0, 1)).result.actions[0].attacker

		expect(firstGoes(0.2)).toBe(0)
		expect(firstGoes(0.7)).toBe(1)
	})

	it('takes the damage off the defender\'s HP and counts the round', () => {
		const { state, result } = resolveRound(battle(pikachu, gyarados), [thunderbolt, tackle], maxRoll)

		// Thunderbolt: 130 of Gyarados' 155 HP. Tackle back: (22 × 40 × 125/40) / 50 + 2 = 57 of Pikachu's 95
		expect(state.fighters.map(f => f.hp)).toEqual([38, 25])
		expect(state.round).toBe(1)
		expect(result).toEqual({
			round: 1,
			actions: [
				{ attacker: 0, move: 'thunderbolt', hit: true, damage: 130, ko: false },
				{ attacker: 1, move: 'tackle', hit: true, damage: 57, ko: false }
			],
			hp: [38, 25]
		})
	})

	it('misses when the roll is over the move\'s accuracy', () => {
		const hydroPump: BattleMove = { name: 'hydro-pump', power: 110, type: 'water', accuracy: 80, damageClass: 'special' }

		// Pikachu's tackle: accuracy roll then damage roll. Gyarados' hydro pump: accuracy roll 0.85 → miss
		const { state, result } = resolveRound(battle(pikachu, gyarados), [tackle, hydroPump], sequence(0, 1, 0.85))

		expect(result.actions[1]).toEqual({ attacker: 1, move: 'hydro-pump', hit: false, damage: 0, ko: false })
		expect(state.fighters[0].hp).toBe(95)
	})

	it('never misses with a move without accuracy', () => {
		const swift: BattleMove = { name: 'swift', power: 60, type: 'normal', accuracy: null, damageClass: 'special' }

		const { result } = resolveRound(battle(pikachu, gyarados), [swift, swift], () => 0.99)

		expect(result.actions.every(a => a.hit)).toBe(true)
	})

	it('ends the battle on a KO: HP stops at 0 and the KO\'d Pokémon does not act', () => {
		const start = battle(pikachu, gyarados)
		const weakened: BattleState = { ...start, fighters: [start.fighters[0], { ...start.fighters[1], hp: 20 }] }

		const { state, result } = resolveRound(weakened, [thunderbolt, tackle], maxRoll)

		expect(result).toEqual({
			round: 1,
			actions: [{ attacker: 0, move: 'thunderbolt', hit: true, damage: 130, ko: true }],
			hp: [95, 0],
			winner: 0
		})
		expect(state.winner).toBe(0)
	})
})
