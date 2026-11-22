import { describe, expect, it } from 'vitest'
import type { Pokemon, Resistance } from '../types/pokemon.ts'
import { computeDamage, maxHp, type BattleMove } from './battleEngine.ts'

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

const maxRoll = () => 1
const minRoll = () => 0

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

	it('deals no damage to an immune defender', () => {
		expect(computeDamage(pikachu, gyarados, earthquake, maxRoll)).toBe(0)
	})
})
