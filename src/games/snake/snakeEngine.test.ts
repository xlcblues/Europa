import { describe, expect, it } from "vitest";

import {
  SNAKE_INITIAL_TICK_MS,
  SNAKE_MIN_TICK_MS,
  advanceSnake,
  createSnakeState,
  findFreeFoodPoint,
  getSnakeSpeedLevel,
  getSnakeTickMs,
  queueDirection,
  type SnakePoint,
  type SnakeState,
} from "./snakeEngine";

function point(x: number, y: number): SnakePoint {
  return { x, y };
}

function hasPoint(points: SnakePoint[], target: SnakePoint): boolean {
  return points.some((candidate) => candidate.x === target.x && candidate.y === target.y);
}

function fillExcept(target: SnakePoint, width: number, height: number): SnakePoint[] {
  const cells: SnakePoint[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x !== target.x || y !== target.y) {
        cells.push(point(x, y));
      }
    }
  }
  return cells;
}

describe("Snake engine", () => {
  it("creates a centered four-cell snake facing right with valid food", () => {
    const state = createSnakeState({ rng: () => 0 });

    expect(state.snake).toHaveLength(4);
    expect(state.snake[0]).toEqual(point(10, 10));
    expect(state.direction).toBe("right");
    expect(state.food).not.toBeNull();
    expect(hasPoint(state.snake, state.food!)).toBe(false);
    expect(state.tickMs).toBe(SNAKE_INITIAL_TICK_MS);
  });

  it("ignores reverse, duplicate, and overflow direction inputs", () => {
    let state = createSnakeState({ rng: () => 0 });

    state = queueDirection(state, "left");
    expect(state.pendingDirections).toEqual([]);

    state = queueDirection(state, "right");
    expect(state.pendingDirections).toEqual([]);

    state = queueDirection(state, "up");
    state = queueDirection(state, "left");
    expect(state.pendingDirections).toEqual(["up", "left"]);

    state = queueDirection(state, "down");
    expect(state.pendingDirections).toEqual(["up", "left"]);
  });

  it("preserves two rapid legal turns and applies them in order", () => {
    let state = createSnakeState({ rng: () => 0 });
    state = queueDirection(state, "up");
    state = queueDirection(state, "left");

    state = advanceSnake(state, () => 0);
    expect(state.snake[0]).toEqual(point(10, 9));
    expect(state.pendingDirections).toEqual(["left"]);

    state = advanceSnake(state, () => 0);
    expect(state.snake[0]).toEqual(point(9, 9));
    expect(state.pendingDirections).toEqual([]);
  });

  it("grows, scores, and regenerates food outside the snake", () => {
    let state = createSnakeState({ rng: () => 0, initialFood: point(11, 10) });
    const tail = state.snake[state.snake.length - 1];

    state = advanceSnake(state, () => 0.99);
    expect(state.snake).toHaveLength(5);
    expect(state.snake[state.snake.length - 1]).toEqual(tail);
    expect(state.score).toBe(10);
    expect(state.foodEaten).toBe(1);
    expect(state.food).not.toBeNull();
    expect(hasPoint(state.snake, state.food!)).toBe(false);
    expect(state.status).toBe("playing");
  });

  it("uses the five-food speed curve and clamps at 65ms", () => {
    expect(getSnakeTickMs(0)).toBe(130);
    expect(getSnakeTickMs(4)).toBe(130);
    expect(getSnakeTickMs(5)).toBe(122);
    expect(getSnakeTickMs(10)).toBe(114);
    expect(getSnakeTickMs(45)).toBe(SNAKE_MIN_TICK_MS);
    expect(getSnakeTickMs(396)).toBe(SNAKE_MIN_TICK_MS);
    expect(getSnakeSpeedLevel(0)).toBe(1);
    expect(getSnakeSpeedLevel(5)).toBe(2);
    expect(getSnakeSpeedLevel(396)).toBe(80);
  });

  it("detects wall and self collisions", () => {
    const wallState = createSnakeState({ rng: () => 0 });
    wallState.snake = [point(19, 10), point(18, 10), point(17, 10), point(16, 10)];
    const wallResult = advanceSnake(wallState);
    expect(wallResult.status).toBe("lost");
    expect(wallResult.collision).toBe("wall");

    const selfState = createSnakeState({ rng: () => 0 });
    selfState.snake = [point(5, 5), point(4, 5), point(4, 4), point(5, 4), point(6, 4)];
    selfState.direction = "right";
    const queued = queueDirection(selfState, "up");
    const selfResult = advanceSnake(queued);
    expect(selfResult.status).toBe("lost");
    expect(selfResult.collision).toBe("self");
  });

  it("allows the head to move into the tail cell as the tail vacates", () => {
    const state = createSnakeState({ rng: () => 0 });
    state.snake = [point(5, 5), point(5, 4), point(4, 4), point(4, 5)];
    state.direction = "right";
    const queued = queueDirection(state, "left");
    const next = { ...queued, direction: "left" as const, pendingDirections: [] };
    const result = advanceSnake(next);

    expect(result.status).toBe("playing");
    expect(result.snake[0]).toEqual(point(4, 5));
    expect(result.snake).toHaveLength(4);
  });

  it("wins and adds 500 points when the final cell is filled", () => {
    const finalCell = point(1, 0);
    const almostFull = createSnakeState({ width: 5, height: 5, initialLength: 4 });
    almostFull.snake = fillExcept(finalCell, 5, 5).map((cell, index) => (index === 0 ? point(0, 0) : cell));
    almostFull.snake[0] = point(0, 0);
    almostFull.food = finalCell;
    almostFull.direction = "right";
    almostFull.foodEaten = 395;
    almostFull.score = 3950;

    const result = advanceSnake(almostFull);
    expect(result.snake).toHaveLength(25);
    expect(result.status).toBe("won");
    expect(result.food).toBeNull();
    expect(result.score).toBe(4460);
  });

  it("never chooses an occupied food cell", () => {
    const snake = [point(0, 0), point(1, 0), point(2, 0), point(3, 0)];
    for (const randomValue of [0, 0.25, 0.5, 0.75, 0.999]) {
      const food = findFreeFoodPoint(snake, 5, 5, () => randomValue);
      expect(food).not.toBeNull();
      expect(hasPoint(snake, food!)).toBe(false);
    }
  });

  it("returns the same state when advancing after a finished game", () => {
    const finished: SnakeState = {
      ...createSnakeState({ rng: () => 0 }),
      status: "lost",
      collision: "wall",
    };
    expect(advanceSnake(finished)).toBe(finished);
  });
});
