import { usePokemons } from "../hooks/usePokemons";
import { Header } from "./Header";
import PokemonList from "./PokemonList";
import { useTheme } from "./ThemeContext";

export default function PokemonApp() {
  const state = usePokemons();
  const { theme } = useTheme();

  return (
    <div
      className={`${theme === "light" ? "bg-amber-50 text-slate-800" : "bg-slate-800 text-white"} min-h-screen flex flex-col items-center`}
    >
      <Header />
      {state.status === "loading" && (
        <div role="status" className="text-lg p-8 text-center">
          <p>Loading Pokemons...</p>
          <p className="text-sm opacity-70">The first launch builds the Pokédex and can take a minute or two.</p>
        </div>
      )}
      {state.status === "error" && (
        <div role="alert" className="text-lg p-8 text-red-500">
          {state.message}
        </div>
      )}
      {state.status === "success" && <PokemonList pokemons={state.pokemons} />}
    </div>
  );
}
