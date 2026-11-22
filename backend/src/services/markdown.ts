import type { Pokemon, StatBlock } from '../types/pokemon.ts'

const STAT_LABELS: Record<keyof StatBlock, string> = {
	HP: 'HP',
	attack: 'Attack',
	defense: 'Defense',
	special_attack: 'Special Attack',
	special_defense: 'Special Defense',
	speed: 'Speed'
}

const capitalize = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1)

const padId = (id: number): string => String(id).padStart(4, '0')

/** A full Pokémon as a Markdown note, ready to import into VirtualBrain */
export const renderPokemonMarkdown = (pokemon: Pokemon): string => {
	const lines = [
		`# ${capitalize(pokemon.name)} (#${padId(pokemon.id)})`,
		'',
		`- **Generation:** ${pokemon.apiGeneration}`,
		`- **Types:** ${pokemon.apiTypes.map(type => capitalize(type.name)).join(', ')}`,
		'',
		'## Stats',
		'',
		'| Stat | Value |',
		'| --- | --- |',
		...Object.entries(STAT_LABELS).map(([stat, label]) => `| ${label} | ${pokemon.stats[stat as keyof StatBlock]} |`)
	]
	return `${lines.join('\n')}\n`
}
