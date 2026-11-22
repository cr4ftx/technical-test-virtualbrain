const MOVES_LABEL = 'MOVES:'

// The LLM sometimes bolds the label (`**MOVES:**`): emphasis and indentation don't make it narration
const stripLead = (line: string): string => line.replace(/^[\s*_`]+/, '').toUpperCase()

const isMovesLine = (line: string): boolean => stripLead(line).startsWith(MOVES_LABEL)

const couldBeMovesLine = (line: string): boolean => {
	const lead = stripLead(line)
	return MOVES_LABEL.startsWith(lead) || lead.startsWith(MOVES_LABEL)
}

/**
 * Splits a round's streamed narration from its final `MOVES: <move> | <move>` line.
 * Text is released as soon as its line can no longer be the MOVES line, so the narration still streams live;
 * only a line that may turn into `MOVES:` is held back until it is complete.
 */
export function createNarrationFilter() {
	let line = ''
	let lineIsNarration = false
	let movesLine: string | undefined

	const closeLine = (): string => {
		const closed = line
		line = ''
		lineIsNarration = false
		if (!isMovesLine(closed)) return closed
		movesLine = closed.trim()
		return ''
	}

	return {
		/** The narration that can be shown now */
		feed(chunk: string): string {
			let text = ''
			for (const char of chunk) {
				if (lineIsNarration) {
					text += char
					if (char === '\n') lineIsNarration = false
					continue
				}
				line += char
				if (char === '\n') text += closeLine()
				else if (!couldBeMovesLine(line)) {
					text += line
					line = ''
					lineIsNarration = true
				}
			}
			return text
		},
		/** The narration still held back, and the MOVES line if the LLM wrote one */
		end(): { text: string, movesLine?: string } {
			const text = closeLine()
			return movesLine === undefined ? { text } : { text, movesLine }
		}
	}
}
