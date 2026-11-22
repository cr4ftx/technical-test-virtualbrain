import { useMemo, useState, type MouseEvent } from "react";
import type { PokemonSummary } from "../types/pokemon";
import { throttle } from "../utils/throttle";
import { useTheme } from "./ThemeContext";

interface CardProps {
  pokemon: PokemonSummary;
}

interface SelectableCardProps extends CardProps {
  selected: boolean;
  onToggle: () => void;
}

const MAX_TILT_DIVISOR = 10;

export function MiniCard({ pokemon }: CardProps) {
  return (
    <div className="bg-amber-300 text-slate-800 rounded-2xl p-2 h-[40px] flex items-center">
      <img src={pokemon.sprite || pokemon.image} alt={pokemon.name} className="h-full" />
      <div className="text-center ml-2 capitalize">{pokemon.name}</div>
    </div>
  );
}

export default function Card({ pokemon, selected, onToggle }: SelectableCardProps) {
  const { theme } = useTheme();
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  // Stable throttled handler: recreated only if the component remounts
  const onMouseMove = useMemo(
    () =>
      throttle((e: MouseEvent<HTMLButtonElement>) => {
        const box = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        setRotate({
          x: (y - box.height / 2) / MAX_TILT_DIVISOR,
          y: (box.width / 2 - x) / MAX_TILT_DIVISOR,
        });
      }),
    []
  );

  const onMouseLeave = () => setRotate({ x: 0, y: 0 });

  const { stats } = pokemon;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${selected ? "Deselect" : "Select"} ${pokemon.name} for battle`}
      onClick={onToggle}
      className={`${selected ? "outline outline-4 outline-orange-500 shadow-lg shadow-orange-500/50" : "outline-orange-400 hover:outline-dashed"} relative text-left text-slate-800 bg-gradient-to-r from-amber-300 via-amber-100 to-amber-300 p-1 rounded-2xl w-full max-w-[250px] shadow-md`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale3d(1, 1, 1)`,
        transition: "all 400ms cubic-bezier(0.03, 0.98, 0.52, 0.99) 0s",
      }}
    >
      {selected && (
        <span className="absolute -top-3 -right-3 z-[1] rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white shadow">
          Selected
        </span>
      )}
      <div className="rounded-2xl bg-gradient-to-br from-black/10 via-white/70 to-black/10">
        <div className="p-4 flex flex-col rounded-2xl">
          <div className="flex gap-3 justify-between items-center">
            <div className="font-bold capitalize">{pokemon.name}</div>
            <div>HP: {stats.HP}</div>
            <div className="flex gap-1">
              {pokemon.types.map((type) => (
                <img key={type.name} src={type.image} alt={type.name} title={type.name} className="w-5" />
              ))}
            </div>
          </div>
          <img
            className={`${theme === "light" ? "bg-white" : "bg-blue-950"} outline outline-2 my-3 w-full`}
            src={pokemon.image}
            alt={pokemon.name}
            loading="lazy"
          />
          <div>Attack: {stats.attack}</div>
          <div>Defense: {stats.defense}</div>
          <div>Speed: {stats.speed}</div>
        </div>
      </div>
    </button>
  );
}
