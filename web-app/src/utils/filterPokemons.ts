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
