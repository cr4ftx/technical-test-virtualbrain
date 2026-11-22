import { resolveRound, type BattleState, type RandomSource, type RoundResult } from './battleEngine.ts'
import { battleEvents, type BattleEvent } from './battleStream.ts'
import { createNarrationFilter } from './roundNarration.ts'
import { pickMoves } from './roundMoves.ts'

/** A turn-based battle between rounds: its state, and the last round's result for the next prompt */
export interface TurnBasedBattle {
	state: BattleState
	previous?: RoundResult
}

/**
 * Play one round from the LLM's streamed answer: its narration as `text` events, then the `round` the engine
 * computes from the moves it picked. Returns the battle after the round, or `undefined` when the narration
 * failed or was aborted, so the same round can be played again.
 */
export async function* playRound(
	battle: TurnBasedBattle,
	chunks: AsyncIterable<string>,
	random: RandomSource
): AsyncGenerator<BattleEvent, TurnBasedBattle | undefined> {
	const filter = createNarrationFilter()
	let movesLine: string | undefined

	async function* narration() {
		for await (const chunk of chunks) {
			const text = filter.feed(chunk)
			if (text) yield text
		}
		const rest = filter.end()
		movesLine = rest.movesLine
		if (rest.text) yield rest.text
	}

	let finished = false
	for await (const event of battleEvents(narration())) {
		if (event.type === 'end') finished = true
		else yield event
		if (event.type === 'error') return undefined
	}
	// Aborted: the client left, nobody is waiting for the round
	if (!finished) return undefined

	const [first, second] = battle.state.fighters
	const picks = pickMoves(movesLine, [first.moves, second.moves], random)
	const { state, result } = resolveRound(battle.state, [picks[0].move, picks[1].move], random)
	yield {
		type: 'round',
		...result,
		actions: result.actions.map(action => ({ ...action, fallback: picks[action.attacker].fallback }))
	}
	return { state, previous: result }
}
