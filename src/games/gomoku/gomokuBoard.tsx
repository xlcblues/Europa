import { useEffect, useRef } from "react";

import { useAppStore } from "../../state/appStore";
import {
  GOMOKU_BOARD_SIZE,
  GOMOKU_STAR_POINTS,
  getCell,
  isPointInBoard,
  type GomokuEngineState,
} from "./gomokuEngine";
import type { GomokuPhase, GomokuPoint, GomokuStone } from "./gomokuTypes";

interface GomokuBoardProps {
  state: GomokuEngineState;
  phase: GomokuPhase;
  cursor: GomokuPoint;
  hover: GomokuPoint | null;
  aiThinking: boolean;
  onPlace: (point: GomokuPoint) => void;
  onHover: (point: GomokuPoint | null) => void;
}

interface BoardPalette {
  stage: string;
  board: string;
  accent: string;
  gold: string;
  text: string;
  line: string;
}

const FALLBACK_PALETTE: BoardPalette = {
  stage: "#06151d",
  board: "#071b24",
  accent: "#7fcad8",
  gold: "#d9b76c",
  text: "#edf7f8",
  line: "#8aa3ac",
};

const COLUMN_LETTERS = "ABCDEFGHIJKLMNO";

export function GomokuBoard({
  state,
  phase,
  cursor,
  hover,
  aiThinking,
  onPlace,
  onHover,
}: GomokuBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
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

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawBoard(
        context,
        cssSize,
        state,
        phase,
        cursor,
        hover,
        aiThinking,
        readPalette(canvas),
        reducedMotion,
      );
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
  }, [aiThinking, cursor, hover, phase, reducedMotion, resolvedTheme, state]);

  const stonesPlaced = state.moves.length;
  const phaseLabel = phase === "playing"
    ? "对局进行中"
    : phase === "paused"
      ? "对局已暂停"
      : phase === "result"
        ? "本局已结束"
        : "等待开始";

  return (
    <div ref={stageRef} className="gomoku-board-stage">
      <div className="gomoku-board-orbit gomoku-board-orbit-a" aria-hidden="true" />
      <div className="gomoku-board-orbit gomoku-board-orbit-b" aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className="gomoku-canvas"
        role="img"
        aria-label={`星盘五子棋棋盘，15×15，已落子 ${stonesPlaced}，${phaseLabel}`}
        onClick={(event) => {
          const point = pointFromEvent(canvasRef.current, event);
          if (point) {
            onPlace(point);
          }
        }}
        onPointerMove={(event) => {
          onHover(pointFromEvent(canvasRef.current, event));
        }}
        onPointerLeave={() => onHover(null)}
      />
    </div>
  );
}

function pointFromEvent(
  canvas: HTMLCanvasElement | null,
  event: { clientX: number; clientY: number },
): GomokuPoint | null {
  if (!canvas) {
    return null;
  }
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0) {
    return null;
  }
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const geometry = boardGeometry(rect.width);
  const col = Math.round((x - geometry.margin) / geometry.step);
  const row = Math.round((y - geometry.margin) / geometry.step);
  const point = { x: col, y: row };
  if (!isPointInBoard(point)) {
    return null;
  }
  const offsetX = Math.abs(x - (geometry.margin + col * geometry.step));
  const offsetY = Math.abs(y - (geometry.margin + row * geometry.step));
  if (Math.max(offsetX, offsetY) > geometry.step * 0.55) {
    return null;
  }
  return point;
}

function boardGeometry(size: number): { margin: number; boardSize: number; step: number } {
  const margin = Math.max(22, size * 0.06);
  const boardSize = size - margin * 2;
  const step = boardSize / (GOMOKU_BOARD_SIZE - 1);
  return { margin, boardSize, step };
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
  state: GomokuEngineState,
  phase: GomokuPhase,
  cursor: GomokuPoint,
  hover: GomokuPoint | null,
  aiThinking: boolean,
  palette: BoardPalette,
  reducedMotion: boolean,
): void {
  context.clearRect(0, 0, size, size);
  context.fillStyle = palette.stage;
  context.fillRect(0, 0, size, size);

  const centerGlow = context.createRadialGradient(
    size * 0.5,
    size * 0.46,
    size * 0.04,
    size * 0.5,
    size * 0.46,
    size * 0.72,
  );
  centerGlow.addColorStop(0, colorWithAlpha(palette.accent, 0.16));
  centerGlow.addColorStop(0.5, colorWithAlpha(palette.accent, 0.045));
  centerGlow.addColorStop(1, colorWithAlpha(palette.stage, 0));
  context.fillStyle = centerGlow;
  context.fillRect(0, 0, size, size);

  drawOrbitalDecor(context, size, palette, reducedMotion);

  const geometry = boardGeometry(size);
  const { margin, boardSize, step } = geometry;
  const boardX = margin;
  const boardY = margin;

  // Board surface
  const surfacePad = step * 0.72;
  roundedRect(
    context,
    boardX - surfacePad,
    boardY - surfacePad,
    boardSize + surfacePad * 2,
    boardSize + surfacePad * 2,
    Math.max(8, step * 0.55),
  );
  context.fillStyle = colorWithAlpha(palette.board, 0.8);
  context.fill();
  context.strokeStyle = colorWithAlpha(palette.accent, 0.2);
  context.lineWidth = 1;
  context.stroke();

  // Grid lines
  context.strokeStyle = colorWithAlpha(palette.line, 0.24);
  context.lineWidth = 1;
  for (let index = 0; index < GOMOKU_BOARD_SIZE; index += 1) {
    const position = boardX + index * step;
    context.beginPath();
    context.moveTo(position, boardY);
    context.lineTo(position, boardY + boardSize);
    context.stroke();
    context.beginPath();
    context.moveTo(boardX, position);
    context.lineTo(boardX + boardSize, position);
    context.stroke();
  }

  // Star points
  for (const point of GOMOKU_STAR_POINTS) {
    const centerX = boardX + point.x * step;
    const centerY = boardY + point.y * step;
    context.beginPath();
    context.arc(centerX, centerY, Math.max(2.2, step * 0.09), 0, Math.PI * 2);
    context.fillStyle = palette.gold;
    context.fill();
  }

  drawCoordinates(context, boardX, boardY, boardSize, step, palette);

  // Stones
  for (let y = 0; y < GOMOKU_BOARD_SIZE; y += 1) {
    for (let x = 0; x < GOMOKU_BOARD_SIZE; x += 1) {
      const stone = getCell(state.board, x, y);
      if (!stone) {
        continue;
      }
      drawStone(
        context,
        boardX + x * step,
        boardY + y * step,
        step,
        stone,
        palette,
      );
    }
  }

  // Victory line
  if (state.victoryLine && state.victoryLine.length > 1) {
    const line = state.victoryLine;
    const start = line[0];
    const end = line[line.length - 1];
    if (start && end) {
      context.strokeStyle = colorWithAlpha(palette.gold, 0.72);
      context.lineWidth = Math.max(2.5, step * 0.13);
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(boardX + start.x * step, boardY + start.y * step);
      context.lineTo(boardX + end.x * step, boardY + end.y * step);
      context.stroke();
    }
  }

  // Last move ring
  const lastMove = state.moves[state.moves.length - 1];
  if (lastMove) {
    const centerX = boardX + lastMove.x * step;
    const centerY = boardY + lastMove.y * step;
    context.strokeStyle = colorWithAlpha(palette.gold, 0.85);
    context.lineWidth = Math.max(1.4, step * 0.07);
    context.beginPath();
    context.arc(centerX, centerY, step * 0.34, 0, Math.PI * 2);
    context.stroke();
  }

  const interactive = phase === "playing" && !state.winner && !state.isDraw;

  // Hover preview
  if (interactive && hover && getCell(state.board, hover.x, hover.y) === null) {
    const stone: GomokuStone = state.current;
    drawStone(
      context,
      boardX + hover.x * step,
      boardY + hover.y * step,
      step,
      stone,
      palette,
      0.45,
    );
  }

  // Keyboard cursor
  if (interactive && !aiThinking) {
    const centerX = boardX + cursor.x * step;
    const centerY = boardY + cursor.y * step;
    context.strokeStyle = colorWithAlpha(palette.accent, 0.7);
    context.lineWidth = Math.max(1.2, step * 0.055);
    context.beginPath();
    context.arc(centerX, centerY, step * 0.42, 0, Math.PI * 2);
    context.stroke();
  }

  if (aiThinking) {
    const centerX = size * 0.5;
    const centerY = margin - step * 0.42;
    context.fillStyle = colorWithAlpha(palette.gold, 0.9);
    context.font = `500 ${Math.max(9, size * 0.014)}px "SF Mono", Consolas, monospace`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("AI 思考中", centerX, centerY);
  }
}

function drawCoordinates(
  context: CanvasRenderingContext2D,
  boardX: number,
  boardY: number,
  boardSize: number,
  step: number,
  palette: BoardPalette,
): void {
  context.fillStyle = colorWithAlpha(palette.text, 0.5);
  context.font = `500 ${Math.max(8, step * 0.28)}px "SF Mono", Consolas, monospace`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  for (let index = 0; index < GOMOKU_BOARD_SIZE; index += 1) {
    const x = boardX + index * step;
    const y = boardY + index * step;
    const letter = COLUMN_LETTERS[index] ?? "?";
    const number = String(index + 1);
    context.fillText(letter, x, boardY - step * 0.58);
    context.fillText(letter, x, boardY + boardSize + step * 0.58);
    context.fillText(number, boardX - step * 0.58, y);
    context.fillText(number, boardX + boardSize + step * 0.58, y);
  }
}

function drawStone(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  step: number,
  stone: GomokuStone,
  palette: BoardPalette,
  alpha = 1,
): void {
  const radius = step * 0.42;
  if (stone === "black") {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = colorWithAlpha(palette.text, alpha);
    context.fill();
    context.beginPath();
    context.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
    context.fillStyle = colorWithAlpha(palette.stage, alpha);
    context.fill();
  } else {
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = colorWithAlpha(palette.stage, alpha);
    context.fill();
    context.strokeStyle = colorWithAlpha(palette.text, alpha);
    context.lineWidth = Math.max(1.2, step * 0.06);
    context.stroke();
    context.beginPath();
    context.arc(centerX, centerY, radius * 0.46, 0, Math.PI * 2);
    context.strokeStyle = colorWithAlpha(palette.accent, alpha * 0.5);
    context.lineWidth = Math.max(1, step * 0.045);
    context.stroke();
  }
}

function drawOrbitalDecor(
  context: CanvasRenderingContext2D,
  size: number,
  palette: BoardPalette,
  reducedMotion: boolean,
): void {
  // 减少动态：整体降低装饰轨道与核心光晕的强度，保留静态可读性。
  const decorAlpha = reducedMotion ? 0.35 : 1;
  const centerX = size * 0.5;
  const centerY = size * 0.46;
  const ringCount = 3;
  for (let ring = 0; ring < ringCount; ring += 1) {
    const radius = size * (0.28 + ring * 0.11);
    context.strokeStyle = colorWithAlpha(palette.accent, (0.05 + ring * 0.015) * decorAlpha);
    context.lineWidth = 1;
    context.beginPath();
    context.ellipse(
      centerX,
      centerY,
      radius,
      radius * (0.42 + ring * 0.06),
      -0.5 + ring * 0.5,
      0,
      Math.PI * 2,
    );
    context.stroke();
  }
  const glow = context.createRadialGradient(
    centerX,
    centerY,
    size * 0.05,
    centerX,
    centerY,
    size * 0.16,
  );
  glow.addColorStop(0, colorWithAlpha(palette.gold, 0.16 * decorAlpha));
  glow.addColorStop(1, colorWithAlpha(palette.gold, 0));
  context.fillStyle = glow;
  context.beginPath();
  context.arc(centerX, centerY, size * 0.16, 0, Math.PI * 2);
  context.fill();
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
