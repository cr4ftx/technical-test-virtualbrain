import axios from "axios";
import type { Pokemon } from "../types/pokemon";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
});

export async function getPokemon(id: number, signal?: AbortSignal): Promise<Pokemon> {
  const { data } = await api.get<{ pokemon: Pokemon }>(`/pokemons/${id}`, { signal });
  return data.pokemon;
}
