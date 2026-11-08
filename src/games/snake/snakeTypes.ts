import type { SnakeCollision } from "./snakeEngine";
import type { SnakeMatchOutcome } from "../../services/ipc";

export type SnakePhase = "ready" | "countdown" | "playing" | "paused" | "result";
export type SnakeSubmissionStatus = "idle" | "saving" | "saved" | "failed";

export interface SnakeRoundResult {
  sessionId: string;
  outcome: SnakeMatchOutcome;
  score: number;
  durationMs: number;
  foodEaten: number;
  finalLength: number;
  speedLevel: number;
  tickMs: number;
  collision: SnakeCollision;
}
