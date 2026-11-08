export const SNAKE_BOARD_WIDTH = 20;
export const SNAKE_BOARD_HEIGHT = 20;
export const SNAKE_INITIAL_LENGTH = 4;
export const SNAKE_INITIAL_TICK_MS = 130;
export const SNAKE_MIN_TICK_MS = 65;
export const SNAKE_TICK_STEP_MS = 8;
export const SNAKE_FOOD_SCORE = 10;
export const SNAKE_VICTORY_BONUS = 500;

export type SnakeDirection = "up" | "down" | "left" | "right";
export type SnakeStatus = "playing" | "lost" | "won";
export type SnakeCollision = "wall" | "self" | null;

export interface SnakePoint {
  x: number;
  y: number;
}

export interface SnakeState {
  width: number;
  height: number;
  snake: SnakePoint[];
  direction: SnakeDirection;
  pendingDirections: SnakeDirection[];
  food: SnakePoint | null;
  score: number;
  foodEaten: number;
  tickMs: number;
  status: SnakeStatus;
  collision: SnakeCollision;
}

interface CreateSnakeOptions {
  width?: number;
  height?: number;
  initialLength?: number;
  rng?: () => number;
  initialFood?: SnakePoint;
}

const DIRECTION_DELTAS: Record<SnakeDirection, SnakePoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTION: Record<SnakeDirection, SnakeDirection> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export function createSnakeState(options: CreateSnakeOptions = {}): SnakeState {
  const width = options.width ?? SNAKE_BOARD_WIDTH;
  const height = options.height ?? SNAKE_BOARD_HEIGHT;
  const initialLength = options.initialLength ?? SNAKE_INITIAL_LENGTH;

  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2) {
    throw new Error("Snake board dimensions must be integers of at least 2.");
  }
  if (
    !Number.isInteger(initialLength) ||
    initialLength < 2 ||
    initialLength > width ||
    initialLength >= width * height
  ) {
    throw new Error("Snake initial length does not fit the board.");
  }

  const headY = Math.floor(height / 2);
  const headX = Math.max(initialLength - 1, Math.floor(width / 2));
  const snake = Array.from({ length: initialLength }, (_, index) => ({
    x: headX - index,
    y: headY,
  }));
  const rng = options.rng ?? Math.random;
  const food = options.initialFood ?? findFreeFoodPoint(snake, width, height, rng);

  if (options.initialFood && !isPointInsideBoard(options.initialFood, width, height)) {
    throw new Error("Initial snake food must be inside the board.");
  }
  if (options.initialFood && snake.some((segment) => pointsEqual(segment, options.initialFood!))) {
    throw new Error("Initial snake food cannot overlap the snake.");
  }

  return {
    width,
    height,
    snake,
    direction: "right",
    pendingDirections: [],
    food,
    score: 0,
    foodEaten: 0,
    tickMs: SNAKE_INITIAL_TICK_MS,
    status: "playing",
    collision: null,
  };
}

export function queueDirection(state: SnakeState, direction: SnakeDirection): SnakeState {
  if (state.status !== "playing" || state.pendingDirections.length >= 2) {
    return state;
  }

  const effectiveDirection =
    state.pendingDirections[state.pendingDirections.length - 1] ?? state.direction;
  if (direction === effectiveDirection || OPPOSITE_DIRECTION[effectiveDirection] === direction) {
    return state;
  }

  return {
    ...state,
    pendingDirections: [...state.pendingDirections, direction],
  };
}

export function advanceSnake(state: SnakeState, rng: () => number = Math.random): SnakeState {
  if (state.status !== "playing") {
    return state;
  }

  const direction = state.pendingDirections[0] ?? state.direction;
  const pendingDirections = state.pendingDirections.slice(1);
  const head = state.snake[0];
  if (!head) {
    throw new Error("Snake state is missing its head.");
  }

  const delta = DIRECTION_DELTAS[direction];
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y };
  if (!isPointInsideBoard(nextHead, state.width, state.height)) {
    return {
      ...state,
      direction,
      pendingDirections,
      status: "lost",
      collision: "wall",
    };
  }

  const eating = state.food !== null && pointsEqual(nextHead, state.food);
  const collisionBody = eating ? state.snake : state.snake.slice(0, -1);
  if (collisionBody.some((segment) => pointsEqual(segment, nextHead))) {
    return {
      ...state,
      direction,
      pendingDirections,
      status: "lost",
      collision: "self",
    };
  }

  const snake = eating ? [nextHead, ...state.snake] : [nextHead, ...state.snake.slice(0, -1)];
  if (!eating) {
    return {
      ...state,
      snake,
      direction,
      pendingDirections,
    };
  }

  const foodEaten = state.foodEaten + 1;
  const tickMs = getSnakeTickMs(foodEaten);
  const boardFull = snake.length === state.width * state.height;

  return {
    ...state,
    snake,
    direction,
    pendingDirections,
    food: boardFull ? null : findFreeFoodPoint(snake, state.width, state.height, rng),
    foodEaten,
    score: state.score + SNAKE_FOOD_SCORE + (boardFull ? SNAKE_VICTORY_BONUS : 0),
    tickMs,
    status: boardFull ? "won" : "playing",
    collision: null,
  };
}

export function getSnakeTickMs(foodEaten: number): number {
  return Math.max(SNAKE_MIN_TICK_MS, SNAKE_INITIAL_TICK_MS - Math.floor(foodEaten / 5) * SNAKE_TICK_STEP_MS);
}

export function getSnakeSpeedLevel(foodEaten: number): number {
  return Math.floor(foodEaten / 5) + 1;
}

export function findFreeFoodPoint(
  snake: SnakePoint[],
  width: number,
  height: number,
  rng: () => number = Math.random,
): SnakePoint | null {
  const occupied = new Set(snake.map(pointKey));
  const freeCells: SnakePoint[] = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!occupied.has(pointKey({ x, y }))) {
        freeCells.push({ x, y });
      }
    }
  }

  if (freeCells.length === 0) {
    return null;
  }

  const randomValue = Math.min(0.999999999, Math.max(0, rng()));
  return freeCells[Math.floor(randomValue * freeCells.length)] ?? null;
}

export function pointsEqual(left: SnakePoint, right: SnakePoint): boolean {
  return left.x === right.x && left.y === right.y;
}

export function pointKey(point: SnakePoint): string {
  return `${point.x},${point.y}`;
}

function isPointInsideBoard(point: SnakePoint, width: number, height: number): boolean {
  return point.x >= 0 && point.x < width && point.y >= 0 && point.y < height;
}
