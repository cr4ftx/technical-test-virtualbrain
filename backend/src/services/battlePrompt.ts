import type { Pokemon } from '../types/pokemon.ts'

const capitalize = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1)

const describePokemon = ({ name, apiTypes, stats }: Pokemon): string =>
	`- ${capitalize(name)} (${apiTypes.map(t => t.name).join('/')}): `
	+ `HP ${stats.HP}, Attack ${stats.attack}, Defense ${stats.defense}, `
	+ `Sp. Atk ${stats.special_attack}, Sp. Def ${stats.special_defense}, Speed ${stats.speed}`

/** Prompt asking the chatbot to narrate a whole battle between two Pokémon in one answer */
export const buildBattlePrompt = (first: Pokemon, second: Pokemon): string => [
	'Simulate a Pokémon battle between these two Pokémon, using their types and base stats:',
	describePokemon(first),
	describePokemon(second),
	'',
	'Narrate the battle turn by turn: the faster Pokémon attacks first, each turn names the move used, '
	+ 'its type effectiveness and the remaining HP. Keep it under 10 turns. '
	+ 'End with a final line announcing the winner.'
].join('\n')
