import { describe, expect, it } from 'vitest'
import { createNarrationFilter } from './roundNarration.ts'

/** Feed every chunk, then end: what the frontend sees, chunk by chunk, and the moves the held-back line names */
const run = (chunks: string[]) => {
	const filter = createNarrationFilter()
	const shown = chunks.map(chunk => filter.feed(chunk))
	const { text, moves } = filter.end()
	return { shown: [...shown, text], moves }
}

describe('createNarrationFilter', () => {
	it('streams the narration and holds back the final MOVES line, keeping the moves it names', () => {
		const { shown, moves } = run(['Pikachu crackles', ' with energy.\nMOVES: thunderbolt | tackle'])

		expect(shown.join('')).toBe('Pikachu crackles with energy.\n')
		expect(moves).toBe('thunderbolt | tackle')
	})

	it('emits narration as soon as a line can no longer be the MOVES line', () => {
		const { shown } = run(['Pika', 'chu', '\nMO', 'VES: a | b'])

		expect(shown).toEqual(['Pika', 'chu', '\n', '', ''])
	})

	it('holds back a MOVES line split across chunks, whatever its case', () => {
		const { shown, moves } = run(['Go!\nmo', 'ves: ', 'quick-attack | ember\n'])

		expect(shown.join('')).toBe('Go!\n')
		expect(moves).toBe('quick-attack | ember')
	})

	it('recognises a MOVES line wrapped in markdown emphasis', () => {
		const { shown, moves } = run(['Go!\n**MOVES:** ember | tackle'])

		expect(shown.join('')).toBe('Go!\n')
		expect(moves).toBe('ember | tackle')
	})

	it('releases a held line that turns out not to be the MOVES line', () => {
		const { shown, moves } = run(['Go!\nMov', 'ing fast, Pikachu dodges.'])

		expect(shown.join('')).toBe('Go!\nMoving fast, Pikachu dodges.')
		expect(moves).toBeUndefined()
	})

	it('has no MOVES line when the narration never writes one', () => {
		expect(run(['Pikachu attacks.']).moves).toBeUndefined()
	})
})
