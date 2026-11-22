import type { PokemonSummary } from "../types/pokemon";

export interface PokemonFilters {
  search: string;
  types: string[];
}

export function filterPokemons(pokemons: PokemonSummary[], { search }: PokemonFilters): PokemonSummary[] {
  const needle = search.toLowerCase();
  return pokemons.filter((p) => p.name.toLowerCase().includes(needle));
}
