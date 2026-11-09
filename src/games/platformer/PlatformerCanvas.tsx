import { useEffect, useRef } from "react";

import {
  PLATFORMER_LOGICAL_HEIGHT,
  PLATFORMER_LOGICAL_WIDTH,
  type PlatformerLevel,
  type PlatformerWorld,
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
      drawSentinels(state);
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

function drawSentinels({ context, level, world, reducedMotion }: DrawState): void {
  for (const sentinel of world.sentinels) {
    if (sentinel.defeated) {
      continue;
    }
    const definition = sentinel.definition;
    const screenX = sentinel.x - world.camera.x;
    if (screenX < -120 || screenX > PLATFORMER_LOGICAL_WIDTH + 120) {
      continue;
    }

    // 哨兵光晕与游戏时间同步（暂停冻结、恢复续接）；减少动态时使用静态光晕。
    const glow = reducedMotion ? 0.55 : 0.5 + Math.sin(world.levelTimeMs * 0.006) * 0.2;
    context.save();
    context.fillStyle = level.palette.accentSoft;
    context.globalAlpha = glow;
    context.beginPath();
    context.ellipse(sentinel.x, definition.y + definition.height * 0.5, 30, 26, 0, 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;

    context.fillStyle = level.palette.iceDeep;
    context.fillRect(sentinel.x - definition.width * 0.5, definition.y, definition.width, definition.height);
    context.fillStyle = level.palette.accent;
    context.beginPath();
    context.arc(sentinel.x, definition.y + definition.height * 0.5, 7, 0, Math.PI * 2);
    context.fill();
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

  context.save();
  context.globalAlpha = blink ? 0.4 : 1;
  context.translate(player.x, player.y);
  context.scale(player.facing, 1);

  // 冰晶背光（柔和光环）
  context.fillStyle = "rgba(88, 217, 236, 0.14)";
  context.beginPath();
  context.ellipse(0, player.height * 0.5, 28, 32, 0, 0, Math.PI * 2);
  context.fill();

  // 天线：细杆 + 脉冲光点
  context.fillStyle = "#173c4b";
  context.fillRect(15, -7, 2, 9);
  const antennaGlow = 0.65 + Math.sin(timeMs / 90) * 0.35;
  context.globalAlpha = (blink ? 0.4 : 1) * antennaGlow;
  context.fillStyle = "#58d9ec";
  context.beginPath();
  context.arc(16, -8, 3.5, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#d8f7fb";
  context.beginPath();
  context.arc(16, -8, 1.4, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = blink ? 0.4 : 1;

  // 手臂（两侧短臂）
  context.fillStyle = "#0b202b";
  context.beginPath();
  context.roundRect(0, 22, 5, 11, 2);
  context.fill();
  context.beginPath();
  context.roundRect(27, 22, 5, 11, 2);
  context.fill();

  // 腿部（行走摆动 / 滞空收腿）
  const legY = 34;
  const legWidth = 8;
  const legHeight = 12;
  for (const foot of [
    { x: 6 + swing, y: legY },
    { x: 18 - swing, y: legY },
  ]) {
    context.fillStyle = "#0b202b";
    context.beginPath();
    context.roundRect(foot.x, foot.y, legWidth, legHeight, 2);
    context.fill();
    context.fillStyle = "#58d9ec";
    context.beginPath();
    context.roundRect(foot.x + 1, foot.y + legHeight - 5, legWidth - 2, 5, 2);
    context.fill();
  }

  // 躯干
  context.fillStyle = "#0b202b";
  context.beginPath();
  context.roundRect(3, 14, 26, 24, 7);
  context.fill();

  // 胸口核心灯
  context.fillStyle = "#58d9ec";
  context.beginPath();
  context.roundRect(7, 20, 18, 9, 4);
  context.fill();
  context.fillStyle = "#d8f7fb";
  context.beginPath();
  context.roundRect(10, 22, 12, 5, 2);
  context.fill();

  // 头盔
  context.fillStyle = "#0b202b";
  context.beginPath();
  context.roundRect(6, 0, 20, 18, 8);
  context.fill();

  // 面罩视窗
  context.fillStyle = "#58d9ec";
  context.beginPath();
  context.roundRect(3, 8, 26, 8, 4);
  context.fill();

  // 双眼（发光瞳孔）
  context.fillStyle = "#d8f7fb";
  context.beginPath();
  context.arc(10, 12, 2.5, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(22, 12, 2.5, 0, Math.PI * 2);
  context.fill();

  context.restore();
}