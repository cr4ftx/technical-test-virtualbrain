import type { BattleMove } from './battleEngine.ts'
import { pokeapi } from './pokeapi.ts'

interface NamedResource {
	name: string
	url: string
}

/** One entry of a PokeAPI Pokémon's `moves` */
export interface ApiPokemonMove {
	move: NamedResource
	version_group_details: {
		level_learned_at: number
		move_learn_method: NamedResource
		version_group: NamedResource
	}[]
}

/** The fields of a PokeAPI move the battle needs */
export interface ApiMove {
	name: string
	/** `null` for status moves and moves whose power varies (flail, low kick...) */
	power: number | null
	accuracy: number | null
	type: NamedResource
	damage_class: NamedResource
}

const MOVES_PER_POKEMON = 4

// The engine needs at least one move: Pokémon like Ditto learn no damaging move by level-up
const STRUGGLE: BattleMove = { name: 'struggle', power: 50, type: 'normal', accuracy: null, damageClass: 'physical' }

const versionGroupId = ({ url }: NamedResource): number => Number(url.split('/').filter(Boolean).pop())

const toBattleMove = (move: ApiMove): BattleMove | undefined => {
	const damageClass = move.damage_class.name
	if (move.power === null || (damageClass !== 'physical' && damageClass !== 'special')) return undefined
	return { name: move.name, power: move.power, type: move.type.name, accuracy: move.accuracy, damageClass }
}

/** Level-up moves in the most recent version group the Pokémon has them in, learned last first */
export const latestLevelUpMoves = (pokemonMoves: ApiPokemonMove[]): string[] => {
	const levelUps = pokemonMoves.flatMap(({ move, version_group_details }) =>
		version_group_details
			.filter(d => d.move_learn_method.name === 'level-up')
			.map(d => ({ name: move.name, level: d.level_learned_at, group: versionGroupId(d.version_group) })))
	// Learnsets change between games: mixing levels from several would compare unrelated numbers
	const latestGroup = Math.max(...levelUps.map(m => m.group))

	return levelUps
		.filter(m => m.group === latestGroup)
		.sort((a, b) => b.level - a.level)
		.map(m => m.name)
}

/** The 4 damaging level-up moves the Pokémon learned last, from the details of its moves */
export const selectBattleMoves = (pokemonMoves: ApiPokemonMove[], details: ReadonlyMap<string, ApiMove>): BattleMove[] => {
	const moves = latestLevelUpMoves(pokemonMoves)
		.flatMap(name => {
			const detail = details.get(name)
			const move = detail && toBattleMove(detail)
			return move ? [move] : []
		})
		.slice(0, MOVES_PER_POKEMON)
	return moves.length > 0 ? moves : [STRUGGLE]
}

// Move details never change and are shared by many Pokémon: kept for the server's lifetime
const moveCache = new Map<string, Promise<ApiMove>>()

const fetchMove = (name: string): Promise<ApiMove> => {
	let move = moveCache.get(name)
	if (!move) {
		move = pokeapi.get<ApiMove>(`/move/${name}`).then(r => r.data)
		// A failed lookup is retried by the next battle instead of failing every battle with this move
		move.catch(() => moveCache.delete(name))
		moveCache.set(name, move)
	}
	return move
}

/** A Pokémon's battle moves, live from PokeAPI */
export async function fetchBattleMoves(pokemonId: number): Promise<BattleMove[]> {
	const { data } = await pokeapi.get<{ moves: ApiPokemonMove[] }>(`/pokemon/${pokemonId}`)
	const names = latestLevelUpMoves(data.moves)
	const details = await Promise.all(names.map(fetchMove))
	return selectBattleMoves(data.moves, new Map(details.map(d => [d.name, d])))
}
