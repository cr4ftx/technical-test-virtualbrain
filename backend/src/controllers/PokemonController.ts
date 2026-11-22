import { type Request, type Response, Router } from 'express'
import { parsePokemonId } from '../errors.ts'
import { fetchPokemon } from '../services/pokeapi.ts'

const PokemonController = Router()

/**
 * Return a pokemon
 * @route GET /pokemons/:id
 * @group Pokemons
 * @param {number} id.path.required - Pokemon ID (1 to 898)
 */
PokemonController.get(
	'/:id',
	async (req: Request<{ id: string }>, res: Response) => {
		const pokemon = await fetchPokemon(parsePokemonId(req.params.id))
		res.status(200).json({ pokemon })
	}
)

export { PokemonController }
