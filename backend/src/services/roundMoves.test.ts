import { describe, expect, it } from 'vitest'
import type { BattleMove } from './battleEngine.ts'
import { pickMoves } from './roundMoves.ts'

const move = (name: string): BattleMove => ({ name, power: 50, type: 'normal', accuracy: 100, damageClass: 'physical' })

const pikachuMoves = [move('thunderbolt'), move('quick-attack'), move('iron-tail'), move('thunder')]
const charmanderMoves = [move('ember'), move('scratch'), move('flame-burst'), move('slash')]
const movesets: [BattleMove[], BattleMove[]] = [pikachuMoves, charmanderMoves]

// Picks the move at index 2 of a 4-move set
const thirdMove = () => 0.5

describe('pickMoves', () => {
	it('picks the moves the LLM named, first Pokémon first', () => {
		expect(pickMoves('MOVES: thunderbolt | scratch', movesets, thirdMove)).toEqual([
			{ move: pikachuMoves[0], fallback: false },
			{ move: charmanderMoves[1], fallback: false }
		])
	})

	it('matches names whatever their case, spacing or emphasis', () => {
		const [first, second] = pickMoves('**moves:** Quick Attack |  `Flame-Burst`.', movesets, thirdMove)

		expect(first).toEqual({ move: pikachuMoves[1], fallback: false })
		expect(second).toEqual({ move: charmanderMoves[2], fallback: false })
	})

	it('falls back to a random valid move for a name the Pokémon does not know', () => {
		const [first, second] = pickMoves('MOVES: hyper-beam | ember', movesets, thirdMove)

		expect(first).toEqual({ move: pikachuMoves[2], fallback: true })
		expect(second).toEqual({ move: charmanderMoves[0], fallback: false })
	})

	it('falls back for a side the line leaves out', () => {
		const [, second] = pickMoves('MOVES: thunderbolt', movesets, thirdMove)

		expect(second).toEqual({ move: charmanderMoves[2], fallback: true })
	})

	it('falls back for both sides when the LLM wrote no MOVES line', () => {
		expect(pickMoves(undefined, movesets, thirdMove)).toEqual([
			{ move: pikachuMoves[2], fallback: true },
			{ move: charmanderMoves[2], fallback: true }
		])
	})
})
