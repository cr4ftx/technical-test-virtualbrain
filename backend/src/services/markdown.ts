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
	{ title: 'Weaknesses', multipliers: [4, 2] },
	{ title: 'Resistances', multipliers: [0.5, 0.25] },
	{ title: 'Immunities', multipliers: [0] }
]

const MULTIPLIER_LABELS: Record<number, string> = { 4: '×4', 2: '×2', 0.5: '×½', 0.25: '×¼', 0: '×0' }

const renderMatchups = (resistances: Resistance[]): string[] =>
	MATCHUP_GROUPS.flatMap(({ title, multipliers }) => {
		const rows = multipliers.flatMap(multiplier => {
			const types = resistances.filter(r => r.damage_multiplier === multiplier)
			if (types.length === 0) return []
			return [`- **${MULTIPLIER_LABELS[multiplier]}:** ${types.map(type => capitalize(type.name)).join(', ')}`]
		})
		return rows.length === 0 ? [] : ['', `### ${title}`, '', ...rows]
	})

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
		...Object.entries(STAT_LABELS).map(([stat, label]) => `| ${label} | ${pokemon.stats[stat as keyof StatBlock]} |`),
		'',
		'## Type matchups',
		...renderMatchups(pokemon.apiResistances),
		'',
		'## Evolutions',
		'',
		`- **Pre-evolution:** ${capitalize(pokemon.apiPreEvolution)}`,
		`- **Evolutions:** ${pokemon.apiEvolutions.map(evolution => capitalize(evolution.name)).join(', ') || 'None'}`
	]
	return `${lines.join('\n')}\n`
}
