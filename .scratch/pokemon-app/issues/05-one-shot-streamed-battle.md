# 05: One-shot streamed battle

**What to build:** A user picks two Pokémon, enters the arena and watches the LLM narrate the whole battle as it streams in.

**Blocked by:** 02. VirtualBrain chatbot API spec: `docs/virtualbrain-openapi.json`

**Status:** resolved

- [x] Clicking a card toggles it in a selection tray; max 2 selected, clearly indicated on the cards
- [x] A "Fight" button (enabled with exactly 2) switches to an arena view showing both Pokémon; no router
- [x] A back button returns to the grid with the selection kept
- [x] `POST /battles` (one-shot mode) validates the two ids with hand-written guards and calls the chatbot with a prompt including both Pokémon's types and stats plus battle instructions
- [x] The backend re-encodes the chatbot stream as SSE frames over the POST response with typed events: `text`, `end`, `error`
- [x] The VirtualBrain token is read from env and never reaches the frontend
- [x] The frontend reads the stream with `fetch` + a `ReadableStream` reader in a dedicated hook, rendering text live, with abort on unmount/back
- [x] Stream errors surface in the arena with a retry action

## Comments

- API spec added at `docs/virtualbrain-openapi.json`. The flow: exchange the `vb_ak_…` key at `POST /v1/auth/api-key/token` for `accessToken` (1h) + `chatbotId`, then `POST /v1/open-completion/{chatbotId}/query` with `{ query }` and a Bearer token. It answers 201 with a chunked `text/plain` stream of raw Markdown tokens and an `x-session-id` header.

**2026-11-22**: Implemented on `swanncastel/05-one-shot-streamed-battle` ([PR #5](https://github.com/cr4ftx/technical-test-virtualbrain/pull/5)). Notes against the ticket:

- Backend: `parseBattleRequest`, `buildBattlePrompt`, the VirtualBrain client (`virtualbrain.ts`), and `battleEvents` + `sseFrame` (`battleStream.ts`) are unit tested. `BattleController` is thin and has no automated test (no HTTP test setup). The client exchanges the API key again near expiry instead of using the refresh endpoint.
- `POST /battles` answers 503 when `VIRTUALBRAIN_TOKEN` is unset. Errors from validation and the Pokémon lookup are still plain JSON, because they happen before the SSE stream opens.
- Frontend: `toggleSelection` and `createSseParser` are unit tested. `useBattleStream` and the components have no tests (no DOM test setup). Once two Pokémon are selected, the other cards are disabled.
