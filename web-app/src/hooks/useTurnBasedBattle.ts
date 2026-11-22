import { isAxiosError } from "axios";
import { useEffect, useRef, useState } from "react";
import { api, API_URL } from "../api/client";
import type { BattleFighter, RoundResult } from "../types/battle";
import { createSseParser } from "../utils/sseParser";

interface Battle {
  id: string;
  fighters: [BattleFighter, BattleFighter];
}

export interface TurnBasedState {
  status: "starting" | "ready" | "playing" | "over" | "error";
  /** Missing until `POST /battles` answers */
  battle?: Battle;
  /** Every round played so far, oldest first */
  rounds: RoundResult[];
  message?: string;
}

const CONNECTION_ERROR = "Could not reach the arena. Is the backend running?";

const errorMessage = (body: unknown): string =>
  typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
    ? body.error
    : CONNECTION_ERROR;

/**
 * A turn-based battle between two Pokémon: created with `POST /battles`, then played one round at a time,
 * each round read from the SSE stream of `POST /battles/:id/rounds`. Requests are aborted on unmount.
 */
export function useTurnBasedBattle(firstId: number, secondId: number) {
  const [state, setState] = useState<TurnBasedState>({ status: "starting", rounds: [] });
  const [attempt, setAttempt] = useState(0);
  // Aborts whatever request is in flight when the arena is left
  const controller = useRef<AbortController>(new AbortController());

  useEffect(() => {
    const current = new AbortController();
    controller.current = current;
    setState({ status: "starting", rounds: [] });

    api
      .post<{ battleId: string; fighters: [BattleFighter, BattleFighter] }>(
        "/battles",
        { pokemonIds: [firstId, secondId], mode: "turn-based" },
        { signal: current.signal }
      )
      .then(({ data }) => setState({ status: "ready", battle: { id: data.battleId, fighters: data.fighters }, rounds: [] }))
      .catch((error: unknown) => {
        if (current.signal.aborted) return;
        const message = isAxiosError(error) ? errorMessage(error.response?.data) : CONNECTION_ERROR;
        setState({ status: "error", rounds: [], message });
      });

    return () => current.abort();
  }, [firstId, secondId, attempt]);

  const applyRound = (result: RoundResult) =>
    setState((s) => {
      if (!s.battle) return s;
      const [first, second] = s.battle.fighters;
      const fighters: [BattleFighter, BattleFighter] = [
        { ...first, hp: result.hp[0] },
        { ...second, hp: result.hp[1] },
      ];
      return {
        status: result.winner === undefined ? "playing" : "over",
        battle: { ...s.battle, fighters },
        rounds: [...s.rounds, result],
      };
    });

  // A failed round keeps the battle on screen: the same round can be asked for again
  const failRound = (message: string) => setState((s) => ({ ...s, status: "error", message }));

  const playRound = async (battleId: string) => {
    const { signal } = controller.current;
    const response = await fetch(`${API_URL}/battles/${battleId}/rounds`, { method: "POST", signal });
    if (!response.ok || !response.body) {
      failRound(errorMessage(await response.json().catch(() => undefined)));
      return;
    }

    const parser = createSseParser();
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const event of parser.feed(value)) {
        if (event.type === "round") applyRound(event);
        if (event.type === "end") setState((s) => (s.status === "playing" ? { ...s, status: "ready" } : s));
        if (event.type === "error") failRound(event.message);
      }
    }
    // A stream cut before its end frame leaves the round unfinished
    setState((s) => (s.status === "playing" ? { ...s, status: "error", message: CONNECTION_ERROR } : s));
  };

  const nextRound = () => {
    const battleId = state.battle?.id;
    if (!battleId || state.status === "playing" || state.status === "over") return;
    setState((s) => ({ ...s, status: "playing", message: undefined }));
    playRound(battleId).catch(() => {
      if (!controller.current.signal.aborted) failRound(CONNECTION_ERROR);
    });
  };

  // Before the battle exists, retrying creates it again; after, it asks for the round that failed
  const retry = () => (state.battle ? nextRound() : setAttempt((n) => n + 1));

  return { state, nextRound, retry };
}
