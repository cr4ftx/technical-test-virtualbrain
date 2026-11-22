import { useMemo, useState } from "react";
import { usePokemons } from "../hooks/usePokemons";
import type { PokemonSummary } from "../types/pokemon";
import { toggleSelection } from "../utils/battleSelection";
import { filterPokemons, NO_FILTERS } from "../utils/filterPokemons";
import { Arena } from "./Arena";
import { FilterBar } from "./FilterBar";
import { Header } from "./Header";
import PokemonList from "./PokemonList";
import { SelectionTray } from "./SelectionTray";
import { useTheme } from "./ThemeContext";

export default function PokemonApp() {
  const state = usePokemons();
  const { theme } = useTheme();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [selected, setSelected] = useState<PokemonSummary[]>([]);
  const [inArena, setInArena] = useState(false);

  const pokemons = state.status === "success" ? state.pokemons : null;
  const visiblePokemons = useMemo(() => pokemons && filterPokemons(pokemons, filters), [pokemons, filters]);
  const [first, second] = selected;

  return (
    <div
      className={`${theme === "light" ? "bg-amber-50 text-slate-800" : "bg-slate-800 text-white"} min-h-screen flex flex-col items-center`}
    >
      <Header />
      {state.status === "loading" && (
        <div role="status" className="text-lg p-8 text-center">
          <p>Loading Pokémon...</p>
          <p className="text-sm opacity-70">The first launch builds the Pokédex and can take a minute or two.</p>
        </div>
      )}
      {state.status === "error" && (
        <div role="alert" className="text-lg p-8 text-red-500">
          {state.message}
        </div>
      )}
      {inArena && first && second ? (
        <Arena first={first} second={second} onBack={() => setInArena(false)} />
      ) : (
        visiblePokemons && (
          <>
            <FilterBar filters={filters} onChange={setFilters} />
            <PokemonList
              pokemons={visiblePokemons}
              selected={selected}
              onToggle={(pokemon) => setSelected((s) => toggleSelection(s, pokemon))}
            />
            <SelectionTray selected={selected} onFight={() => setInArena(true)} />
          </>
        )
      )}
    </div>
  );
}
