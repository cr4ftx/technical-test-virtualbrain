import { useTurnBasedBattle, type LoggedRound } from "../hooks/useTurnBasedBattle";
import type { BattleAction } from "../types/battle";
import type { PokemonSummary } from "../types/pokemon";
import { Fighter } from "./Fighter";
import { useTheme } from "./ThemeContext";

interface TurnBasedBattleProps {
  first: PokemonSummary;
  second: PokemonSummary;
}

const moveName = (move: string) => move.replace(/-/g, " ");

function ActionLine({ action, names }: { action: BattleAction; names: [string, string] }) {
  const attacker = names[action.attacker];
  const defender = names[action.attacker === 0 ? 1 : 0];
  return (
    <li>
      <span className="capitalize">{attacker}</span> used <span className="capitalize">{moveName(action.move)}</span>
      {action.hit ? (
        action.damage === 0 ? (
          <span className="opacity-70">, it had no effect on {defender}</span>
        ) : (
          <>
            : <span className="font-semibold">{action.damage}</span> damage
          </>
        )
      ) : (
        <span className="opacity-70">, but it missed</span>
      )}
      {action.ko && (
        <span className="font-bold text-red-500">
          {" "}
          · <span className="capitalize">{defender}</span> is KO!
        </span>
      )}
      {action.fallback && (
        <span
          title="The chatbot named no valid move, so this one was picked at random"
          className="ml-2 rounded bg-amber-200 px-1.5 text-xs font-semibold text-amber-900"
        >
          random move
        </span>
      )}
    </li>
  );
}

function Narration({ text }: { text: string }) {
  return <p className="whitespace-pre-line italic opacity-80">{text}</p>;
}

function RoundEntry({ result, names }: { result: LoggedRound; names: [string, string] }) {
  return (
    <li>
      <h3 className="font-bold">Round {result.round}</h3>
      {result.narration && <Narration text={result.narration} />}
      <ul className="pl-4">
        {result.actions.map((action) => (
          <ActionLine key={action.attacker} action={action} names={names} />
        ))}
      </ul>
    </li>
  );
}

export function TurnBasedBattle({ first, second }: TurnBasedBattleProps) {
  const { theme } = useTheme();
  const { state, nextRound, retry } = useTurnBasedBattle(first.id, second.id);
  const names: [string, string] = [first.name, second.name];
  const fighters = state.battle?.fighters;
  const winner = state.rounds[state.rounds.length - 1]?.winner;

  return (
    <>
      <div className="flex items-center justify-center gap-2 sm:gap-8">
        <Fighter pokemon={first} health={fighters?.[0]} />
        <div className="text-3xl sm:text-5xl font-black text-orange-500">VS</div>
        <Fighter pokemon={second} health={fighters?.[1]} />
      </div>

      <section
        aria-label="Round log"
        aria-live="polite"
        aria-busy={state.status === "starting" || state.status === "playing"}
        className={`${theme === "light" ? "bg-white" : "bg-slate-900"} rounded-2xl p-4 sm:p-6 shadow-lg min-h-[12rem] flex flex-col gap-4`}
      >
        {state.status === "starting" && <p className="opacity-70">The Pokémon are getting ready...</p>}
        {state.status === "ready" && state.rounds.length === 0 && (
          <p className="opacity-70">Both Pokémon are ready. Start the first round!</p>
        )}
        {state.rounds.length > 0 && (
          <ol className="flex flex-col gap-3">
            {state.rounds.map((result) => (
              <RoundEntry key={result.round} result={result} names={names} />
            ))}
          </ol>
        )}
        {(state.status === "playing" || (state.status === "error" && state.narration)) && (
          <div>
            <h3 className="font-bold">Round {state.rounds.length + 1}</h3>
            {state.narration ? (
              <Narration text={state.narration} />
            ) : (
              <p className="opacity-70">Both Pokémon are choosing their move...</p>
            )}
          </div>
        )}
        {winner !== undefined && (
          <p className="text-xl font-bold text-orange-500">
            <span className="capitalize">{names[winner]}</span> wins the battle!
          </p>
        )}
        {state.status === "error" && (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-red-500">
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
        {(state.status === "ready" || state.status === "playing") && (
          <button
            type="button"
            onClick={nextRound}
            disabled={state.status === "playing"}
            className="self-center rounded-lg bg-orange-500 px-6 py-2 font-bold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {state.rounds.length === 0 ? "Start round 1" : "Next round"}
          </button>
        )}
      </section>
    </>
  );
}
