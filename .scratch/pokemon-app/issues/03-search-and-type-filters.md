# 03: Search and type filters

**What to build:** A user narrows the grid by typing a name and toggling type chips.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Search bar filters by name: case-insensitive substring match
- [ ] 18 type chips (fire, water, …); selecting chips keeps only Pokémon having all selected types (AND)
- [ ] At most 2 types can be selected at once (no Pokémon has 3)
- [ ] Search and type filters combine; a clear action resets both
- [ ] An empty result shows a "No Pokémon found" message
- [ ] Filter logic is a pure function with unit tests (case, substring, AND, combination)
- [ ] The filter bar stays usable on mobile
