/** Mirrors the backend `BattleMode` (backend/src/services/battleMode.ts): the `BATTLE_MODE` the backend runs with */
export type BattleMode = "one-shot" | "turn-based";

export type Side = 0 | 1;

/** Mirrors the backend `PlayedRound` (backend/src/services/battleStream.ts), the `RoundResult` of its engine */
export interface BattleAction {
  attacker: Side;
  move: string;
  hit: boolean;
  damage: number;
  ko: boolean;
  /** The LLM named no valid move, so this one was picked at random */
  fallback: boolean;
}

export interface RoundResult {
  round: number;
  actions: BattleAction[];
  hp: [number, number];
  winner?: Side;
}

/** A fighter's health in a turn-based battle, as `POST /battles` returns it */
export interface BattleFighter {
  hp: number;
  maxHp: number;
}

/** Mirrors the backend `BattleEvent` (backend/src/services/battleStream.ts): the SSE frames of the battle routes */
export type BattleEvent =
  | { type: "text"; text: string }
  | ({ type: "round" } & RoundResult)
  | { type: "end" }
  | { type: "error"; message: string };
