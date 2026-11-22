import type { Pokemon } from '../types/pokemon.ts'

/** A Pokémon for tests: what the test names, the rest neutral (Normal type, no resistances) */
export const testPokemon = (overrides: Pick<Pokemon, 'id' | 'name' | 'stats'> & Partial<Pokemon>): Pokemon => ({
	pokedexId: overrides.id,
	slug: overrides.name,
	image: '',
	sprite: '',
	apiGeneration: 1,
	apiTypes: [{ name: 'normal', image: '' }],
	apiResistances: [],
	apiResistancesWithAbilities: overrides.apiResistances ?? [],
	resistanceModifyingAbilitiesForApi: { name: '', slug: '' },
	apiEvolutions: [],
	apiPreEvolution: 'none',
	...overrides
})
