import { useBattleMode } from "../hooks/useBattleMode";
import { useBattleStream } from "../hooks/useBattleStream";
import type { PokemonSummary } from "../types/pokemon";
import { Fighter } from "./Fighter";
import { useTheme } from "./ThemeContext";
import { TurnBasedBattle } from "./TurnBasedBattle";

interface ArenaProps {
  first: PokemonSummary;
  second: PokemonSummary;
  onBack: () => void;
}

function OneShotBattle({ first, second }: Omit<ArenaProps, "onBack">) {
  const { theme } = useTheme();
  const { state, retry } = useBattleStream(first.id, second.id);

  return (
    <>
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
    </>
  );
}

export function Arena({ first, second, onBack }: ArenaProps) {
  // The backend decides how battles are played (BATTLE_MODE)
  const { state, retry } = useBattleMode();

  return (
    <div className="w-full max-w-4xl p-4 flex flex-col gap-6">
      <button
        type="button"
        onClick={onBack}
        className="self-start rounded-lg border border-orange-400 px-3 py-2 hover:bg-orange-400/20"
      >
        ← Back to the Pokédex
      </button>

      {state.status === "loading" && (
        <p role="status" className="opacity-70 text-center">
          Preparing the arena...
        </p>
      )}
      {state.status === "error" && (
        <div role="alert" className="flex flex-wrap items-center justify-center gap-3 text-red-500">
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
      {state.status === "success" &&
        (state.mode === "one-shot" ? (
          <OneShotBattle first={first} second={second} />
        ) : (
          <TurnBasedBattle first={first} second={second} />
        ))}
    </div>
  );
}
