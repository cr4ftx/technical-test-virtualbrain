import axios from "axios";
import type { BattleMode } from "../types/battle";
import type { Pokemon, PokemonSummary } from "../types/pokemon";

export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const api = axios.create({ baseURL: API_URL });

export async function getPokemons(signal?: AbortSignal): Promise<PokemonSummary[]> {
  const { data } = await api.get<{ pokemons: PokemonSummary[] }>("/pokemons", { signal });
  return data.pokemons;
}

export async function getPokemon(id: number, signal?: AbortSignal): Promise<Pokemon> {
  const { data } = await api.get<{ pokemon: Pokemon }>(`/pokemons/${id}`, { signal });
  return data.pokemon;
}

export async function getBattleMode(signal?: AbortSignal): Promise<BattleMode> {
  const { data } = await api.get<{ mode: BattleMode }>("/battles/mode", { signal });
  return data.mode;
}
