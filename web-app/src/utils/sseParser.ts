import type { BattleAction, BattleEvent, RoundResult, Side } from "../types/battle";

const isSide = (value: unknown): value is Side => value === 0 || value === 1;

function isBattleAction(value: unknown): value is BattleAction {
  if (typeof value !== "object" || value === null) return false;
  const action = value as Record<string, unknown>;
  return (
    isSide(action.attacker) &&
    typeof action.move === "string" &&
    typeof action.hit === "boolean" &&
    typeof action.damage === "number" &&
    typeof action.ko === "boolean"
  );
}

function toRoundResult(data: object): RoundResult | undefined {
  const { round, actions, hp, winner } = data as Record<string, unknown>;
  if (typeof round !== "number" || !Array.isArray(actions) || !actions.every(isBattleAction)) return undefined;
  if (!Array.isArray(hp) || hp.length !== 2 || !hp.every((v) => typeof v === "number")) return undefined;
  if (winner !== undefined && !isSide(winner)) return undefined;
  return { round, actions, hp: [hp[0], hp[1]], ...(winner !== undefined && { winner }) };
}

function toBattleEvent(type: string, data: unknown): BattleEvent | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  if (type === "text" && "text" in data && typeof data.text === "string") return { type, text: data.text };
  if (type === "round") {
    const result = toRoundResult(data);
    return result && { type, ...result };
  }
  if (type === "end") return { type };
  if (type === "error" && "message" in data && typeof data.message === "string") return { type, message: data.message };
  return undefined;
}

function parseFrame(frame: string): BattleEvent | undefined {
  let type = "message";
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event: ")) type = line.slice("event: ".length);
    else if (line.startsWith("data: ")) data += line.slice("data: ".length);
  }
  try {
    return toBattleEvent(type, JSON.parse(data));
  } catch {
    return undefined;
  }
}

/** Incremental parser for the `POST /battles` SSE stream: feed it text as it arrives, get back the complete events */
export function createSseParser() {
  let buffer = "";

  return {
    feed(chunk: string): BattleEvent[] {
      buffer += chunk;
      const frames = buffer.split("\n\n");
      // The last piece is a frame still in flight, or "" when the chunk ended on a frame boundary
      buffer = frames.pop() ?? "";
      return frames.map(parseFrame).filter((event) => event !== undefined);
    },
  };
}
