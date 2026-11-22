# PokeBattle

Browse the Pokédex (generations 1–8, 898 Pokémon), filter it by name and type, and send two Pokémon into an arena where a VirtualBrain chatbot narrates the battle — in one go, or round by round with the moves picked by the LLM and the damage computed by the app.

- `backend/`: Node.js + Express + TypeScript API in front of [PokeAPI](https://pokeapi.co/api/v2) and the VirtualBrain chatbot API.
- `web-app/`: React + TypeScript + Vite + Tailwind frontend.

The original exercise statement is in [`docs/exercise.md`](docs/exercise.md).

## Prerequisites

- **Node.js 24 or later** (developed on Node 26). The backend runs its TypeScript directly through Node's native type stripping, with no build step.
- npm.
- A VirtualBrain account (only needed for battles; browsing and the export work without it).

## Install

```sh
git clone https://github.com/cr4ftx/technical-test-virtualbrain.git
cd technical-test-virtualbrain

cd backend && npm install && cd ..
cd web-app && npm install && cd ..
```

## Configure

```sh
cp backend/.env.example backend/.env
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Port the API listens on. |
| `CORS_ORIGIN` | any origin | Origin allowed to call the API, e.g. `http://localhost:5173`. |
| `VIRTUALBRAIN_TOKEN` | unset | Chatbot API key (`vb_ak_…`). Without it, `POST /battles` answers 503. Replace the example's placeholder or delete the line: any value counts as set. See [Build the brain and the chatbot](#build-the-brain-and-the-chatbot). |
| `BATTLE_MODE` | `one-shot` | `one-shot` (the chatbot narrates the whole battle) or `turn-based` (the chatbot picks the moves each round, the backend computes the result). Any other value stops the server at boot. |

The backend starts without a `.env` at all, so you can browse the Pokédex before you have a token.

The frontend calls `http://localhost:3001` by default. To point it elsewhere, set `VITE_API_URL` in `web-app/.env.local`.

## Run in dev

In two terminals:

```sh
cd backend && npm run dev    # http://localhost:3001, restarts on change
cd web-app && npm run dev    # http://localhost:5173
```

The first start builds the Pokédex from PokeAPI (from a few seconds to a minute or two, depending on PokeAPI) and caches it in `backend/cache/pokedex.json`. Later starts read the cache. Delete the file to rebuild it.

## Checks

| Check | Backend (`backend/`) | Web app (`web-app/`) |
| --- | --- | --- |
| Tests | `npm test` | `npm test` |
| Lint | `npm run lint` | `npm run lint` |
| Typecheck | `npm run typecheck` | `npm run build` (runs `tsc -b`, then `vite build`) |

## Build the brain and the chatbot

1. **Export the Pokédex as Markdown.** With the backend running:

   ```sh
   curl http://localhost:3001/contents/all
   # {"count":898,"folder":".../backend/exports/pokemons"}
   ```

   This writes one Markdown file per Pokémon to `backend/exports/pokemons/` (gitignored) and replaces any previous export. To get a single Pokémon as a download, use `GET /contents/:pokemonId`.

2. **Create the brain.** Log in to [app.getvirtualbrain.com](https://app.getvirtualbrain.com/), create a new brain, and import the `backend/exports/pokemons/` folder. Indexing the 898 files takes a few minutes. You can check it from the dashboard chat with a question like *"What happens if Orbeetle fights Corviknight?"*.

3. **Create the chatbot.** Create a chatbot from that brain. Paste the custom prompt from [`docs/chatbot-custom-prompt.md`](docs/chatbot-custom-prompt.md) into its settings: one-shot battles depend on it.

4. **Get the token.** Copy the chatbot's API key (`vb_ak_…`) into `VIRTUALBRAIN_TOKEN` in `backend/.env`, then restart the backend.

The API reference is at [chatbot-api.getvirtualbrain.com/docs](https://chatbot-api.getvirtualbrain.com/docs), and a copy of the spec is in [`docs/virtualbrain-openapi.json`](docs/virtualbrain-openapi.json).

## API

| Route | |
| --- | --- |
| `GET /ping` | Health check, answers `pong`. |
| `GET /pokemons` | Every Pokémon as a summary for the grid. |
| `GET /pokemons/:id` | One Pokémon in full. |
| `GET /contents/:pokemonId` | One Pokémon as a Markdown attachment. |
| `GET /contents/all` | Export every Pokémon as Markdown to `backend/exports/pokemons/`. |
| `GET /battles/mode` | `{ mode }`, so the arena knows which view to show. |
| `POST /battles` | `{ pokemonIds: [a, b] }`. One-shot: streams the narration as SSE. Turn-based: answers 201 `{ battleId, fighters }`. |
| `POST /battles/:battleId/rounds` | Turn-based: plays the next round and streams it as SSE. |

## Design decisions

**Disk cache for the Pokédex.** PokeAPI asks clients to cache responses, and the grid needs all 898 Pokémon at once. The backend builds the full dataset once, with at most 10 requests in flight and retries on failure, then writes it to `backend/cache/pokedex.json`. A corrupt cache counts as a miss and is rebuilt. Concurrent requests share one build. Single-Pokémon routes don't wait for a cold build: they fall back to a live PokeAPI call.

**Slim list.** `GET /pokemons` sends only what a card shows: name, images, types, stats and generation. Resistances, abilities and evolutions stay behind `GET /pokemons/:id`. Search and type filters run client-side on that list.

**SSE protocol.** Battles stream as Server-Sent Events over a `POST`, so the frontend reads them with `fetch` and a small SSE parser rather than `EventSource`. Each frame's data is JSON, which keeps the narration's newlines from splitting frames. The events are `text` (a narration chunk), `round` (a computed turn-based round), `end`, and `error` (the narration failed: the frontend offers a retry). Validation and Pokémon lookup run before the stream opens, so those failures stay plain JSON errors with a proper status code. When the client disconnects, the backend aborts the upstream chatbot request.

**Server-owned battle state.** In turn-based mode the backend keeps each battle in memory, with its fighters, HP, round number and chatbot conversation. The client only holds a `battleId` and can't tamper with HP or moves. The chatbot conversation maps to one VirtualBrain session. The session is opened by round 1's query and reused for every later round, because the API only creates a session with a query. A battle is dropped on KO. An abandoned battle stays in memory until the server restarts.

**Damage formula.** It is a simplified version of the games' formula, at level 50 with base stats and no IVs or EVs:

- Max HP is `base HP + 60`.
- Damage is `((2·50/5 + 2) · power · A/D) / 50 + 2`, where A/D is attack/defense or special attack/special defense depending on the move. It is multiplied by STAB (×1.5), the type multiplier from the defender's resistances, and a random roll between 0.85 and 1.
- A hit that lands always deals at least 1 damage, unless the defender is immune.
- Moves can miss based on their accuracy. The faster Pokémon acts first, and speed ties are random.
- Each Pokémon gets its 4 latest damaging level-up moves, or Struggle if it has none.

**Move-choice parsing and fallback.** Each round prompt gives the LLM both Pokémon's types, stats, current HP and 4 moves, plus the previous round's result. It asks for a short narration ending with a strict `MOVES: <move> | <move>` line. The narration streams live as `text` events. Only a line that could still turn into `MOVES:` is held back until it is complete, and the `MOVES` line itself is never shown. Parsing is lenient: the label is case-insensitive and may be wrapped in markdown emphasis, and move names ignore case, spaces vs hyphens and stray punctuation. A missing or invalid move is replaced by a random valid one. The `round` event flags it, and the UI shows a "random move" badge. The LLM only picks the moves: the engine always computes the result.
