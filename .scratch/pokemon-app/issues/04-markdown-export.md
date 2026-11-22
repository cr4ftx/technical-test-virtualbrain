# 04: Markdown export

**What to build:** A single Pokémon can be downloaded as a Markdown file, and all 898 can be exported to a local folder ready to import into the VirtualBrain brain.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] A hand-written renderer turns a full `Pokemon` into Markdown: name and id, generation, types, a stats table, weaknesses/resistances/immunities grouped by multiplier, pre-evolution and evolutions
- [ ] The renderer is a pure function with unit tests
- [ ] `GET /contents/:pokemonId` returns `text/markdown` as an attachment named like `0025-pikachu.md`; invalid ids (outside 1–898) return a 400
- [ ] `GET /contents/all` renders all 898 from the cache into the gitignored `exports/pokemons/` folder using the same file names, reusing the single-Pokémon logic
- [ ] `/contents/all` responds with `{ count, folder }`
- [ ] Running the export twice overwrites cleanly (no stale or duplicate files)
