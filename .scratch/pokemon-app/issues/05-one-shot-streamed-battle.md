# 05: One-shot streamed battle

**What to build:** A user picks two Pokémon, enters the arena and watches the LLM narrate the whole battle as it streams in.

**Blocked by:** 02. VirtualBrain chatbot API spec: `docs/virtualbrain-openapi.json`

**Status:** ready-for-agent

- [ ] Clicking a card toggles it in a selection tray; max 2 selected, clearly indicated on the cards
- [ ] A "Fight" button (enabled with exactly 2) switches to an arena view showing both Pokémon; no router
- [ ] A back button returns to the grid with the selection kept
- [ ] `POST /battles` (one-shot mode) validates the two ids with hand-written guards and calls the chatbot with a prompt including both Pokémon's types and stats plus battle instructions
- [ ] The backend re-encodes the chatbot stream as SSE frames over the POST response with typed events: `text`, `end`, `error`
- [ ] The VirtualBrain token is read from env and never reaches the frontend
- [ ] The frontend reads the stream with `fetch` + a `ReadableStream` reader in a dedicated hook, rendering text live, with abort on unmount/back
- [ ] Stream errors surface in the arena with a retry action

## Comments

- API spec added at `docs/virtualbrain-openapi.json`. The flow: exchange the `vb_ak_…` key at `POST /v1/auth/api-key/token` for `accessToken` (1h) + `chatbotId`, then `POST /v1/open-completion/{chatbotId}/query` with `{ query }` and a Bearer token. It answers 201 with a chunked `text/plain` stream of raw Markdown tokens and an `x-session-id` header.
