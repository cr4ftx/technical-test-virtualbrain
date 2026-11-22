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
	it('asks a short question naming each Pokémon by its exported note title', () => {
		expect(buildBattlePrompt(pikachu, gyarados)).toBe('What happens if Pikachu (#0025) fights Gyarados (#0130)?')
	})
})
