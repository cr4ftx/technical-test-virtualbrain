import type { Pokemon } from '../types/pokemon.ts'

const capitalize = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1)

const padId = (id: number): string => String(id).padStart(4, '0')

/** A full Pokémon as a Markdown note, ready to import into VirtualBrain */
export const renderPokemonMarkdown = (pokemon: Pokemon): string => {
	const lines = [
		`# ${capitalize(pokemon.name)} (#${padId(pokemon.id)})`,
		'',
		`- **Generation:** ${pokemon.apiGeneration}`,
		`- **Types:** ${pokemon.apiTypes.map(type => capitalize(type.name)).join(', ')}`
	]
	return `${lines.join('\n')}\n`
}
