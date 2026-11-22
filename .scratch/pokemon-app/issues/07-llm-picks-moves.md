# 07: LLM picks the moves through a session

**What to build:** In turn-based mode the LLM chooses each Pokémon's move every round, narrating its choice live, and gets the computed result back in the same session to play the next round until a KO.

**Blocked by:** 06; the VirtualBrain chatbot API spec (session management section)

**Status:** resolved

- [x] Creating a turn-based battle opens one chatbot session, kept server-side with the battle state
- [x] Each round prompt includes both Pokémon's types, stats, current HP, their 4 moves and the previous round's result
- [x] The LLM writes a short narration ending with a strict `MOVES: <move> | <move>` line
- [x] The narration streams to the frontend as `text` events; the `MOVES` line is parsed, not displayed
- [x] A missing or invalid move falls back to a random valid move, flagged in the `round` event and visible in the UI
- [x] Parsing and fallback logic are pure functions with unit tests
- [x] The round result is computed by the engine from ticket 06, never by the LLM

## Comments

**2026-11-22**: Implemented on `swanncastel/07-llm-picks-moves`. Notes against the ticket:

- The API spec in `docs/virtualbrain-openapi.json` covers sessions: `/v1/open-completion/{id}/query` takes an optional `x-session-id` header and answers with `X-Session-Id`, opening a session when the header is missing.
- **Session opened on the first round, not at creation.** The API only creates a session with a query, so `POST /battles` opens a conversation (`virtualbrain.openConversation()`, no network call) kept in the battle map with the state; round 1's answer names the session and every later round reuses it. Opening it at creation would cost a throwaway LLM call.
- Turn-based mode now needs `VIRTUALBRAIN_TOKEN` too: `POST /battles` answers 503 without it, like one-shot.
- The round prompt carries its own instructions (`roundPrompt.ts`): the stats are inline, so it doesn't depend on the brain retrieving the right notes, and its wording doesn't trigger the one-shot custom prompt.
- The `MOVES` line is matched case-insensitively, also when wrapped in markdown emphasis (`**MOVES:**`); move names ignore case, spaces vs hyphens and stray punctuation. The narration streams live: only a line that could still become `MOVES:` is held back until complete.
- Each `round` action carries `fallback: boolean`; the UI shows a "random move" badge on fallback actions, and each round's narration above its actions.
- A failed narration sends an `error` event and leaves the battle unchanged, so Retry replays the same round. A client leaving mid-round aborts the chatbot request.
- `createNarrationFilter`, `pickMoves`, `buildRoundPrompt`, `playRound`, the VirtualBrain conversation and the frontend `createSseParser` are unit tested. The controller, `useTurnBasedBattle` and the components are not (no HTTP/DOM test setup).
