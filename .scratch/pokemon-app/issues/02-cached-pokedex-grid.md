# 02: Cached Pokédex shown in the grid

**What to build:** Opening the web app shows all 898 Pokémon (gens 1–8) in the responsive grid, each card with image, types, HP, Attack, Defense and Speed. The backend builds the full dataset once and serves it from a disk cache.

**Blocked by:** 01

**Status:** resolved

- [x] At boot the backend starts building the full dataset in the background, at most ~10 PokeAPI requests in flight
- [x] The finished build is saved to a gitignored JSON cache file; later boots load it instantly
- [x] Requests arriving during a build await the same in-flight build (never a second one)
- [x] A failed build writes nothing; the next request starts a fresh build
- [x] `GET /pokemons` returns a slim `PokemonSummary` list (id, name, image, sprite, types, 6 stats, generation), ~200 KB
- [x] `GET /pokemons/:id` keeps returning the full `Pokemon`, served from the cache when available
- [x] The frontend fetches the list once with a plain fetch hook (AbortController cleanup, no TanStack) and renders all 898 cards
- [x] Loading state (cold build can take 1–2 min) and error state are shown
- [x] Grid is responsive down to mobile; the existing dark mode still works
- [x] Tests cover the in-flight dedupe and the no-partial-write behaviour

## Comments

**2026-11-22**: Implemented on `swanncastel/02-cached-pokedex-grid`. Notes against the ticket:

- `GET /pokemons` is ~500 KB uncompressed (31 KB gzipped), not ~200 KB: type icon URLs account for ~180 KB. Kept as-is since the card renders them; sending type names only and building icon URLs client-side would close the gap.
- The 10-in-flight cap sits on the PokeAPI client's adapter, so it bounds requests (retries included), not pokemons. `GET /pokemons/:id` live fallbacks share it and queue behind a cold build.
- A real cold build took 5–7 s, far under the 1–2 min estimate; the loading copy keeps the conservative wording.
- A corrupt cache file is treated as a miss and rebuilt; a failed build aborts its still-queued requests.
- The fetch hook reuses the existing axios client with an AbortController signal. The web-app has no test runner, so the frontend is verified by typecheck, lint and build only.
