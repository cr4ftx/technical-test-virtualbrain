# 07: LLM picks the moves through a session

**What to build:** In turn-based mode the LLM chooses each Pokémon's move every round, narrating its choice live, and gets the computed result back in the same session to play the next round until a KO.

**Blocked by:** 06; the VirtualBrain chatbot API spec (session management section)

**Status:** needs-info (waiting on the API spec)

- [ ] Creating a turn-based battle opens one chatbot session, kept server-side with the battle state
- [ ] Each round prompt includes both Pokémon's types, stats, current HP, their 4 moves and the previous round's result
- [ ] The LLM writes a short narration ending with a strict `MOVES: <move> | <move>` line
- [ ] The narration streams to the frontend as `text` events; the `MOVES` line is parsed, not displayed
- [ ] A missing or invalid move falls back to a random valid move, flagged in the `round` event and visible in the UI
- [ ] Parsing and fallback logic are pure functions with unit tests
- [ ] The round result is computed by the engine from ticket 06, never by the LLM
