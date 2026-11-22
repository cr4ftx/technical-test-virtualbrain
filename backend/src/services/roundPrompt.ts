import type { BattleAction, BattleMove, BattleState, Fighter, RoundResult } from './battleEngine.ts'
import { capitalize } from './markdown.ts'

const nameOf = (fighter: Fighter): string => capitalize(fighter.pokemon.name)

const describeFighter = ({ pokemon, hp, maxHp }: Fighter): string => {
	const types = pokemon.apiTypes.map(t => capitalize(t.name)).join('/')
	const { attack, defense, special_attack, special_defense, speed } = pokemon.stats
	return `${capitalize(pokemon.name)}: ${types}, HP ${hp}/${maxHp}, Attack ${attack}, Defense ${defense}, `
		+ `Special Attack ${special_attack}, Special Defense ${special_defense}, Speed ${speed}`
}

const describeMove = ({ name, type, damageClass, power, accuracy }: BattleMove): string =>
	`${name} (${capitalize(type)}, ${damageClass}, power ${power}, ${accuracy === null ? 'never misses' : `accuracy ${accuracy}`})`

const describeAction = ({ attacker, move, hit, damage, ko }: BattleAction, fighters: [Fighter, Fighter]): string => {
	const used = `${nameOf(fighters[attacker])} used ${move}`
	if (!hit) return `${used} but missed.`
	if (damage === 0) return `${used} but it had no effect.`
	const defender = fighters[attacker === 0 ? 1 : 0]
	return `${used} and dealt ${damage} damage${ko ? `, knocking ${nameOf(defender)} out` : ''}.`
}

/**
 * The query for one round of a turn-based battle: everything the LLM needs to pick both moves.
 * Unlike the one-shot query, it carries its own instructions: the stats are inline, so the brain's
 * document search retrieving the wrong notes doesn't matter here.
 */
export const buildRoundPrompt = (state: BattleState, previous?: RoundResult): string => {
	const { fighters } = state
	const [first, second] = fighters
	return [
		`Round ${state.round + 1} of a Pokémon battle at level 50. Choose one move for each Pokémon.`,
		'',
		describeFighter(first),
		`${nameOf(first)}'s moves: ${first.moves.map(describeMove).join(', ')}`,
		describeFighter(second),
		`${nameOf(second)}'s moves: ${second.moves.map(describeMove).join(', ')}`,
		...(previous ? ['', `Last round: ${previous.actions.map(a => describeAction(a, fighters)).join(' ')}`] : []),
		'',
		'In two or three sentences, narrate how each Pokémon sizes up the other and why it picks its move, '
		+ 'without telling whether the moves hit: the game computes that. '
		+ 'Then end with exactly one line, using the move names exactly as listed:',
		`MOVES: <${nameOf(first)}'s move> | <${nameOf(second)}'s move>`
	].join('\n')
}
