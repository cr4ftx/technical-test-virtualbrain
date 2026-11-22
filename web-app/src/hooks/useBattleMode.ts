import axios from "axios";
import { useEffect, useState } from "react";
import { getBattleMode } from "../api/client";
import type { BattleMode } from "../types/battle";

type BattleModeState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; mode: BattleMode };

/** The battle mode the backend is configured with (`BATTLE_MODE`), cancelling the request on unmount */
export function useBattleMode() {
  const [state, setState] = useState<BattleModeState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    getBattleMode(controller.signal)
      .then((mode) => setState({ status: "success", mode }))
      .catch((error: unknown) => {
        if (axios.isCancel(error)) return;
        setState({ status: "error", message: "Could not reach the arena. Is the backend running?" });
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = () => setAttempt((n) => n + 1);

  return { state, retry };
}
