import { type Request, type Response, Router } from 'express'
import { parsePokemonId } from '../errors.ts'
import { fetchPokemon } from '../services/pokeapi.ts'
import { pokedex } from '../services/pokedex.ts'
import type { Pokemon, PokemonSummary } from '../types/pokemon.ts'

const PokemonController = Router()

const toSummary = (pokemon: Pokemon): PokemonSummary => ({
	id: pokemon.id,
	name: pokemon.name,
	image: pokemon.image,
	sprite: pokemon.sprite,
	types: pokemon.apiTypes,
	stats: pokemon.stats,
	generation: pokemon.apiGeneration
})

/**
 * Return every pokemon as a summary. Waits for the Pokédex build on a cold start.
 * @route GET /pokemons
 * @group Pokemons
 */
PokemonController.get('/', async (_req: Request, res: Response) => {
	const pokemons = await pokedex.load()
	res.status(200).json({ pokemons: pokemons.map(toSummary) })
})

/**
 * Return a pokemon, from the Pokédex cache when it is loaded, otherwise live from PokeAPI
 * @route GET /pokemons/:id
 * @group Pokemons
 * @param {number} id.path.required - Pokemon ID (1 to 898)
 */
PokemonController.get(
	'/:id',
	async (req: Request<{ id: string }>, res: Response) => {
		const id = parsePokemonId(req.params.id)
		const pokemon = pokedex.peek()?.find(p => p.id === id) ?? await fetchPokemon(id)
		res.status(200).json({ pokemon })
	}
)

export { PokemonController }
