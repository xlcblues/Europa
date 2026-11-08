import { describe, expect, it } from "vitest";

import {
  GOMOKU_BOARD_SIZE,
  GOMOKU_MAX_UNDO,
  applyUndo,
  boardFromMoves,
  canUndo,
  coordinateLabel,
  createGomokuState,
  detectWinAt,
  getCell,
  isPointInBoard,
  isValidPlacement,
  moveCursor,
  otherStone,
  placeStone,
} from "./gomokuEngine";

function makeState(moves: Array<{ x: number; y: number }>) {
  let state = createGomokuState();
  for (const point of moves) {
    state = placeStone(state, point);
  }
  return state;
}

describe("gomokuEngine", () => {
  it("creates an empty board with black to move", () => {
    const state = createGomokuState();
    expect(state.current).toBe("black");
    expect(state.moves).toEqual([]);
    expect(state.winner).toBeNull();
    expect(state.undoBudget).toBe(GOMOKU_MAX_UNDO);
    expect(state.board).toHaveLength(GOMOKU_BOARD_SIZE);
    expect(state.board[0]).toHaveLength(GOMOKU_BOARD_SIZE);
    expect(state.board.every((row) => row.every((cell) => cell === null))).toBe(true);
  });

  it("alternates turns and records the move history", () => {
    const state = placeStone(createGomokuState(), { x: 7, y: 7 });
    expect(state.current).toBe("white");
    expect(state.moves).toEqual([{ x: 7, y: 7 }]);
    expect(getCell(state.board, 7, 7)).toBe("black");

    const next = placeStone(state, { x: 8, y: 8 });
    expect(next.current).toBe("black");
    expect(next.moves).toEqual([{ x: 7, y: 7 }, { x: 8, y: 8 }]);
    expect(getCell(next.board, 8, 8)).toBe("white");
  });

  it("rejects occupying an already-used intersection", () => {
    const state = placeStone(createGomokuState(), { x: 7, y: 7 });
    expect(isValidPlacement(state, { x: 7, y: 7 })).toBe(false);
    const unchanged = placeStone(state, { x: 7, y: 7 });
    expect(unchanged).toEqual(state);
  });

  it("rejects out-of-board placements", () => {
    const state = createGomokuState();
    expect(isValidPlacement(state, { x: 15, y: 7 })).toBe(false);
    expect(isValidPlacement(state, { x: -1, y: 7 })).toBe(false);
    expect(placeStone(state, { x: 15, y: 7 })).toEqual(state);
  });

  it("detects a horizontal win of exactly five stones", () => {
    const state = makeState([
      { x: 3, y: 7 }, { x: 0, y: 0 },
      { x: 4, y: 7 }, { x: 1, y: 0 },
      { x: 5, y: 7 }, { x: 2, y: 0 },
      { x: 6, y: 7 }, { x: 0, y: 1 },
      { x: 7, y: 7 },
    ]);
    expect(state.winner).toBe("black");
    expect(state.victoryLine).toEqual([
      { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 }, { x: 6, y: 7 }, { x: 7, y: 7 },
    ]);
  });

  it("detects a vertical win", () => {
    const state = makeState([
      { x: 7, y: 3 }, { x: 0, y: 0 },
      { x: 7, y: 4 }, { x: 1, y: 0 },
      { x: 7, y: 5 }, { x: 2, y: 0 },
      { x: 7, y: 6 }, { x: 3, y: 0 },
      { x: 7, y: 7 },
    ]);
    expect(state.winner).toBe("black");
  });

  it("detects diagonal wins in both directions", () => {
    const rising = makeState([
      { x: 3, y: 11 }, { x: 0, y: 0 },
      { x: 4, y: 10 }, { x: 1, y: 0 },
      { x: 5, y: 9 }, { x: 2, y: 0 },
      { x: 6, y: 8 }, { x: 3, y: 0 },
      { x: 7, y: 7 },
    ]);
    expect(rising.winner).toBe("black");
    expect(rising.victoryLine).toEqual([
      { x: 3, y: 11 }, { x: 4, y: 10 }, { x: 5, y: 9 }, { x: 6, y: 8 }, { x: 7, y: 7 },
    ]);

    const falling = makeState([
      { x: 3, y: 3 }, { x: 0, y: 0 },
      { x: 4, y: 4 }, { x: 1, y: 0 },
      { x: 5, y: 5 }, { x: 2, y: 0 },
      { x: 6, y: 6 }, { x: 3, y: 0 },
      { x: 7, y: 7 },
    ]);
    expect(falling.winner).toBe("black");
  });

  it("detects overline wins longer than five", () => {
    const board = boardFromMoves([
      { x: 3, y: 7 }, { x: 0, y: 0 },
      { x: 4, y: 7 }, { x: 1, y: 0 },
      { x: 5, y: 7 }, { x: 2, y: 0 },
      { x: 6, y: 7 }, { x: 3, y: 0 },
      { x: 7, y: 7 }, { x: 4, y: 0 },
      { x: 8, y: 7 },
    ]);
    const line = detectWinAt(board, { x: 7, y: 7 }, "black");
    expect(line).not.toBeNull();
    expect(line).toHaveLength(6);
  });

  it("ends the game at the fifth stone of an overline run", () => {
    const state = makeState([
      { x: 3, y: 7 }, { x: 0, y: 0 },
      { x: 4, y: 7 }, { x: 1, y: 0 },
      { x: 5, y: 7 }, { x: 2, y: 0 },
      { x: 6, y: 7 }, { x: 3, y: 0 },
      { x: 7, y: 7 },
    ]);
    expect(state.winner).toBe("black");
    expect(state.victoryLine).toHaveLength(5);
  });

  it("does not treat four stones as a win", () => {
    const state = makeState([
      { x: 3, y: 7 }, { x: 0, y: 0 },
      { x: 4, y: 7 }, { x: 1, y: 0 },
      { x: 5, y: 7 }, { x: 2, y: 0 },
      { x: 6, y: 7 },
    ]);
    expect(state.winner).toBeNull();
    expect(detectWinAt(state.board, { x: 6, y: 7 }, "black")).toBeNull();
  });

  it("detects a draw only when the board is full", () => {
    const blackCells: Array<{ x: number; y: number }> = [];
    const whiteCells: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < GOMOKU_BOARD_SIZE; y += 1) {
      for (let x = 0; x < GOMOKU_BOARD_SIZE; x += 1) {
        const bucket = (x + 2 * y) % 4 < 2 ? blackCells : whiteCells;
        bucket.push({ x, y });
      }
    }
    const moves: Array<{ x: number; y: number }> = [];
    for (let index = 0; index < GOMOKU_BOARD_SIZE * GOMOKU_BOARD_SIZE; index += 1) {
      moves.push(index % 2 === 0 ? blackCells[index >> 1]! : whiteCells[index >> 1]!);
    }
    const state = makeState(moves);
    expect(state.isDraw).toBe(true);
    expect(state.winner).toBeNull();
    expect(state.moves).toHaveLength(GOMOKU_BOARD_SIZE * GOMOKU_BOARD_SIZE);
  });

  it("undoes one move in PVP mode and restores the turn", () => {
    const state = makeState([{ x: 7, y: 7 }, { x: 8, y: 8 }]);
    expect(canUndo(state)).toBe(true);
    const undone = applyUndo(state, 1);
    expect(undone.moves).toEqual([{ x: 7, y: 7 }]);
    expect(undone.current).toBe("white");
    expect(getCell(undone.board, 8, 8)).toBeNull();
    expect(undone.undoBudget).toBe(GOMOKU_MAX_UNDO - 1);
  });

  it("undoes an AI round of two plies in one action", () => {
    const state = makeState([{ x: 7, y: 7 }, { x: 8, y: 8 }, { x: 9, y: 9 }]);
    const undone = applyUndo(state, 2);
    expect(undone.moves).toEqual([{ x: 7, y: 7 }]);
    expect(undone.current).toBe("white");
    expect(undone.undoBudget).toBe(GOMOKU_MAX_UNDO - 1);
  });

  it("blocks undo after a result or when the budget is spent", () => {
    const won = makeState([
      { x: 3, y: 7 }, { x: 0, y: 0 },
      { x: 4, y: 7 }, { x: 1, y: 0 },
      { x: 5, y: 7 }, { x: 2, y: 0 },
      { x: 6, y: 7 }, { x: 3, y: 0 },
      { x: 7, y: 7 },
    ]);
    expect(canUndo(won)).toBe(false);
    expect(applyUndo(won, 1)).toEqual(won);

    let state = makeState([{ x: 7, y: 7 }]);
    for (let index = 0; index < GOMOKU_MAX_UNDO; index += 1) {
      state = applyUndo(state, 1);
    }
    expect(canUndo(state)).toBe(false);
  });

  it("boardFromMoves reconstructs alternating stones", () => {
    const board = boardFromMoves([{ x: 7, y: 7 }, { x: 8, y: 8 }, { x: 9, y: 9 }]);
    expect(getCell(board, 7, 7)).toBe("black");
    expect(getCell(board, 8, 8)).toBe("white");
    expect(getCell(board, 9, 9)).toBe("black");
  });

  it("moves the keyboard cursor within board bounds", () => {
    const point = moveCursor({ x: 14, y: 14 }, 1, 1);
    expect(point).toEqual({ x: 14, y: 14 });
    expect(moveCursor({ x: 7, y: 7 }, -1, 1)).toEqual({ x: 6, y: 8 });
    expect(isPointInBoard({ x: 0, y: 0 })).toBe(true);
    expect(isPointInBoard({ x: 15, y: 0 })).toBe(false);
  });

  it("formats coordinate labels as letter plus number", () => {
    expect(coordinateLabel({ x: 0, y: 0 })).toBe("A1");
    expect(coordinateLabel({ x: 7, y: 7 })).toBe("H8");
    expect(coordinateLabel({ x: 14, y: 14 })).toBe("O15");
  });

  it("returns the opposing stone color", () => {
    expect(otherStone("black")).toBe("white");
    expect(otherStone("white")).toBe("black");
  });
});
