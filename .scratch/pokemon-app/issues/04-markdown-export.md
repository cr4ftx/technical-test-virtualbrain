# 04: Markdown export

**What to build:** A single Pokémon can be downloaded as a Markdown file, and all 898 can be exported to a local folder ready to import into the VirtualBrain brain.

**Blocked by:** 02

**Status:** resolved

- [x] A hand-written renderer turns a full `Pokemon` into Markdown: name and id, generation, types, a stats table, weaknesses/resistances/immunities grouped by multiplier, pre-evolution and evolutions
- [x] The renderer is a pure function with unit tests
- [x] `GET /contents/:pokemonId` returns `text/markdown` as an attachment named like `0025-pikachu.md`; invalid ids (outside 1–898) return a 400
- [x] `GET /contents/all` renders all 898 from the cache into the gitignored `exports/pokemons/` folder using the same file names, reusing the single-Pokémon logic
- [x] `/contents/all` responds with `{ count, folder }`
- [x] Running the export twice overwrites cleanly (no stale or duplicate files)

## Comments

**2026-11-22**: Implemented on `swanncastel/04-markdown-export`. Notes against the ticket:

- The renderer is `renderPokemonMarkdown` + `markdownFileName` in `backend/src/services/markdown.ts`. The bulk export is `exportPokedexMarkdown` in `backend/src/services/markdownExport.ts`. Both are unit tested. The routes are thin and have no automated tests (no HTTP test setup).
- The export goes to `backend/exports/pokemons/`, which is gitignored. A hidden note in the README says `pokemons-ru`. We kept the ticket's name, because nothing backs the README's version up.
- Type matchups use `apiResistances` and ignore abilities.
