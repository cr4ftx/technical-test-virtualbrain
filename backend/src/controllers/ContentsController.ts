import { type Request, type Response, Router } from 'express'
import { join } from 'node:path'
import { parsePokemonId } from '../errors.ts'
import { markdownFileName, renderPokemonMarkdown } from '../services/markdown.ts'
import { exportPokedexMarkdown } from '../services/markdownExport.ts'
import { fetchPokemon } from '../services/pokeapi.ts'
import { pokedex } from '../services/pokedex.ts'

const ContentController = Router()

const EXPORT_FOLDER = join(import.meta.dirname, '../../exports/pokemons')

/**
 * Save all pokemon as markdown in the export folder. Waits for the Pokédex build on a cold start.
 * @route GET /contents/all
 * @group Contents
 */
ContentController.get(
	'/all',
	async (_req: Request, res: Response) => {
		const pokemons = await pokedex.load()
		res.status(200).json(await exportPokedexMarkdown(pokemons, EXPORT_FOLDER))
	}
)

/**
 * Return a pokemon as a markdown attachment, from the Pokédex cache when it is loaded, otherwise live from PokeAPI
 * @route GET /contents/:pokemonId
 * @group Contents
 * @param {number} pokemonId.path.required - Pokemon ID (1 to 898)
 */
ContentController.get(
	'/:pokemonId',
	async (req: Request<{ pokemonId: string }>, res: Response) => {
		const id = parsePokemonId(req.params.pokemonId)
		const pokemon = pokedex.peek()?.find(p => p.id === id) ?? await fetchPokemon(id)
		res.status(200)
			.attachment(markdownFileName(pokemon))
			.type('text/markdown; charset=utf-8')
			.send(renderPokemonMarkdown(pokemon))
	}
)

export { ContentController }
