import type { BattleAction, RoundResult } from './battleEngine.ts'

/** A round as the frontend sees it: each action also says whether its move was picked at random */
export interface PlayedRound extends Omit<RoundResult, 'actions'> {
	actions: (BattleAction & { fallback: boolean })[]
}

export type BattleEvent =
	| { type: 'text', text: string }
	| ({ type: 'round' } & PlayedRound)
	| { type: 'end' }
	| { type: 'error', message: string }

/** The chatbot's narration as battle events: its text as it streams, then how it finished */
export async function* battleEvents(chunks: AsyncIterable<string>): AsyncGenerator<BattleEvent> {
	try {
		for await (const text of chunks) yield { type: 'text', text }
	} catch (error) {
		// Aborted because the client left: nothing failed, and there is nobody to tell
		if (error instanceof Error && error.name === 'AbortError') return
		// The upstream status and message stay in the server logs, the frontend only needs to offer a retry
		console.error('Battle stream failed:', error instanceof Error ? error.message : error)
		yield { type: 'error', message: 'The battle narration failed, please try again' }
		return
	}
	yield { type: 'end' }
}

/** Encode an event as a Server-Sent Events frame: JSON keeps the narration's newlines from splitting the frame */
export const sseFrame = ({ type, ...data }: BattleEvent): string => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`
