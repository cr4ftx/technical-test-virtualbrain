import { describe, expect, it } from "vitest";
import type { PokemonSummary } from "../types/pokemon";
import { toggleSelection } from "./battleSelection";

function pokemon(id: number, name: string): PokemonSummary {
  return {
    id,
    name,
    image: "",
    sprite: "",
    types: [],
    stats: { HP: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0 },
    generation: 1,
  };
}

const pikachu = pokemon(25, "pikachu");
const squirtle = pokemon(7, "squirtle");
const bulbasaur = pokemon(1, "bulbasaur");

describe("toggleSelection", () => {
  it("selects an unselected Pokémon", () => {
    expect(toggleSelection([pikachu], squirtle)).toEqual([pikachu, squirtle]);
  });

  it("deselects a selected Pokémon", () => {
    expect(toggleSelection([pikachu, squirtle], pikachu)).toEqual([squirtle]);
  });

  it("ignores a third Pokémon, since a battle has two", () => {
    expect(toggleSelection([pikachu, squirtle], bulbasaur)).toEqual([pikachu, squirtle]);
  });
});
