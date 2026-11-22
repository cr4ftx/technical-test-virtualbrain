import type { PokemonSummary } from "../types/pokemon";

/** The 18 type names, exactly as the backend sends them in `PokemonSummary.types` */
export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const;

export type PokemonTypeName = (typeof POKEMON_TYPES)[number];

/** No Pokémon has more than two types, so a third selection could only ever empty the grid */
export const MAX_SELECTED_TYPES = 2;

export interface PokemonFilters {
  search: string;
  types: PokemonTypeName[];
}

export const NO_FILTERS: PokemonFilters = { search: "", types: [] };

export function filterPokemons(pokemons: PokemonSummary[], { search, types }: PokemonFilters): PokemonSummary[] {
  const needle = search.toLowerCase();
  return pokemons.filter(
    (p) =>
      p.name.toLowerCase().includes(needle) && types.every((type) => p.types.some((t) => t.name === type))
  );
}

export function toggleType(selected: PokemonTypeName[], type: PokemonTypeName): PokemonTypeName[] {
  if (selected.includes(type)) return selected.filter((t) => t !== type);
  if (selected.length >= MAX_SELECTED_TYPES) return selected;
  return [...selected, type];
}
