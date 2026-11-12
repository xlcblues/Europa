import { useEffect, useRef } from "react";

import {
  PLATFORMER_LOGICAL_HEIGHT,
  PLATFORMER_LOGICAL_WIDTH,
  type LevelDecoration,
  type LevelPalette,
  type PlatformMotion,
  type PlatformerLevel,
  type PlatformerWorld,
  type RuntimeSentinel,
} from "./platformerTypes";
import { getPlatformerLevel } from "./platformerLevels";

interface PlatformerCanvasProps {
  world: PlatformerWorld;
  reducedMotion: boolean;
  ariaLabel: string;
}

interface DrawState {
  context: CanvasRenderingContext2D;
  level: PlatformerLevel;
  world: PlatformerWorld;
  cameraX: number;
  reducedMotion: boolean;
}

export function PlatformerCanvas({ world, reducedMotion, ariaLabel }: PlatformerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // world 每固定步（60Hz）都是新对象：若把 world 放进 effect 依赖，画布会每帧销毁重建并重置缓冲区，导致持续闪屏。
  // 因此用 ref 持有最新 world，绘制循环只依赖 reducedMotion，长期复用同一个 rAF 循环。
  const worldRef = useRef<PlatformerWorld>(world);
  worldRef.current = world;

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasElement;
    const contextElement = canvas.getContext("2d");
    if (!contextElement) {
      return;
    }
    const context: CanvasRenderingContext2D = contextElement;

    let animationFrame = 0;
    let lastDrawnWorld: PlatformerWorld | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize(): void {
      const parent = canvas.parentElement;
      const parentWidth = parent?.clientWidth ?? PLATFORMER_LOGICAL_WIDTH;
      const parentHeight = parent?.clientHeight ?? PLATFORMER_LOGICAL_HEIGHT;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = parentWidth;
      height = parentHeight;
      canvas.width = Math.max(1, Math.round(parentWidth * dpr));
      canvas.height = Math.max(1, Math.round(parentHeight * dpr));
      canvas.style.width = `${parentWidth}px`;
      canvas.style.height = `${parentHeight}px`;
      // 尺寸变化后强制重绘（即使 world 引用未变，画布也需要按新尺寸刷新）。
      lastDrawnWorld = null;
      draw();
    }

    function draw(): void {
      const currentWorld = worldRef.current;
      // 暂停/恢复期间 world 引用不变：跳过重绘，冻结所有动画，零绘制开销。
      if (currentWorld === lastDrawnWorld) {
        return;
      }
      lastDrawnWorld = currentWorld;
      const level = getPlatformerLevel(currentWorld.levelIndex);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const scale = Math.min(width / PLATFORMER_LOGICAL_WIDTH, height / PLATFORMER_LOGICAL_HEIGHT);
      const offsetX = (width - PLATFORMER_LOGICAL_WIDTH * scale) * 0.5;
      const offsetY = (height - PLATFORMER_LOGICAL_HEIGHT * scale) * 0.5;
      context.save();
      context.translate(offsetX, offsetY);
      context.scale(scale, scale);

      const state: DrawState = {
        context,
        level,
        world: currentWorld,
        cameraX: currentWorld.camera.x,
        reducedMotion,
      };

      drawSky(state);
      drawParallax(state);

      // 世界对象统一按相机偏移投影：相机右移时，场景整体左移，角色不会在屏幕右缘消失。
      context.save();
      context.translate(-currentWorld.camera.x, 0);
      drawDecorations(state);
      drawBeacon(state);
      drawPlatforms(state);
      drawCheckpoints(state);
      drawCrystals(state);
      drawEnemies(state);
      drawProjectiles(state);
      drawWeaponPickups(state);
      drawPlayer(state);
      context.restore();

      context.restore();
    }

    function loop(): void {
      draw();
      animationFrame = requestAnimationFrame(loop);
    }

    resize();
    draw();
    animationFrame = requestAnimationFrame(loop);

    const onWindowResize = (): void => resize();
    window.addEventListener("resize", onWindowResize);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
    if (observer && canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", onWindowResize);
      observer?.disconnect();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="platformer-canvas"
      role="img"
      aria-label={ariaLabel}
    />
  );
}

function drawSky({ context, level }: DrawState): void {
  const gradient = context.createLinearGradient(0, 0, 0, PLATFORMER_LOGICAL_HEIGHT);
  gradient.addColorStop(0, level.palette.skyTop);
  gradient.addColorStop(1, level.palette.skyBottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, PLATFORMER_LOGICAL_WIDTH, PLATFORMER_LOGICAL_HEIGHT);

  const glowColor =
    level.theme === "core"
      ? "rgba(255, 158, 198, 0.15)"
      : level.theme === "night"
        ? "rgba(167, 139, 250, 0.16)"
        : level.theme === "tide"
          ? "rgba(92, 240, 221, 0.14)"
          : "rgba(232, 248, 252, 0.15)";
  const stars = context.createRadialGradient(900, 120, 8, 900, 120, 420);
  stars.addColorStop(0, glowColor);
  stars.addColorStop(1, "rgba(232, 248, 252, 0)");
  context.fillStyle = stars;
  context.fillRect(0, 0, PLATFORMER_LOGICAL_WIDTH, 420);

  // 星点（按主题确定性分布，避免闪烁）
  const random = createSeededRandom(hashSeed("sky-" + level.theme));
  context.save();
  context.globalAlpha = 0.5;
  context.fillStyle = level.palette.iceLight;
  for (let i = 0; i < 46; i += 1) {
    const sx = random() * PLATFORMER_LOGICAL_WIDTH;
    const sy = random() * 300;
    const size = random() * 1.6 + 0.6;
    context.beginPath();
    context.arc(sx, sy, size, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawParallax({ context, level, cameraX, world, reducedMotion }: DrawState): void {
  const layers: Array<{ factor: number; color: string; peaks: number[] }> = [
    {
      factor: 0.12,
      color: level.palette.iceDeep,
      peaks: [0, 420, 820, 1240, 1620, 2020, 2440, 2820],
    },
    {
      factor: 0.28,
      color: level.palette.iceDeep + "c8",
      peaks: [180, 520, 980, 1420, 1860, 2260, 2680, 3100],
    },
    {
      factor: 0.48,
      color: level.palette.iceDeep + "6e",
      peaks: [240, 640, 1100, 1540, 1980, 2400, 2840],
    },
  ];

  layers.forEach((layer, index) => {
    // 视差漂移与游戏时间同步（暂停冻结、恢复续接）；减少动态时禁用漂移。
    const drift = !reducedMotion && index === 2 && world.levelTimeMs > 0
      ? (world.levelTimeMs * 0.0072) % 160
      : 0;
    const startX = -(cameraX * layer.factor) % 160;
    context.fillStyle = layer.color;
    context.beginPath();
    context.moveTo(-drift, PLATFORMER_LOGICAL_HEIGHT);
    for (let column = 0; column < 9; column += 1) {
      const x = startX - drift + column * 160;
      const peakY = 460 - ((layer.peaks[column % layer.peaks.length] ?? 360) % 180);
      context.lineTo(x, peakY);
      context.lineTo(x + 80, peakY + 26);
    }
    context.lineTo(PLATFORMER_LOGICAL_WIDTH + 160, PLATFORMER_LOGICAL_HEIGHT);
    context.closePath();
    context.fill();
  });
}

/** 以稳定种子生成确定性伪随机，保证冰面纹理在重绘时不会闪烁。 */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 冰凌：沿平台下缘垂悬的小冰锥。 */
function drawIcicles(
  context: CanvasRenderingContext2D,
  x: number,
  bottomY: number,
  width: number,
  random: () => number,
): void {
  const count = Math.max(3, Math.floor(width / 34));
  for (let i = 0; i < count; i += 1) {
    const ix = x + ((i + random() * 0.7) / count) * width;
    const length = 4 + random() * 11;
    const thickness = 2.5 + random() * 3.5;
    const tip = ix + (random() - 0.5) * 3;
    context.fillStyle = i % 3 === 0
      ? "rgba(216, 247, 251, 0.55)"
      : "rgba(111, 194, 210, 0.42)";
    context.beginPath();
    context.moveTo(ix - thickness, bottomY);
    context.lineTo(ix + thickness, bottomY);
    context.lineTo(tip, bottomY + length);
    context.closePath();
    context.fill();
  }
}

/** 冰缝：从顶缘向下延伸的暗色分层线与亮色细裂纹。 */
function drawIceSeams(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  random: () => number,
): void {
  const seamCount = Math.max(1, Math.floor(width / 110));
  context.lineWidth = 1.4;
  for (let i = 0; i < seamCount; i += 1) {
    const sx = x + ((i + 0.35 + random() * 0.3) * width) / seamCount;
    const depth = 8 + random() * Math.min(38, Math.max(10, height * 0.5));
    context.strokeStyle = "rgba(7, 22, 31, 0.2)";
    context.beginPath();
    context.moveTo(sx, y + 2);
    context.lineTo(sx, y + depth);
    context.stroke();
    context.strokeStyle = "rgba(216, 247, 251, 0.2)";
    context.beginPath();
    context.moveTo(sx, y + depth * 0.45);
    context.lineTo(sx + (random() - 0.5) * 16, y + depth * 0.85);
    context.stroke();
  }
}

/** 场景装饰物：按主题在背景层绘制极光、星云与地貌特征（不参与碰撞）。 */
function drawDecorations({ context, level, world, reducedMotion }: DrawState): void {
  const { palette } = level;
  const cameraX = world.camera.x;
  for (const decoration of level.decorations) {
    const screenX = decoration.x - cameraX;
    if (screenX < -160 || screenX > PLATFORMER_LOGICAL_WIDTH + 160) {
      continue;
    }
    switch (decoration.kind) {
      case "aurora":
        drawAuroraBand(context, decoration, palette, world.levelTimeMs, reducedMotion);
        break;
      case "nebula":
        drawNebulaBlob(context, decoration, palette);
        break;
      case "iceSpire":
        drawIceSpire(context, decoration, palette);
        break;
      case "crystalSpire":
        drawCrystalSpire(context, decoration, palette, world.levelTimeMs, reducedMotion);
        break;
      case "rockColumn":
        drawRockColumn(context, decoration, palette);
        break;
      case "tideWisp":
        drawTideWisp(context, decoration, palette, world.levelTimeMs, reducedMotion);
        break;
      case "emberVent":
        drawEmberVent(context, decoration, palette, world.levelTimeMs, reducedMotion);
        break;
      case "floatingShard":
        drawFloatingShard(context, decoration, palette, world.levelTimeMs, reducedMotion);
        break;
      default:
        break;
    }
  }
}

/** 极光带：蜿蜒的透明光带，随游戏时间缓慢流动。 */
function drawAuroraBand(
  context: CanvasRenderingContext2D,
  decoration: LevelDecoration,
  palette: LevelPalette,
  timeMs: number,
  reducedMotion: boolean,
): void {
  const sway = reducedMotion ? 0 : Math.sin(timeMs * 0.0011 + decoration.variant * 1.7) * 26;
  const midY = decoration.y + decoration.height * 0.5;
  const gradient = context.createLinearGradient(0, decoration.y, 0, decoration.y + decoration.height);
  gradient.addColorStop(0, "rgba(88, 217, 236, 0)");
  gradient.addColorStop(0.5, palette.accentSoft);
  gradient.addColorStop(1, "rgba(88, 217, 236, 0)");
  context.save();
  context.globalAlpha = 0.6 + (reducedMotion ? 0 : 0.18 * Math.sin(timeMs * 0.002 + decoration.variant * 2));
  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(decoration.x, midY);
  context.quadraticCurveTo(
    decoration.x + decoration.width * 0.3,
    midY + sway,
    decoration.x + decoration.width * 0.58,
    midY,
  );
  context.quadraticCurveTo(
    decoration.x + decoration.width * 0.82,
    midY - sway * 0.7,
    decoration.x + decoration.width,
    midY,
  );
  context.lineTo(decoration.x + decoration.width, decoration.y + decoration.height);
  context.lineTo(decoration.x, decoration.y + decoration.height);
  context.closePath();
  context.fill();
  context.restore();
}

/** 星云：柔和的径向光晕，悬浮于夜空中。 */
function drawNebulaBlob(
  context: CanvasRenderingContext2D,
  decoration: LevelDecoration,
  palette: LevelPalette,
): void {
  const cx = decoration.x + decoration.width * 0.5;
  const cy = decoration.y + decoration.height * 0.5;
  const radius = Math.max(decoration.width, decoration.height) * 0.5;
  const glow = context.createRadialGradient(cx, cy, 4, cx, cy, radius);
  glow.addColorStop(0, palette.accentSoft);
  glow.addColorStop(0.65, "rgba(23, 60, 75, 0.05)");
  glow.addColorStop(1, "rgba(23, 60, 75, 0)");
  context.save();
  context.globalAlpha = 0.5 + 0.14 * ((decoration.variant % 3) - 1) * 0.5;
  context.fillStyle = glow;
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/** 冰峰：从冰面向上生长的尖锐冰刺。 */
function drawIceSpire(
  context: CanvasRenderingContext2D,
  decoration: LevelDecoration,
  palette: LevelPalette,
): void {
  const baseY = decoration.y + decoration.height;
  const half = decoration.width * 0.5;
  const lean = (decoration.variant % 3) - 1;
  const body = context.createLinearGradient(decoration.x, 0, decoration.x + decoration.width, 0);
  body.addColorStop(0, palette.iceDeep);
  body.addColorStop(0.5, palette.iceMid);
  body.addColorStop(1, palette.iceLight);
  context.save();
  context.fillStyle = body;
  context.beginPath();
  context.moveTo(decoration.x, baseY);
  context.lineTo(decoration.x + decoration.width, baseY);
  context.lineTo(decoration.x + half + lean * 8, decoration.y);
  context.closePath();
  context.fill();
  context.globalAlpha = 0.5;
  context.fillStyle = palette.iceLight;
  context.beginPath();
  context.moveTo(decoration.x + decoration.width * 0.5, baseY);
  context.lineTo(decoration.x + half + lean * 8, decoration.y);
  context.lineTo(decoration.x + decoration.width * 0.62, baseY);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.restore();
}

/** 晶体尖塔：发光的青色晶簇。 */
function drawCrystalSpire(
  context: CanvasRenderingContext2D,
  decoration: LevelDecoration,
  palette: LevelPalette,
  timeMs: number,
  reducedMotion: boolean,
): void {
  const baseY = decoration.y + decoration.height;
  const cx = decoration.x + decoration.width * 0.5;
  const pulse = reducedMotion ? 0.7 : 0.62 + 0.2 * Math.sin(timeMs * 0.005 + decoration.variant * 2);
  context.save();
  context.globalAlpha = pulse;
  context.fillStyle = palette.accent;
  context.beginPath();
  context.moveTo(decoration.x, baseY);
  context.lineTo(decoration.x + decoration.width, baseY);
  context.lineTo(cx, decoration.y);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = palette.iceLight;
  context.beginPath();
  context.moveTo(cx - decoration.width * 0.2, baseY);
  context.lineTo(cx + decoration.width * 0.18, baseY);
  context.lineTo(cx, decoration.y + 6);
  context.closePath();
  context.fill();
  context.restore();
}

/** 岩柱：粗壮的暗色石柱，带横向岩层纹路。 */
function drawRockColumn(
  context: CanvasRenderingContext2D,
  decoration: LevelDecoration,
  palette: LevelPalette,
): void {
  const baseY = decoration.y + decoration.height;
  const body = context.createLinearGradient(decoration.x, 0, decoration.x + decoration.width, 0);
  body.addColorStop(0, "rgba(0, 0, 0, 0.4)");
  body.addColorStop(0.5, palette.iceDeep);
  body.addColorStop(1, "rgba(0, 0, 0, 0.4)");
  context.save();
  context.fillStyle = body;
  context.beginPath();
  context.moveTo(decoration.x + decoration.width * 0.12, baseY);
  context.lineTo(decoration.x + decoration.width * 0.3, decoration.y);
  context.lineTo(decoration.x + decoration.width * 0.72, decoration.y);
  context.lineTo(decoration.x + decoration.width * 0.88, baseY);
  context.closePath();
  context.fill();
  context.globalAlpha = 0.22;
  context.strokeStyle = palette.iceLight;
  context.lineWidth = 1.5;
  for (let i = 0; i < 3; i += 1) {
    const layerY = decoration.y + decoration.height * (0.24 + i * 0.24);
    context.beginPath();
    context.moveTo(decoration.x + decoration.width * 0.22, layerY);
    context.lineTo(decoration.x + decoration.width * 0.8, layerY);
    context.stroke();
  }
  context.globalAlpha = 1;
  context.restore();
}

/** 潮汐萤光：漂浮的青色光球，缓慢上下浮动。 */
function drawTideWisp(
  context: CanvasRenderingContext2D,
  decoration: LevelDecoration,
  palette: LevelPalette,
  timeMs: number,
  reducedMotion: boolean,
): void {
  const cx = decoration.x + decoration.width * 0.5;
  const cy =
    decoration.y +
    decoration.height * 0.5 +
    (reducedMotion ? 0 : Math.sin(timeMs * 0.004 + decoration.variant * 2) * 8);
  const pulse = reducedMotion ? 0.8 : 0.6 + 0.3 * Math.sin(timeMs * 0.007 + decoration.variant * 3);
  context.save();
  context.globalAlpha = pulse;
  context.fillStyle = palette.accent;
  context.beginPath();
  context.arc(cx, cy, decoration.width * 0.5, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = palette.iceLight;
  context.beginPath();
  context.arc(cx - decoration.width * 0.15, cy - decoration.height * 0.15, decoration.width * 0.14, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

/** 熔岩喷口：暗色底座 + 脉动熔光 + 升腾火星。 */
function drawEmberVent(
  context: CanvasRenderingContext2D,
  decoration: LevelDecoration,
  palette: LevelPalette,
  timeMs: number,
  reducedMotion: boolean,
): void {
  const random = createSeededRandom(hashSeed(`vent-${decoration.x}`));
  const pulse = reducedMotion ? 0.6 : 0.5 + 0.3 * Math.sin(timeMs * 0.006 + decoration.variant * 2);
  context.save();
  context.fillStyle = palette.iceDeep;
  context.beginPath();
  context.roundRect(decoration.x, decoration.y, decoration.width, decoration.height, 5);
  context.fill();
  context.globalAlpha = pulse;
  context.fillStyle = palette.beacon;
  context.beginPath();
  context.ellipse(
    decoration.x + decoration.width * 0.5,
    decoration.y + 4,
    decoration.width * 0.36,
    4,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.globalAlpha = 1;
  if (!reducedMotion) {
    for (let i = 0; i < 3; i += 1) {
      const t = ((timeMs * 0.5 + i * 210 + decoration.variant * 90) % 900) / 900;
      const ex = decoration.x + decoration.width * (0.2 + 0.6 * random());
      const ey = decoration.y + decoration.height * 0.5 - t * 26 - 4;
      context.globalAlpha = (1 - t) * 0.8;
      context.fillStyle = palette.accent;
      context.beginPath();
      context.arc(ex, ey, 1.6 + t * 1.4, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.globalAlpha = 1;
  context.restore();
}

/** 浮空碎片：缓慢漂浮的菱形冰晶。 */
function drawFloatingShard(
  context: CanvasRenderingContext2D,
  decoration: LevelDecoration,
  palette: LevelPalette,
  timeMs: number,
  reducedMotion: boolean,
): void {
  const cx = decoration.x + decoration.width * 0.5;
  const cy =
    decoration.y +
    decoration.height * 0.5 +
    (reducedMotion ? 0 : Math.sin(timeMs * 0.003 + decoration.variant * 2) * 7);
  const pulse = reducedMotion ? 0.75 : 0.65 + 0.2 * Math.sin(timeMs * 0.006 + decoration.variant);
  context.save();
  context.globalAlpha = pulse;
  context.fillStyle = palette.accent;
  context.beginPath();
  context.moveTo(cx, cy - decoration.height * 0.5);
  context.lineTo(cx + decoration.width * 0.5, cy);
  context.lineTo(cx, cy + decoration.height * 0.5);
  context.lineTo(cx - decoration.width * 0.5, cy);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = palette.iceLight;
  context.beginPath();
  context.moveTo(cx, cy - decoration.height * 0.3);
  context.lineTo(cx + decoration.width * 0.24, cy);
  context.lineTo(cx, cy + decoration.height * 0.3);
  context.lineTo(cx - decoration.width * 0.24, cy);
  context.closePath();
  context.fill();
  context.restore();
}

/** 薄冰架（单向平台）：半透明浮冰板。 */
function drawOneWayPlatform(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: LevelPalette,
  levelHeight: number,
): void {
  const random = createSeededRandom(hashSeed(`${x}-${y}-${width}-shelf`));

  const pane = context.createLinearGradient(0, y, 0, y + height);
  pane.addColorStop(0, "rgba(228, 249, 252, 0.92)");
  pane.addColorStop(0.55, "rgba(111, 194, 210, 0.4)");
  pane.addColorStop(1, "rgba(111, 194, 210, 0.16)");
  context.globalAlpha = 0.88;
  context.fillStyle = pane;
  context.fillRect(x, y, width, height);
  context.globalAlpha = 1;

  context.fillStyle = "rgba(240, 252, 254, 0.85)";
  context.fillRect(x, y, width, 2);
  context.fillStyle = "rgba(111, 194, 210, 0.3)";
  context.fillRect(x, y + height - 2, width, 2);

  const speckles = Math.floor(width / 30);
  context.globalAlpha = 0.16;
  context.fillStyle = palette.iceLight;
  for (let i = 0; i < speckles; i += 1) {
    const sx = x + random() * (width - 3);
    const sy = y + 2 + random() * Math.max(1, height - 3);
    context.fillRect(sx, sy, 2, 2);
  }
  context.globalAlpha = 1;

  if (y + height <= levelHeight - 60) {
    drawIcicles(context, x, y + height, width, random);
  }
}

/** 实体冰台/地面：分层冰盖 + 冰缝 + 冰凌，移动平台带推进器光晕。 */
function drawSolidPlatform(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  palette: LevelPalette,
  motion: PlatformMotion | undefined,
  levelHeight: number,
  timeMs: number,
  reducedMotion: boolean,
): void {
  const random = createSeededRandom(hashSeed(`${x}-${y}-${width}-${height}`));

  const body = context.createLinearGradient(0, y, 0, y + height);
  body.addColorStop(0, palette.iceMid);
  body.addColorStop(0.42, palette.iceDeep);
  body.addColorStop(1, "rgba(7, 22, 31, 0.92)");
  context.fillStyle = body;
  context.fillRect(x, y, width, height);

  // 冰层横向分层切片
  context.globalAlpha = 0.18;
  context.fillStyle = palette.iceLight;
  for (let layer = 1; layer <= 2; layer += 1) {
    const ly = y + height * (0.52 + layer * 0.17);
    context.fillRect(x + 2, ly, width - 4, 1);
  }
  context.globalAlpha = 1;

  // 顶部亮冰盖（站立面）
  const cap = Math.min(14, height);
  const capGradient = context.createLinearGradient(0, y, 0, y + cap);
  capGradient.addColorStop(0, "rgba(228, 249, 252, 0.95)");
  capGradient.addColorStop(1, "rgba(111, 194, 210, 0.55)");
  context.fillStyle = capGradient;
  context.fillRect(x, y, width, cap);

  context.fillStyle = "rgba(240, 252, 254, 0.92)";
  context.fillRect(x, y, width, 2);
  context.fillStyle = "rgba(216, 247, 251, 0.35)";
  context.fillRect(x, y + 2, width, 2);

  // 冰面霜点
  const speckles = Math.floor(width / 26);
  context.globalAlpha = 0.14;
  context.fillStyle = palette.iceLight;
  for (let i = 0; i < speckles; i += 1) {
    const sx = x + random() * (width - 3);
    const sy = y + 3 + random() * Math.max(1, cap - 4);
    context.fillRect(sx, sy, 2, 2);
  }
  context.globalAlpha = 1;

  drawIceSeams(context, x, y, width, height, random);

  // 悬浮平台下缘冰凌
  if (y + height <= levelHeight - 60) {
    drawIcicles(context, x, y + height, width, random);
  }

  // 移动平台：推进器光晕与边沿警示灯
  if (motion) {
    const phase = motion.phase ?? 0;
    const glow = reducedMotion ? 0.3 : 0.26 + Math.sin(timeMs * 0.008 + phase * 2) * 0.1;
    context.globalAlpha = glow;
    context.fillStyle = palette.accent;
    if (motion.axis === "x") {
      context.beginPath();
      context.ellipse(x + 5, y + height * 0.5, 4, height * 0.38, 0, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.ellipse(x + width - 5, y + height * 0.5, 4, height * 0.38, 0, 0, Math.PI * 2);
      context.fill();
    } else {
      const beam = context.createLinearGradient(0, y + height, 0, y + height + 16);
      beam.addColorStop(0, "rgba(88, 217, 236, 0.5)");
      beam.addColorStop(1, "rgba(88, 217, 236, 0)");
      context.fillStyle = beam;
      context.fillRect(x + width * 0.18, y + height, width * 0.64, 16);
    }
    context.globalAlpha = 1;
    context.fillStyle = palette.beacon;
    context.fillRect(x, y, 2, Math.min(6, height));
    context.fillRect(x + width - 2, y, 2, Math.min(6, height));
  }
}

function drawPlatforms({ context, level, world, reducedMotion }: DrawState): void {
  for (const platform of level.platforms) {
    const offset = world.platformOffsets[platform.id];
    const x = platform.x + (offset?.x ?? 0);
    const y = platform.y + (offset?.y ?? 0);
    const width = platform.width;
    const height = platform.height;
    const { palette } = level;

    if (x + width < world.camera.x - 120 || x > world.camera.x + PLATFORMER_LOGICAL_WIDTH + 120) {
      continue;
    }

    if (platform.kind === "oneWay") {
      drawOneWayPlatform(context, x, y, width, height, palette, level.height);
      continue;
    }

    drawSolidPlatform(
      context,
      x,
      y,
      width,
      height,
      palette,
      platform.motion,
      level.height,
      world.levelTimeMs,
      reducedMotion,
    );
  }
}

function drawCrystals({ context, level, world, reducedMotion }: DrawState): void {
  // 脉冲与游戏时间同步（暂停冻结、恢复续接）；减少动态时使用静态亮度。
  const pulse = reducedMotion ? 0.78 : 0.72 + Math.sin(world.levelTimeMs * 0.0048) * 0.12;
  for (const crystal of level.crystals) {
    if (world.collectedItemIds.includes(crystal.id)) {
      continue;
    }
    const screenX = crystal.x - world.camera.x;
    if (screenX < -80 || screenX > PLATFORMER_LOGICAL_WIDTH + 80) {
      continue;
    }

    context.save();
    context.globalAlpha = pulse;
    context.fillStyle = level.palette.accentSoft;
    context.beginPath();
    context.moveTo(crystal.x, crystal.y - 18);
    context.lineTo(crystal.x + 12, crystal.y);
    context.lineTo(crystal.x, crystal.y + 18);
    context.lineTo(crystal.x - 12, crystal.y);
    context.closePath();
    context.fill();
    context.globalAlpha = 1;

    context.fillStyle = level.palette.accent;
    context.beginPath();
    context.moveTo(crystal.x, crystal.y - 12);
    context.lineTo(crystal.x + 8, crystal.y);
    context.lineTo(crystal.x, crystal.y + 12);
    context.lineTo(crystal.x - 8, crystal.y);
    context.closePath();
    context.fill();

    context.fillStyle = level.palette.iceLight;
    context.beginPath();
    context.moveTo(crystal.x, crystal.y - 5);
    context.lineTo(crystal.x + 4, crystal.y);
    context.lineTo(crystal.x, crystal.y + 5);
    context.lineTo(crystal.x - 4, crystal.y);
    context.closePath();
    context.fill();
    context.restore();
  }
}

interface EnemyDrawState {
  context: CanvasRenderingContext2D;
  sentinel: RuntimeSentinel;
  top: number;
  timeMs: number;
  reducedMotion: boolean;
  palette: LevelPalette;
}

function drawEnemies({ context, level, world, reducedMotion }: DrawState): void {
  for (const sentinel of world.sentinels) {
    if (sentinel.defeated) {
      continue;
    }
    const definition = sentinel.definition;
    const screenX = sentinel.x - world.camera.x;
    if (screenX < -160 || screenX > PLATFORMER_LOGICAL_WIDTH + 160) {
      continue;
    }
    const state: EnemyDrawState = {
      context,
      sentinel,
      top: definition.y + sentinel.y,
      timeMs: world.levelTimeMs,
      reducedMotion,
      palette: level.palette,
    };
    const kind = definition.kind ?? "sentinel";
    if (kind === "crawler") {
      drawCrawler(state);
    } else if (kind === "drifter") {
      drawDrifter(state);
    } else if (kind === "hopper") {
      drawHopper(state);
    } else if (kind === "gunner") {
      drawGunner(state);
    } else if (kind === "charger") {
      drawCharger(state);
    } else if (kind === "spiker") {
      drawSpiker(state);
    } else {
      drawClassicSentinel(state);
    }
  }
}

/** 冰核哨兵：经典的巡逻哨兵，胸口核心灯脉冲。 */
function drawClassicSentinel({ context, sentinel, top, timeMs, reducedMotion, palette }: EnemyDrawState): void {
  const definition = sentinel.definition;
  const sx = sentinel.x;
  const sy = top;
  const glow = reducedMotion ? 0.5 : 0.5 + Math.sin(timeMs * 0.006) * 0.18;
  const walk = reducedMotion ? 0 : Math.sin(timeMs / 150) * 3;

  context.save();
  // 脚下微弱反光（避免背景光晕）
  context.globalAlpha = 0.16;
  context.fillStyle = palette.accent;
  context.beginPath();
  context.ellipse(sx + definition.width * 0.5, sy + definition.height + 2, 18, 5, 0, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  // 双腿
  context.fillStyle = "#0a1a24";
  context.beginPath();
  context.roundRect(sx + 8, sy + 33, 8, 11 + Math.max(0, walk), 3);
  context.fill();
  context.beginPath();
  context.roundRect(sx + definition.width - 16, sy + 33, 8, 11 - Math.max(0, walk), 3);
  context.fill();

  // 躯干
  context.fillStyle = palette.iceDeep;
  context.beginPath();
  context.roundRect(sx + 6, sy + 9, definition.width - 12, 28, 8);
  context.fill();
  context.fillStyle = "rgba(216, 247, 251, 0.18)";
  context.beginPath();
  context.roundRect(sx + 9, sy + 11, definition.width - 18, 5, 3);
  context.fill();

  // 核心灯（脉冲）
  context.globalAlpha = glow;
  context.fillStyle = palette.accent;
  context.beginPath();
  context.arc(sx + definition.width * 0.5, sy + 23, 8, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = palette.iceLight;
  context.beginPath();
  context.arc(sx + definition.width * 0.5, sy + 23, 3, 0, Math.PI * 2);
  context.fill();

  // 头部（单眼视窗）
  context.fillStyle = "#0a1a24";
  context.beginPath();
  context.roundRect(sx + 9, sy + 1, definition.width - 18, 13, 5);
  context.fill();
  context.fillStyle = palette.accent;
  context.beginPath();
  context.roundRect(sx + 12, sy + 4, definition.width - 24, 4, 2);
  context.fill();
  context.fillStyle = palette.iceLight;
  context.beginPath();
  context.arc(sx + definition.width * 0.5, sy + 6, 1.8, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

/** 冰甲爬虫：低矮贴地，六足交替爬行。 */
function drawCrawler({ context, sentinel, top, timeMs, reducedMotion, palette }: EnemyDrawState): void {
  const definition = sentinel.definition;
  const sy = top + (reducedMotion ? 0 : Math.sin(timeMs / 170) * 1);
  const facing = sentinel.direction;

  context.save();
  context.translate(sentinel.x + definition.width * 0.5, sy);
  context.scale(facing, 1);

  // 六足（交替摆动）
  const gait = reducedMotion ? 0 : Math.sin(timeMs / 130);
  for (let i = 0; i < 3; i += 1) {
    const offset = i - 1;
    const swing = gait * 3 * (i % 2 === 0 ? 1 : -1);
    context.fillStyle = "#0a1a24";
    context.beginPath();
    context.roundRect(-9 + offset * 7 + swing, 11, 4, 14, 2);
    context.fill();
    context.beginPath();
    context.roundRect(5 + offset * 7 - swing, 11, 4, 14, 2);
    context.fill();
  }

  // 甲壳
  context.fillStyle = palette.iceDeep;
  context.beginPath();
  context.roundRect(-definition.width * 0.5 + 3, 0, definition.width - 6, 20, 7);
  context.fill();
  context.fillStyle = "rgba(216, 247, 251, 0.18)";
  context.beginPath();
  context.roundRect(-definition.width * 0.5 + 6, 3, definition.width - 12, 5, 3);
  context.fill();
  // 甲片接缝
  context.globalAlpha = 0.55;
  context.fillStyle = palette.iceMid;
  context.beginPath();
  context.roundRect(-definition.width * 0.5 + 13, 5, 2, 13, 1);
  context.fill();
  context.beginPath();
  context.roundRect(definition.width * 0.5 - 15, 5, 2, 13, 1);
  context.fill();
  context.globalAlpha = 1;

  // 头部（前侧）
  context.fillStyle = "#0a1a24";
  context.beginPath();
  context.roundRect(6, 2, 10, 12, 4);
  context.fill();
  // 双眼（脉冲）
  const eyeGlow = reducedMotion ? 1 : 0.75 + Math.sin(timeMs * 0.01) * 0.25;
  context.globalAlpha = eyeGlow;
  context.fillStyle = palette.accent;
  context.beginPath();
  context.arc(9, 8, 2, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(14, 8, 2, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  // 尾刺（后侧）
  context.fillStyle = palette.accent;
  context.beginPath();
  context.moveTo(-definition.width * 0.5 + 2, 3);
  context.lineTo(-definition.width * 0.5 - 7, 9);
  context.lineTo(-definition.width * 0.5 + 2, 13);
  context.closePath();
  context.fill();

  context.restore();
}

/** 裂隙浮游体：悬浮在裂隙间的发光浮游生物。 */
function drawDrifter({ context, sentinel, top, timeMs, reducedMotion, palette }: EnemyDrawState): void {
  const definition = sentinel.definition;
  const sx = sentinel.x;
  const sy = top;
  const cx = sx + definition.width * 0.5;
  const cy = sy + definition.height * 0.5;
  const pulse = reducedMotion ? 1 : 0.7 + Math.sin(timeMs * 0.009) * 0.3;

  context.save();
  // 触须（下方摆动）
  context.strokeStyle = palette.iceMid;
  context.lineWidth = 3;
  context.lineCap = "round";
  for (let i = 0; i < 3; i += 1) {
    const sway = reducedMotion ? 0 : Math.sin(timeMs / 120 + i * 1.1) * 4;
    const x0 = cx - 11 + i * 11 + sway * 0.4;
    const x1 = x0 + sway;
    const x2 = cx - 11 + i * 11 + sway * 1.6;
    context.beginPath();
    context.moveTo(x0, sy + definition.height - 2);
    context.quadraticCurveTo(x1, sy + definition.height + 5, x2, sy + definition.height + 10 + (i % 2) * 2);
    context.stroke();
  }

  // 主体
  context.fillStyle = palette.iceDeep;
  context.beginPath();
  context.ellipse(cx, cy, definition.width * 0.5, definition.height * 0.5 - 2, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(216, 247, 251, 0.2)";
  context.beginPath();
  context.ellipse(cx - 3, cy - 5, definition.width * 0.24, definition.height * 0.2, -0.3, 0, Math.PI * 2);
  context.fill();

  // 核心
  context.globalAlpha = pulse;
  context.fillStyle = palette.accent;
  context.beginPath();
  context.arc(cx, cy, 7, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = palette.iceLight;
  context.beginPath();
  context.arc(cx, cy, 2.6, 0, Math.PI * 2);
  context.fill();

  // 侧鳍（扇动）
  const flap = reducedMotion ? 0 : Math.sin(timeMs / 110) * 3;
  context.fillStyle = palette.iceMid;
  context.beginPath();
  context.moveTo(cx - definition.width * 0.5 + 2, cy - 4);
  context.quadraticCurveTo(cx - definition.width * 0.5 - 8, cy + 2 + flap, cx - definition.width * 0.5 + 2, cy + 8);
  context.closePath();
  context.fill();
  context.beginPath();
  context.moveTo(cx + definition.width * 0.5 - 2, cy - 4);
  context.quadraticCurveTo(cx + definition.width * 0.5 + 8, cy + 2 - flap, cx + definition.width * 0.5 - 2, cy + 8);
  context.closePath();
  context.fill();

  // 单眼
  context.fillStyle = palette.accent;
  context.beginPath();
  context.arc(cx + 4, cy - 4, 2.4, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

/** 弹跳兽：周期性弹跳，落地时压缩弹簧腿并扬尘。 */
function drawHopper({ context, sentinel, top, timeMs, reducedMotion, palette }: EnemyDrawState): void {
  const definition = sentinel.definition;
  const sx = sentinel.x;
  const sy = top;
  const cx = sx + definition.width * 0.5;
  const hopHeight = definition.hopHeight ?? 44;
  const airborne = hopHeight > 0 ? Math.min(1, Math.max(0, -sentinel.y / hopHeight)) : 0;
  const stretch = 1 - airborne;
  const bounce = reducedMotion ? 0 : Math.sin(timeMs / 90) * 1.5;

  context.save();
  // 落地冲击尘（接近地面时）
  if (airborne < 0.3) {
    context.globalAlpha = 0.28 * (1 - airborne / 0.3);
    context.fillStyle = palette.iceLight;
    context.beginPath();
    context.ellipse(cx, sy + definition.height - 2, 13, 4, 0, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  }

  // 弹簧腿
  const legTop = sy + definition.height - 2 - stretch * 8;
  context.strokeStyle = palette.accent;
  context.lineWidth = 4;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(cx - 12, legTop);
  context.lineTo(cx - 12, legTop + 5 + stretch * 3);
  context.stroke();
  context.beginPath();
  context.moveTo(cx + 12, legTop);
  context.lineTo(cx + 12, legTop + 5 + stretch * 3);
  context.stroke();

  // 身体
  context.fillStyle = palette.iceDeep;
  context.beginPath();
  context.roundRect(cx - 17, sy + 4, 34, definition.height - 12 + stretch * 8, 12);
  context.fill();
  context.fillStyle = "rgba(216, 247, 251, 0.18)";
  context.beginPath();
  context.roundRect(cx - 13, sy + 7, 26, 5, 3);
  context.fill();

  // 大眼睛
  const eyeGlow = reducedMotion ? 1 : 0.8 + Math.sin(timeMs * 0.01) * 0.2;
  context.globalAlpha = eyeGlow;
  context.fillStyle = palette.accent;
  context.beginPath();
  context.arc(cx, sy + 13 + stretch * 2, 6, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = palette.iceLight;
  context.beginPath();
  context.arc(cx + 1.5, sy + 11 + stretch * 2, 2.2, 0, Math.PI * 2);
  context.fill();

  // 顶部小天线（琥珀警示灯）
  context.fillStyle = "#0a1a24";
  context.beginPath();
  context.roundRect(cx - 1.5, sy - 4 + bounce, 3, 9, 1.5);
  context.fill();
  context.fillStyle = palette.beacon;
  context.beginPath();
  context.arc(cx, sy - 5 + bounce, 2.2, 0, Math.PI * 2);
  context.fill();

  context.restore();
}
/** 炮台射手：装甲炮塔 + 旋转炮管，进入射程后瞄准玩家开火。 */
function drawGunner({ context, sentinel, top, timeMs, reducedMotion, palette }: EnemyDrawState): void {
  const definition = sentinel.definition;
  const sy = top;
  const facing = sentinel.direction;

  context.save();
  context.translate(sentinel.x + definition.width * 0.5, sy);
  context.scale(facing, 1);

  // 支撑底座
  context.fillStyle = "#0a1a24";
  context.beginPath();
  context.roundRect(-12, definition.height - 9, 24, 9, 3);
  context.fill();

  // 装甲炮塔（径向渐变躯干）
  const body = context.createRadialGradient(
    0,
    definition.height * 0.42,
    2,
    0,
    definition.height * 0.42,
    definition.width * 0.5,
  );
  body.addColorStop(0, palette.iceMid);
  body.addColorStop(1, palette.iceDeep);
  context.fillStyle = body;
  context.beginPath();
  context.arc(0, definition.height * 0.42, definition.width * 0.42, 0, Math.PI * 2);
  context.fill();

  // 装甲环带
  context.strokeStyle = "rgba(216, 247, 251, 0.25)";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, definition.height * 0.42, definition.width * 0.28, 0, Math.PI * 2);
  context.stroke();

  // 炮塔基座与炮管（朝前）
  context.fillStyle = "#0a1a24";
  context.beginPath();
  context.roundRect(-4, -10, 8, definition.height * 0.58, 3);
  context.fill();
  context.beginPath();
  context.roundRect(4, definition.height * 0.26, definition.width * 0.4, 7, 3);
  context.fill();

  // 炮口蓄能光
  const glow = reducedMotion ? 0.6 : 0.5 + 0.3 * Math.sin(timeMs * 0.012);
  context.globalAlpha = glow;
  context.fillStyle = palette.accent;
  context.beginPath();
  context.arc(4 + definition.width * 0.4, definition.height * 0.29, 3.4, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  // 观测眼
  context.fillStyle = palette.accent;
  context.beginPath();
  context.arc(0, definition.height * 0.38, 4.5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = palette.iceLight;
  context.beginPath();
  context.arc(1.4, definition.height * 0.36, 1.8, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

/** 冲锋兽：重装冰甲 + 护目镜头盔，冲锋时拉出加速残影。 */
function drawCharger({ context, sentinel, top, timeMs, reducedMotion, palette }: EnemyDrawState): void {
  const definition = sentinel.definition;
  const sy = top;
  const facing = sentinel.direction;
  const charging = sentinel.mode === "charge";

  context.save();
  context.translate(sentinel.x + definition.width * 0.5, sy);
  context.scale(facing, 1);

  // 冲锋残影
  if (charging && !reducedMotion) {
    context.globalAlpha = 0.22;
    context.fillStyle = palette.accent;
    context.beginPath();
    context.roundRect(-definition.width * 0.5 - 16, 2, definition.width * 0.9, definition.height * 0.55, 8);
    context.fill();
    context.globalAlpha = 1;
  }

  // 冰甲身体
  const body = context.createLinearGradient(0, 0, 0, definition.height);
  body.addColorStop(0, palette.iceMid);
  body.addColorStop(1, palette.iceDeep);
  context.fillStyle = body;
  context.beginPath();
  context.roundRect(-definition.width * 0.5, 0, definition.width, definition.height * 0.78, 9);
  context.fill();

  // 背甲板
  context.fillStyle = palette.iceDeep;
  context.beginPath();
  context.roundRect(-definition.width * 0.5 + 3, 4, definition.width - 6, definition.height * 0.4, 6);
  context.fill();
  context.strokeStyle = "rgba(216, 247, 251, 0.2)";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(-definition.width * 0.5 + 8, 4);
  context.lineTo(-definition.width * 0.5 + 8, definition.height * 0.42);
  context.stroke();

  // 头盔 + 护目镜
  context.fillStyle = "#0a1a24";
  context.beginPath();
  context.roundRect(-definition.width * 0.5, 0, definition.width, 12, 6);
  context.fill();
  context.fillStyle = palette.accent;
  context.beginPath();
  context.roundRect(-definition.width * 0.4, 3, definition.width * 0.8, 5, 2.5);
  context.fill();
  const visorPulse = reducedMotion ? 1 : 0.75 + 0.25 * Math.sin(timeMs * 0.014);
  context.globalAlpha = visorPulse;
  context.fillStyle = palette.iceLight;
  context.beginPath();
  context.roundRect(-definition.width * 0.3, 4.4, definition.width * 0.5, 2.4, 1.2);
  context.fill();
  context.globalAlpha = 1;

  // 腿部（冲锋时前倾）
  context.fillStyle = "#0a1a24";
  context.beginPath();
  context.roundRect(-definition.width * 0.4, definition.height * 0.66, 8, definition.height * 0.34, 3);
  context.fill();
  context.beginPath();
  context.roundRect(definition.width * 0.14, definition.height * 0.66, 8, definition.height * 0.34, 3);
  context.fill();
  context.fillStyle = palette.accent;
  context.beginPath();
  context.roundRect(-definition.width * 0.4, definition.height * 0.9, 8, 3, 1.5);
  context.fill();
  context.beginPath();
  context.roundRect(definition.width * 0.14, definition.height * 0.9, 8, 3, 1.5);
  context.fill();

  context.restore();
}

/** 尖刺傀儡：原地驻守，周期性伸出/收回尖刺（伸出时不可踩踏）。 */
function drawSpiker({ context, sentinel, top, timeMs, reducedMotion, palette }: EnemyDrawState): void {
  const definition = sentinel.definition;
  const sy = top;
  const cycle = definition.spikeCycleMs ?? 2000;
  const upMs = definition.spikeUpMs ?? 650;
  const progress = (sentinel.phaseMs % cycle) / cycle;
  const up = progress < upMs / cycle;
  const spikeHeight = definition.spikeHeight ?? 22;
  const extend = up ? spikeHeight : spikeHeight * 0.15;
  const cx = sentinel.x + definition.width * 0.5;

  context.save();
  // 基座
  context.fillStyle = palette.iceDeep;
  context.beginPath();
  context.roundRect(sentinel.x + 2, sy, definition.width - 4, definition.height, 6);
  context.fill();
  context.fillStyle = "rgba(216, 247, 251, 0.18)";
  context.beginPath();
  context.roundRect(sentinel.x + 5, sy + 2, definition.width - 10, 4, 2);
  context.fill();

  // 尖刺（伸出动画）
  const spikeColor = up ? palette.accent : palette.iceMid;
  context.fillStyle = spikeColor;
  for (let i = 0; i < 5; i += 1) {
    const sx = sentinel.x + 8 + i * ((definition.width - 16) / 4);
    const tipX = sx + (i - 2) * 2;
    context.beginPath();
    context.moveTo(sx - 4, sy);
    context.lineTo(sx + 4, sy);
    context.lineTo(tipX, sy - extend);
    context.closePath();
    context.fill();
  }

  // 顶部警示灯
  const pulse = reducedMotion ? 0.8 : up ? 1 : 0.4 + 0.2 * Math.sin(timeMs * 0.01);
  context.globalAlpha = pulse;
  context.fillStyle = palette.beacon;
  context.beginPath();
  context.arc(cx, sy - extend - 3, 2.6, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.restore();
}

/** 投射物：玩家青蓝等离子弹 + 敌方冰晶弹。 */
function drawProjectiles({ context, level, world, reducedMotion }: DrawState): void {
  const { palette } = level;
  for (const projectile of world.projectiles) {
    const screenX = projectile.x - world.camera.x;
    if (screenX < -40 || screenX > PLATFORMER_LOGICAL_WIDTH + 40) {
      continue;
    }
    const cx = projectile.x + projectile.width * 0.5;
    const cy = projectile.y + projectile.height * 0.5;
    const trail = reducedMotion ? 0.4 : 0.3 + 0.25 * Math.sin(world.levelTimeMs * 0.03 + projectile.x);
    context.save();
    if (projectile.kind === "plasma") {
      // 玩家等离子弹：青蓝流线弹体 + 拖尾
      context.globalAlpha = trail;
      context.fillStyle = palette.accentSoft;
      context.beginPath();
      context.ellipse(cx - projectile.width * 1.8, cy, projectile.width * 2.1, projectile.height * 0.7, 0, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
      const body = context.createLinearGradient(projectile.x, 0, projectile.x + projectile.width, 0);
      body.addColorStop(0, palette.iceLight);
      body.addColorStop(1, palette.accent);
      context.fillStyle = body;
      context.beginPath();
      context.roundRect(projectile.x, projectile.y, projectile.width, projectile.height, 4);
      context.fill();
    } else {
      // 敌方冰晶弹：旋转菱形冰晶
      context.globalAlpha = trail;
      context.fillStyle = "rgba(216, 247, 251, 0.28)";
      context.beginPath();
      context.arc(cx, cy, projectile.width * 1.7, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;
      context.fillStyle = palette.iceLight;
      context.beginPath();
      context.moveTo(cx, cy - projectile.height * 1.4);
      context.lineTo(cx + projectile.width, cy);
      context.lineTo(cx, cy + projectile.height * 1.4);
      context.lineTo(cx - projectile.width, cy);
      context.closePath();
      context.fill();
      context.fillStyle = palette.accent;
      context.beginPath();
      context.moveTo(cx, cy - projectile.height * 0.7);
      context.lineTo(cx + projectile.width * 0.5, cy);
      context.lineTo(cx, cy + projectile.height * 0.7);
      context.lineTo(cx - projectile.width * 0.5, cy);
      context.closePath();
      context.fill();
    }
    context.restore();
  }
}

/** 武器补给点：漂浮的弹药箱，带脉冲光环。 */
function drawWeaponPickups({ context, level, world, reducedMotion }: DrawState): void {
  const pulse = reducedMotion ? 0.8 : 0.65 + 0.25 * Math.sin(world.levelTimeMs * 0.006);
  for (const pickup of level.weaponPickups) {
    if (world.collectedPickupIds.includes(pickup.id)) {
      continue;
    }
    const screenX = pickup.x - world.camera.x;
    if (screenX < -60 || screenX > PLATFORMER_LOGICAL_WIDTH + 60) {
      continue;
    }
    const cx = pickup.x + pickup.width * 0.5;
    const cy =
      pickup.y +
      pickup.height * 0.5 +
      (reducedMotion ? 0 : Math.sin(world.levelTimeMs * 0.004 + pickup.x) * 4);
    context.save();
    context.globalAlpha = pulse;
    context.fillStyle = level.palette.accentSoft;
    context.beginPath();
    context.arc(cx, cy, pickup.width * 0.9, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
    context.fillStyle = level.palette.iceDeep;
    context.beginPath();
    context.roundRect(pickup.x, pickup.y, pickup.width, pickup.height, 5);
    context.fill();
    context.strokeStyle = level.palette.accent;
    context.lineWidth = 2;
    context.strokeRect(pickup.x + 1.5, pickup.y + 1.5, pickup.width - 3, pickup.height - 3);
    context.fillStyle = level.palette.accent;
    context.fillRect(cx - 7, cy - 3, 5, 6);
    context.fillRect(cx + 2, cy - 3, 5, 6);
    context.fillStyle = level.palette.iceLight;
    context.fillRect(cx - 7, cy - 1, 5, 2);
    context.fillRect(cx + 2, cy - 1, 5, 2);
    context.restore();
  }
}

function drawCheckpoints({ context, level, world }: DrawState): void {
  for (const checkpoint of level.checkpoints) {
    const activated = world.activatedCheckpointIds.includes(checkpoint.id);
    const screenX = checkpoint.x - world.camera.x;
    if (screenX < -80 || screenX > PLATFORMER_LOGICAL_WIDTH + 80) {
      continue;
    }

    const color = activated ? level.palette.beacon : level.palette.iceDeep;
    context.fillStyle = color;
    context.fillRect(checkpoint.x, checkpoint.y, 6, checkpoint.height);
    context.fillRect(checkpoint.x - 12, checkpoint.y + 6, 30, 8);
    context.fillStyle = activated ? "rgba(232, 184, 79, 0.3)" : "rgba(111, 194, 210, 0.24)";
    context.fillRect(checkpoint.x - 18, checkpoint.y - 14, 42, 14);
  }
}

function drawBeacon({ context, level }: DrawState): void {
  const beacon = level.beacon;

  const beam = context.createLinearGradient(beacon.x, beacon.y, beacon.x, beacon.y - 200);
  beam.addColorStop(0, "rgba(232, 184, 79, 0.34)");
  beam.addColorStop(1, "rgba(232, 184, 79, 0)");
  context.fillStyle = beam;
  context.fillRect(beacon.x - 12, beacon.y - 200, 24, 200);

  context.fillStyle = level.palette.beacon;
  context.fillRect(beacon.x, beacon.y, beacon.width, beacon.height);
  context.fillStyle = "rgba(216, 247, 251, 0.85)";
  context.fillRect(beacon.x + beacon.width * 0.25, beacon.y + 8, beacon.width * 0.5, 10);
}

function drawPlayer({ context, world }: DrawState): void {
  const player = world.player;
  const invincible = player.invincibleMs > 0;
  const blink = invincible && Math.floor(world.levelTimeMs / 120) % 2 === 0;
  const timeMs = world.levelTimeMs;
  const moving = player.onGround && Math.abs(player.vx) > 8;
  const swing = !player.onGround ? 2.5 : moving ? Math.sin(timeMs / 130) * 4 : 0;
  const landing = world.landedFlashMs > 0;
  const landingT = landing ? Math.min(1, world.landedFlashMs / 300) : 0;
  const squashY = landing ? Math.sin(landingT * Math.PI) * 3.2 : 0;

  context.save();
  context.globalAlpha = blink ? 0.4 : 1;
  context.translate(player.x, player.y + squashY);
  context.scale(player.facing, 1);
  if (landing) {
    context.scale(1 + squashY * 0.02, 1 - squashY * 0.03);
  }

  // 背包装备（探测背包 + 扫描天线，位于身后）
  context.fillStyle = "#0b202b";
  context.beginPath();
  context.roundRect(-5, 8, 10, 20, 4);
  context.fill();
  context.fillStyle = "#58d9ec";
  context.beginPath();
  context.roundRect(-4, 10, 8, 6, 2);
  context.fill();
  context.fillStyle = "#173c4b";
  context.beginPath();
  context.arc(-4, 13, 3, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#173c4b";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(-4, 8);
  context.lineTo(-8, 4);
  context.stroke();
  context.fillStyle = "#58d9ec";
  context.beginPath();
  context.arc(-8, 4, 2, 0, Math.PI * 2);
  context.fill();

  // 头顶天线：细杆 + 脉冲光点
  context.fillStyle = "#173c4b";
  context.fillRect(15, -8, 2, 9);
  const antennaGlow = 0.65 + Math.sin(timeMs / 90) * 0.35;
  context.globalAlpha = (blink ? 0.4 : 1) * antennaGlow;
  context.fillStyle = "#58d9ec";
  context.beginPath();
  context.arc(16, -9, 3.5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#d8f7fb";
  context.beginPath();
  context.arc(16, -9, 1.4, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = blink ? 0.4 : 1;

  // 手臂（肩关节 + 前臂 + 手部光点）
  for (const armX of [1, 26]) {
    context.fillStyle = "#0b202b";
    context.beginPath();
    context.roundRect(armX, 17, 6, 9, 3);
    context.fill();
    context.fillStyle = "#173c4b";
    context.beginPath();
    context.roundRect(armX + 1, 23, 4, 8, 2);
    context.fill();
    context.globalAlpha = (blink ? 0.4 : 1) * 0.9;
    context.fillStyle = "#58d9ec";
    context.beginPath();
    context.arc(armX + 3, 32, 1.6, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = blink ? 0.4 : 1;
  }

  // 腿部（行走摆动 / 滞空收腿），带护膝与靴底光
  const legY = 33;
  const legHeight = 13;
  for (const foot of [
    { x: 5 + swing, y: legY },
    { x: 19 - swing, y: legY },
  ]) {
    context.fillStyle = "#0b202b";
    context.beginPath();
    context.roundRect(foot.x, foot.y, 7, legHeight, 3);
    context.fill();
    context.fillStyle = "#58d9ec";
    context.beginPath();
    context.roundRect(foot.x + 1, foot.y + 3, 5, 4, 1.5);
    context.fill();
    context.fillStyle = "#58d9ec";
    context.beginPath();
    context.roundRect(foot.x, foot.y + legHeight - 4, 7, 4, 2);
    context.fill();
  }

  // 躯干
  context.fillStyle = "#0b202b";
  context.beginPath();
  context.roundRect(3, 14, 26, 26, 7);
  context.fill();
  // 躯干侧通风口
  context.fillStyle = "#173c4b";
  context.beginPath();
  context.roundRect(6, 26, 3, 6, 1.5);
  context.fill();
  context.beginPath();
  context.roundRect(23, 26, 3, 6, 1.5);
  context.fill();

  // 胸口核心灯
  context.fillStyle = "#58d9ec";
  context.beginPath();
  context.roundRect(7, 19, 18, 10, 5);
  context.fill();
  context.fillStyle = "#d8f7fb";
  context.beginPath();
  context.roundRect(10, 21, 12, 6, 3);
  context.fill();

  // 腰带
  context.fillStyle = "#173c4b";
  context.beginPath();
  context.roundRect(5, 33, 22, 4, 2);
  context.fill();

  // 头盔
  context.fillStyle = "#0b202b";
  context.beginPath();
  context.roundRect(5, 0, 22, 20, 9);
  context.fill();
  // 头盔帽檐高光
  context.fillStyle = "rgba(216, 247, 251, 0.55)";
  context.beginPath();
  context.roundRect(7, 2, 18, 3, 1.5);
  context.fill();
  // 头盔顶饰线
  context.fillStyle = "#173c4b";
  context.beginPath();
  context.roundRect(14, 4, 5, 4, 1.5);
  context.fill();

  // 面罩视窗
  context.fillStyle = "#58d9ec";
  context.beginPath();
  context.roundRect(2, 8, 28, 9, 4.5);
  context.fill();
  context.fillStyle = "rgba(216, 247, 251, 0.35)";
  context.beginPath();
  context.roundRect(4, 9, 12, 3, 1.5);
  context.fill();

  // 双眼（发光瞳孔）
  context.fillStyle = "#d8f7fb";
  context.beginPath();
  context.arc(9, 12.5, 2.6, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(23, 12.5, 2.6, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#173c4b";
  context.beginPath();
  context.arc(10, 12.5, 1, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(24, 12.5, 1, 0, Math.PI * 2);
  context.fill();

  // 跳跃推进器尾迹（滞空时）
  if (!player.onGround) {
    const jet = 0.5 + Math.sin(timeMs / 60) * 0.2;
    context.globalAlpha = (blink ? 0.4 : 1) * jet;
    context.fillStyle = "#58d9ec";
    context.beginPath();
    context.ellipse(8, 47, 3, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.ellipse(24, 47, 3, 5, 0, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = blink ? 0.4 : 1;
  }

  context.restore();
}