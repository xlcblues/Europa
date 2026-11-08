import { describe, expect, it } from "vitest";

import type { GomokuCell, GomokuPoint } from "./gomokuTypes";
import { GOMOKU_BOARD_SIZE, boardFromMoves, getCell } from "./gomokuEngine";
import { chooseAiMove, findImmediateWin, generateCandidates } from "./gomokuAi";

function play(moves: Array<{ x: number; y: number }>): GomokuCell[][] {
  return boardFromMoves(moves);
}

function alwaysNow(): number {
  return 0;
}

describe("gomokuAi", () => {
  it("opens on the center intersection of an empty board", () => {
    const move = chooseAiMove(play([]), "black", "beginner", { now: alwaysNow });
    expect(move).toEqual({ x: 7, y: 7 });
  });

  it("takes an immediate winning move", () => {
    // Black has four stones on row 7 with an open right end; white must win elsewhere first.
    const board = play([
      { x: 3, y: 7 }, { x: 0, y: 0 },
      { x: 4, y: 7 }, { x: 1, y: 0 },
      { x: 5, y: 7 }, { x: 2, y: 0 },
      { x: 6, y: 7 }, { x: 8, y: 8 },
      { x: 0, y: 2 }, { x: 3, y: 3 },
      { x: 0, y: 3 }, { x: 4, y: 3 },
      { x: 0, y: 4 }, { x: 5, y: 3 },
      { x: 0, y: 5 }, { x: 6, y: 3 },
    ]);
    const move = chooseAiMove(board, "white", "beginner", { now: alwaysNow });
    expect(move).toEqual({ x: 7, y: 3 });
  });

  it("blocks the opponent when the opponent has an immediate win", () => {
    const board = play([
      { x: 3, y: 7 }, { x: 0, y: 0 },
      { x: 4, y: 7 }, { x: 1, y: 0 },
      { x: 5, y: 7 }, { x: 2, y: 0 },
      { x: 6, y: 7 }, { x: 8, y: 8 },
    ]);
    const move = chooseAiMove(board, "white", "beginner", { now: alwaysNow });
    expect(move).toEqual({ x: 7, y: 7 });
  });

  it("prioritizes its own win over blocking a weaker threat", () => {
    // White can win horizontally on row 3; black has only an open three.
    const board = play([
      { x: 3, y: 7 }, { x: 3, y: 3 },
      { x: 4, y: 7 }, { x: 4, y: 3 },
      { x: 5, y: 7 }, { x: 5, y: 3 },
      { x: 6, y: 7 }, { x: 6, y: 3 },
    ]);
    const move = chooseAiMove(board, "white", "beginner", { now: alwaysNow });
    expect(move).toEqual({ x: 7, y: 3 });
  });

  it("never returns an occupied intersection", () => {
    const moves: GomokuPoint[] = [
      { x: 7, y: 7 }, { x: 8, y: 8 }, { x: 9, y: 9 }, { x: 10, y: 10 },
    ];
    const board = play(moves);
    for (const difficulty of ["beginner", "intermediate", "master"] as const) {
      const move = chooseAiMove(board, "black", difficulty);
      expect(move).not.toBeNull();
      expect(getCell(board, move!.x, move!.y)).toBeNull();
      expect(isWithinBoard(move!)).toBe(true);
    }
  });

  it("finds immediate wins among generated candidates", () => {
    const board = play([
      { x: 3, y: 7 }, { x: 0, y: 0 },
      { x: 4, y: 7 }, { x: 1, y: 0 },
      { x: 5, y: 7 }, { x: 2, y: 0 },
      { x: 6, y: 7 },
    ]);
    const candidates = generateCandidates(board);
    expect(findImmediateWin(board, candidates, "black")).toEqual({ x: 7, y: 7 });
  });

  it("generates candidates only around existing stones", () => {
    const board = play([{ x: 7, y: 7 }]);
    const candidates = generateCandidates(board);
    expect(candidates.length).toBeGreaterThan(0);
    for (const point of candidates) {
      const distance = Math.max(Math.abs(point.x - 7), Math.abs(point.y - 7));
      expect(distance).toBeLessThanOrEqual(2);
    }
  });

  it("falls back to a valid heuristic move when the budget is exhausted", () => {
    const board = play([{ x: 7, y: 7 }, { x: 8, y: 8 }, { x: 9, y: 9 }]);
    let elapsed = 0;
    const move = chooseAiMove(board, "black", "master", {
      now: () => {
        elapsed += 1_000_000_000;
        return elapsed;
      },
    });
    expect(move).not.toBeNull();
    expect(getCell(board, move!.x, move!.y)).toBeNull();
  });
});

function isWithinBoard(point: GomokuPoint): boolean {
  return point.x >= 0 && point.x < GOMOKU_BOARD_SIZE && point.y >= 0 && point.y < GOMOKU_BOARD_SIZE;
}
