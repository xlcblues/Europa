import {
  PLATFORMER_ACCELERATION,
  PLATFORMER_ASSISTED_COYOTE_MS,
  PLATFORMER_ASSISTED_JUMP_BUFFER_MS,
  PLATFORMER_COYOTE_MS,
  PLATFORMER_DECELERATION,
  PLATFORMER_GRAVITY,
  PLATFORMER_HIT_INVINCIBILITY_MS,
  PLATFORMER_INITIAL_LIVES,
  PLATFORMER_JUMP_BUFFER_MS,
  PLATFORMER_JUMP_CUTOFF,
  PLATFORMER_JUMP_SPEED,
  PLATFORMER_LOGICAL_WIDTH,
  PLATFORMER_MAX_FALL_SPEED,
  PLATFORMER_MOVE_SPEED,
  PLATFORMER_SCORE_BEACON,
  PLATFORMER_SCORE_CHECKPOINT,
  PLATFORMER_SCORE_CRYSTAL,
  PLATFORMER_SCORE_FULL_COLLECTION,
  PLATFORMER_SCORE_SENTINEL,
  PLATFORMER_SCORE_VICTORY,
  PLATFORMER_SCORE_ZERO_DEATH,
  PLATFORMER_STEP_MS,
  PLATFORMER_STEP_SECONDS,
  PLATFORMER_TOTAL_LEVELS,
  type CameraState,
  type CheckpointDefinition,
  type PlatformDefinition,
  type PlatformOffset,
  type PlatformerEvent,
  type PlatformerInput,
  type PlatformerLevel,
  type PlatformerLevelContext,
  type PlatformerMatchLevelResult,
  type PlatformerMatchSubmission,
  type PlatformerRestoreSnapshot,
  type PlatformerRunResult,
  type PlatformerSaveDetails,
  type PlatformerSaveRecord,
  type PlatformerStepResult,
  type PlatformerWorld,
  type PlayerState,
} from "./platformerTypes";
import {
  getLevelStartCheckpointId,
  getPlatformerLevel,
  getPlatformerLevelById,
  getPlatformerLevelIndex,
  PLATFORMER_LEVELS,
} from "./platformerLevels";

const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 46;
const FALL_MARGIN = 120;
const STOMP_TOLERANCE = 10;
// 冰晶收集判定盒半径（像素）：按玩家身体与水晶包围盒相交判定，避免中心对中心漏检。
const CRYSTAL_PICKUP_RADIUS = 18;
const STOMP_BOUNCE_SPEED = 420;
const EPSILON = 0.75;
const SESSION_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

export const PLATFORMER_PLAYER_WIDTH = PLAYER_WIDTH;
export const PLATFORMER_PLAYER_HEIGHT = PLAYER_HEIGHT;

export function getPlatformerPlayerSize(): { width: number; height: number } {
  return { width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
}

export function createPlatformerInput(assisted = false): PlatformerInput {
  return {
    left: false,
    right: false,
    jumpHeld: false,
    jumpPressed: false,
    downPressed: false,
    assisted,
  };
}

export function createPlatformerSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `platformer-${globalThis.crypto.randomUUID()}`;
  }
  return `platformer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getPlatformOffset(
  platform: PlatformDefinition,
  levelTimeMs: number,
): PlatformOffset {
  if (!platform.motion) {
    return { x: 0, y: 0 };
  }
  const phase = (Math.max(0, levelTimeMs) / 1000) * platform.motion.speed + platform.motion.phase;
  const displacement = Math.sin(phase) * platform.motion.amplitude;
  return platform.motion.axis === "x"
    ? { x: displacement, y: 0 }
    : { x: 0, y: displacement };
}

export function getActiveCheckpointId(world: PlatformerWorld): string {
  const level = getPlatformerLevel(world.levelIndex);
  return world.lastCheckpointIdByLevel[String(level.id)] ?? getLevelStartCheckpointId(level);
}

export function createInitialPlatformerContext(
  sessionId: string = createPlatformerSessionId(),
  assisted = false,
): PlatformerLevelContext {
  return {
    score: 0,
    lives: PLATFORMER_INITIAL_LIVES,
    sessionId,
    assisted,
    collectedItemIds: [],
    defeatedSentinelIds: [],
    activatedCheckpointIds: [],
    lastCheckpointIdByLevel: {},
    deathsByLevel: {},
    completedLevelIds: [],
    reachedBeaconLevelIds: [],
    levelDurations: {},
    levelScores: {},
    totalDurationMs: 0,
  };
}

export function createLevelContext(world: PlatformerWorld): PlatformerLevelContext {
  return {
    score: world.score,
    lives: world.lives,
    sessionId: world.sessionId,
    assisted: world.assisted,
    collectedItemIds: [...world.collectedItemIds],
    defeatedSentinelIds: [...world.defeatedSentinelIds],
    activatedCheckpointIds: [...world.activatedCheckpointIds],
    lastCheckpointIdByLevel: { ...world.lastCheckpointIdByLevel },
    deathsByLevel: { ...world.deathsByLevel },
    completedLevelIds: [...world.completedLevelIds],
    reachedBeaconLevelIds: [...world.reachedBeaconLevelIds],
    levelDurations: { ...world.levelDurations },
    levelScores: { ...world.levelScores },
    totalDurationMs: world.totalDurationMs,
  };
}

export function createPlatformerWorld(
  context: PlatformerLevelContext,
  levelIndex = 0,
  checkpointId?: string,
  timing?: { levelDurationMs?: number; levelTimeMs?: number },
): PlatformerWorld {
  const level = getPlatformerLevel(levelIndex);
  const activeCheckpointId =
    checkpointId ??
    context.lastCheckpointIdByLevel[String(level.id)] ??
    getLevelStartCheckpointId(level);
  const platformOffsets = getLevelOffsets(level, timing?.levelTimeMs ?? 0);
  const spawn = getCheckpointSpawn(level, activeCheckpointId);
  const player = createPlayerAtSpawn(level, spawn, platformOffsets);
  const camera: CameraState = {
    x: clampCamera(getCameraTarget(player.x, level.width), level.width),
    previousX: 0,
  };
  camera.previousX = camera.x;

  return {
    levelIndex,
    levelId: level.id,
    status: "playing",
    player,
    camera,
    platformOffsets,
    sentinels: level.sentinels.map((definition) => ({
      definition,
      x: definition.x,
      y: 0,
      direction: 1,
      phaseMs: 0,
      defeated: context.defeatedSentinelIds.includes(definition.id),
    })),
    score: context.score,
    lives: context.lives,
    sessionId: context.sessionId,
    assisted: context.assisted,
    collectedItemIds: [...context.collectedItemIds],
    defeatedSentinelIds: [...context.defeatedSentinelIds],
    activatedCheckpointIds: [...context.activatedCheckpointIds],
    lastCheckpointIdByLevel: { ...context.lastCheckpointIdByLevel },
    deathsByLevel: { ...context.deathsByLevel },
    completedLevelIds: [...context.completedLevelIds],
    reachedBeaconLevelIds: [...context.reachedBeaconLevelIds],
    levelDurations: { ...context.levelDurations },
    levelScores: { ...context.levelScores },
    totalDurationMs: context.totalDurationMs,
    levelDurationMs: Math.max(0, timing?.levelDurationMs ?? 0),
    levelTimeMs: Math.max(0, timing?.levelTimeMs ?? 0),
    lastDeathReason: null,
    deathFlashMs: 0,
    checkpointFlashMs: 0,
    crystalFlashMs: 0,
    landedFlashMs: 0,
  };
}

export function restartAtCheckpoint(world: PlatformerWorld): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const spawn = getCheckpointSpawn(level, getActiveCheckpointId(world));
  return {
    ...world,
    status: "playing",
    player: {
      ...createPlayerAtSpawn(level, spawn, world.platformOffsets),
      invincibleMs: PLATFORMER_HIT_INVINCIBILITY_MS,
    },
    camera: {
      x: clampCamera(getCameraTarget(spawn.x, level.width), level.width),
      previousX: clampCamera(getCameraTarget(spawn.x, level.width), level.width),
    },
    sentinels: world.sentinels.map((sentinel) => ({
      ...sentinel,
      defeated:
        sentinel.defeated || world.defeatedSentinelIds.includes(sentinel.definition.id),
    })),
    lastDeathReason: null,
    deathFlashMs: 0,
    checkpointFlashMs: 450,
    crystalFlashMs: 0,
    landedFlashMs: 0,
  };
}

function getLevelOffsets(level: PlatformerLevel, timeMs: number): Record<string, PlatformOffset> {
  return Object.fromEntries(
    level.platforms.map((platform) => [platform.id, getPlatformOffset(platform, timeMs)]),
  );
}

function createPlayerAtSpawn(
  level: PlatformerLevel,
  spawn: { x: number; y: number },
  offsets: Record<string, PlatformOffset>,
): PlayerState {
  const player: PlayerState = {
    x: spawn.x,
    y: spawn.y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    previousX: spawn.x,
    previousY: spawn.y,
    facing: 1,
    onGround: false,
    groundPlatformId: null,
    coyoteMs: 0,
    jumpBufferMs: 0,
    jumpHeldLast: false,
    invincibleMs: 0,
    dropThroughPlatformId: null,
  };
  const support = findSupport(player, level, offsets);
  if (support) {
    player.onGround = true;
    player.groundPlatformId = support.id;
    player.coyoteMs = PLATFORMER_COYOTE_MS;
    player.y = support.top - PLAYER_HEIGHT;
  }
  return player;
}

function getCheckpointSpawn(
  level: PlatformerLevel,
  checkpointId: string,
): { x: number; y: number } {
  if (checkpointId === getLevelStartCheckpointId(level)) {
    return { x: level.spawnX, y: level.spawnY };
  }
  const checkpoint = level.checkpoints.find((item) => item.id === checkpointId);
  if (!checkpoint) {
    throw new Error(`Unknown checkpoint ${checkpointId} for level ${level.id}.`);
  }
  return { x: checkpoint.spawnX, y: checkpoint.spawnY };
}

function getPlatformBounds(
  platform: PlatformDefinition,
  offsets: Record<string, PlatformOffset>,
) {
  const offset = offsets[platform.id] ?? { x: 0, y: 0 };
  return {
    x: platform.x + offset.x,
    y: platform.y + offset.y,
    width: platform.width,
    height: platform.height,
  };
}

function findSupport(
  player: PlayerState,
  level: PlatformerLevel,
  offsets: Record<string, PlatformOffset>,
): { id: string; top: number } | null {
  let support: { id: string; top: number; distance: number } | null = null;
  for (const platform of level.platforms) {
    const bounds = getPlatformBounds(platform, offsets);
    const overlapsX =
      player.x + player.width > bounds.x + EPSILON &&
      player.x < bounds.x + bounds.width - EPSILON;
    const bottom = player.y + player.height;
    const distance = Math.abs(bottom - bounds.y);
    if (
      overlapsX &&
      distance <= 1.5 &&
      player.vy >= -EPSILON &&
      (!support || distance < support.distance)
    ) {
      support = { id: platform.id, top: bounds.y, distance };
    }
  }
  return support ? { id: support.id, top: support.top } : null;
}

function isSolidPlatform(platform: PlatformDefinition): boolean {
  return platform.kind === "solid";
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
  padding = 0,
): boolean {
  return (
    ax + aw > bx + padding &&
    ax < bx + bw - padding &&
    ay + ah > by + padding &&
    ay < by + bh - padding
  );
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function getCameraTarget(playerX: number, levelWidth: number): number {
  return clamp(playerX - PLATFORMER_LOGICAL_WIDTH * 0.35, 0, Math.max(0, levelWidth - PLATFORMER_LOGICAL_WIDTH));
}

function clampCamera(cameraX: number, levelWidth: number): number {
  return clamp(cameraX, 0, Math.max(0, levelWidth - PLATFORMER_LOGICAL_WIDTH));
}

function cloneWorld(world: PlatformerWorld): PlatformerWorld {
  return {
    ...world,
    player: { ...world.player },
    camera: { ...world.camera },
    platformOffsets: Object.fromEntries(
      Object.entries(world.platformOffsets).map(([id, offset]) => [id, { ...offset }]),
    ),
    sentinels: world.sentinels.map((sentinel) => ({ ...sentinel })),
    collectedItemIds: [...world.collectedItemIds],
    defeatedSentinelIds: [...world.defeatedSentinelIds],
    activatedCheckpointIds: [...world.activatedCheckpointIds],
    lastCheckpointIdByLevel: { ...world.lastCheckpointIdByLevel },
    deathsByLevel: { ...world.deathsByLevel },
    completedLevelIds: [...world.completedLevelIds],
    reachedBeaconLevelIds: [...world.reachedBeaconLevelIds],
    levelDurations: { ...world.levelDurations },
    levelScores: { ...world.levelScores },
  };
}
export function stepPlatformer(
  world: PlatformerWorld,
  input: PlatformerInput,
): PlatformerStepResult {
  const next = cloneWorld(world);
  const events: PlatformerEvent[] = [];

  if (world.status !== "playing") {
    return { world: next, events };
  }

  const level = getPlatformerLevel(next.levelIndex);
  next.levelTimeMs += PLATFORMER_STEP_MS;
  next.levelDurationMs += PLATFORMER_STEP_MS;
  next.totalDurationMs += PLATFORMER_STEP_MS;
  next.deathFlashMs = Math.max(0, next.deathFlashMs - PLATFORMER_STEP_MS);
  next.checkpointFlashMs = Math.max(0, next.checkpointFlashMs - PLATFORMER_STEP_MS);
  next.crystalFlashMs = Math.max(0, next.crystalFlashMs - PLATFORMER_STEP_MS);
  next.landedFlashMs = Math.max(0, next.landedFlashMs - PLATFORMER_STEP_MS);
  next.player.invincibleMs = Math.max(0, next.player.invincibleMs - PLATFORMER_STEP_MS);

  const previousOffsets = next.platformOffsets;
  const nextOffsets = getLevelOffsets(level, next.levelTimeMs);
  followMovingPlatform(next, level, previousOffsets, nextOffsets);
  next.platformOffsets = nextOffsets;

  updateRuntimeSentinels(next, level);
  next.player.previousX = next.player.x;
  next.player.previousY = next.player.y;
  const wasGrounded = next.player.onGround;
  const previousGroundId = next.player.groundPlatformId;

  updateHorizontalMotion(next.player, input);
  updateJumpTimers(next.player, input, next.assisted);

  if (
    input.downPressed &&
    next.player.onGround &&
    previousGroundId &&
    isOneWayPlatform(level, previousGroundId)
  ) {
    next.player.dropThroughPlatformId = previousGroundId;
    next.player.onGround = false;
    next.player.groundPlatformId = null;
    next.player.y += 2;
    next.player.vy = Math.max(next.player.vy, 90);
  }

  if (tryStartJump(next.player, input)) {
    events.push({ type: "jump" });
  }

  next.player.vy = Math.min(
    PLATFORMER_MAX_FALL_SPEED,
    next.player.vy + PLATFORMER_GRAVITY * PLATFORMER_STEP_SECONDS,
  );
  if (next.player.onGround && next.player.vy >= 0) {
    next.player.vy = 0;
  }

  resolveHorizontalMotion(next.player, level, next.platformOffsets);
  resolveVerticalMotion(next.player, level, next.platformOffsets, events, wasGrounded, next.assisted);
  if (!wasGrounded && next.player.onGround) {
    next.landedFlashMs = 300;
  }
  checkFall(next, level, events);

  next.player.jumpHeldLast = input.jumpHeld;
  cleanupDropThrough(next.player, level, next.platformOffsets);

  collectCrystals(next, level, events);
  activateCheckpoint(next, level, events);
  resolveSentinelContacts(next, level, events);
  resolveBeacon(next, level, events);

  updateCamera(next, level);
  return { world: next, events };
}

function updateHorizontalMotion(player: PlayerState, input: PlatformerInput): void {
  const direction = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (direction !== 0) {
    player.facing = direction > 0 ? 1 : -1;
    const targetVelocity = direction * PLATFORMER_MOVE_SPEED;
    const rate = Math.sign(targetVelocity - player.vx) === direction
      ? PLATFORMER_ACCELERATION
      : PLATFORMER_DECELERATION;
    player.vx = moveTowards(
      player.vx,
      targetVelocity,
      rate * PLATFORMER_STEP_SECONDS,
    );
    return;
  }

  player.vx = moveTowards(player.vx, 0, PLATFORMER_DECELERATION * PLATFORMER_STEP_SECONDS);
}

function updateJumpTimers(player: PlayerState, input: PlatformerInput, assisted: boolean): void {
  const jumpBufferMs = assisted ? PLATFORMER_ASSISTED_JUMP_BUFFER_MS : PLATFORMER_JUMP_BUFFER_MS;
  const coyoteMs = assisted ? PLATFORMER_ASSISTED_COYOTE_MS : PLATFORMER_COYOTE_MS;

  if (input.jumpPressed) {
    player.jumpBufferMs = jumpBufferMs;
  } else {
    player.jumpBufferMs = Math.max(0, player.jumpBufferMs - PLATFORMER_STEP_MS);
  }

  if (player.onGround) {
    player.coyoteMs = coyoteMs;
  } else {
    player.coyoteMs = Math.max(0, player.coyoteMs - PLATFORMER_STEP_MS);
  }

  if (
    !input.jumpHeld &&
    player.jumpHeldLast &&
    player.vy < 0
  ) {
    player.vy *= PLATFORMER_JUMP_CUTOFF;
  }
}

function tryStartJump(player: PlayerState, input: PlatformerInput): boolean {
  if (player.jumpBufferMs <= 0) {
    return false;
  }
  if (player.coyoteMs <= 0) {
    return false;
  }

  player.vy = -PLATFORMER_JUMP_SPEED;
  player.onGround = false;
  player.groundPlatformId = null;
  player.coyoteMs = 0;
  player.jumpBufferMs = 0;
  player.dropThroughPlatformId = null;
  if (input.jumpHeld) {
    player.jumpHeldLast = true;
  }
  return true;
}

function resolveHorizontalMotion(
  player: PlayerState,
  level: PlatformerLevel,
  offsets: Record<string, PlatformOffset>,
): void {
  const previousX = player.x;
  player.x += player.vx * PLATFORMER_STEP_SECONDS;

  for (const platform of level.platforms) {
    if (!isSolidPlatform(platform)) {
      continue;
    }
    const bounds = getPlatformBounds(platform, offsets);
    if (!rectsOverlap(player.x, player.y, player.width, player.height, bounds.x, bounds.y, bounds.width, bounds.height)) {
      continue;
    }

    const previousRight = previousX + player.width;
    if (player.vx > 0 && previousRight <= bounds.x + EPSILON) {
      player.x = bounds.x - player.width;
      player.vx = 0;
    } else if (player.vx < 0 && previousX >= bounds.x + bounds.width - EPSILON) {
      player.x = bounds.x + bounds.width;
      player.vx = 0;
    }
  }
}

function resolveVerticalMotion(
  player: PlayerState,
  level: PlatformerLevel,
  offsets: Record<string, PlatformOffset>,
  events: PlatformerEvent[],
  wasGrounded: boolean,
  assisted: boolean,
): void {
  const previousTop = player.y;
  const previousBottom = player.y + player.height;
  player.y += player.vy * PLATFORMER_STEP_SECONDS;
  player.onGround = false;
  player.groundPlatformId = null;

  if (player.vy >= 0) {
    let landing: { id: string; top: number } | null = null;
    for (const platform of level.platforms) {
      if (player.dropThroughPlatformId === platform.id) {
        continue;
      }
      const bounds = getPlatformBounds(platform, offsets);
      const overlapsX =
        player.x + player.width > bounds.x + EPSILON &&
        player.x < bounds.x + bounds.width - EPSILON;
      const currentBottom = player.y + player.height;

      if (
        overlapsX &&
        previousBottom <= bounds.y + EPSILON &&
        currentBottom >= bounds.y - EPSILON &&
        (!landing || bounds.y < landing.top)
      ) {
        landing = { id: platform.id, top: bounds.y };
      }
    }

    if (landing) {
      player.y = landing.top - player.height;
      player.vy = 0;
      player.onGround = true;
      player.groundPlatformId = landing.id;
      player.coyoteMs = assisted ? PLATFORMER_ASSISTED_COYOTE_MS : PLATFORMER_COYOTE_MS;
      if (!wasGrounded) {
        events.push({ type: "land" });
      }
    }
    return;
  }

  let ceiling: { bottom: number } | null = null;
  for (const platform of level.platforms) {
    if (!isSolidPlatform(platform)) {
      continue;
    }
    const bounds = getPlatformBounds(platform, offsets);
    const overlapsX =
      player.x + player.width > bounds.x + EPSILON &&
      player.x < bounds.x + bounds.width - EPSILON;
    if (
      overlapsX &&
      previousTop >= bounds.y + bounds.height - EPSILON &&
      player.y <= bounds.y + bounds.height &&
      (!ceiling || bounds.y + bounds.height > ceiling.bottom)
    ) {
      ceiling = { bottom: bounds.y + bounds.height };
    }
  }

  if (ceiling) {
    player.y = ceiling.bottom;
    player.vy = 0;
  }
}

function cleanupDropThrough(
  player: PlayerState,
  level: PlatformerLevel,
  offsets: Record<string, PlatformOffset>,
): void {
  if (!player.dropThroughPlatformId) {
    return;
  }
  const platform = level.platforms.find((item) => item.id === player.dropThroughPlatformId);
  if (!platform) {
    player.dropThroughPlatformId = null;
    return;
  }
  const bounds = getPlatformBounds(platform, offsets);
  if (player.y >= bounds.y + bounds.height || player.vy < 0) {
    player.dropThroughPlatformId = null;
  }
}

function followMovingPlatform(
  world: PlatformerWorld,
  level: PlatformerLevel,
  previousOffsets: Record<string, PlatformOffset>,
  nextOffsets: Record<string, PlatformOffset>,
): void {
  const player = world.player;
  if (!player.onGround || !player.groundPlatformId) {
    return;
  }
  const platform = level.platforms.find((item) => item.id === player.groundPlatformId);
  if (!platform?.motion) {
    return;
  }
  const previous = previousOffsets[platform.id] ?? { x: 0, y: 0 };
  const next = nextOffsets[platform.id] ?? { x: 0, y: 0 };
  player.x += next.x - previous.x;
  player.y += next.y - previous.y;
}

function updateRuntimeSentinels(world: PlatformerWorld, level: PlatformerLevel): void {
  world.sentinels = world.sentinels.map((sentinel) => {
    if (sentinel.defeated) {
      return sentinel;
    }
    const definition = level.sentinels.find((item) => item.id === sentinel.definition.id);
    if (!definition) {
      return sentinel;
    }
    const phaseMs = sentinel.phaseMs + PLATFORMER_STEP_MS;
    const kind = definition.kind ?? "sentinel";

    if (kind === "drifter") {
      // 浮游体：水平正弦漂移 + 垂直小幅摆动，缓慢悬浮于裂隙间。
      const driftRange = definition.patrolMaxX - definition.patrolMinX - definition.width;
      const driftPeriod = definition.bobPeriodMs ?? 4200;
      const progress = (phaseMs % driftPeriod) / driftPeriod;
      const x = definition.patrolMinX + driftRange * (0.5 + 0.5 * Math.sin(progress * Math.PI * 2));
      const y = -(definition.bobAmplitude ?? 5) * Math.sin(progress * Math.PI * 2);
      return { ...sentinel, x, y, phaseMs };
    }

    // 爬虫/哨兵/弹跳兽：水平匀速巡逻，并在巡逻边界折返。
    let x = sentinel.x + sentinel.direction * definition.speed * PLATFORMER_STEP_SECONDS;
    let direction = sentinel.direction;
    if (x <= definition.patrolMinX) {
      x = definition.patrolMinX;
      direction = 1;
    } else if (x + definition.width >= definition.patrolMaxX) {
      x = definition.patrolMaxX - definition.width;
      direction = -1;
    }

    let y = 0;
    if (kind === "hopper") {
      // 弹跳兽：周期性的抛物线跳跃，从地面起跳后回落。
      const hopPeriod = definition.hopPeriodMs ?? 1400;
      const hopHeight = definition.hopHeight ?? 44;
      const t = (phaseMs % hopPeriod) / hopPeriod;
      y = -hopHeight * 4 * t * (1 - t);
    }

    return { ...sentinel, x, y, direction, phaseMs };
  });
}
function moveTowards(value: number, target: number, maximumDelta: number): number {
  if (Math.abs(target - value) <= maximumDelta) {
    return target;
  }
  return value + Math.sign(target - value) * maximumDelta;
}

function isOneWayPlatform(level: PlatformerLevel, platformId: string): boolean {
  return level.platforms.find((item) => item.id === platformId)?.kind === "oneWay";
}

function collectCrystals(
  world: PlatformerWorld,
  level: PlatformerLevel,
  events: PlatformerEvent[],
): void {
  const playerLeft = world.player.x;
  const playerRight = world.player.x + world.player.width;
  const playerTop = world.player.y;
  const playerBottom = world.player.y + world.player.height;
  for (const crystal of level.crystals) {
    if (world.collectedItemIds.includes(crystal.id)) {
      continue;
    }
    const crystalLeft = crystal.x - CRYSTAL_PICKUP_RADIUS;
    const crystalRight = crystal.x + CRYSTAL_PICKUP_RADIUS;
    const crystalTop = crystal.y - CRYSTAL_PICKUP_RADIUS;
    const crystalBottom = crystal.y + CRYSTAL_PICKUP_RADIUS;
    if (
      playerRight >= crystalLeft &&
      playerLeft <= crystalRight &&
      playerBottom >= crystalTop &&
      playerTop <= crystalBottom
    ) {
      world.collectedItemIds.push(crystal.id);
      addWorldScore(world, PLATFORMER_SCORE_CRYSTAL, level.id);
      world.crystalFlashMs = 360;
      events.push({
        type: "crystal",
        crystalId: crystal.id,
        score: PLATFORMER_SCORE_CRYSTAL,
      });
    }
  }
}

function activateCheckpoint(
  world: PlatformerWorld,
  level: PlatformerLevel,
  events: PlatformerEvent[],
): void {
  for (const checkpoint of level.checkpoints) {
    if (!overlapsCheckpoint(world.player, checkpoint)) {
      continue;
    }
    world.lastCheckpointIdByLevel[String(level.id)] = checkpoint.id;
    if (world.activatedCheckpointIds.includes(checkpoint.id)) {
      return;
    }
    world.activatedCheckpointIds.push(checkpoint.id);
    addWorldScore(world, PLATFORMER_SCORE_CHECKPOINT, level.id);
    world.checkpointFlashMs = 1050;
    events.push({
      type: "checkpoint",
      checkpointId: checkpoint.id,
      score: PLATFORMER_SCORE_CHECKPOINT,
    });
    return;
  }
}

function resolveSentinelContacts(
  world: PlatformerWorld,
  level: PlatformerLevel,
  events: PlatformerEvent[],
): void {
  if (world.status !== "playing") {
    return;
  }
  for (const sentinel of world.sentinels) {
    if (sentinel.defeated) {
      continue;
    }
    const player = world.player;
    if (
      !rectsOverlap(
        player.x,
        player.y,
        player.width,
        player.height,
        sentinel.x,
        sentinel.definition.y + sentinel.y,
        sentinel.definition.width,
        sentinel.definition.height,
        2,
      )
    ) {
      continue;
    }

    const stomped =
      player.vy > 0 &&
      player.previousY + player.height <= sentinel.definition.y + sentinel.y + STOMP_TOLERANCE;
    if (stomped) {
      sentinel.defeated = true;
      if (!world.defeatedSentinelIds.includes(sentinel.definition.id)) {
        world.defeatedSentinelIds.push(sentinel.definition.id);
        addWorldScore(world, PLATFORMER_SCORE_SENTINEL, level.id);
        events.push({
          type: "sentinel_stomped",
          sentinelId: sentinel.definition.id,
          score: PLATFORMER_SCORE_SENTINEL,
        });
      }
      player.y = sentinel.definition.y + sentinel.y - player.height - 2;
      player.vy = -STOMP_BOUNCE_SPEED;
      player.onGround = false;
      player.groundPlatformId = null;
      player.invincibleMs = Math.max(player.invincibleMs, 300);
      continue;
    }

    if (player.invincibleMs > 0) {
      continue;
    }
    applyDamage(world, "sentinel", events);
    return;
  }
}

function applyDamage(
  world: PlatformerWorld,
  reason: "fall" | "sentinel",
  events: PlatformerEvent[],
): void {
  if (world.status !== "playing") {
    return;
  }

  world.lives = Math.max(0, world.lives - 1);
  const levelKey = String(world.levelId);
  world.deathsByLevel[levelKey] = (world.deathsByLevel[levelKey] ?? 0) + 1;
  world.lastDeathReason = reason;
  world.deathFlashMs = 760;
  events.push({ type: "damage", reason, lives: world.lives });

  if (world.lives <= 0) {
    world.status = "game_over";
    world.player.vy = 0;
    events.push({ type: "game_over" });
    return;
  }

  const respawned = restartAtCheckpoint(world);
  Object.assign(world, respawned);
  world.lastDeathReason = reason;
  world.deathFlashMs = 760;
  world.player.invincibleMs = PLATFORMER_HIT_INVINCIBILITY_MS;
}

function checkFall(world: PlatformerWorld, level: PlatformerLevel, events: PlatformerEvent[]): void {
  if (world.player.y > level.height + FALL_MARGIN) {
    applyDamage(world, "fall", events);
  }
}

function resolveBeacon(
  world: PlatformerWorld,
  level: PlatformerLevel,
  events: PlatformerEvent[],
): void {
  if (world.status !== "playing") {
    return;
  }
  if (!rectsOverlap(world.player.x, world.player.y, world.player.width, world.player.height, level.beacon.x, level.beacon.y, level.beacon.width, level.beacon.height, 4)) {
    return;
  }

  if (!world.reachedBeaconLevelIds.includes(level.id)) {
    world.reachedBeaconLevelIds.push(level.id);
    addWorldScore(world, PLATFORMER_SCORE_BEACON, level.id);
  }

  if (world.completedLevelIds.includes(level.id)) {
    return;
  }

  world.completedLevelIds.push(level.id);
  world.status = "level_complete";
  world.levelDurations[String(level.id)] = world.levelDurationMs;

  const collectedInLevel = countCollectedInLevel(world, level.id);
  if (collectedInLevel === level.crystals.length) {
    addWorldScore(world, PLATFORMER_SCORE_FULL_COLLECTION, level.id);
  }
  if ((world.deathsByLevel[String(level.id)] ?? 0) === 0) {
    addWorldScore(world, PLATFORMER_SCORE_ZERO_DEATH, level.id);
  }

  const allCompleted = PLATFORMER_LEVELS.every((item) =>
    world.completedLevelIds.includes(item.id),
  );
  if (allCompleted) {
    addWorldScore(world, PLATFORMER_SCORE_VICTORY, level.id);
    world.status = "victory";
    events.push({
      type: "level_complete",
      levelId: level.id,
      scoreEarned: world.levelScores[String(level.id)] ?? 0,
    });
    events.push({ type: "victory" });
    return;
  }

  events.push({
    type: "level_complete",
    levelId: level.id,
    scoreEarned: world.levelScores[String(level.id)] ?? 0,
  });
}

function addWorldScore(world: PlatformerWorld, points: number, levelId: number): void {
  if (points <= 0) {
    return;
  }
  world.score += points;
  const key = String(levelId);
  world.levelScores[key] = (world.levelScores[key] ?? 0) + points;
}

function countCollectedInLevel(world: PlatformerWorld, levelId: number): number {
  const level = getPlatformerLevelById(levelId);
  return level.crystals.filter((crystal) => world.collectedItemIds.includes(crystal.id)).length;
}

function countDefeatedInLevel(world: PlatformerWorld, levelId: number): number {
  const level = getPlatformerLevelById(levelId);
  return level.sentinels.filter((sentinel) => world.defeatedSentinelIds.includes(sentinel.id)).length;
}

function countCheckpointsInLevel(world: PlatformerWorld, levelId: number): number {
  const level = getPlatformerLevelById(levelId);
  return level.checkpoints.filter((checkpoint) => world.activatedCheckpointIds.includes(checkpoint.id)).length;
}

function overlapsCheckpoint(player: PlayerState, checkpoint: CheckpointDefinition): boolean {
  return rectsOverlap(
    player.x,
    player.y,
    player.width,
    player.height,
    checkpoint.x,
    checkpoint.y,
    checkpoint.width,
    checkpoint.height,
    2,
  );
}

function updateCamera(world: PlatformerWorld, level: PlatformerLevel): void {
  world.camera.previousX = world.camera.x;
  const target = getCameraTarget(world.player.x + world.player.width * 0.5, level.width);
  const response = 0.135;
  world.camera.x = clampCamera(
    world.camera.x + (target - world.camera.x) * response,
    level.width,
  );
}

export function createPlatformerSave(world: PlatformerWorld): PlatformerSaveRecord {
  if (world.status !== "playing") {
    throw new Error("仅进行中的对局可以保存检查点。");
  }

  const level = getPlatformerLevel(world.levelIndex);
  const levelDurations = normalizeCompletedLevelDurations(world);
  const levelDurationMs = normalizeDuration(world.levelDurationMs, "本关时长");
  const levelTimeMs = Math.min(
    levelDurationMs,
    normalizeDuration(world.levelTimeMs, "移动平台时间"),
  );
  const totalDurationMs =
    Object.values(levelDurations).reduce((total, duration) => total + duration, 0) +
    levelDurationMs;

  const details: PlatformerSaveDetails = {
    schemaVersion: 1,
    levelIndex: world.levelIndex,
    sessionId: world.sessionId,
    assisted: world.assisted,
    collectedItemIds: [...world.collectedItemIds],
    defeatedSentinelIds: [...world.defeatedSentinelIds],
    activatedCheckpointIds: [...world.activatedCheckpointIds],
    lastCheckpointIdByLevel: { ...world.lastCheckpointIdByLevel },
    deathsByLevel: { ...world.deathsByLevel },
    completedLevelIds: [...world.completedLevelIds],
    reachedBeaconLevelIds: [...world.reachedBeaconLevelIds],
    levelDurations,
    levelScores: { ...world.levelScores },
    totalDurationMs,
    levelDurationMs,
    levelTimeMs,
  };

  return {
    slot: "platformer_main",
    levelId: level.id,
    checkpointId: getActiveCheckpointId(world),
    score: world.score,
    lives: world.lives,
    details,
    updatedAt: Date.now(),
  };
}

function normalizeCompletedLevelDurations(world: PlatformerWorld): Record<string, number> {
  const completed = [...world.completedLevelIds].sort((left, right) => left - right);
  if (completed.length !== world.levelIndex) {
    throw new Error("检查点只能保存在通关进度之后的当前关卡。");
  }

  const durations: Record<string, number> = {};
  for (let index = 0; index < world.levelIndex; index += 1) {
    const expectedLevelId = index + 1;
    if (completed[index] !== expectedLevelId) {
      throw new Error("通关记录与当前关卡顺序不一致。");
    }
    const rawDuration = world.levelDurations[String(expectedLevelId)];
    if (typeof rawDuration !== "number") {
      throw new Error("已通关关卡缺少有效时长。");
    }
    durations[String(expectedLevelId)] = normalizeDuration(rawDuration, "已通关关卡时长");
  }
  return durations;
}

function normalizeDuration(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label}无效。`);
  }
  return Math.round(value);
}

export function parsePlatformerSaveDetails(
  record: PlatformerSaveRecord,
): PlatformerRestoreSnapshot {
  const details = requireObject(record.details, "存档详情");
  if (record.slot !== "platformer_main") {
    throw new Error("检查点存档槽位无效。");
  }
  const levelId = requireInteger(record.levelId, 1, PLATFORMER_TOTAL_LEVELS, "存档关卡");
  const levelIndex = requireInteger(details.levelIndex, 0, PLATFORMER_TOTAL_LEVELS - 1, "存档关卡索引");
  if (levelIndex !== getPlatformerLevelIndex(levelId)) {
    throw new Error("存档关卡与索引不一致。");
  }
  if (details.schemaVersion !== 1) {
    throw new Error("存档版本不受支持。");
  }

  const level = getPlatformerLevelById(levelId);
  const sessionId = requireString(details.sessionId, "对局会话 ID");
  if (!SESSION_PATTERN.test(sessionId)) {
    throw new Error("存档对局会话 ID 无效。");
  }
  const assisted = requireBoolean(details.assisted, "辅助模式标记");
  const collectedItemIds = requireUniqueStringArray(details.collectedItemIds, "冰晶记录");
  const defeatedSentinelIds = requireUniqueStringArray(details.defeatedSentinelIds, "敌人记录");
  const activatedCheckpointIds = requireUniqueStringArray(
    details.activatedCheckpointIds,
    "检查点记录",
  );
  const completedLevelIds = requireUniqueIntegerArray(
    details.completedLevelIds,
    1,
    PLATFORMER_TOTAL_LEVELS,
    "通关记录",
  );
  const reachedBeaconLevelIds = requireUniqueIntegerArray(
    details.reachedBeaconLevelIds,
    1,
    PLATFORMER_TOTAL_LEVELS,
    "信标记录",
  );
  const lastCheckpointIdByLevel = requireStringNumberMap(
    details.lastCheckpointIdByLevel,
    "最近检查点",
  );
  const deathsByLevel = requireIntegerNumberMap(details.deathsByLevel, "死亡统计", 0, 999);
  const levelDurations = requireIntegerNumberMap(details.levelDurations, "关卡时长", 0, 86_400_000);
  const levelScores = requireIntegerNumberMap(details.levelScores, "关卡得分", 0, 1_000_000);
  const totalDurationMs = requireInteger(details.totalDurationMs, 0, 86_400_000, "累计时长");
  const levelDurationMs = requireInteger(details.levelDurationMs, 0, 86_400_000, "本关时长");
  const levelTimeMs = requireInteger(details.levelTimeMs, 0, 86_400_000, "移动平台时间");
  const score = requireInteger(record.score, 0, 1_000_000, "存档得分");
  const lives = requireInteger(record.lives, 1, PLATFORMER_INITIAL_LIVES, "剩余生命");

  validateEntityIds(collectedItemIds, defeatedSentinelIds, activatedCheckpointIds);
  validateLevelNumberKeys(deathsByLevel, "死亡统计");
  validateLevelNumberKeys(levelDurations, "关卡时长");
  validateLevelNumberKeys(levelScores, "关卡得分", false);
  validateCheckpointSelection(
    level,
    record.checkpointId,
    lastCheckpointIdByLevel,
    activatedCheckpointIds,
  );
  validateProgressConsistency(
    completedLevelIds,
    reachedBeaconLevelIds,
    record.checkpointId,
    level,
  );

  validateCompletedProgress(
    levelIndex,
    completedLevelIds,
    reachedBeaconLevelIds,
    levelDurations,
    deathsByLevel,
    levelScores,
    lastCheckpointIdByLevel,
  );
  validateProgressEntityOwnership(
    level.id,
    collectedItemIds,
    defeatedSentinelIds,
    activatedCheckpointIds,
  );

  const completedDurationMs = sumLevelDurations(levelDurations);
  if (completedDurationMs + levelDurationMs !== totalDurationMs) {
    throw new Error("存档累计时长与分关时长不一致。");
  }
  if (levelTimeMs > levelDurationMs) {
    throw new Error("存档移动平台时间超过本关时长。");
  }
  if (!Number.isInteger(record.updatedAt) || record.updatedAt < 0) {
    throw new Error("存档更新时间无效。");
  }

  const context: PlatformerLevelContext = {
    score,
    lives,
    sessionId,
    assisted,
    collectedItemIds,
    defeatedSentinelIds,
    activatedCheckpointIds,
    lastCheckpointIdByLevel,
    deathsByLevel,
    completedLevelIds,
    reachedBeaconLevelIds,
    levelDurations,
    levelScores,
    totalDurationMs,
  };

  validateScoreConsistency(context);

  return {
    levelIndex,
    context,
    lastCheckpointId: record.checkpointId,
    levelDurationMs,
    levelTimeMs,
  };
}

export function restorePlatformerWorld(record: PlatformerSaveRecord): PlatformerWorld {
  const snapshot = parsePlatformerSaveDetails(record);
  const world = createPlatformerWorld(
    snapshot.context,
    snapshot.levelIndex,
    snapshot.lastCheckpointId,
    {
      levelDurationMs: snapshot.levelDurationMs,
      levelTimeMs: snapshot.levelTimeMs,
    },
  );
  world.checkpointFlashMs = 900;
  return world;
}

export function createMatchLevelResult(
  world: PlatformerWorld,
  levelId: number = world.levelId,
): PlatformerMatchLevelResult {
  const level = getPlatformerLevelById(levelId);
  const completed = world.completedLevelIds.includes(levelId);
  const durationMs = completed
    ? world.levelDurations[String(levelId)] ?? 0
    : levelId === world.levelId
      ? world.levelDurationMs
      : 0;
  return {
    levelId,
    score: world.levelScores[String(levelId)] ?? 0,
    crystalsCollected: countCollectedInLevel(world, levelId),
    crystalsTotal: level.crystals.length,
    sentinelsDefeated: countDefeatedInLevel(world, levelId),
    sentinelsTotal: level.sentinels.length,
    checkpointsActivated: countCheckpointsInLevel(world, levelId),
    checkpointsTotal: level.checkpoints.length,
    deaths: world.deathsByLevel[String(levelId)] ?? 0,
    durationMs: Math.max(0, Math.round(durationMs)),
    completed,
    reachedBeacon: world.reachedBeaconLevelIds.includes(levelId),
  };
}

export function createPlatformerMatchSubmission(
  world: PlatformerWorld,
): PlatformerMatchSubmission {
  const levelResults = PLATFORMER_LEVELS.map((level) => createMatchLevelResult(world, level.id));
  const levelsCompleted = levelResults.filter((result) => result.completed).length;
  return {
    sessionId: world.sessionId,
    outcome: levelsCompleted === PLATFORMER_TOTAL_LEVELS ? "victory" : "game_over",
    score: world.score,
    durationMs: levelResults.reduce((total, result) => total + result.durationMs, 0),
    levelsCompleted,
    crystalsCollected: levelResults.reduce((total, result) => total + result.crystalsCollected, 0),
    sentinelsDefeated: levelResults.reduce((total, result) => total + result.sentinelsDefeated, 0),
    deaths: levelResults.reduce((total, result) => total + result.deaths, 0),
    levelResults,
  };
}

export function createPlatformerRunResult(world: PlatformerWorld): PlatformerRunResult {
  const submission = createPlatformerMatchSubmission(world);
  return {
    submission,
    sessionId: submission.sessionId,
    outcome: submission.outcome,
    score: submission.score,
    durationMs: submission.durationMs,
    levelsCompleted: submission.levelsCompleted,
    crystalsCollected: submission.crystalsCollected,
    sentinelsDefeated: submission.sentinelsDefeated,
    deaths: submission.deaths,
    levelResults: submission.levelResults,
  };
}

function validateEntityIds(
  collectedItemIds: string[],
  defeatedSentinelIds: string[],
  activatedCheckpointIds: string[],
): void {
  const crystals = new Set(PLATFORMER_LEVELS.flatMap((level) => level.crystals.map((item) => item.id)));
  const sentinels = new Set(PLATFORMER_LEVELS.flatMap((level) => level.sentinels.map((item) => item.id)));
  const checkpoints = new Set(
    PLATFORMER_LEVELS.flatMap((level) => level.checkpoints.map((item) => item.id)),
  );
  if (collectedItemIds.some((id) => !crystals.has(id))) {
    throw new Error("存档包含未知冰晶。");
  }
  if (defeatedSentinelIds.some((id) => !sentinels.has(id))) {
    throw new Error("存档包含未知敌人。");
  }
  if (activatedCheckpointIds.some((id) => !checkpoints.has(id))) {
    throw new Error("存档包含未知检查点。");
  }
}

function validateLevelNumberKeys(
  values: Record<string, number>,
  label: string,
  allowZero = true,
): void {
  for (const [key, value] of Object.entries(values)) {
    const levelId = Number(key);
    if (!Number.isInteger(levelId) || levelId < 1 || levelId > PLATFORMER_TOTAL_LEVELS) {
      throw new Error(`${label}包含未知关卡。`);
    }
    if (!Number.isInteger(value) || value < 0 || (!allowZero && value === 0)) {
      throw new Error(`${label}包含无效数值。`);
    }
  }
}

function sumLevelDurations(levelDurations: Record<string, number>): number {
  return Object.values(levelDurations).reduce((total, duration) => total + duration, 0);
}

function validateCompletedProgress(
  levelIndex: number,
  completedLevelIds: number[],
  reachedBeaconLevelIds: number[],
  levelDurations: Record<string, number>,
  deathsByLevel: Record<string, number>,
  levelScores: Record<string, number>,
  lastCheckpointIdByLevel: Record<string, string>,
): void {
  const expectedCompleted = Array.from({ length: levelIndex }, (_, index) => index + 1);
  if (
    completedLevelIds.length !== expectedCompleted.length ||
    completedLevelIds.some((levelId, index) => levelId !== expectedCompleted[index])
  ) {
    throw new Error("通关记录必须按关卡顺序连续完成。");
  }
  if (
    reachedBeaconLevelIds.length !== completedLevelIds.length ||
    reachedBeaconLevelIds.some((levelId, index) => levelId !== completedLevelIds[index])
  ) {
    throw new Error("信标记录与通关记录不一致。");
  }

  const activeLevelId = levelIndex + 1;
  validateLimitNumberKeys(deathsByLevel, activeLevelId, "死亡统计");
  validateLimitNumberKeys(levelScores, activeLevelId, "关卡得分");
  validateLimitStringKeys(lastCheckpointIdByLevel, activeLevelId, "最近检查点");

  for (const levelId of expectedCompleted) {
    if (!Number.isInteger(levelDurations[String(levelId)])) {
      throw new Error("已通关关卡缺少有效时长。");
    }
  }
  validateLimitNumberKeys(levelDurations, levelIndex, "关卡时长");
}

function validateLimitNumberKeys(
  values: Record<string, number>,
  maximumLevelId: number,
  label: string,
): void {
  for (const [key, value] of Object.entries(values)) {
    const levelId = Number(key);
    if (!Number.isInteger(levelId) || levelId < 1 || levelId > maximumLevelId) {
      throw new Error(`${label}包含未知关卡。`);
    }
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${label}包含无效数值。`);
    }
  }
}

function validateLimitStringKeys(
  values: Record<string, string>,
  maximumLevelId: number,
  label: string,
): void {
  for (const [key, value] of Object.entries(values)) {
    const levelId = Number(key);
    if (!Number.isInteger(levelId) || levelId < 1 || levelId > maximumLevelId) {
      throw new Error(`${label}包含未知关卡。`);
    }
    const level = getPlatformerLevelById(levelId);
    const checkpointIds = new Set([
      getLevelStartCheckpointId(level),
      ...level.checkpoints.map((checkpoint) => checkpoint.id),
    ]);
    if (!checkpointIds.has(value)) {
      throw new Error(`${label}包含无效检查点。`);
    }
  }
}

function validateProgressEntityOwnership(
  activeLevelId: number,
  collectedItemIds: string[],
  defeatedSentinelIds: string[],
  activatedCheckpointIds: string[],
): void {
  const allowedLevelIds = new Set(
    PLATFORMER_LEVELS.filter((level) => level.id <= activeLevelId).map((level) => level.id),
  );
  const crystals = new Map(
    PLATFORMER_LEVELS.flatMap((level) =>
      level.crystals.map((crystal) => [crystal.id, level.id] as const),
    ),
  );
  const sentinels = new Map(
    PLATFORMER_LEVELS.flatMap((level) =>
      level.sentinels.map((sentinel) => [sentinel.id, level.id] as const),
    ),
  );
  const checkpoints = new Map(
    PLATFORMER_LEVELS.flatMap((level) =>
      level.checkpoints.map((checkpoint) => [checkpoint.id, level.id] as const),
    ),
  );

  if (collectedItemIds.some((id) => !allowedLevelIds.has(crystals.get(id) ?? -1))) {
    throw new Error("存档包含未来关卡冰晶。");
  }
  if (defeatedSentinelIds.some((id) => !allowedLevelIds.has(sentinels.get(id) ?? -1))) {
    throw new Error("存档包含未来关卡敌人。");
  }
  if (activatedCheckpointIds.some((id) => !allowedLevelIds.has(checkpoints.get(id) ?? -1))) {
    throw new Error("存档包含未来关卡检查点。");
  }
}

function validateCheckpointSelection(
  level: PlatformerLevel,
  checkpointId: unknown,
  lastCheckpointIdByLevel: Record<string, string>,
  activatedCheckpointIds: string[],
): void {
  if (typeof checkpointId !== "string") {
    throw new Error("存档检查点无效。");
  }
  const startId = getLevelStartCheckpointId(level);
  const validIds = new Set([startId, ...level.checkpoints.map((item) => item.id)]);
  if (!validIds.has(checkpointId)) {
    throw new Error("存档检查点不属于当前关卡。");
  }

  const selected = lastCheckpointIdByLevel[String(level.id)];
  if (checkpointId === startId) {
    if (selected && selected !== startId) {
      throw new Error("存档检查点与最近检查点不一致。");
    }
    return;
  }
  if (selected !== checkpointId) {
    throw new Error("存档检查点与最近检查点不一致。");
  }
  if (!activatedCheckpointIds.includes(checkpointId)) {
    throw new Error("存档检查点尚未激活。");
  }
}

function validateProgressConsistency(
  completedLevelIds: number[],
  reachedBeaconLevelIds: number[],
  checkpointId: unknown,
  activeLevel: PlatformerLevel,
): void {
  for (const levelId of completedLevelIds) {
    if (!reachedBeaconLevelIds.includes(levelId)) {
      throw new Error("通关记录缺少信标记录。");
    }
  }
  if (completedLevelIds.includes(activeLevel.id)) {
    throw new Error("检查点存档不能位于已完成关卡。");
  }
  if (typeof checkpointId === "string" && checkpointId.startsWith("level-") && checkpointId !== getLevelStartCheckpointId(activeLevel)) {
    throw new Error("存档检查点格式无效。");
  }
}

function validateScoreConsistency(context: PlatformerLevelContext): void {
  const expectedByLevel = new Map<number, number>();
  for (const level of PLATFORMER_LEVELS) {
    expectedByLevel.set(level.id, calculateExpectedLevelScore(context, level.id));
  }
  for (const [key, score] of Object.entries(context.levelScores)) {
    const levelId = Number(key);
    if (score !== expectedByLevel.get(levelId)) {
      throw new Error("存档关卡得分与收集进度不一致。");
    }
  }
  const expectedTotal = [...expectedByLevel.values()].reduce((total, score) => total + score, 0);
  if (context.score !== expectedTotal) {
    throw new Error("存档总分与收集进度不一致。");
  }
  if (context.levelScores && Object.values(context.levelScores).reduce((total, value) => total + value, 0) !== context.score) {
    throw new Error("存档关卡得分总和无效。");
  }
}

function calculateExpectedLevelScore(
  context: PlatformerLevelContext,
  levelId: number,
): number {
  const level = getPlatformerLevelById(levelId);
  const crystals = level.crystals.filter((item) => context.collectedItemIds.includes(item.id)).length;
  const sentinels = level.sentinels.filter((item) => context.defeatedSentinelIds.includes(item.id)).length;
  const checkpoints = level.checkpoints.filter((item) => context.activatedCheckpointIds.includes(item.id)).length;
  let score = crystals * PLATFORMER_SCORE_CRYSTAL;
  score += sentinels * PLATFORMER_SCORE_SENTINEL;
  score += checkpoints * PLATFORMER_SCORE_CHECKPOINT;
  if (context.reachedBeaconLevelIds.includes(levelId)) {
    score += PLATFORMER_SCORE_BEACON;
  }
  if (context.completedLevelIds.includes(levelId)) {
    if (crystals === level.crystals.length) {
      score += PLATFORMER_SCORE_FULL_COLLECTION;
    }
    if ((context.deathsByLevel[String(levelId)] ?? 0) === 0) {
      score += PLATFORMER_SCORE_ZERO_DEATH;
    }
  }
  if (
    levelId === PLATFORMER_TOTAL_LEVELS &&
    PLATFORMER_LEVELS.every((item) => context.completedLevelIds.includes(item.id))
  ) {
    score += PLATFORMER_SCORE_VICTORY;
  }
  return score;
}

function requireObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}格式无效。`);
  }
  return value as Record<string, unknown>;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`${label}格式无效。`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label}格式无效。`);
  }
  return value;
}

function requireInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new Error(`${label}无效。`);
  }
  return value as number;
}

function requireUniqueStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`${label}格式无效。`);
  }
  if (new Set(value).size !== value.length) {
    throw new Error(`${label}包含重复项。`);
  }
  return [...value];
}

function requireUniqueIntegerArray(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): number[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label}格式无效。`);
  }
  const values = value.map((item) => requireInteger(item, minimum, maximum, label));
  if (new Set(values).size !== values.length) {
    throw new Error(`${label}包含重复项。`);
  }
  return values;
}

function requireStringNumberMap(value: unknown, label: string): Record<string, string> {
  const object = requireObject(value, label);
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(object)) {
    if (typeof item !== "string") {
      throw new Error(`${label}格式无效。`);
    }
    result[key] = item;
  }
  return result;
}

function requireIntegerNumberMap(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): Record<string, number> {
  const object = requireObject(value, label);
  const result: Record<string, number> = {};
  for (const [key, item] of Object.entries(object)) {
    result[key] = requireInteger(item, minimum, maximum, label);
  }
  return result;
}




