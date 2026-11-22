import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Pokemon } from '../types/pokemon.ts'
import { markdownFileName, renderPokemonMarkdown } from './markdown.ts'

/** Write every Pokémon as a Markdown file into `folder`, replacing whatever a previous export left there */
export const exportPokedexMarkdown = async (pokemons: Pokemon[], folder: string) => {
	// Emptied first so a Pokémon renamed or dropped since the last export leaves no stale file
	await rm(folder, { recursive: true, force: true })
	await mkdir(folder, { recursive: true })
	await Promise.all(
		pokemons.map(pokemon => writeFile(join(folder, markdownFileName(pokemon)), renderPokemonMarkdown(pokemon)))
	)
	return { count: pokemons.length, folder }
}
