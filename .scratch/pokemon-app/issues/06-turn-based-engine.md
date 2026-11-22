# 06: Turn-based battle engine (no LLM yet)

**What to build:** In the arena, a user switches to turn-based mode and plays round by round: the app computes damage, HP bars drop and the battle ends on a KO. Moves are picked at random for now, so the mode is demoable before the LLM is wired.

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] Each Pokémon gets 4 real damaging level-up moves (latest learned) from PokeAPI, with power, type, accuracy and physical/special class; move details are cached
- [ ] Max HP is the base HP stat scaled to level 50
- [ ] Damage formula: `((22 × power × A/D) / 50 + 2) × STAB 1.5 × type multiplier × random(0.85–1)`, with A/D using special stats for special moves and the type multiplier from the defender's resistances
- [ ] The faster Pokémon acts first; a move can miss per its accuracy; a Pokémon at 0 HP is KO and doesn't act
- [ ] The engine is pure with an injectable random source and full unit tests (formula, STAB, immunity, speed order, miss, KO)
- [ ] Battle state lives on the server in an in-memory map; `POST /battles` (turn-based mode) creates it and a round endpoint resolves the next round
- [ ] Rounds emit `round` SSE events (moves used, damage, hits/misses, HP, KO) on the same protocol as ticket 05
- [ ] The arena has a one-shot / turn-based mode toggle, HP bars, a round log and a "Next round" action until KO
