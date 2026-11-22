import { setTimeout as sleep } from 'node:timers/promises'
import { describe, expect, it } from 'vitest'
import { limitConcurrency } from './limitConcurrency.ts'

describe('limitConcurrency', () => {
	it('never runs more than the limit at once, and runs every task', async () => {
		const limit = limitConcurrency(3)
		let inFlight = 0
		let peak = 0

		const task = async (i: number) => {
			inFlight++
			peak = Math.max(peak, inFlight)
			await sleep(i % 4)
			inFlight--
			return i
		}

		const results = await Promise.all(Array.from({ length: 20 }, (_, i) => limit(() => task(i))))

		expect(peak).toBe(3)
		expect(results).toEqual(Array.from({ length: 20 }, (_, i) => i))
	})

	it('frees the slot when a task fails', async () => {
		const limit = limitConcurrency(1)

		await expect(limit(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom')
		expect(await limit(async () => 'next')).toBe('next')
	})
})
