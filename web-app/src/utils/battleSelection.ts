import type { PokemonSummary } from "../types/pokemon";

export const BATTLE_SIZE = 2;

export function toggleSelection(selected: PokemonSummary[], pokemon: PokemonSummary): PokemonSummary[] {
  if (selected.some((p) => p.id === pokemon.id)) return selected.filter((p) => p.id !== pokemon.id);
  if (selected.length >= BATTLE_SIZE) return selected;
  return [...selected, pokemon];
}
