import { useBattleStream } from "../hooks/useBattleStream";
import type { PokemonSummary } from "../types/pokemon";
import { useTheme } from "./ThemeContext";

interface ArenaProps {
  first: PokemonSummary;
  second: PokemonSummary;
  onBack: () => void;
}

function Fighter({ pokemon }: { pokemon: PokemonSummary }) {
  const { stats } = pokemon;
  return (
    <div className="flex flex-1 flex-col items-center gap-2 min-w-0">
      <img src={pokemon.image} alt={pokemon.name} className="w-32 sm:w-48 drop-shadow-xl" />
      <h2 className="text-xl sm:text-2xl font-bold capitalize">{pokemon.name}</h2>
      <div className="flex gap-1">
        {pokemon.types.map((type) => (
          <img key={type.name} src={type.image} alt={type.name} title={type.name} className="h-4" />
        ))}
      </div>
      <dl className="grid grid-cols-2 gap-x-3 text-sm">
        <dt className="opacity-70">HP</dt>
        <dd>{stats.HP}</dd>
        <dt className="opacity-70">Attack</dt>
        <dd>{stats.attack}</dd>
        <dt className="opacity-70">Defense</dt>
        <dd>{stats.defense}</dd>
        <dt className="opacity-70">Speed</dt>
        <dd>{stats.speed}</dd>
      </dl>
    </div>
  );
}

export function Arena({ first, second, onBack }: ArenaProps) {
  const { theme } = useTheme();
  const { state, retry } = useBattleStream(first.id, second.id);

  return (
    <div className="w-full max-w-4xl p-4 flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start rounded-lg border border-orange-400 px-3 py-2 hover:bg-orange-400/20"
      >
        ← Back to the Pokédex
      </button>

      <div className="flex items-center justify-center gap-2 sm:gap-8">
        <Fighter pokemon={first} />
        <div className="text-3xl sm:text-5xl font-black text-orange-500">VS</div>
        <Fighter pokemon={second} />
      </div>

      <section
        aria-label="Battle narration"
        aria-live="polite"
        aria-busy={state.status === "streaming"}
        className={`${theme === "light" ? "bg-white" : "bg-slate-900"} rounded-2xl p-4 sm:p-6 shadow-lg min-h-[12rem]`}
      >
        {state.text ? (
          <p className="whitespace-pre-wrap leading-relaxed">{state.text}</p>
        ) : (
          state.status === "streaming" && <p className="opacity-70">The battle is about to begin...</p>
        )}
        {state.status === "streaming" && state.text && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse align-middle" aria-hidden />
        )}
        {state.status === "error" && (
          <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-red-500">
            <span>{state.message}</span>
            <button
              type="button"
              onClick={retry}
              className="rounded-lg bg-orange-500 px-4 py-1 font-bold text-white hover:bg-orange-600"
            >
              Retry
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
