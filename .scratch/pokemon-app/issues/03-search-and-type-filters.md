# 03: Search and type filters

**What to build:** A user narrows the grid by typing a name and toggling type chips.

**Blocked by:** 02

**Status:** resolved

- [x] Search bar filters by name: case-insensitive substring match
- [x] 18 type chips (fire, water, …); selecting chips keeps only Pokémon having all selected types (AND)
- [x] At most 2 types can be selected at once (no Pokémon has 3)
- [x] Search and type filters combine; a clear action resets both
- [x] An empty result shows a "No Pokemon found" message
- [x] Filter logic is a pure function with unit tests (case, substring, AND, combination)
- [x] The filter bar stays usable on mobile

## Comments

**2026-11-22**: Implemented on `swanncastel/03-search-and-type-filters`, PR https://github.com/cr4ftx/technical-test-virtualbrain/pull/3. Notes against the ticket:

- Filter logic is `filterPokemons` + `toggleType` in `web-app/src/utils/filterPokemons.ts`. The web-app gained vitest (`npm test`) to host their unit tests.
- Unselected chips are disabled once two types are picked, on top of `toggleType` ignoring a third.
- Mobile layout is reviewed from markup only, not rendered on a device: the 18 chips wrap to several rows on a narrow phone.
