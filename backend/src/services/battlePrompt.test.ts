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

	it('names each Pokémon the way its exported note is titled, so the brain retrieves it', () => {
		expect(prompt).toContain('Pikachu (#0025)')
		expect(prompt).toContain('Gyarados (#0130)')
	})

	it('leaves types and stats to the brain instead of sending them', () => {
		expect(prompt).not.toMatch(/electric|water|flying/i)
		expect(prompt).not.toMatch(/(HP|Attack|Defense|Speed) \d+/)
	})

	it('tells the chatbot to use the knowledge base\'s stats and type matchups', () => {
		expect(prompt).toMatch(/knowledge base/i)
		expect(prompt).toMatch(/stats/i)
		expect(prompt).toMatch(/type matchups/i)
	})

	it('asks for a turn-by-turn battle ending with a winner', () => {
		expect(prompt).toMatch(/turn by turn/i)
		expect(prompt).toMatch(/winner/i)
	})
})
