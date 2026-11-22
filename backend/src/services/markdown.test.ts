import { describe, expect, it } from 'vitest'
import type { Pokemon, Resistance } from '../types/pokemon.ts'
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

	it('groups weaknesses, resistances and immunities by multiplier, leaving neutral types out', () => {
		const resistance = (name: string, damage_multiplier: number): Resistance =>
			({ name, damage_multiplier, damage_relation: 'neutral' })
		const pokemon: Pokemon = {
			...pikachu,
			apiResistances: [
				resistance('normal', 1),
				resistance('fire', 4),
				resistance('ice', 2),
				resistance('rock', 2),
				resistance('water', 0.5),
				resistance('grass', 0.25),
				resistance('bug', 0.25),
				resistance('ground', 0)
			]
		}

		expect(renderPokemonMarkdown(pokemon)).toContain([
			'## Type matchups',
			'',
			'### Weaknesses',
			'',
			'- **×4:** Fire',
			'- **×2:** Ice, Rock',
			'',
			'### Resistances',
			'',
			'- **×½:** Water',
			'- **×¼:** Grass, Bug',
			'',
			'### Immunities',
			'',
			'- **×0:** Ground'
		].join('\n'))
	})

	it('leaves out matchup groups the Pokémon has no type in', () => {
		const pokemon: Pokemon = {
			...pikachu,
			apiResistances: [{ name: 'ground', damage_multiplier: 2, damage_relation: 'vulnerable' }]
		}

		const markdown = renderPokemonMarkdown(pokemon)

		expect(markdown).toContain('### Weaknesses\n\n- **×2:** Ground')
		expect(markdown).not.toContain('### Resistances')
		expect(markdown).not.toContain('### Immunities')
	})

	it('ends with the pre-evolution and the evolutions', () => {
		const eevee: Pokemon = {
			...pikachu,
			apiPreEvolution: 'none',
			apiEvolutions: [{ name: 'vaporeon', pokedexId: 134 }, { name: 'jolteon', pokedexId: 135 }]
		}

		expect(renderPokemonMarkdown(pikachu)).toMatch(
			/\n## Evolutions\n\n- \*\*Pre-evolution:\*\* Pichu\n- \*\*Evolutions:\*\* Raichu\n$/
		)
		expect(renderPokemonMarkdown(eevee)).toMatch(
			/\n## Evolutions\n\n- \*\*Pre-evolution:\*\* None\n- \*\*Evolutions:\*\* Vaporeon, Jolteon\n$/
		)
	})

	it('says None when the Pokémon does not evolve', () => {
		const tauros: Pokemon = { ...pikachu, apiPreEvolution: 'none', apiEvolutions: [] }

		expect(renderPokemonMarkdown(tauros)).toMatch(/- \*\*Evolutions:\*\* None\n$/)
	})
})
