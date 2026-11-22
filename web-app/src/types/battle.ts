/** Mirrors the backend `BattleMode` (backend/src/services/battleRequest.ts) */
export type BattleMode = "one-shot" | "turn-based";

export type Side = 0 | 1;

/** Mirrors the backend `BattleAction` and `RoundResult` (backend/src/services/battleEngine.ts) */
export interface BattleAction {
  attacker: Side;
  move: string;
  hit: boolean;
  damage: number;
  ko: boolean;
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
