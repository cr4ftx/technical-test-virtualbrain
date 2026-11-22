import type { Pokemon } from '../types/pokemon.ts'
import { pokemonTitle } from './markdown.ts'

/** Prompt asking the chatbot to narrate a whole battle between two Pokémon in one answer, from the brain's notes */
export const buildBattlePrompt = (first: Pokemon, second: Pokemon): string => [
	`Simulate a Pokémon battle between ${pokemonTitle(first)} and ${pokemonTitle(second)}.`,
	'Base it on their notes in the knowledge base: use their types, base stats and type matchups from there.',
	'',
	'Narrate the battle turn by turn: the faster Pokémon attacks first, each turn names the move used, '
	+ 'its type effectiveness and the remaining HP. Keep it under 10 turns. '
	+ 'End with a final line announcing the winner.'
].join('\n')
