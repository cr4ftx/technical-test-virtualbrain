import { describe, expect, it } from 'vitest'
import type { Pokemon } from '../types/pokemon.ts'
import { buildBattlePrompt } from './battlePrompt.ts'

const pokemon = (overrides: Pick<Pokemon, 'id' | 'name' | 'apiTypes' | 'stats'>): Pokemon => ({
	pokedexId: overrides.id,
	slug: overrides.name,
	image: '',
	sprite: '',
	apiGeneration: 1,
	apiResistances: [],
	apiResistancesWithAbilities: [],
	resistanceModifyingAbilitiesForApi: { name: '', slug: '' },
	apiEvolutions: [],
	apiPreEvolution: 'none',
	...overrides
})

const pikachu = pokemon({
	id: 25,
	name: 'pikachu',
	apiTypes: [{ name: 'electric', image: '' }],
	stats: { HP: 35, attack: 55, defense: 40, special_attack: 50, special_defense: 50, speed: 90 }
})

const gyarados = pokemon({
	id: 130,
	name: 'gyarados',
	apiTypes: [{ name: 'water', image: '' }, { name: 'flying', image: '' }],
	stats: { HP: 95, attack: 125, defense: 79, special_attack: 60, special_defense: 100, speed: 81 }
})

describe('buildBattlePrompt', () => {
	const prompt = buildBattlePrompt(pikachu, gyarados)

	it('introduces each Pokémon with its name and types', () => {
		expect(prompt).toContain('Pikachu (electric)')
		expect(prompt).toContain('Gyarados (water/flying)')
	})

	it('lists each Pokémon\'s base stats', () => {
		expect(prompt).toContain('HP 35, Attack 55, Defense 40, Sp. Atk 50, Sp. Def 50, Speed 90')
		expect(prompt).toContain('HP 95, Attack 125, Defense 79, Sp. Atk 60, Sp. Def 100, Speed 81')
	})

	it('asks for a turn-by-turn battle ending with a winner', () => {
		expect(prompt).toMatch(/turn by turn/i)
		expect(prompt).toMatch(/winner/i)
	})
})
