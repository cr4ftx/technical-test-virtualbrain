# 06: Turn-based battle engine (no LLM yet)

**What to build:** In the arena, a user switches to turn-based mode and plays round by round: the app computes damage, HP bars drop and the battle ends on a KO. Moves are picked at random for now, so the mode is demoable before the LLM is wired.

**Blocked by:** 05

**Status:** resolved

- [x] Each Pokémon gets 4 real damaging level-up moves (latest learned) from PokeAPI, with power, type, accuracy and physical/special class; move details are cached
- [x] Max HP is the base HP stat scaled to level 50
- [x] Damage formula: `((22 × power × A/D) / 50 + 2) × STAB 1.5 × type multiplier × random(0.85–1)`, with A/D using special stats for special moves and the type multiplier from the defender's resistances
- [x] The faster Pokémon acts first; a move can miss per its accuracy; a Pokémon at 0 HP is KO and doesn't act
- [x] The engine is pure with an injectable random source and full unit tests (formula, STAB, immunity, speed order, miss, KO)
- [x] Battle state lives on the server in an in-memory map; `POST /battles` (turn-based mode) creates it and a round endpoint resolves the next round
- [x] Rounds emit `round` SSE events (moves used, damage, hits/misses, HP, KO) on the same protocol as ticket 05
- [x] The arena has a one-shot / turn-based mode toggle, HP bars, a round log and a "Next round" action until KO

## Comments

**2026-11-22**: Implemented on `swanncastel/06-turn-based-engine` ([PR #7](https://github.com/cr4ftx/technical-test-virtualbrain/pull/7)). Notes against the ticket:

- Max HP is base HP + 60 (level 50, no IVs/EVs). A/D use base stats. A landed hit deals at least 1 damage unless the defender is immune.
- "Latest learned" means the highest learn level in the most recent version group the Pokémon has. The Japanese Gen 1 groups are skipped (PokeAPI numbers them after Scarlet/Violet). Pokémon with no damaging level-up move (Ditto) get Struggle.
- **Changed from the ticket: no mode toggle in the arena.** The backend env var `BATTLE_MODE` (`one-shot` or `turn-based`, one-shot when unset, any other value stops the server at boot) decides how every battle is played. The arena reads it from `GET /battles/mode` and shows the matching view.
- In turn-based mode, `POST /battles` answers 201 `{ battleId, fighters: [{ hp, maxHp }] }`. `POST /battles/:id/rounds` streams `round` then `end`. A battle is dropped on KO, so later rounds get a 404. Abandoned battles stay in the map until restart.
- `battleEngine`, `selectBattleMoves`/`fetchBattleMoves`, `parseBattleRequest`, `sseFrame` and the frontend `createSseParser` are unit tested. The controller, `useTurnBasedBattle` and the components are not (no HTTP/DOM test setup).
