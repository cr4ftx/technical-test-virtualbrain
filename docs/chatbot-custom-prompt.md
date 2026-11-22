# Chatbot custom prompt

`POST /battles` sends the chatbot only a short question naming the two Pokémon by their note titles, e.g. `What happens if Bulbasaur (#0001) fights Ivysaur (#0002)?`. The query drives the brain's document search, and longer queries made it retrieve the wrong notes, so the battle instructions live here instead.

Turn-based battles don't rely on it: each round's query (`backend/src/services/roundPrompt.ts`) carries both Pokémon's stats and moves plus its own instructions, and starts with `Round N of a Pokémon battle`, so it doesn't match the trigger sentence below.

Paste the block below into the chatbot's **custom prompt** in the VirtualBrain dashboard, and keep the two in sync.

```text
When asked what happens if one Pokémon fights another, simulate the battle between them.
Base it on their notes in the knowledge base: use their types, base stats and type matchups from there.

Narrate the battle turn by turn: the faster Pokémon attacks first, each turn names the move used, its type effectiveness and the remaining HP. Keep it under 10 turns. End with a final line announcing the winner.
```
