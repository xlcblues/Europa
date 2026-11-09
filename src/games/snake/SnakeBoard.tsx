import { useEffect, useRef } from "react";

import { useAppStore } from "../../state/appStore";
import type { SnakeDirection, SnakePoint, SnakeState } from "./snakeEngine";

interface SnakeBoardProps {
  state: SnakeState;
  phase: "ready" | "countdown" | "playing" | "paused" | "result";
}

interface BoardPalette {
  stage: string;
  board: string;
  accent: string;
  gold: string;
  text: string;
  line: string;
}

const DIRECTION_VECTOR: Record<SnakeDirection, SnakePoint> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const FALLBACK_PALETTE: BoardPalette = {
  stage: "#06151d",
  board: "#071b24",
  accent: "#7fcad8",
  gold: "#d9b76c",
  text: "#edf7f8",
  line: "#8aa3ac",
};

export function SnakeBoard({ state, phase }: SnakeBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // palette 只随主题/减少动态变化刷新，避免每个 tick 触发 getComputedStyle（低性能设备友好）。
  const paletteRef = useRef<BoardPalette | null>(null);
  const paletteKeyRef = useRef("");
  const resolvedTheme = useAppStore((store) => store.resolvedTheme);
  const reducedMotion = useAppStore((store) => store.reducedMotion);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) {
      return;
    }

    const draw = () => {
      const cssSize = Math.max(280, Math.round(stage.clientWidth || 620));
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const pixelSize = Math.round(cssSize * dpr);
      if (canvas.width !== pixelSize || canvas.height !== pixelSize) {
        canvas.width = pixelSize;
        canvas.height = pixelSize;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const themeKey = `${resolvedTheme}:${reducedMotion}`;
      if (paletteKeyRef.current !== themeKey) {
        paletteKeyRef.current = themeKey;
        paletteRef.current = readPalette(canvas);
      }
      const palette = paletteRef.current ?? FALLBACK_PALETTE;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBoard(context, cssSize, state, phase, palette, reducedMotion);
    };

    draw();
    window.addEventListener("resize", draw);

    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(draw) : null;
    observer?.observe(stage);

    return () => {
      window.removeEventListener("resize", draw);
      observer?.disconnect();
    };
  }, [phase, reducedMotion, resolvedTheme, state]);

  const length = state.snake.length;
  return (
    <div ref={stageRef} className="snake-board-stage">
      <div className="snake-board-orbit snake-board-orbit-a" aria-hidden="true" />
      <div className="snake-board-orbit snake-board-orbit-b" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="snake-canvas"
        role="img"
        aria-label={`贪吃蛇棋盘，20×20，当前蛇长 ${length}，${phase === "playing" ? "对局进行中" : phase === "paused" ? "对局已暂停" : phase === "result" ? "本局已结束" : "等待开始"}`}
      />
    </div>
  );
}

function readPalette(element: HTMLElement): BoardPalette {
  const style = getComputedStyle(element);
  return {
    stage: readVariable(style, "--art-stage", FALLBACK_PALETTE.stage),
    board: readVariable(style, "--bg-raised", FALLBACK_PALETTE.board),
    accent: readVariable(style, "--accent", FALLBACK_PALETTE.accent),
    gold: readVariable(style, "--gold", FALLBACK_PALETTE.gold),
    text: readVariable(style, "--text", FALLBACK_PALETTE.text),
    line: readVariable(style, "--line-strong", FALLBACK_PALETTE.line),
  };
}

function readVariable(style: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = style.getPropertyValue(name).trim();
  return value || fallback;
}

function drawBoard(
  context: CanvasRenderingContext2D,
  size: number,
  state: SnakeState,
  phase: SnakeBoardProps["phase"],
  palette: BoardPalette,
  reducedMotion: boolean,
): void {
  context.clearRect(0, 0, size, size);
  context.fillStyle = palette.stage;
  context.fillRect(0, 0, size, size);

  const centerGlow = context.createRadialGradient(
    size * 0.54,
    size * 0.4,
    size * 0.04,
    size * 0.54,
    size * 0.4,
    size * 0.72,
  );
  centerGlow.addColorStop(0, colorWithAlpha(palette.accent, 0.16));
  centerGlow.addColorStop(0.5, colorWithAlpha(palette.accent, 0.045));
  centerGlow.addColorStop(1, colorWithAlpha(palette.stage, 0));
  context.fillStyle = centerGlow;
  context.fillRect(0, 0, size, size);

  drawOrbitalDecor(context, size, palette, reducedMotion);

  const padding = Math.max(14, size * 0.036);
  const boardSize = size - padding * 2;
  const boardX = padding;
  const boardY = padding;
  const cell = boardSize / state.width;

  roundedRect(context, boardX, boardY, boardSize, boardSize, Math.max(7, size * 0.015));
  context.fillStyle = colorWithAlpha(palette.board, 0.72);
  context.fill();
  context.strokeStyle = colorWithAlpha(palette.accent, 0.19);
  context.lineWidth = 1;
  context.stroke();

  context.save();
  roundedRect(context, boardX, boardY, boardSize, boardSize, Math.max(7, size * 0.015));
  context.clip();

  const boardWash = context.createLinearGradient(boardX, boardY, boardX + boardSize, boardY + boardSize);
  boardWash.addColorStop(0, colorWithAlpha(palette.accent, 0.055));
  boardWash.addColorStop(0.52, "rgba(0, 0, 0, 0)");
  boardWash.addColorStop(1, colorWithAlpha(palette.gold, 0.025));
  context.fillStyle = boardWash;
  context.fillRect(boardX, boardY, boardSize, boardSize);

  drawGrid(context, state.width, state.height, boardX, boardY, cell, palette);
  drawFood(context, state.food, boardX, boardY, cell, palette);
  drawSnake(context, state, boardX, boardY, cell, palette);
  context.restore();

  context.strokeStyle = colorWithAlpha(palette.accent, phase === "playing" ? 0.32 : 0.18);
  context.lineWidth = 1;
  roundedRect(context, boardX, boardY, boardSize, boardSize, Math.max(7, size * 0.015));
  context.stroke();
}

function drawOrbitalDecor(
  context: CanvasRenderingContext2D,
  size: number,
  palette: BoardPalette,
  reducedMotion: boolean,
): void {
  context.save();
  context.strokeStyle = colorWithAlpha(palette.accent, 0.12);
  context.lineWidth = 1;
  context.beginPath();
  context.ellipse(size * 0.62, size * 0.32, size * 0.39, size * 0.24, -0.36, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.ellipse(size * 0.34, size * 0.73, size * 0.3, size * 0.17, -0.18, 0.2, Math.PI * 1.7);
  context.stroke();

  context.strokeStyle = colorWithAlpha(palette.accent, 0.08);
  context.beginPath();
  context.moveTo(-size * 0.04, size * 0.2);
  context.quadraticCurveTo(size * 0.42, -size * 0.02, size * 0.95, size * 0.26);
  context.stroke();
  context.beginPath();
  context.moveTo(-size * 0.03, size * 0.88);
  context.quadraticCurveTo(size * 0.54, size * 0.76, size * 1.04, size * 0.95);
  context.stroke();

  const starAlpha = reducedMotion ? 0.2 : 0.26;
  context.fillStyle = colorWithAlpha(palette.text, starAlpha);
  for (const [x, y, radius] of [
    [0.07, 0.09, 1.1],
    [0.91, 0.13, 1.4],
    [0.86, 0.82, 1],
    [0.14, 0.93, 1.3],
  ] as const) {
    context.beginPath();
    context.arc(size * x, size * y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = colorWithAlpha(palette.gold, 0.8);
  context.beginPath();
  context.arc(size * 0.85, size * 0.21, Math.max(2, size * 0.006), 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  boardX: number,
  boardY: number,
  cell: number,
  palette: BoardPalette,
): void {
  context.save();
  for (let x = 1; x < width; x += 1) {
    const major = x % 5 === 0;
    context.strokeStyle = colorWithAlpha(palette.line, major ? 0.18 : 0.08);
    context.lineWidth = major ? 1 : 0.65;
    context.beginPath();
    context.moveTo(boardX + x * cell, boardY);
    context.lineTo(boardX + x * cell, boardY + height * cell);
    context.stroke();
  }
  for (let y = 1; y < height; y += 1) {
    const major = y % 5 === 0;
    context.strokeStyle = colorWithAlpha(palette.line, major ? 0.18 : 0.08);
    context.lineWidth = major ? 1 : 0.65;
    context.beginPath();
    context.moveTo(boardX, boardY + y * cell);
    context.lineTo(boardX + width * cell, boardY + y * cell);
    context.stroke();
  }

  context.fillStyle = colorWithAlpha(palette.gold, 0.24);
  for (const x of [5, 10, 15]) {
    for (const y of [5, 10, 15]) {
      context.beginPath();
      context.arc(boardX + x * cell, boardY + y * cell, Math.max(1.1, cell * 0.045), 0, Math.PI * 2);
      context.fill();
    }
  }
  context.restore();
}

function drawFood(
  context: CanvasRenderingContext2D,
  food: SnakePoint | null,
  boardX: number,
  boardY: number,
  cell: number,
  palette: BoardPalette,
): void {
  if (!food) {
    return;
  }

  const centerX = boardX + (food.x + 0.5) * cell;
  const centerY = boardY + (food.y + 0.5) * cell;
  const outerRadius = cell * 0.65;
  const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);
  glow.addColorStop(0, colorWithAlpha(palette.gold, 0.32));
  glow.addColorStop(0.48, colorWithAlpha(palette.gold, 0.13));
  glow.addColorStop(1, colorWithAlpha(palette.gold, 0));
  context.fillStyle = glow;
  context.beginPath();
  context.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  context.fill();

  context.save();
  context.translate(centerX, centerY);
  context.rotate(Math.PI / 4);
  roundedRect(context, -cell * 0.24, -cell * 0.24, cell * 0.48, cell * 0.48, cell * 0.09);
  context.fillStyle = palette.gold;
  context.fill();
  context.strokeStyle = colorWithAlpha(palette.text, 0.62);
  context.lineWidth = 1;
  context.stroke();
  context.restore();

  context.fillStyle = colorWithAlpha(palette.text, 0.78);
  context.beginPath();
  context.arc(centerX - cell * 0.08, centerY - cell * 0.1, Math.max(1, cell * 0.035), 0, Math.PI * 2);
  context.fill();
}

function drawSnake(
  context: CanvasRenderingContext2D,
  state: SnakeState,
  boardX: number,
  boardY: number,
  cell: number,
  palette: BoardPalette,
): void {
  const centers = state.snake.map((segment) => ({
    x: boardX + (segment.x + 0.5) * cell,
    y: boardY + (segment.y + 0.5) * cell,
  }));

  context.save();
  for (let index = centers.length - 1; index > 0; index -= 1) {
    const current = centers[index];
    const previous = centers[index - 1];
    if (!current || !previous) {
      continue;
    }
    context.strokeStyle = colorWithAlpha(palette.accent, 0.46 - index / centers.length * 0.18);
    context.lineWidth = cell * 0.45;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(current.x, current.y);
    context.lineTo(previous.x, previous.y);
    context.stroke();
  }

  centers.forEach((center, index) => {
    if (index === 0) {
      return;
    }
    const taper = Math.max(0.55, 1 - index / centers.length * 0.42);
    const size = cell * 0.58 * taper;
    const alpha = Math.max(0.36, 0.92 - index / centers.length * 0.5);
    roundedRect(context, center.x - size / 2, center.y - size / 2, size, size, size * 0.3);
    context.fillStyle = colorWithAlpha(palette.accent, alpha);
    context.fill();
    context.strokeStyle = colorWithAlpha(palette.text, index % 4 === 0 ? 0.19 : 0.09);
    context.lineWidth = 0.8;
    context.stroke();
  });

  const head = centers[0];
  if (head) {
    const headRadius = cell * 0.39;
    context.fillStyle = palette.accent;
    context.beginPath();
    context.arc(head.x, head.y, headRadius, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = colorWithAlpha(palette.text, 0.6);
    context.lineWidth = 1.2;
    context.stroke();

    const direction = DIRECTION_VECTOR[state.direction];
    const perpendicular = { x: -direction.y, y: direction.x };
    const eyeForward = headRadius * 0.34;
    const eyeSpread = headRadius * 0.34;
    const eyeRadius = Math.max(1.4, cell * 0.065);
    context.fillStyle = palette.stage;
    for (const sign of [-1, 1]) {
      context.beginPath();
      context.arc(
        head.x + direction.x * eyeForward + perpendicular.x * eyeSpread * sign,
        head.y + direction.y * eyeForward + perpendicular.y * eyeSpread * sign,
        eyeRadius,
        0,
        Math.PI * 2,
      );
      context.fill();
    }

    context.strokeStyle = colorWithAlpha(palette.gold, 0.9);
    context.lineWidth = Math.max(1, cell * 0.05);
    context.beginPath();
    context.arc(head.x, head.y, headRadius * 1.23, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function colorWithAlpha(color: string, alpha: number): string {
  const normalized = color.trim();
  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const expanded = hex.length === 3
      ? hex.split("").map((part) => `${part}${part}`).join("")
      : hex;
    if (expanded.length >= 6) {
      const red = Number.parseInt(expanded.slice(0, 2), 16);
      const green = Number.parseInt(expanded.slice(2, 4), 16);
      const blue = Number.parseInt(expanded.slice(4, 6), 16);
      return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }
  }

  const rgb = /^rgba?\((\d+),?\s*(\d+),?\s*(\d+)/.exec(normalized);
  if (rgb) {
    return `rgba(${Number(rgb[1])}, ${Number(rgb[2])}, ${Number(rgb[3])}, ${alpha})`;
  }
  return color;
}
