# 02: Cached Pokédex shown in the grid

**What to build:** Opening the web app shows all 898 Pokémon (gens 1–8) in the responsive grid, each card with image, types, HP, Attack, Defense and Speed. The backend builds the full dataset once and serves it from a disk cache.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] At boot the backend starts building the full dataset in the background, at most ~10 PokeAPI requests in flight
- [ ] The finished build is saved to a gitignored JSON cache file; later boots load it instantly
- [ ] Requests arriving during a build await the same in-flight build (never a second one)
- [ ] A failed build writes nothing; the next request starts a fresh build
- [ ] `GET /pokemons` returns a slim `PokemonSummary` list (id, name, image, sprite, types, 6 stats, generation), ~200 KB
- [ ] `GET /pokemons/:id` keeps returning the full `Pokemon`, served from the cache when available
- [ ] The frontend fetches the list once with a plain fetch hook (AbortController cleanup, no TanStack) and renders all 898 cards
- [ ] Loading state (cold build can take 1–2 min) and error state are shown
- [ ] Grid is responsive down to mobile; the existing dark mode still works
- [ ] Tests cover the in-flight dedupe and the no-partial-write behaviour
