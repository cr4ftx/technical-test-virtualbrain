import { describe, expect, it, vi } from 'vitest'
import { battleEvents, sseFrame, type BattleEvent } from './battleStream.ts'

const collect = async (events: AsyncIterable<BattleEvent>): Promise<BattleEvent[]> => {
	const result: BattleEvent[] = []
	for await (const event of events) result.push(event)
	return result
}

describe('battleEvents', () => {
	it('turns each text chunk into a text event, then ends', async () => {
		async function* chunks() {
			yield 'Pikachu uses '
			yield 'Thunderbolt!'
		}

		expect(await collect(battleEvents(chunks()))).toEqual([
			{ type: 'text', text: 'Pikachu uses ' },
			{ type: 'text', text: 'Thunderbolt!' },
			{ type: 'end' }
		])
	})

	it('ends with a single error event, without the upstream details, when the stream fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		async function* chunks() {
			yield 'Pikachu uses '
			throw new Error('VirtualBrain completion failed: 429')
		}

		expect(await collect(battleEvents(chunks()))).toEqual([
			{ type: 'text', text: 'Pikachu uses ' },
			{ type: 'error', message: 'The battle narration failed, please try again' }
		])
	})

	it('stops quietly when the stream is aborted, since nobody is listening anymore', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		const controller = new AbortController()
		async function* chunks() {
			yield 'Pikachu uses '
			controller.abort()
			controller.signal.throwIfAborted()
		}

		expect(await collect(battleEvents(chunks()))).toEqual([{ type: 'text', text: 'Pikachu uses ' }])
		expect(consoleError).not.toHaveBeenCalled()
	})
})

describe('sseFrame', () => {
	it('names the frame after the event type and carries the rest as JSON, newlines included', () => {
		expect(sseFrame({ type: 'text', text: 'Turn 1:\nPikachu attacks' }))
			.toBe('event: text\ndata: {"text":"Turn 1:\\nPikachu attacks"}\n\n')
	})

	it('carries a round result as the frame data', () => {
		const frame = sseFrame({
			type: 'round',
			round: 2,
			actions: [{ attacker: 1, move: 'tackle', hit: true, damage: 57, ko: true, fallback: false }],
			hp: [0, 25],
			winner: 1
		})

		expect(frame).toBe(
			'event: round\ndata: {"round":2,"actions":[{"attacker":1,"move":"tackle","hit":true,"damage":57,"ko":true,"fallback":false}],"hp":[0,25],"winner":1}\n\n'
		)
	})

	it('sends an empty object for an event without data', () => {
		expect(sseFrame({ type: 'end' })).toBe('event: end\ndata: {}\n\n')
	})
})
