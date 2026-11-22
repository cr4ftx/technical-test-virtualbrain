import type { BattleMove, RandomSource } from './battleEngine.ts'

export interface MovePick {
	move: BattleMove
	/** The LLM named no valid move for this Pokémon, so a random one was picked */
	fallback: boolean
}

// `Quick Attack`, `**quick_attack**` and `quick-attack.` all name PokeAPI's `quick-attack`
const normalize = (name: string): string =>
	name.toLowerCase().replace(/[*_`'".]/g, ' ').trim().replace(/\s+/g, '-')

const namedMoves = (movesLine: string | undefined): string[] => {
	const label = movesLine?.match(/MOVES:/i)
	if (!movesLine || label?.index === undefined) return []
	return movesLine.slice(label.index + label[0].length).split('|').map(normalize)
}

/** Each Pokémon's move from the LLM's `MOVES: <move> | <move>` line, or a random valid one when it named none */
export const pickMoves = (
	movesLine: string | undefined,
	movesets: [BattleMove[], BattleMove[]],
	random: RandomSource
): [MovePick, MovePick] => {
	const names = namedMoves(movesLine)
	const pick = (side: 0 | 1): MovePick => {
		const moves = movesets[side]
		const named = moves.find(move => normalize(move.name) === names[side])
		return named
			? { move: named, fallback: false }
			: { move: moves[Math.floor(random() * moves.length)], fallback: true }
	}
	return [pick(0), pick(1)]
}
