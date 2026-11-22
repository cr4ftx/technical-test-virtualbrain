import type { Pokemon } from '../types/pokemon.ts'
import { pokemonTitle } from './markdown.ts'

/**
 * The query asking the chatbot for a battle between two Pokémon.
 *
 * The brain's document search embeds the whole query, and every note shares the same template,
 * so any instruction text drowns the names and retrieves the wrong notes. The query therefore
 * carries only the note titles; the battle instructions live in the chatbot's custom prompt
 * (docs/chatbot-custom-prompt.md), whose trigger sentence matches this wording: reword both together.
 */
export const buildBattlePrompt = (first: Pokemon, second: Pokemon): string =>
	`What happens if ${pokemonTitle(first)} fights ${pokemonTitle(second)}?`
