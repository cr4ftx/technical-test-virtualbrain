import { useEffect, useState } from "react";
import axios from "axios";
import { getPokemons } from "../api/client";
import type { PokemonSummary } from "../types/pokemon";

type PokemonsState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; pokemons: PokemonSummary[] };

/** Fetches the whole Pokédex once on mount, cancelling the request on unmount */
export function usePokemons(): PokemonsState {
  const [state, setState] = useState<PokemonsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    getPokemons(controller.signal)
      .then((pokemons) => setState({ status: "success", pokemons }))
      .catch((error: unknown) => {
        if (axios.isCancel(error)) return;
        setState({ status: "error", message: "Could not load Pokémon. Is the backend running?" });
      });

    return () => controller.abort();
  }, []);

  return state;
}
