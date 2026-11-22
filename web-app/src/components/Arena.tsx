import { useState } from "react";
import { useBattleStream } from "../hooks/useBattleStream";
import type { PokemonSummary } from "../types/pokemon";
import { Fighter } from "./Fighter";
import { useTheme } from "./ThemeContext";
import { TurnBasedBattle } from "./TurnBasedBattle";

type BattleMode = "one-shot" | "turn-based";

const MODES: { mode: BattleMode; label: string }[] = [
  { mode: "one-shot", label: "One-shot" },
  { mode: "turn-based", label: "Turn-based" },
];

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
  const [mode, setMode] = useState<BattleMode>("one-shot");

  return (
    <div className="w-full max-w-4xl p-4 flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-orange-400 px-3 py-2 hover:bg-orange-400/20"
        >
          ← Back to the Pokédex
        </button>
        {/* Switching mode unmounts the running battle, which aborts its requests */}
        <div role="radiogroup" aria-label="Battle mode" className="flex rounded-lg border border-orange-400 overflow-hidden">
          {MODES.map(({ mode: value, label }) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className={`px-3 py-2 ${mode === value ? "bg-orange-500 text-white font-bold" : "hover:bg-orange-400/20"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "one-shot" ? (
        <OneShotBattle first={first} second={second} />
      ) : (
        <TurnBasedBattle first={first} second={second} />
      )}
    </div>
  );
}
