import type { GomokuMatchOutcome } from "../../services/ipc";

export type GomokuStone = "black" | "white";
export type GomokuCell = GomokuStone | null;
export type GomokuMode = "pvp" | "ai";
export type GomokuDifficulty = "beginner" | "intermediate" | "master";
export type GomokuPhase = "ready" | "playing" | "paused" | "result";
export type GomokuSubmissionStatus = "idle" | "saving" | "saved" | "failed";

export interface GomokuPoint {
  x: number;
  y: number;
}

export interface GomokuMove {
  point: GomokuPoint;
  stone: GomokuStone;
  index: number;
}

export interface GomokuRoundResult {
  sessionId: string;
  mode: GomokuMode;
  difficulty: GomokuDifficulty | null;
  outcome: GomokuMatchOutcome;
  winner: GomokuStone | null;
  moveCount: number;
  durationMs: number;
  usedUndo: boolean;
  undoCount: number;
  victoryLine: GomokuPoint[] | null;
  moves: GomokuPoint[];
}

export type GomokuSound =
  | "start"
  | "place"
  | "undo"
  | "win"
  | "lose"
  | "draw"
  | "pause"
  | "resume"
  | "think";
