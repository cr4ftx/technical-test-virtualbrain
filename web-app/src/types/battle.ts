/** Mirrors the backend `BattleEvent` (backend/src/services/battleStream.ts): the SSE frames of `POST /battles` */
export type BattleEvent =
  | { type: "text"; text: string }
  | { type: "end" }
  | { type: "error"; message: string };
