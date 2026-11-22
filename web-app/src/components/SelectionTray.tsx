import type { PokemonSummary } from "../types/pokemon";
import { BATTLE_SIZE } from "../utils/battleSelection";
import { MiniCard } from "./Card";
import { useTheme } from "./ThemeContext";

interface SelectionTrayProps {
  selected: PokemonSummary[];
  onFight: () => void;
}

export function SelectionTray({ selected, onFight }: SelectionTrayProps) {
  const { theme } = useTheme();
  const ready = selected.length === BATTLE_SIZE;

  return (
    <div
      className={`${theme === "light" ? "bg-amber-100" : "bg-slate-900"} sticky bottom-0 z-10 w-full shadow-[0_-4px_12px_rgba(0,0,0,0.2)] p-3`}
    >
      <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-3">
        {Array.from({ length: BATTLE_SIZE }, (_, i) =>
          selected[i] ? (
            <MiniCard key={selected[i].id} pokemon={selected[i]} />
          ) : (
            <div key={`empty-${i}`} className="h-[40px] rounded-2xl border-2 border-dashed border-current px-4 flex items-center opacity-50">
              Pick a Pokémon
            </div>
          )
        )}
        <button
          type="button"
          disabled={!ready}
          onClick={onFight}
          className="rounded-lg bg-orange-500 px-6 py-2 font-bold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Fight!
        </button>
      </div>
    </div>
  );
}
