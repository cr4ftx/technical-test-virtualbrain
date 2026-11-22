import { describe, expect, it, vi } from 'vitest'
import { battleEvents, type BattleEvent } from './battleStream.ts'

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
})
