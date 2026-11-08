import type { GomokuCell, GomokuPoint, GomokuStone } from "./gomokuTypes";

export const GOMOKU_BOARD_SIZE = 15;
export const GOMOKU_WIN_LENGTH = 5;
export const GOMOKU_MAX_UNDO = 3;

export interface GomokuEngineState {
  board: GomokuCell[][];
  current: GomokuStone;
  moves: GomokuPoint[];
  winner: GomokuStone | null;
  victoryLine: GomokuPoint[] | null;
  isDraw: boolean;
  undoBudget: number;
}

const COLUMN_LETTERS = "ABCDEFGHIJKLMNO";

export const GOMOKU_STAR_POINTS: readonly GomokuPoint[] = [
  { x: 3, y: 3 },
  { x: 3, y: 11 },
  { x: 7, y: 7 },
  { x: 11, y: 3 },
  { x: 11, y: 11 },
];

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

export function createEmptyBoard(): GomokuCell[][] {
  return Array.from({ length: GOMOKU_BOARD_SIZE }, () =>
    Array<GomokuCell>(GOMOKU_BOARD_SIZE).fill(null),
  );
}

export function createGomokuState(): GomokuEngineState {
  return {
    board: createEmptyBoard(),
    current: "black",
    moves: [],
    winner: null,
    victoryLine: null,
    isDraw: false,
    undoBudget: GOMOKU_MAX_UNDO,
  };
}

export function isPointInBoard(point: GomokuPoint): boolean {
  return (
    Number.isInteger(point.x) &&
    Number.isInteger(point.y) &&
    point.x >= 0 &&
    point.x < GOMOKU_BOARD_SIZE &&
    point.y >= 0 &&
    point.y < GOMOKU_BOARD_SIZE
  );
}

export function getCell(board: GomokuCell[][], x: number, y: number): GomokuCell {
  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    return null;
  }
  if (x < 0 || x >= GOMOKU_BOARD_SIZE || y < 0 || y >= GOMOKU_BOARD_SIZE) {
    return null;
  }
  return board[y]?.[x] ?? null;
}

export function isValidPlacement(state: GomokuEngineState, point: GomokuPoint): boolean {
  return (
    isPointInBoard(point) &&
    state.winner === null &&
    !state.isDraw &&
    getCell(state.board, point.x, point.y) === null
  );
}

export function boardFromMoves(moves: readonly GomokuPoint[]): GomokuCell[][] {
  const board = createEmptyBoard();
  moves.forEach((point, index) => {
    if (isPointInBoard(point)) {
      board[point.y]![point.x] = index % 2 === 0 ? "black" : "white";
    }
  });
  return board;
}

export function detectWinAt(
  board: GomokuCell[][],
  point: GomokuPoint,
  stone: GomokuStone,
): GomokuPoint[] | null {
  if (getCell(board, point.x, point.y) !== stone) {
    return null;
  }

  for (const [dx, dy] of DIRECTIONS) {
    const line: GomokuPoint[] = [{ x: point.x, y: point.y }];
    let step = 1;
    while (getCell(board, point.x + dx * step, point.y + dy * step) === stone) {
      line.push({ x: point.x + dx * step, y: point.y + dy * step });
      step += 1;
    }
    step = 1;
    while (getCell(board, point.x - dx * step, point.y - dy * step) === stone) {
      line.unshift({ x: point.x - dx * step, y: point.y - dy * step });
      step += 1;
    }
    if (line.length >= GOMOKU_WIN_LENGTH) {
      return line;
    }
  }

  return null;
}

export function placeStone(state: GomokuEngineState, point: GomokuPoint): GomokuEngineState {
  if (!isValidPlacement(state, point)) {
    return state;
  }

  const board = state.board.map((row) => [...row]);
  board[point.y]![point.x] = state.current;
  const moves = [...state.moves, point];
  const victoryLine = detectWinAt(board, point, state.current);

  if (victoryLine) {
    return {
      ...state,
      board,
      moves,
      winner: state.current,
      victoryLine,
      isDraw: false,
      current: state.current,
    };
  }

  const isDraw = moves.length === GOMOKU_BOARD_SIZE * GOMOKU_BOARD_SIZE;
  return {
    ...state,
    board,
    moves,
    winner: null,
    victoryLine: null,
    isDraw,
    current: state.current === "black" ? "white" : "black",
  };
}

export function canUndo(state: GomokuEngineState): boolean {
  return (
    state.undoBudget > 0 &&
    state.moves.length > 0 &&
    state.winner === null &&
    !state.isDraw
  );
}

export function applyUndo(state: GomokuEngineState, plies = 1): GomokuEngineState {
  if (!canUndo(state) || plies < 1) {
    return state;
  }

  const removeCount = Math.min(plies, state.moves.length);
  const moves = state.moves.slice(0, state.moves.length - removeCount);
  return {
    board: boardFromMoves(moves),
    moves,
    current: moves.length % 2 === 0 ? "black" : "white",
    winner: null,
    victoryLine: null,
    isDraw: false,
    undoBudget: state.undoBudget - 1,
  };
}

export function moveCursor(point: GomokuPoint, dx: number, dy: number): GomokuPoint {
  return {
    x: Math.min(GOMOKU_BOARD_SIZE - 1, Math.max(0, point.x + dx)),
    y: Math.min(GOMOKU_BOARD_SIZE - 1, Math.max(0, point.y + dy)),
  };
}

export function coordinateLabel(point: GomokuPoint): string {
  const letter = COLUMN_LETTERS[point.x] ?? "?";
  return `${letter}${point.y + 1}`;
}

export function stoneLabel(stone: GomokuStone): string {
  return stone === "black" ? "黑棋" : "白棋";
}

export function otherStone(stone: GomokuStone): GomokuStone {
  return stone === "black" ? "white" : "black";
}
