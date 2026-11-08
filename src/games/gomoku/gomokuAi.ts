import type { GomokuCell, GomokuDifficulty, GomokuPoint, GomokuStone } from "./gomokuTypes";
import {
  GOMOKU_BOARD_SIZE,
  GOMOKU_WIN_LENGTH,
  detectWinAt,
  getCell,
  isPointInBoard,
  otherStone,
} from "./gomokuEngine";

export interface GomokuAiOptions {
  rng?: () => number;
  now?: () => number;
}

interface DifficultyConfig {
  budgetMs: number;
  maxDepth: number;
}

export const GOMOKU_DIFFICULTY_CONFIG: Record<GomokuDifficulty, DifficultyConfig> = {
  beginner: { budgetMs: 200, maxDepth: 2 },
  intermediate: { budgetMs: 800, maxDepth: 4 },
  master: { budgetMs: 2_000, maxDepth: 6 },
};

const CANDIDATE_RADIUS = 2;
const CENTER = { x: Math.floor(GOMOKU_BOARD_SIZE / 2), y: Math.floor(GOMOKU_BOARD_SIZE / 2) };
const WIN_SCORE = 1_000_000;

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
];

export function chooseAiMove(
  board: GomokuCell[][],
  stone: GomokuStone,
  difficulty: GomokuDifficulty,
  options: GomokuAiOptions = {},
): GomokuPoint | null {
  const candidates = generateCandidates(board);
  if (candidates.length === 0) {
    return null;
  }

  const winningMove = findImmediateWin(board, candidates, stone);
  if (winningMove) {
    return winningMove;
  }

  const blockingMove = findImmediateWin(board, candidates, otherStone(stone));
  if (blockingMove) {
    return blockingMove;
  }

  const config = GOMOKU_DIFFICULTY_CONFIG[difficulty];
  const now = options.now ?? (() => Date.now());
  const startedAt = now();
  const deadline = startedAt + config.budgetMs;

  const searched = searchBestMove(board, stone, config.maxDepth, deadline, now);
  if (searched.point) {
    return searched.point;
  }

  return pickHeuristicMove(board, candidates, stone, options.rng);
}

export function generateCandidates(board: GomokuCell[][]): GomokuPoint[] {
  const hasAnyStone = board.some((row) => row.some((cell) => cell !== null));
  if (!hasAnyStone) {
    return [{ x: CENTER.x, y: CENTER.y }];
  }

  const found: GomokuPoint[] = [];
  const seen = new Set<number>();
  for (let y = 0; y < GOMOKU_BOARD_SIZE; y += 1) {
    for (let x = 0; x < GOMOKU_BOARD_SIZE; x += 1) {
      if (getCell(board, x, y) !== null) {
        continue;
      }
      let nearStone = false;
      outer: for (let dy = -CANDIDATE_RADIUS; dy <= CANDIDATE_RADIUS; dy += 1) {
        for (let dx = -CANDIDATE_RADIUS; dx <= CANDIDATE_RADIUS; dx += 1) {
          if (getCell(board, x + dx, y + dy) !== null) {
            nearStone = true;
            break outer;
          }
        }
      }
      if (nearStone) {
        const key = y * GOMOKU_BOARD_SIZE + x;
        if (!seen.has(key)) {
          seen.add(key);
          found.push({ x, y });
        }
      }
    }
  }
  return found;
}

export function findImmediateWin(
  board: GomokuCell[][],
  candidates: readonly GomokuPoint[],
  stone: GomokuStone,
): GomokuPoint | null {
  let best: GomokuPoint | null = null;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    if (!winsIfPlaced(board, candidate, stone)) {
      continue;
    }
    const score = pointHeuristic(board, candidate, stone);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function winsIfPlaced(board: GomokuCell[][], point: GomokuPoint, stone: GomokuStone): boolean {
  const next = placeOnBoard(board, point, stone);
  return detectWinAt(next, point, stone) !== null;
}

function searchBestMove(
  board: GomokuCell[][],
  stone: GomokuStone,
  maxDepth: number,
  deadline: number,
  now: () => number,
): { point: GomokuPoint | null } {
  const orderedRoot = orderCandidates(board, generateCandidates(board), stone);
  let bestPoint: GomokuPoint | null = orderedRoot[0] ?? null;
  let foundComplete = false;

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    if (now() > deadline) {
      break;
    }
    const result = minimax(
      board,
      stone,
      stone,
      depth,
      -Infinity,
      Infinity,
      deadline,
      now,
    );
    if (!result.complete) {
      break;
    }
    if (result.point !== null) {
      bestPoint = result.point;
      foundComplete = true;
    }
    if (result.score >= WIN_SCORE) {
      break;
    }
  }

  return { point: foundComplete ? bestPoint : (orderedRoot[0] ?? null) };
}

function minimax(
  board: GomokuCell[][],
  perspective: GomokuStone,
  toMove: GomokuStone,
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
  now: () => number,
): { score: number; point: GomokuPoint | null; complete: boolean } {
  if (now() > deadline || depth <= 0) {
    return { score: evaluateBoard(board, perspective), point: null, complete: false };
  }

  const candidates = orderCandidates(board, generateCandidates(board), toMove);
  if (candidates.length === 0) {
    return { score: evaluateBoard(board, perspective), point: null, complete: true };
  }

  const maximizing = toMove === perspective;
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestPoint: GomokuPoint | null = null;
  let timedOut = false;

  for (const candidate of candidates) {
    if (now() > deadline) {
      timedOut = true;
      break;
    }

    const nextBoard = placeOnBoard(board, candidate, toMove);
    let nodeScore: number;
    if (detectWinAt(nextBoard, candidate, toMove) !== null) {
      nodeScore = toMove === perspective ? WIN_SCORE + depth : -(WIN_SCORE + depth);
    } else {
      nodeScore = minimax(
        nextBoard,
        perspective,
        otherStone(toMove),
        depth - 1,
        alpha,
        beta,
        deadline,
        now,
      ).score;
    }

    if (maximizing) {
      if (nodeScore > bestScore) {
        bestScore = nodeScore;
        bestPoint = candidate;
      }
      alpha = Math.max(alpha, bestScore);
    } else {
      if (nodeScore < bestScore) {
        bestScore = nodeScore;
        bestPoint = candidate;
      }
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) {
      break;
    }
  }

  return {
    score: bestScore,
    point: bestPoint,
    complete: !timedOut,
  };
}

function orderCandidates(
  board: GomokuCell[][],
  candidates: readonly GomokuPoint[],
  stone: GomokuStone,
): GomokuPoint[] {
  const scored = candidates.map((point, index) => ({
    point,
    score: pointHeuristic(board, point, stone),
    index,
  }));
  scored.sort((left, right) => right.score - left.score || left.index - right.index);
  return scored.map((item) => item.point);
}

function pickHeuristicMove(
  board: GomokuCell[][],
  candidates: readonly GomokuPoint[],
  stone: GomokuStone,
  rng?: () => number,
): GomokuPoint {
  const ordered = orderCandidates(board, candidates, stone);
  const topScore = ordered.length > 0 ? pointHeuristic(board, ordered[0]!, stone) : 0;
  const topGroup = ordered.filter(
    (point) => pointHeuristic(board, point, stone) >= topScore - 0.001,
  );

  const pick = rng ? Math.floor(rng() * topGroup.length) : 0;
  return topGroup[pick] ?? ordered[0] ?? CENTER;
}

function pointHeuristic(board: GomokuCell[][], point: GomokuPoint, stone: GomokuStone): number {
  const attack = shapeValue(board, point, stone);
  const defense = shapeValue(board, point, otherStone(stone));
  const centerBonus = (GOMOKU_BOARD_SIZE - 1 - Math.abs(point.x - CENTER.x) - Math.abs(point.y - CENTER.y)) * 2;
  return attack * 1.15 + defense + centerBonus;
}

function shapeValue(board: GomokuCell[][], point: GomokuPoint, stone: GomokuStone): number {
  const next = placeOnBoard(board, point, stone);
  let total = 0;
  for (const [dx, dy] of DIRECTIONS) {
    total += shapeInDirection(next, point, dx, dy, stone);
  }
  return total;
}

function shapeInDirection(
  board: GomokuCell[][],
  point: GomokuPoint,
  dx: number,
  dy: number,
  stone: GomokuStone,
): number {
  let count = 1;
  let openEnds = 0;
  for (const sign of [1, -1]) {
    let step = 1;
    while (isPointInBoard({ x: point.x + dx * step * sign, y: point.y + dy * step * sign })
      && getCell(board, point.x + dx * step * sign, point.y + dy * step * sign) === stone) {
      count += 1;
      step += 1;
    }
    const nextX = point.x + dx * step * sign;
    const nextY = point.y + dy * step * sign;
    if (isPointInBoard({ x: nextX, y: nextY }) && getCell(board, nextX, nextY) === null) {
      openEnds += 1;
    }
  }
  return runScore(count, openEnds);
}

function evaluateBoard(board: GomokuCell[][], perspective: GomokuStone): number {
  let total = 0;
  for (const [dx, dy] of DIRECTIONS) {
    total += scanDirection(board, dx, dy, perspective);
  }
  return total;
}

function scanDirection(
  board: GomokuCell[][],
  dx: number,
  dy: number,
  perspective: GomokuStone,
): number {
  let total = 0;
  if (dx === 1 && dy === 0) {
    for (let y = 0; y < GOMOKU_BOARD_SIZE; y += 1) {
      total += scanRun(board, 0, y, dx, dy, perspective);
    }
  } else if (dx === 0 && dy === 1) {
    for (let x = 0; x < GOMOKU_BOARD_SIZE; x += 1) {
      total += scanRun(board, x, 0, dx, dy, perspective);
    }
  } else if (dx === 1 && dy === 1) {
    for (let x = 0; x < GOMOKU_BOARD_SIZE; x += 1) {
      total += scanRun(board, x, 0, dx, dy, perspective);
    }
    for (let y = 1; y < GOMOKU_BOARD_SIZE; y += 1) {
      total += scanRun(board, 0, y, dx, dy, perspective);
    }
  } else {
    for (let x = 0; x < GOMOKU_BOARD_SIZE; x += 1) {
      total += scanRun(board, x, GOMOKU_BOARD_SIZE - 1, dx, dy, perspective);
    }
    for (let y = GOMOKU_BOARD_SIZE - 2; y >= 0; y -= 1) {
      total += scanRun(board, 0, y, dx, dy, perspective);
    }
  }
  return total;
}

function scanRun(
  board: GomokuCell[][],
  startX: number,
  startY: number,
  dx: number,
  dy: number,
  perspective: GomokuStone,
): number {
  let x = startX;
  let y = startY;
  let before = cellOrOut(board, x - dx, y - dy);
  let total = 0;

  while (isPointInBoard({ x, y })) {
    const cell = getCell(board, x, y);
    if (cell === null) {
      before = null;
      x += dx;
      y += dy;
      continue;
    }

    let length = 0;
    while (isPointInBoard({ x, y }) && getCell(board, x, y) === cell) {
      length += 1;
      x += dx;
      y += dy;
    }
    const after = cellOrOut(board, x, y);
    const openEnds = (before === null ? 1 : 0) + (after === null ? 1 : 0);
    const value = runScore(length, openEnds);
    total += cell === perspective ? value : -value;
    before = after;
  }

  return total;
}

function cellOrOut(board: GomokuCell[][], x: number, y: number): GomokuCell | "out" {
  return isPointInBoard({ x, y }) ? getCell(board, x, y) : "out";
}

function runScore(length: number, openEnds: number): number {
  if (length >= GOMOKU_WIN_LENGTH) {
    return WIN_SCORE;
  }
  if (openEnds === 0) {
    return length >= 4 ? 500 : 0;
  }
  if (openEnds === 1) {
    if (length === 4) {
      return 30_000;
    }
    if (length === 3) {
      return 2_000;
    }
    if (length === 2) {
      return 120;
    }
    return 0;
  }
  if (length === 4) {
    return 200_000;
  }
  if (length === 3) {
    return 12_000;
  }
  if (length === 2) {
    return 800;
  }
  return 0;
}

function placeOnBoard(
  board: GomokuCell[][],
  point: GomokuPoint,
  stone: GomokuStone,
): GomokuCell[][] {
  const next = board.map((row) => [...row]);
  next[point.y]![point.x] = stone;
  return next;
}
