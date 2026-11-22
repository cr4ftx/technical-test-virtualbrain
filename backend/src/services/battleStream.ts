export type BattleEvent =
	| { type: 'text', text: string }
	| { type: 'end' }
	| { type: 'error', message: string }

/** The chatbot's narration as battle events: its text as it streams, then how it finished */
export async function* battleEvents(chunks: AsyncIterable<string>): AsyncGenerator<BattleEvent> {
	try {
		for await (const text of chunks) yield { type: 'text', text }
	} catch (error) {
		// The upstream status and message stay in the server logs, the frontend only needs to offer a retry
		console.error('Battle stream failed:', error instanceof Error ? error.message : error)
		yield { type: 'error', message: 'The battle narration failed, please try again' }
		return
	}
	yield { type: 'end' }
}
