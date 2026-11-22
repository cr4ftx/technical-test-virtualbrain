import { useEffect, useState } from "react";
import axios from "axios";
import { getPokemon } from "../api/client";
import type { Pokemon } from "../types/pokemon";
import { Header } from "./Header";
import PokemonList from "./PokemonList";
import { useTheme } from "./ThemeContext";

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; pokemons: Pokemon[] };

export default function PokemonApp() {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const { theme } = useTheme();

  useEffect(() => {
    const controller = new AbortController();

    getPokemon(1, controller.signal)
      .then((pokemon) => setState({ status: "success", pokemons: [pokemon] }))
      .catch((error: unknown) => {
        if (axios.isCancel(error)) return;
        setState({ status: "error", message: "Could not load Pokemons. Is the backend running?" });
      });

    return () => controller.abort();
  }, []);

  return (
    <div
      className={`${theme === "light" ? "bg-amber-50 text-slate-800" : "bg-slate-800 text-white"} min-h-screen flex flex-col items-center`}
    >
      <Header />
      {state.status === "loading" && <div className="text-lg p-8">Loading Pokemons...</div>}
      {state.status === "error" && (
        <div role="alert" className="text-lg p-8 text-red-500">
          {state.message}
        </div>
      )}
      {state.status === "success" && <PokemonList pokemons={state.pokemons} />}
    </div>
  );
}
