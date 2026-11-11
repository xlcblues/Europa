import { useEffect, useRef } from "react";

import {
  PLATFORMER_LOGICAL_HEIGHT,
  PLATFORMER_LOGICAL_WIDTH,
  type LevelPalette,
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
      drawBeacon(state);
      drawPlatforms(state);
      drawCheckpoints(state);
      drawCrystals(state);
      drawEnemies(state);
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

  const stars = context.createRadialGradient(900, 120, 8, 900, 120, 420);
  stars.addColorStop(0, "rgba(232, 248, 252, 0.16)");
  stars.addColorStop(1, "rgba(232, 248, 252, 0)");
  context.fillStyle = stars;
  context.fillRect(0, 0, PLATFORMER_LOGICAL_WIDTH, 420);
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
      color: "rgba(23, 60, 75, 0.82)",
      peaks: [180, 520, 980, 1420, 1860, 2260, 2680, 3100],
    },
    {
      factor: 0.48,
      color: "rgba(23, 60, 75, 0.42)",
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

function drawPlatforms({ context, level, world }: DrawState): void {
  for (const platform of level.platforms) {
    const offset = world.platformOffsets[platform.id];
    const x = platform.x + (offset?.x ?? 0);
    const y = platform.y + (offset?.y ?? 0);
    const width = platform.width;
    const height = platform.height;

    if (platform.kind === "oneWay") {
      context.fillStyle = level.palette.iceLight;
      context.globalAlpha = 0.72;
      context.fillRect(x, y, width, Math.min(8, height));
      context.globalAlpha = 1;
      continue;
    }

    context.fillStyle = level.palette.iceDeep;
    context.fillRect(x, y, width, height);
    context.fillStyle = level.palette.iceMid;
    context.fillRect(x, y, width, Math.min(10, height));
    context.fillStyle = "rgba(216, 247, 251, 0.24)";
    context.fillRect(x, y, width, 3);
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