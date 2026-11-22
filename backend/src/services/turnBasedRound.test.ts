import { describe, expect, it, vi } from 'vitest'
import { createFighter, type BattleMove } from './battleEngine.ts'
import type { BattleEvent } from './battleStream.ts'
import { playRound, type TurnBasedBattle } from './turnBasedRound.ts'
import { testPokemon } from './testPokemon.ts'

const move = (name: string): BattleMove => ({ name, power: 40, type: 'normal', accuracy: 100, damageClass: 'physical' })

const fast = testPokemon({ id: 1, name: 'fast', stats: { HP: 100, attack: 50, defense: 50, special_attack: 50, special_defense: 50, speed: 90 } })
const slow = testPokemon({ id: 2, name: 'slow', stats: { HP: 100, attack: 50, defense: 50, special_attack: 50, special_defense: 50, speed: 30 } })

const battle: TurnBasedBattle = {
	state: {
		round: 0,
		fighters: [createFighter(fast, [move('tackle'), move('pound')]), createFighter(slow, [move('scratch'), move('cut')])]
	}
}

// Always hits for max damage, and a fallback picks the first move
const firstAndMax = () => 0

async function* chunks(...texts: string[]) {
	yield * texts
}

/** Every event the round yields, and the battle it returns */
const play = async (round: AsyncGenerator<BattleEvent, TurnBasedBattle | undefined>) => {
	const events: BattleEvent[] = []
	for (let step = await round.next(); ; step = await round.next()) {
		if (step.done) return { events, next: step.value }
		events.push(step.value)
	}
}

describe('playRound', () => {
	it('streams the narration, then plays the moves the LLM picked', async () => {
		const { events } = await play(playRound(battle, chunks('Fast dashes in.', '\nMOVES: pound | cut'), firstAndMax))

		expect(events.filter(e => e.type === 'text').map(e => e.text).join('')).toBe('Fast dashes in.\n')
		const round = events.at(-1)
		expect(round).toMatchObject({
			type: 'round',
			round: 1,
			actions: [
				{ attacker: 0, move: 'pound', hit: true, fallback: false },
				{ attacker: 1, move: 'cut', hit: true, fallback: false }
			]
		})
	})

	it('returns the battle after the round, remembering it for the next prompt', async () => {
		const { events, next } = await play(playRound(battle, chunks('Go!\nMOVES: pound | cut'), firstAndMax))
		const round = events.at(-1)

		expect(round?.type).toBe('round')
		if (round?.type !== 'round') return
		expect(next?.state.round).toBe(1)
		expect(next?.state.fighters.map(f => f.hp)).toEqual(round.hp)
		expect(next?.previous).toEqual({ round: 1, actions: round.actions.map(({ fallback: _, ...action }) => action), hp: round.hp })
	})

	it('flags the move picked at random when the LLM named an invalid one', async () => {
		const { events } = await play(playRound(battle, chunks('Go!\nMOVES: hyper-beam | cut'), firstAndMax))

		expect(events.at(-1)).toMatchObject({
			actions: [
				{ attacker: 0, move: 'tackle', fallback: true },
				{ attacker: 1, move: 'cut', fallback: false }
			]
		})
	})

	it('ends with an error and leaves the battle as it was when the chatbot fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		async function* failing() {
			yield 'Fast dashes'
			throw new Error('VirtualBrain completion failed: 429')
		}

		const { events, next } = await play(playRound(battle, failing(), firstAndMax))

		expect(events).toEqual([
			{ type: 'text', text: 'Fast dashes' },
			{ type: 'error', message: 'The battle narration failed, please try again' }
		])
		expect(next).toBeUndefined()
	})
})
