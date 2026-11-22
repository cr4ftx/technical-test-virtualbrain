import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pokeapi } from './pokeapi.ts'

type Outcome = number | 'network-error'

/** Adapter answering each successive request with the next outcome: an HTTP status or a network failure */
const scriptedAdapter = (outcomes: Outcome[]) => {
	const remaining = [...outcomes]
	return vi.fn<AxiosAdapter>(async (config: InternalAxiosRequestConfig) => {
		const outcome = remaining.shift()
		if (outcome === undefined) throw new Error('Unexpected extra request')
		if (outcome === 'network-error') {
			throw new AxiosError('socket hang up', 'ECONNRESET', config)
		}
		const response = { data: { status: outcome }, status: outcome, statusText: '', headers: {}, config }
		if (outcome >= 400) {
			throw new AxiosError(`Status ${outcome}`, AxiosError.ERR_BAD_RESPONSE, config, null, response)
		}
		return response
	})
}

const originalAdapter = pokeapi.defaults.adapter

beforeEach(() => {
	vi.useFakeTimers()
})

afterEach(() => {
	vi.useRealTimers()
	pokeapi.defaults.adapter = originalAdapter
})

/** Run a request to completion, fast-forwarding through the retry backoff */
const settle = async <T>(request: Promise<T>) => {
	const settled = request.then(
		value => ({ value }),
		(error: unknown) => ({ error })
	)
	await vi.runAllTimersAsync()
	return settled
}

describe('pokeapi retries', () => {
	it.each<Outcome>([503, 429, 'network-error'])('retries a %s then succeeds', async failure => {
		const adapter = scriptedAdapter([failure, 200])
		pokeapi.defaults.adapter = adapter

		const result = await settle(pokeapi.get('/pokemon/1'))

		expect(result).toMatchObject({ value: { status: 200 } })
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it('gives up after 3 retries with the last upstream error', async () => {
		const adapter = scriptedAdapter([500, 502, 503, 504, 200])
		pokeapi.defaults.adapter = adapter

		const result = await settle(pokeapi.get('/pokemon/1'))

		expect(result).toMatchObject({ error: { response: { status: 504 } } })
		expect(adapter).toHaveBeenCalledTimes(4)
	})

	it('fails a 404 immediately', async () => {
		const adapter = scriptedAdapter([404, 200])
		pokeapi.defaults.adapter = adapter

		const result = await settle(pokeapi.get('/pokemon/1'))

		expect(result).toMatchObject({ error: { response: { status: 404 } } })
		expect(adapter).toHaveBeenCalledTimes(1)
	})
})
