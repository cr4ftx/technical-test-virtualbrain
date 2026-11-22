# 05: One-shot streamed battle

**What to build:** A user picks two Pokémon, enters the arena and watches the LLM narrate the whole battle as it streams in.

**Blocked by:** 02; the VirtualBrain chatbot API spec must be available in the repo (auth, chat endpoint, stream format)

**Status:** needs-info (waiting on the API spec)

- [ ] Clicking a card toggles it in a selection tray; max 2 selected, clearly indicated on the cards
- [ ] A "Fight" button (enabled with exactly 2) switches to an arena view showing both Pokémon; no router
- [ ] A back button returns to the grid with the selection kept
- [ ] `POST /battles` (one-shot mode) validates the two ids with hand-written guards and calls the chatbot with a prompt including both Pokémon's types and stats plus battle instructions
- [ ] The backend re-encodes the chatbot stream as SSE frames over the POST response with typed events: `text`, `end`, `error`
- [ ] The VirtualBrain token is read from env and never reaches the frontend
- [ ] The frontend reads the stream with `fetch` + a `ReadableStream` reader in a dedicated hook, rendering text live, with abort on unmount/back
- [ ] Stream errors surface in the arena with a retry action
