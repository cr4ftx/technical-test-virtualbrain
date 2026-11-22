import { describe, expect, it } from "vitest";
import type { PokemonSummary } from "../types/pokemon";
import { filterPokemons, toggleType } from "./filterPokemons";

function pokemon(name: string, types: string[]): PokemonSummary {
  return {
    id: 0,
    name,
    image: "",
    sprite: "",
    types: types.map((type) => ({ name: type, image: "" })),
    stats: { HP: 0, attack: 0, defense: 0, special_attack: 0, special_defense: 0, speed: 0 },
    generation: 1,
  };
}

const bulbasaur = pokemon("bulbasaur", ["grass", "poison"]);
const charmander = pokemon("charmander", ["fire"]);
const charizard = pokemon("charizard", ["fire", "flying"]);
const pidgey = pokemon("pidgey", ["normal", "flying"]);
const pokedex = [bulbasaur, charmander, charizard, pidgey];

const names = (pokemons: PokemonSummary[]) => pokemons.map((p) => p.name);

describe("filterPokemons", () => {
  it("keeps Pokémon whose name contains the search, ignoring case", () => {
    expect(names(filterPokemons(pokedex, { search: "ChAr", types: [] }))).toEqual(["charmander", "charizard"]);
    expect(names(filterPokemons(pokedex, { search: "saur", types: [] }))).toEqual(["bulbasaur"]);
  });

  it("keeps only Pokémon having every selected type", () => {
    expect(names(filterPokemons(pokedex, { search: "", types: ["flying"] }))).toEqual(["charizard", "pidgey"]);
    expect(names(filterPokemons(pokedex, { search: "", types: ["fire", "flying"] }))).toEqual(["charizard"]);
  });

  it("applies the search and the types together", () => {
    expect(names(filterPokemons(pokedex, { search: "char", types: ["flying"] }))).toEqual(["charizard"]);
    expect(names(filterPokemons(pokedex, { search: "bulba", types: ["fire"] }))).toEqual([]);
  });
});

describe("toggleType", () => {
  it("selects an unselected type", () => {
    expect(toggleType(["fire"], "flying")).toEqual(["fire", "flying"]);
  });

  it("deselects a selected type", () => {
    expect(toggleType(["fire", "flying"], "fire")).toEqual(["flying"]);
  });

  it("ignores a third type, since no Pokémon has three", () => {
    expect(toggleType(["fire", "flying"], "water")).toEqual(["fire", "flying"]);
  });
});
