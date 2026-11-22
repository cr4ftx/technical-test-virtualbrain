import type { BattleFighter } from "../types/battle";
import type { PokemonSummary } from "../types/pokemon";

interface FighterProps {
  pokemon: PokemonSummary;
  /** Shown as an HP bar in turn-based battles */
  health?: BattleFighter;
}

function HpBar({ hp, maxHp }: BattleFighter) {
  const ratio = hp / maxHp;
  const color = ratio > 0.5 ? "bg-green-500" : ratio > 0.2 ? "bg-yellow-400" : "bg-red-500";
  return (
    <div className="w-full max-w-[12rem]">
      <div
        role="meter"
        aria-label="HP"
        aria-valuemin={0}
        aria-valuemax={maxHp}
        aria-valuenow={hp}
        className="h-3 rounded-full bg-slate-400/40 overflow-hidden"
      >
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <p className="text-center text-sm tabular-nums">
        {hp} / {maxHp} HP
      </p>
    </div>
  );
}

export function Fighter({ pokemon, health }: FighterProps) {
  const { stats } = pokemon;
  const ko = health?.hp === 0;
  return (
    <div className="flex flex-1 flex-col items-center gap-2 min-w-0">
      <img
        src={pokemon.image}
        alt={pokemon.name}
        className={`w-32 sm:w-48 drop-shadow-xl transition ${ko ? "grayscale opacity-50" : ""}`}
      />
      <h2 className="text-xl sm:text-2xl font-bold capitalize">{pokemon.name}</h2>
      <div className="flex gap-1">
        {pokemon.types.map((type) => (
          <img key={type.name} src={type.image} alt={type.name} title={type.name} className="h-4" />
        ))}
      </div>
      {health ? (
        <HpBar {...health} />
      ) : (
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
      )}
    </div>
  );
}
