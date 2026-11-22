import type { PokemonSummary } from "../types/pokemon";
import Card from "./Card";

interface PokemonListProps {
  pokemons: PokemonSummary[];
}

export default function PokemonList({ pokemons }: PokemonListProps) {
  if (pokemons.length === 0) {
    return <div className="text-lg text-center w-full p-8">No Pokemon found</div>;
  }

  return (
    <div className="p-4 w-full max-w-7xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-10 place-items-center">
      {pokemons.map((p) => (
        <Card key={p.id} pokemon={p} />
      ))}
    </div>
  );
}
