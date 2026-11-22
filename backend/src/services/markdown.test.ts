import { describe, expect, it } from 'vitest'
import type { Pokemon } from '../types/pokemon.ts'
import { renderPokemonMarkdown } from './markdown.ts'

const typeImage = 'https://example.test/type.png'

const pikachu = {
	id: 25,
	pokedexId: 25,
	name: 'pikachu',
	slug: 'pikachu',
	image: 'https://example.test/25.png',
	sprite: 'https://example.test/25-sprite.png',
	stats: { HP: 35, attack: 55, defense: 40, special_attack: 50, special_defense: 50, speed: 90 },
	apiTypes: [{ name: 'electric', image: typeImage }],
	apiGeneration: 1,
	apiResistances: [],
	apiResistancesWithAbilities: [],
	resistanceModifyingAbilitiesForApi: { name: 'static', slug: 'static' },
	apiEvolutions: [{ name: 'raichu', pokedexId: 26 }],
	apiPreEvolution: 'pichu'
} satisfies Pokemon

describe('renderPokemonMarkdown', () => {
	it('opens with the name and padded id, then the generation and types', () => {
		const charizard: Pokemon = {
			...pikachu,
			id: 6,
			name: 'charizard',
			apiTypes: [{ name: 'fire', image: typeImage }, { name: 'flying', image: typeImage }]
		}

		expect(renderPokemonMarkdown(charizard)).toMatch(
			/^# Charizard \(#0006\)\n\n- \*\*Generation:\*\* 1\n- \*\*Types:\*\* Fire, Flying\n/
		)
	})

	it('lists the six base stats in a table', () => {
		expect(renderPokemonMarkdown(pikachu)).toContain([
			'## Stats',
			'',
			'| Stat | Value |',
			'| --- | --- |',
			'| HP | 35 |',
			'| Attack | 55 |',
			'| Defense | 40 |',
			'| Special Attack | 50 |',
			'| Special Defense | 50 |',
			'| Speed | 90 |'
		].join('\n'))
	})
})
