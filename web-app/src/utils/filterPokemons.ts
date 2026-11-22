import type { PokemonSummary } from "../types/pokemon";

export interface PokemonFilters {
  search: string;
  types: string[];
}

export function filterPokemons(pokemons: PokemonSummary[], { search, types }: PokemonFilters): PokemonSummary[] {
  const needle = search.toLowerCase();
  return pokemons.filter(
    (p) =>
      p.name.toLowerCase().includes(needle) && types.every((type) => p.types.some((t) => t.name === type))
  );
}

/** No Pokémon has more than two types, so a third selection could only ever empty the grid */
const MAX_SELECTED_TYPES = 2;

export function toggleType(selected: string[], type: string): string[] {
  if (selected.includes(type)) return selected.filter((t) => t !== type);
  if (selected.length >= MAX_SELECTED_TYPES) return selected;
  return [...selected, type];
}
