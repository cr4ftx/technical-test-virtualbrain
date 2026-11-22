import type { Pokemon, Resistance, StatBlock } from '../types/pokemon.ts'

const STAT_LABELS: Record<keyof StatBlock, string> = {
	HP: 'HP',
	attack: 'Attack',
	defense: 'Defense',
	special_attack: 'Special Attack',
	special_defense: 'Special Defense',
	speed: 'Speed'
}

const MATCHUP_GROUPS = [
	{ title: 'Weaknesses', multipliers: [[4, '×4'], [2, '×2']] },
	{ title: 'Resistances', multipliers: [[0.5, '×½'], [0.25, '×¼']] },
	{ title: 'Immunities', multipliers: [[0, '×0']] }
] as const

export const capitalize = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1)

const listNames = (items: { name: string }[]): string => items.map(item => capitalize(item.name)).join(', ')

const padId = (id: number): string => String(id).padStart(4, '0')

/** e.g. `Pikachu (#0025)`: the note's title, which the battle prompt reuses so the brain retrieves the right note */
export const pokemonTitle = ({ name, id }: Pokemon): string => `${capitalize(name)} (#${padId(id)})`

const renderMatchups = (resistances: Resistance[]): string[] => {
	const groups = MATCHUP_GROUPS.flatMap(({ title, multipliers }) => {
		const rows = multipliers.flatMap(([multiplier, label]) => {
			const types = resistances.filter(r => r.damage_multiplier === multiplier)
			return types.length === 0 ? [] : [`- **${label}:** ${listNames(types)}`]
		})
		return rows.length === 0 ? [] : ['', `### ${title}`, '', ...rows]
	})
	return groups.length === 0 ? ['', 'None'] : groups
}

/** A full Pokémon as a Markdown note, ready to import into VirtualBrain */
export const renderPokemonMarkdown = (pokemon: Pokemon): string => {
	const lines = [
		`# ${pokemonTitle(pokemon)}`,
		'',
		`- **Generation:** ${pokemon.apiGeneration}`,
		`- **Types:** ${listNames(pokemon.apiTypes)}`,
		'',
		'## Stats',
		'',
		'| Stat | Value |',
		'| --- | --- |',
		...Object.entries(STAT_LABELS).map(([stat, label]) => `| ${label} | ${pokemon.stats[stat as keyof StatBlock]} |`),
		'',
		'## Type matchups',
		...renderMatchups(pokemon.apiResistances),
		'',
		'## Evolutions',
		'',
		`- **Pre-evolution:** ${pokemon.apiPreEvolution === 'none' ? 'None' : capitalize(pokemon.apiPreEvolution)}`,
		`- **Evolutions:** ${listNames(pokemon.apiEvolutions) || 'None'}`
	]
	return `${lines.join('\n')}\n`
}

/** e.g. `0025-pikachu.md`: the padded id keeps a folder listing in Pokédex order */
export const markdownFileName = (pokemon: Pokemon): string => `${padId(pokemon.id)}-${pokemon.slug}.md`
