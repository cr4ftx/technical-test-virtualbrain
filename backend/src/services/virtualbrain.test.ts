import { describe, expect, it, vi } from 'vitest'
import { createVirtualBrainClient } from './virtualbrain.ts'

const API = 'https://chatbot-api.getvirtualbrain.com'
const CHATBOT_ID = 'fe4b240c-fb19-484e-845e-46c729c39fbe'

const tokenResponse = (accessToken: string) =>
	Response.json({ accessToken, refreshToken: 'refresh', expiresIn: 3600, chatbotId: CHATBOT_ID }, { status: 201 })

const textStream = (chunks: (string | Uint8Array)[]) => {
	const encoder = new TextEncoder()
	return new ReadableStream<Uint8Array>({
		start(controller) {
			for (const chunk of chunks) controller.enqueue(typeof chunk === 'string' ? encoder.encode(chunk) : chunk)
			controller.close()
		}
	})
}

/** Fake VirtualBrain API: hands out access-1, access-2... and streams `chunks` for every query */
const fakeApi = (chunks: (string | Uint8Array)[] = ['ok']) => {
	let issued = 0
	return vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
		const url = String(input)
		if (url === `${API}/v1/auth/api-key/token`) return tokenResponse(`access-${++issued}`)
		if (url === `${API}/v1/open-completion/${CHATBOT_ID}/query`) {
			return new Response(textStream(chunks), { status: 201, headers: { 'content-type': 'text/plain' } })
		}
		return new Response('not found', { status: 404 })
	})
}

const collect = async (chunks: AsyncIterable<string>): Promise<string[]> => {
	const result: string[] = []
	for await (const chunk of chunks) result.push(chunk)
	return result
}

const queryCalls = (fetch: ReturnType<typeof fakeApi>) =>
	fetch.mock.calls.filter(([url]) => String(url).includes('/open-completion/'))

const tokenCalls = (fetch: ReturnType<typeof fakeApi>) =>
	fetch.mock.calls.filter(([url]) => String(url).endsWith('/api-key/token'))

describe('VirtualBrain client', () => {
	it('exchanges the API key, then streams the completion text chunk by chunk', async () => {
		const fetch = fakeApi(['Pikachu uses ', 'Thunderbolt!'])
		const client = createVirtualBrainClient({ apiKey: 'vb_ak_secret', fetch })

		expect(await collect(client.streamCompletion('Pikachu vs Squirtle?'))).toEqual(['Pikachu uses ', 'Thunderbolt!'])

		const [[, tokenInit]] = tokenCalls(fetch)
		expect(JSON.parse(String(tokenInit?.body))).toEqual({ apiKey: 'vb_ak_secret' })
		const [[, queryInit]] = queryCalls(fetch)
		expect(new Headers(queryInit?.headers).get('authorization')).toBe('Bearer access-1')
		expect(JSON.parse(String(queryInit?.body))).toEqual({ query: 'Pikachu vs Squirtle?' })
	})

	it('reuses the access token across queries while it is valid', async () => {
		const fetch = fakeApi()
		const client = createVirtualBrainClient({ apiKey: 'vb_ak_secret', fetch })

		await collect(client.streamCompletion('first'))
		await collect(client.streamCompletion('second'))

		expect(tokenCalls(fetch)).toHaveLength(1)
		expect(queryCalls(fetch).map(([, init]) => new Headers(init?.headers).get('authorization')))
			.toEqual(['Bearer access-1', 'Bearer access-1'])
	})

	it('exchanges the API key again when the access token is about to expire', async () => {
		const fetch = fakeApi()
		let now = 0
		const client = createVirtualBrainClient({ apiKey: 'vb_ak_secret', fetch, now: () => now })

		await collect(client.streamCompletion('first'))
		now = 59 * 60 * 1000 + 1
		await collect(client.streamCompletion('second'))

		expect(queryCalls(fetch).map(([, init]) => new Headers(init?.headers).get('authorization')))
			.toEqual(['Bearer access-1', 'Bearer access-2'])
	})

	it('fails with the upstream status when the API key is rejected, and retries the exchange next time', async () => {
		const fetch = fakeApi()
		fetch.mockResolvedValueOnce(new Response('{"message":"Invalid API key"}', { status: 401 }))
		const client = createVirtualBrainClient({ apiKey: 'vb_ak_revoked', fetch })

		await expect(collect(client.streamCompletion('first'))).rejects.toThrow('VirtualBrain API key exchange failed: 401')
		expect(await collect(client.streamCompletion('second'))).toEqual(['ok'])
	})

	it('fails with the upstream status when the completion is refused', async () => {
		const fetch = fakeApi()
		fetch.mockImplementation(async input => String(input).endsWith('/api-key/token')
			? tokenResponse('access-1')
			: new Response('Too Many Requests', { status: 429 }))
		const client = createVirtualBrainClient({ apiKey: 'vb_ak_secret', fetch })

		await expect(collect(client.streamCompletion('first'))).rejects.toThrow('VirtualBrain completion failed: 429')
	})

	it('keeps a character whole when its bytes are split across chunks', async () => {
		const bytes = new TextEncoder().encode('Pokémon')
		const fetch = fakeApi([bytes.slice(0, 4), bytes.slice(4)])
		const client = createVirtualBrainClient({ apiKey: 'vb_ak_secret', fetch })

		expect((await collect(client.streamCompletion('q'))).join('')).toBe('Pokémon')
	})
})
