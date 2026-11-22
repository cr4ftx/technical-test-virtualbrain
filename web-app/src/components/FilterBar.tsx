import { MAX_SELECTED_TYPES, NO_FILTERS, toggleType, type PokemonFilters } from "../utils/filterPokemons";
import { useTheme } from "./ThemeContext";

const TYPES = [
  "normal",
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

interface FilterBarProps {
  filters: PokemonFilters;
  onChange: (filters: PokemonFilters) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const { theme } = useTheme();
  const isFull = filters.types.length >= MAX_SELECTED_TYPES;

  return (
    <div className="w-full max-w-7xl p-4 flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search by name"
          aria-label="Search by name"
          className={`${theme === "light" ? "bg-white border-slate-300" : "bg-slate-900 border-slate-600"} min-w-0 flex-1 rounded-lg border px-3 py-2`}
        />
        <button
          type="button"
          onClick={() => onChange(NO_FILTERS)}
          className="rounded-lg border border-orange-400 px-3 py-2 hover:bg-orange-400/20"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type (up to 2)">
        {TYPES.map((type) => {
          const selected = filters.types.includes(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={selected}
              disabled={!selected && isFull}
              onClick={() => onChange({ ...filters, types: toggleType(filters.types, type) })}
              className={`${selected ? "bg-orange-400 text-slate-900 border-orange-400" : "border-current"} rounded-full border px-3 py-1 text-sm capitalize disabled:opacity-40`}
            >
              {type}
            </button>
          );
        })}
      </div>
    </div>
  );
}
