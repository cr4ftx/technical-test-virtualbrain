import { useEffect, useState } from "react";
import { API_URL } from "../api/client";
import { createSseParser } from "../utils/sseParser";

export type BattleStreamState =
  | { status: "streaming"; text: string }
  | { status: "done"; text: string }
  | { status: "error"; text: string; message: string };

const CONNECTION_ERROR = "Could not reach the arena. Is the backend running?";

/**
 * Streams the narration of a battle between two Pokémon from `POST /battles`.
 * axios can't hand over a streamed body in the browser, hence `fetch` and a reader.
 * The request is aborted on unmount, so leaving the arena stops the battle.
 */
export function useBattleStream(firstId: number, secondId: number) {
  const [state, setState] = useState<BattleStreamState>({ status: "streaming", text: "" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "streaming", text: "" });
    // Keeps whatever narration already arrived on screen above the error
    const fail = (message: string) => setState((s) => ({ status: "error", text: s.text, message }));

    const run = async () => {
      const response = await fetch(`${API_URL}/battles`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pokemonIds: [firstId, secondId] }),
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        const body: unknown = await response.json().catch(() => undefined);
        const message =
          typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
            ? body.error
            : CONNECTION_ERROR;
        fail(message);
        return;
      }

      const parser = createSseParser();
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const event of parser.feed(value)) {
          if (event.type === "text") setState((s) => ({ status: "streaming", text: s.text + event.text }));
          if (event.type === "end") setState((s) => ({ status: "done", text: s.text }));
          if (event.type === "error") fail(event.message);
        }
      }
      // A stream cut without an end or error frame (backend restarted, network dropped) is a failure too
      setState((s) => (s.status === "streaming" ? { status: "error", text: s.text, message: CONNECTION_ERROR } : s));
    };

    run().catch(() => {
      if (!controller.signal.aborted) fail(CONNECTION_ERROR);
    });

    return () => controller.abort();
  }, [firstId, secondId, attempt]);

  const retry = () => setAttempt((n) => n + 1);

  return { state, retry };
}
