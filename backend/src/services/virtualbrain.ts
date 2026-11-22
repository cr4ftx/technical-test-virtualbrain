const VIRTUALBRAIN_URL = 'https://chatbot-api.getvirtualbrain.com'
// Renew ahead of expiry, so a token never lapses between being picked and reaching the API
const TOKEN_RENEWAL_MARGIN_MS = 60_000

interface VirtualBrainClientOptions {
	apiKey: string
	fetch?: typeof globalThis.fetch
	now?: () => number
}

interface ApiKeyTokenResponse {
	accessToken: string
	expiresIn: number
	chatbotId: string
}

interface Session {
	accessToken: string
	chatbotId: string
	renewAt: number
}

/** Client for the VirtualBrain chatbot API (spec: docs/virtualbrain-openapi.json) */
export function createVirtualBrainClient({ apiKey, fetch = globalThis.fetch, now = Date.now }: VirtualBrainClientOptions) {
	const exchangeApiKey = async (): Promise<Session> => {
		const response = await fetch(`${VIRTUALBRAIN_URL}/v1/auth/api-key/token`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ apiKey })
		})
		if (!response.ok) throw new Error(`VirtualBrain API key exchange failed: ${response.status}`)
		const { accessToken, chatbotId, expiresIn } = await response.json() as ApiKeyTokenResponse
		return { accessToken, chatbotId, renewAt: now() + expiresIn * 1000 - TOKEN_RENEWAL_MARGIN_MS }
	}

	// Kept as a promise, so battles starting while an exchange is in flight wait for it instead of starting their own
	let session: Promise<Session> | undefined

	const getSession = async (): Promise<Session> => {
		const current = session && await session.catch(() => undefined)
		if (current && now() < current.renewAt) return current
		session = exchangeApiKey()
		return session
	}

	/** Stream the chatbot's answer to `query` as text chunks, as they arrive */
	async function* streamCompletion(query: string, signal?: AbortSignal): AsyncGenerator<string> {
		const { accessToken, chatbotId } = await getSession()
		const response = await fetch(`${VIRTUALBRAIN_URL}/v1/open-completion/${chatbotId}/query`, {
			method: 'POST',
			headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
			body: JSON.stringify({ query }),
			signal
		})
		if (!response.ok || !response.body) throw new Error(`VirtualBrain completion failed: ${response.status}`)
		yield * response.body.pipeThrough(new TextDecoderStream())
	}

	return { streamCompletion }
}
