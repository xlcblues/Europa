import {
  createLevelContext,
  createPlatformerInput,
  createPlatformerMatchSubmission,
  createPlatformerSave,
  createPlatformerWorld,
  createInitialPlatformerContext,
  getActiveCheckpointId,
  getPlatformOffset,
  parsePlatformerSaveDetails,
  restorePlatformerWorld,
  stepPlatformer,
} from "./platformerEngine";
import { getPlatformerLevel, PLATFORMER_LEVELS } from "./platformerLevels";
import {
  PLATFORMER_DECELERATION,
  PLATFORMER_SCORE_BEACON,
  PLATFORMER_SCORE_CHECKPOINT,
  PLATFORMER_SCORE_CRYSTAL,
  PLATFORMER_SCORE_FULL_COLLECTION,
  PLATFORMER_SCORE_SENTINEL,
  PLATFORMER_SCORE_VICTORY,
  PLATFORMER_SCORE_ZERO_DEATH,
} from "./platformerTypes";
import type {
  PlatformerInput,
  PlatformerLevel,
  PlatformerLevelContext,
  PlatformerWorld,
} from "./platformerTypes";

type Controls = Partial<Pick<PlatformerInput, "left" | "right" | "jumpPressed" | "jumpHeld" | "downPressed">>;
function levelAt(index: number): PlatformerLevel {
  const level = PLATFORMER_LEVELS[index];
  if (!level) {
    throw new Error(`Missing platformer level at index ${index}.`);
  }
  return level;
}

function tick(world: PlatformerWorld, controls: Controls = {}): PlatformerWorld {
  return stepPlatformer(world, { ...createPlatformerInput(), ...controls }).world;
}

function centerX(world: PlatformerWorld): number {
  return world.player.x + world.player.width * 0.5;
}

function centerY(world: PlatformerWorld): number {
  return world.player.y + world.player.height * 0.5;
}

function groundOf(world: PlatformerWorld): string {
  return `${world.player.groundPlatformId ?? "air"} @ (${centerX(world).toFixed(1)}, ${centerY(world).toFixed(1)})`;
}

function idle(world: PlatformerWorld, frames = 8): PlatformerWorld {
  let current = world;
  for (let index = 0; index < frames && current.status === "playing"; index += 1) {
    current = tick(current);
  }
  return current;
}

function walk(world: PlatformerWorld, target: number, expectedGround: string, maxFrames = 900): PlatformerWorld {
  let current = world;
  if (current.player.groundPlatformId !== expectedGround) {
    throw new Error(`walk start expected ${expectedGround}, found ${groundOf(current)}`);
  }
  for (let frame = 0; frame < maxFrames && current.status === "playing"; frame += 1) {
    const delta = target - centerX(current);
    const movingToward = current.player.vx * Math.sign(delta);
    const stoppingDistance = Math.abs(current.player.vx) ** 2 / (2 * PLATFORMER_DECELERATION);
    const brake = movingToward > 0 && stoppingDistance >= Math.abs(delta) - 2;
    const controls: Controls = Math.abs(delta) <= 0.75 && Math.abs(current.player.vx) <= 2
      ? {}
      : brake
        ? {}
        : delta < 0
          ? { left: true }
          : { right: true };
    current = tick(current, controls);
    if (current.player.groundPlatformId !== expectedGround) {
      throw new Error(`walk left ${expectedGround}; target=${target.toFixed(1)}, ${groundOf(current)}`);
    }
    if (Math.abs(target - centerX(current)) <= 1.25 && Math.abs(current.player.vx) <= 2) {
      return idle(current);
    }
  }
  if (current.status !== "playing") return current;
  if (current.player.groundPlatformId !== expectedGround) {
    throw new Error(`walk finish expected ${expectedGround}, found ${groundOf(current)}`);
  }
  if (Math.abs(target - centerX(current)) > 2.5) {
    throw new Error(`walk target=${target.toFixed(1)} finish=${centerX(current).toFixed(1)}`);
  }
  return idle(current);
}

interface JumpOptions {
  fromPlatformId: string;
  landPlatformId: string;
  target: number;
  runway?: number;
  holdFrames?: number;
  maxFrames?: number;
}

function jumpTo(world: PlatformerWorld, direction: "left" | "right", options: JumpOptions): PlatformerWorld {
  let current = world;
  if (current.status !== "playing") {
    throw new Error(`jumpTo not playing: ${groundOf(current)}`);
  }
  if (current.player.groundPlatformId !== options.fromPlatformId) {
    throw new Error(`jumpTo start expected ${options.fromPlatformId}, found ${groundOf(current)}`);
  }
  const runway = options.runway ?? 0;
  const holdFrames = options.holdFrames ?? 28;
  const maxFrames = options.maxFrames ?? 240;
  let leftGround = false;
  let landed: string | null = null;
  for (let frame = 0; frame < maxFrames && current.status === "playing"; frame += 1) {
    const delta = options.target - centerX(current);
    const movingToward = current.player.vx * Math.sign(delta);
    const stoppingDistance = Math.abs(current.player.vx) ** 2 / (2 * PLATFORMER_DECELERATION);
    const runwayNow = current.player.onGround && frame < runway;
    if (runwayNow && current.player.groundPlatformId !== options.fromPlatformId) {
      throw new Error(`jump runway left ${options.fromPlatformId}: ${groundOf(current)}`);
    }
    const brake = movingToward > 0 && stoppingDistance >= Math.abs(delta) - 22;
    const horizontal: Controls = runwayNow || (!brake && Math.abs(delta) > 1.5)
      ? direction === "right" ? { right: true } : { left: true }
      : {};
    current = tick(current, {
      ...horizontal,
      jumpPressed: frame === runway,
      jumpHeld: frame >= runway && frame < runway + holdFrames,
    });
    if (!current.player.onGround) {
      leftGround = true;
    }
    if (leftGround && frame > runway + 3 && current.player.onGround) {
      landed = current.player.groundPlatformId;
      break;
    }
  }
  if (current.status !== "playing") {
    throw new Error(`jumpTo ${options.fromPlatformId}->${options.landPlatformId} ended ${current.status}: ${groundOf(current)}, lives=${current.lives}`);
  }
  if (landed !== options.landPlatformId) {
    throw new Error(`jumpTo expected landing ${options.landPlatformId}, got ${landed ?? "air"}: ${groundOf(current)}, target=${options.target}`);
  }
  return idle(current);
}

function walkOff(world: PlatformerWorld, direction: "left" | "right", expectedGround: string): PlatformerWorld {
  let current = world;
  let leftGround = false;
  for (let frame = 0; frame < 240 && current.status === "playing"; frame += 1) {
    current = tick(current, direction === "right" ? { right: true } : { left: true });
    if (!current.player.onGround) {
      leftGround = true;
    }
    if (leftGround && frame > 3 && current.player.onGround) {
      break;
    }
  }
  if (current.status !== "playing") return current;
  if (current.player.groundPlatformId !== expectedGround) {
    throw new Error(`walkOff expected ${expectedGround}, found ${groundOf(current)}`);
  }
  return idle(current);
}

function jumpVertical(world: PlatformerWorld, expectedGround: string): PlatformerWorld {
  let current = tick(world, { jumpPressed: true, jumpHeld: true });
  let leftGround = false;
  for (let frame = 1; frame < 140 && current.status === "playing"; frame += 1) {
    if (!current.player.onGround) {
      leftGround = true;
    }
    current = tick(current, { jumpHeld: frame < 30 });
    if (leftGround && frame > 3 && current.player.onGround) {
      break;
    }
  }
  if (current.status !== "playing") return current;
  if (current.player.groundPlatformId !== expectedGround) {
    throw new Error(`jumpVertical expected ${expectedGround}, found ${groundOf(current)}`);
  }
  return idle(current);
}

function collectCrystal(world: PlatformerWorld, id: string, expectedGround: string): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const crystal = level.crystals.find((item) => item.id === id);
  if (!crystal) throw new Error(`unknown crystal ${id}`);
  let current = walk(world, crystal.x, expectedGround);
  if (!current.collectedItemIds.includes(id)) current = jumpVertical(current, expectedGround);
  if (!current.collectedItemIds.includes(id)) {
    throw new Error(`crystal ${id} missed at (${centerX(current).toFixed(1)}, ${centerY(current).toFixed(1)})`);
  }
  return current;
}

function log(label: string, world: PlatformerWorld): void {
  console.log(label, {
    x: Number(centerX(world).toFixed(1)),
    y: Number(centerY(world).toFixed(1)),
    ground: world.player.groundPlatformId,
    crystals: world.collectedItemIds.length,
    sentinels: world.defeatedSentinelIds.length,
    checkpoints: world.activatedCheckpointIds.length,
    status: world.status,
    lives: world.lives,
    score: world.score,
  });
}

describe("level 1 real-input route", () => {
  it("collects all crystals and reaches the beacon", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("route-level-1"), 0);
    world = walk(world, 220, "l1-ground-a");
    world = jumpTo(world, "right", { fromPlatformId: "l1-ground-a", landPlatformId: "l1-step-a", target: 350 });
    world = walk(world, 490, "l1-step-a");
    world = walkOff(world, "right", "l1-ground-a");
    world = walk(world, 690, "l1-ground-a");
    world = jumpTo(world, "right", { fromPlatformId: "l1-ground-a", landPlatformId: "l1-ice-shelf-a", target: 820, runway: 12 });
    log("shelf-a", world);
    for (const id of ["l1-crystal-01", "l1-crystal-02", "l1-crystal-03"]) {
      world = collectCrystal(world, id, "l1-ice-shelf-a");
    }
    world = jumpTo(world, "right", { fromPlatformId: "l1-ice-shelf-a", landPlatformId: "l1-ice-shelf-b", target: 1100, runway: 8 });
    log("shelf-b", world);
    for (const id of ["l1-crystal-04", "l1-crystal-05", "l1-crystal-06"]) {
      world = collectCrystal(world, id, "l1-ice-shelf-b");
    }
    world = walkOff(world, "right", "l1-ground-b");
    world = walk(world, 1665, "l1-ground-b");
    log("checkpoint", world);
    world = walk(world, 1840, "l1-ground-b");
    world = jumpTo(world, "right", { fromPlatformId: "l1-ground-b", landPlatformId: "l1-ground-c", target: 2005 });
    world = jumpTo(world, "right", { fromPlatformId: "l1-ground-c", landPlatformId: "l1-ledge-a", target: 2080 });
    log("ledge", world);
    for (const id of ["l1-crystal-07", "l1-crystal-08", "l1-crystal-09"]) {
      world = collectCrystal(world, id, "l1-ledge-a");
    }
    world = walkOff(world, "right", "l1-ground-c");
    world = walk(world, 2720, "l1-ground-c");
    log("beacon", world);
    expect(world.status).toBe("level_complete");
    expect(world.collectedItemIds).toHaveLength(9);
    expect(world.activatedCheckpointIds).toEqual(["l1-checkpoint-01"]);
  });
});
function waitForLiftOffsets(world: PlatformerWorld, platformId: string, minimumY: number): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const platform = level.platforms.find((item) => item.id === platformId);
  if (!platform?.motion) throw new Error(`unknown moving platform ${platformId}`);
  let current = world;
  for (let frame = 0; frame < 240 && current.status === "playing"; frame += 1) {
    const offset = getPlatformOffset(platform, current.levelTimeMs);
    if (offset.y >= minimumY) return current;
    current = tick(current);
  }
  throw new Error(`lift ${platformId} did not reach y offset ${minimumY}`);
}

function rideLift(world: PlatformerWorld, platformId: string, frames: number): PlatformerWorld {
  let current = world;
  if (current.player.groundPlatformId !== platformId) {
    throw new Error(`rideLift expected ${platformId}, found ${groundOf(current)}`);
  }
  const startY = current.player.y;
  const level = getPlatformerLevel(world.levelIndex);
  const platform = level.platforms.find((item) => item.id === platformId);
  if (!platform) throw new Error(`unknown platform ${platformId}`);
  for (let frame = 0; frame < frames && current.status === "playing"; frame += 1) {
    current = tick(current);
    if (current.player.groundPlatformId !== platformId) {
      const offset = current.platformOffsets[platformId] ?? { x: 0, y: 0 };
      throw new Error(`rideLift lost ${platformId} at frame ${frame}: ${groundOf(current)}, playerBottom=${(current.player.y + current.player.height).toFixed(2)}, platformTop=${(platform.y + offset.y).toFixed(2)}, offsetY=${offset.y.toFixed(2)}, vy=${current.player.vy.toFixed(2)}`);
    }
  }
  if (Math.abs(current.player.y - startY) < 0.5) {
    throw new Error(`rideLift ${platformId} did not move the player`);
  }
  return current;
}

describe("level 2 real-input route", () => {
  it("uses the vertical lift and reaches the beacon", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("route-level-2"), 1);
    world = walk(world, 600, "l2-ground-a");
    world = jumpTo(world, "right", { fromPlatformId: "l2-ground-a", landPlatformId: "l2-step-a", target: 720, runway: 10 });
    log("step-a", world);
    for (const id of ["l2-crystal-01", "l2-crystal-02", "l2-crystal-03"]) {
      world = collectCrystal(world, id, "l2-step-a");
    }
    world = jumpTo(world, "right", { fromPlatformId: "l2-step-a", landPlatformId: "l2-upper-a", target: 940, runway: 8 });
    log("upper-a", world);
    for (const id of ["l2-crystal-04", "l2-crystal-05", "l2-crystal-06"]) {
      world = collectCrystal(world, id, "l2-upper-a");
    }
    world = jumpTo(world, "right", { fromPlatformId: "l2-upper-a", landPlatformId: "l2-upper-b", target: 1215, runway: 6 });
    log("upper-b", world);
    world = walk(world, 1370, "l2-upper-b");
    world = jumpTo(world, "right", { fromPlatformId: "l2-upper-b", landPlatformId: "l2-upper-c", target: 1540, runway: 8 });
    log("upper-c", world);
    for (const id of ["l2-crystal-07", "l2-crystal-08", "l2-crystal-09"]) {
      world = collectCrystal(world, id, "l2-upper-c");
    }
    world = walkOff(world, "right", "l2-ground-c");
    world = walk(world, 1740, "l2-ground-c");
    log("checkpoint", world);
    world = walk(world, 1805, "l2-ground-c");
    world = waitForLiftOffsets(world, "l2-vertical-lift", 25);
    const liftOffset = world.platformOffsets["l2-vertical-lift"]?.y ?? 0;
    world = jumpTo(world, "right", { fromPlatformId: "l2-ground-c", landPlatformId: "l2-vertical-lift", target: 1925, runway: 8 });
    log("lift", world);
    expect(world.player.onGround).toBe(true);
    expect(world.player.groundPlatformId).toBe("l2-vertical-lift");
    expect(liftOffset).toBeGreaterThan(0);
    world = rideLift(world, "l2-vertical-lift", 40);
    log("lift ridden", world);
    world = jumpTo(world, "right", { fromPlatformId: "l2-vertical-lift", landPlatformId: "l2-ground-d", target: 2070, runway: 6 });
    log("ground-d", world);
    world = jumpTo(world, "right", { fromPlatformId: "l2-ground-d", landPlatformId: "l2-upper-approach", target: 2185, runway: 8 });
    world = jumpTo(world, "right", { fromPlatformId: "l2-upper-approach", landPlatformId: "l2-upper-d", target: 2310, runway: 5 });
    log("upper-d", world);
    for (const id of ["l2-crystal-10", "l2-crystal-11", "l2-crystal-12"]) {
      world = collectCrystal(world, id, "l2-upper-d");
    }
    world = jumpTo(world, "right", { fromPlatformId: "l2-upper-d", landPlatformId: "l2-ground-e", target: 2650, runway: 8 });
    log("ground-e", world);
    world = walk(world, 3340, "l2-ground-e");
    log("beacon", world);
    expect(world.status).toBe("level_complete");
    expect(world.collectedItemIds).toHaveLength(12);
    expect(world.activatedCheckpointIds).toEqual(["l2-checkpoint-01"]);
  });
});

function waitForLiftBelow(world: PlatformerWorld, platformId: string, maximumY: number): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const platform = level.platforms.find((item) => item.id === platformId);
  if (!platform?.motion) throw new Error(`unknown moving platform ${platformId}`);
  let current = world;
  for (let frame = 0; frame < 300 && current.status === "playing"; frame += 1) {
    const offset = getPlatformOffset(platform, current.levelTimeMs);
    if (offset.y <= maximumY) return current;
    current = tick(current);
  }
  throw new Error(`lift ${platformId} did not reach y offset ${maximumY}`);
}

describe("level 3 real-input route", () => {
  it("collects hidden samples, activates both checkpoints, and reaches the beacon", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("route-level-3"), 2);
    world = walk(world, 440, "l3-ground-a");
    world = jumpTo(world, "right", { fromPlatformId: "l3-ground-a", landPlatformId: "l3-upper-a", target: 730, runway: 12 });
    log("upper-a", world);
    for (const id of ["l3-crystal-01", "l3-crystal-02", "l3-crystal-03"]) {
      world = collectCrystal(world, id, "l3-upper-a");
    }
    world = walk(world, 812, "l3-upper-a");
    world = jumpTo(world, "right", { fromPlatformId: "l3-upper-a", landPlatformId: "l3-upper-b", target: 1020, runway: 7, holdFrames: 30 });
    log("upper-b", world);
    for (const id of ["l3-crystal-04", "l3-crystal-05", "l3-crystal-06"]) {
      world = collectCrystal(world, id, "l3-upper-b");
    }
    world = walkOff(world, "right", "l3-oneway-a");
    log("oneway-a", world);
    world = walkOff(world, "right", "l3-ground-c");
    world = walk(world, 1610, "l3-ground-c");
    log("checkpoint-1", world);
    world = walk(world, 1330, "l3-ground-c");
    world = jumpTo(world, "left", { fromPlatformId: "l3-ground-c", landPlatformId: "l3-oneway-a", target: 1270, runway: 8 });
    log("oneway-return", world);
    world = jumpTo(world, "left", { fromPlatformId: "l3-oneway-a", landPlatformId: "l3-upper-b", target: 1050, runway: 10, holdFrames: 30 });
    log("upper-b-return", world);
    world = jumpTo(world, "right", { fromPlatformId: "l3-upper-b", landPlatformId: "l3-upper-c", target: 1320, runway: 6 });
    log("upper-c", world);
    world = walk(world, 1370, "l3-upper-c");
    world = jumpTo(world, "right", { fromPlatformId: "l3-upper-c", landPlatformId: "l3-narrow-a", target: 1570, runway: 8 });
    log("narrow-a", world);
    world = walk(world, 1608, "l3-narrow-a");
    world = jumpTo(world, "right", { fromPlatformId: "l3-narrow-a", landPlatformId: "l3-upper-d", target: 1870, runway: 7, holdFrames: 30 });
    log("upper-d", world);
    world = walk(world, 1940, "l3-upper-d");
    world = jumpTo(world, "right", { fromPlatformId: "l3-upper-d", landPlatformId: "l3-upper-e", target: 2160, runway: 8, holdFrames: 30 });
    log("upper-e", world);
    for (const id of ["l3-crystal-07", "l3-crystal-08", "l3-crystal-09"]) {
      world = collectCrystal(world, id, "l3-upper-e");
    }
    world = walk(world, 2225, "l3-upper-e");
    world = waitForLiftOffsets(world, "l3-hidden-lift", 35);
    world = jumpTo(world, "right", { fromPlatformId: "l3-upper-e", landPlatformId: "l3-hidden-lift", target: 2420, runway: 6 });
    log("hidden-lift", world);
    world = waitForLiftBelow(world, "l3-hidden-lift", -35);
    log("hidden-lift-high", world);
    world = walk(world, 2460, "l3-hidden-lift");
    world = jumpTo(world, "right", { fromPlatformId: "l3-hidden-lift", landPlatformId: "l3-upper-f", target: 2800, runway: 4, holdFrames: 32 });
    log("hidden-f", world);
    world = walkOff(world, "right", "l3-hidden-a");
    log("hidden-a", world);
    world = walk(world, 2720, "l3-hidden-a");
    world = jumpTo(world, "right", { fromPlatformId: "l3-hidden-a", landPlatformId: "l3-hidden-b", target: 2890, runway: 8, holdFrames: 30 });
    log("hidden-b", world);
    world = collectCrystal(world, "l3-crystal-12", "l3-hidden-b");
    world = walk(world, 2792, "l3-hidden-b");
    world = collectCrystal(world, "l3-crystal-11", "l3-hidden-b");
    world = jumpTo(world, "left", { fromPlatformId: "l3-hidden-b", landPlatformId: "l3-hidden-a", target: 2700, runway: 5, holdFrames: 30 });
    if (!world.collectedItemIds.includes("l3-crystal-10")) {
      throw new Error(`crystal l3-crystal-10 missed: ${groundOf(world)}`);
    }
    world = walk(world, 2720, "l3-hidden-a");
    world = jumpTo(world, "right", { fromPlatformId: "l3-hidden-a", landPlatformId: "l3-hidden-b", target: 2900, runway: 5, holdFrames: 30 });
    world = walkOff(world, "right", "l3-ground-f");
    world = walk(world, 3165, "l3-ground-f");
    log("checkpoint-2", world);
    world = walk(world, 3340, "l3-ground-f");
    world = jumpTo(world, "right", { fromPlatformId: "l3-ground-f", landPlatformId: "l3-upper-g", target: 3480, runway: 8 });
    log("upper-g", world);
    for (const id of ["l3-crystal-13", "l3-crystal-14", "l3-crystal-15"]) {
      world = collectCrystal(world, id, "l3-upper-g");
    }
    world = walkOff(world, "right", "l3-ground-g");
    world = walk(world, 4040, "l3-ground-g");
    log("beacon", world);
    expect(world.status).toBe("level_complete");
    expect(world.collectedItemIds).toHaveLength(15);
    expect(world.activatedCheckpointIds).toEqual(["l3-checkpoint-01", "l3-checkpoint-02"]);
  });
});

describe("movement assists", () => {
  it("allows a coyote-time jump after leaving a ledge", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("coyote-test"), 0);
    world.player.x = 1146;
    world.player.previousX = world.player.x;
    world.player.y = 574;
    world.player.previousY = world.player.y;
    world.player.vx = 0;
    world.player.vy = 0;
    world.player.onGround = true;
    world.player.groundPlatformId = "l1-ground-a";
    world.player.coyoteMs = 100;

    let leftGround = false;
    for (let frame = 0; frame < 20; frame += 1) {
      world = tick(world, { right: true });
      if (!world.player.onGround) {
        leftGround = true;
        break;
      }
    }
    expect(leftGround).toBe(true);

    const result = stepPlatformer(world, {
      ...createPlatformerInput(),
      jumpPressed: true,
      jumpHeld: true,
    });
    expect(result.events.some((event) => event.type === "jump")).toBe(true);
    expect(result.world.player.vy).toBeLessThan(0);
  });

  it("queues a jump pressed immediately before landing", () => {
    const world = createPlatformerWorld(createInitialPlatformerContext("buffer-test"), 0);
    world.player.y = 573;
    world.player.previousY = world.player.y;
    world.player.vy = 300;
    world.player.onGround = false;
    world.player.groundPlatformId = null;
    world.player.coyoteMs = 0;

    const pressed = stepPlatformer(world, {
      ...createPlatformerInput(),
      jumpPressed: true,
      jumpHeld: true,
    });
    expect(pressed.events.some((event) => event.type === "jump")).toBe(false);
    expect(pressed.world.player.onGround).toBe(true);
    expect(pressed.world.player.jumpBufferMs).toBeGreaterThan(0);

    const buffered = stepPlatformer(pressed.world, createPlatformerInput());
    expect(buffered.events.some((event) => event.type === "jump")).toBe(true);
    expect(buffered.world.player.vy).toBeLessThan(0);
  });

  it("drops through a one-way platform when down is pressed", () => {
    const world = createPlatformerWorld(createInitialPlatformerContext("drop-test"), 0);
    world.player.x = 840;
    world.player.previousX = world.player.x;
    world.player.y = 530 - world.player.height;
    world.player.previousY = world.player.y;
    world.player.vx = 0;
    world.player.vy = 0;
    world.player.onGround = true;
    world.player.groundPlatformId = "l1-ice-shelf-a";

    const result = stepPlatformer(world, {
      ...createPlatformerInput(),
      downPressed: true,
    });
    expect(result.world.player.onGround).toBe(false);
    expect(result.world.player.groundPlatformId).toBeNull();
    expect(result.world.player.dropThroughPlatformId).toBe("l1-ice-shelf-a");
    expect(result.world.player.y).toBeGreaterThan(world.player.y);
  });
});

describe("level 3 sentinel interactions", () => {
  const level = getPlatformerLevel(2);

  it("lets the player stomp each sentinel exactly once", () => {
    for (const definition of level.sentinels) {
      let world = createPlatformerWorld(
        createInitialPlatformerContext(`stomp-${definition.id}`),
        2,
      );
      const runtime = world.sentinels.find(
        (sentinel) => sentinel.definition.id === definition.id,
      );
      if (!runtime) throw new Error(`missing runtime sentinel ${definition.id}`);

      world.player.x = runtime.x + 6;
      world.player.previousX = world.player.x;
      world.player.y = definition.y - world.player.height - 4;
      world.player.previousY = world.player.y;
      world.player.vx = 0;
      world.player.vy = 260;
      world.player.onGround = false;
      world.player.groundPlatformId = null;

      let stompEvents = 0;
      for (let frame = 0; frame < 12 && !world.defeatedSentinelIds.includes(definition.id); frame += 1) {
        const result = stepPlatformer(world, createPlatformerInput());
        stompEvents += result.events.filter(
          (event) =>
            event.type === "sentinel_stomped" && event.sentinelId === definition.id,
        ).length;
        world = result.world;
      }
      expect(stompEvents).toBe(1);
      expect(world.defeatedSentinelIds).toContain(definition.id);
      expect(world.lives).toBe(3);
      expect(world.score).toBe(PLATFORMER_SCORE_SENTINEL);

      const scoreAfterStomp = world.score;
      const replay = stepPlatformer(world, createPlatformerInput());
      expect(
        replay.events.some((event) => event.type === "sentinel_stomped"),
      ).toBe(false);
      expect(replay.world.score).toBe(scoreAfterStomp);
    }
  });

  it("damages the player on side contact with each sentinel", () => {
    for (const definition of level.sentinels) {
      const world = createPlatformerWorld(
        createInitialPlatformerContext(`side-hit-${definition.id}`),
        2,
      );
      const runtime = world.sentinels.find(
        (sentinel) => sentinel.definition.id === definition.id,
      );
      if (!runtime) throw new Error(`missing runtime sentinel ${definition.id}`);

      world.player.x = runtime.x - 18;
      world.player.previousX = world.player.x;
      world.player.y = definition.y;
      world.player.previousY = world.player.y;
      world.player.vx = 0;
      world.player.vy = 0;
      world.player.onGround = false;
      world.player.groundPlatformId = null;
      world.player.invincibleMs = 0;

      const result = stepPlatformer(world, {
        ...createPlatformerInput(),
        right: true,
      });
      expect(result.events).toContainEqual(
        expect.objectContaining({
          type: "damage",
          reason: "sentinel",
          lives: 2,
        }),
      );
      expect(result.world.lives).toBe(2);
      expect(result.world.defeatedSentinelIds).not.toContain(definition.id);
      expect(result.world.player.invincibleMs).toBeGreaterThan(0);
    }
  });
});

describe("enemy kind runtime motion", () => {
  const patrolBoundsOk = (x: number, definition: { patrolMinX: number; patrolMaxX: number; width: number }): boolean =>
    x >= definition.patrolMinX - 0.001 && x <= definition.patrolMaxX - definition.width + 0.001;

  it("keeps crawlers patrolling along the ground", () => {
    const level = getPlatformerLevel(0);
    let world = createPlatformerWorld(createInitialPlatformerContext("crawler-motion"), 0);
    const crawler = world.sentinels.find((s) => s.definition.kind === "crawler");
    if (!crawler) throw new Error("missing crawler in level 1");
    const definition = level.sentinels.find((d) => d.id === crawler.definition.id);
    if (!definition) throw new Error("missing crawler definition");

    for (let frame = 0; frame < 600; frame += 1) {
      world = tick(world);
      const current = world.sentinels.find((s) => s.definition.id === crawler.definition.id);
      if (!current) throw new Error("crawler runtime missing");
      expect(current.y).toBe(0);
      expect(patrolBoundsOk(current.x, definition)).toBe(true);
    }
  });

  it("makes drifters bob vertically while drifting horizontally", () => {
    const level = getPlatformerLevel(1);
    let world = createPlatformerWorld(createInitialPlatformerContext("drifter-motion"), 1);
    const drifter = world.sentinels.find((s) => s.definition.kind === "drifter");
    if (!drifter) throw new Error("missing drifter in level 2");
    const definition = level.sentinels.find((d) => d.id === drifter.definition.id);
    if (!definition) throw new Error("missing drifter definition");
    const amplitude = definition.bobAmplitude ?? 5;
    let sawUp = false;
    let sawDown = false;

    for (let frame = 0; frame < 900; frame += 1) {
      world = tick(world);
      const current = world.sentinels.find((s) => s.definition.id === drifter.definition.id);
      if (!current) throw new Error("drifter runtime missing");
      expect(current.y).toBeGreaterThanOrEqual(-amplitude - 0.001);
      expect(current.y).toBeLessThanOrEqual(amplitude + 0.001);
      expect(patrolBoundsOk(current.x, definition)).toBe(true);
      if (current.y < -amplitude * 0.8) sawUp = true;
      if (current.y > amplitude * 0.8) sawDown = true;
    }
    expect(sawUp).toBe(true);
    expect(sawDown).toBe(true);
  });

  it("makes hoppers leap in a parabolic arc while patrolling", () => {
    const level = getPlatformerLevel(2);
    let world = createPlatformerWorld(createInitialPlatformerContext("hopper-motion"), 2);
    const hopper = world.sentinels.find((s) => s.definition.kind === "hopper");
    if (!hopper) throw new Error("missing hopper in level 3");
    const definition = level.sentinels.find((d) => d.id === hopper.definition.id);
    if (!definition) throw new Error("missing hopper definition");
    const hopHeight = definition.hopHeight ?? 44;
    let atApex = false;
    let backOnGround = false;
    let sawAirborne = false;

    for (let frame = 0; frame < 1400; frame += 1) {
      world = tick(world);
      const current = world.sentinels.find((s) => s.definition.id === hopper.definition.id);
      if (!current) throw new Error("hopper runtime missing");
      expect(current.y).toBeGreaterThanOrEqual(-hopHeight - 0.001);
      expect(current.y).toBeLessThanOrEqual(0.001);
      expect(patrolBoundsOk(current.x, definition)).toBe(true);
      if (current.y < -hopHeight * 0.95) atApex = true;
      if (current.y < -2) sawAirborne = true;
      if (sawAirborne && current.y >= -1) backOnGround = true;
    }
    expect(atApex).toBe(true);
    expect(backOnGround).toBe(true);
  });
});

describe("checkpoint persistence", () => {
  it("round-trips progress, score, position, and moving-platform time", () => {
    let world = createPlatformerWorld(
      createInitialPlatformerContext("checkpoint-save-test"),
      0,
      "l1-checkpoint-01",
    );
    world = tick(world);
    expect(world.activatedCheckpointIds).toEqual(["l1-checkpoint-01"]);
    expect(getActiveCheckpointId(world)).toBe("l1-checkpoint-01");
    const scoreAtCheckpoint = world.score;

    const save = createPlatformerSave(world);
    const parsed = parsePlatformerSaveDetails(save);
    const restored = restorePlatformerWorld(save);

    expect(parsed.levelIndex).toBe(0);
    expect(parsed.lastCheckpointId).toBe("l1-checkpoint-01");
    expect(restored.levelId).toBe(1);
    expect(restored.status).toBe("playing");
    expect(restored.player.x).toBe(world.player.x);
    expect(restored.player.y).toBe(world.player.y);
    expect(restored.score).toBe(scoreAtCheckpoint);
    expect(restored.activatedCheckpointIds).toEqual(["l1-checkpoint-01"]);
    expect(restored.levelTimeMs).toBe(Math.round(world.levelTimeMs));
    expect(getActiveCheckpointId(restored)).toBe("l1-checkpoint-01");

    world = tick(world);
    expect(world.score).toBe(scoreAtCheckpoint);
    expect(world.activatedCheckpointIds).toHaveLength(1);
  });

  it("rejects a save whose score does not match its collection state", () => {
    let world = createPlatformerWorld(
      createInitialPlatformerContext("checkpoint-tamper-test"),
      0,
      "l1-checkpoint-01",
    );
    world = tick(world);
    const save = createPlatformerSave(world);
    const details = save.details as Record<string, unknown>;
    const tampered = {
      ...save,
      details: {
        ...details,
        collectedItemIds: ["l1-crystal-01"],
      },
    };

    expect(() => parsePlatformerSaveDetails(tampered)).toThrow(
      "存档关卡得分与收集进度不一致",
    );
  });
});

describe("platformer run settlement", () => {
  it("awards the full victory once and exposes idempotent match results", () => {
    const level1 = getPlatformerLevel(0);
    const level2 = getPlatformerLevel(1);
    const level3 = getPlatformerLevel(2);
    const completedLevels = [level1, level2];
    const earlierIds = {
      crystals: completedLevels.flatMap((level) => level.crystals.map((item) => item.id)),
      sentinels: completedLevels.flatMap((level) => level.sentinels.map((item) => item.id)),
      checkpoints: completedLevels.flatMap((level) =>
        level.checkpoints.map((item) => item.id),
      ),
    };
    const currentIds = {
      crystals: level3.crystals.map((item) => item.id),
      sentinels: level3.sentinels.map((item) => item.id),
      checkpoints: level3.checkpoints.map((item) => item.id),
    };
    const earlierScore =
      levelAt(0).crystals.length * PLATFORMER_SCORE_CRYSTAL +
      levelAt(0).sentinels.length * PLATFORMER_SCORE_SENTINEL +
      levelAt(0).checkpoints.length * PLATFORMER_SCORE_CHECKPOINT +
      PLATFORMER_SCORE_BEACON +
      PLATFORMER_SCORE_FULL_COLLECTION +
      PLATFORMER_SCORE_ZERO_DEATH +
      levelAt(1).crystals.length * PLATFORMER_SCORE_CRYSTAL +
      levelAt(1).sentinels.length * PLATFORMER_SCORE_SENTINEL +
      levelAt(1).checkpoints.length * PLATFORMER_SCORE_CHECKPOINT +
      PLATFORMER_SCORE_BEACON +
      PLATFORMER_SCORE_FULL_COLLECTION +
      PLATFORMER_SCORE_ZERO_DEATH;
    const currentPreBeaconScore =
      level3.crystals.length * PLATFORMER_SCORE_CRYSTAL +
      level3.sentinels.length * PLATFORMER_SCORE_SENTINEL +
      level3.checkpoints.length * PLATFORMER_SCORE_CHECKPOINT;
    const context: PlatformerLevelContext = {
      score: earlierScore + currentPreBeaconScore,
      lives: 3,
      sessionId: "settlement-campaign",
      assisted: false,
      collectedItemIds: [...earlierIds.crystals, ...currentIds.crystals],
      defeatedSentinelIds: [...earlierIds.sentinels, ...currentIds.sentinels],
      activatedCheckpointIds: [...earlierIds.checkpoints, ...currentIds.checkpoints],
      lastCheckpointIdByLevel: {
        "1": "l1-checkpoint-01",
        "2": "l2-checkpoint-01",
        "3": "l3-checkpoint-02",
      },
      deathsByLevel: { "1": 0, "2": 0, "3": 0 },
      completedLevelIds: [1, 2],
      reachedBeaconLevelIds: [1, 2],
      levelDurations: { "1": 9000, "2": 10000 },
      levelScores: {
        "1": levelAt(0).crystals.length * PLATFORMER_SCORE_CRYSTAL +
          levelAt(0).sentinels.length * PLATFORMER_SCORE_SENTINEL +
          levelAt(0).checkpoints.length * PLATFORMER_SCORE_CHECKPOINT +
          PLATFORMER_SCORE_BEACON +
          PLATFORMER_SCORE_FULL_COLLECTION +
          PLATFORMER_SCORE_ZERO_DEATH,
        "2": levelAt(1).crystals.length * PLATFORMER_SCORE_CRYSTAL +
          levelAt(1).sentinels.length * PLATFORMER_SCORE_SENTINEL +
          levelAt(1).checkpoints.length * PLATFORMER_SCORE_CHECKPOINT +
          PLATFORMER_SCORE_BEACON +
          PLATFORMER_SCORE_FULL_COLLECTION +
          PLATFORMER_SCORE_ZERO_DEATH,
        "3": currentPreBeaconScore,
      },
      totalDurationMs: 20000,
    };

    const world = createPlatformerWorld(context, 2, "l3-checkpoint-02", {
      levelDurationMs: 1000,
      levelTimeMs: 1000,
    });
    world.player.x = level3.beacon.x + 10;
    world.player.previousX = world.player.x;
    world.player.y = level3.beacon.y + 20;
    world.player.previousY = world.player.y;
    world.player.vx = 0;
    world.player.vy = 0;
    world.player.onGround = false;
    world.player.groundPlatformId = null;

    const first = stepPlatformer(world, createPlatformerInput());
    const expectedFinalScore = earlierScore + currentPreBeaconScore +
      PLATFORMER_SCORE_BEACON +
      PLATFORMER_SCORE_FULL_COLLECTION +
      PLATFORMER_SCORE_ZERO_DEATH +
      PLATFORMER_SCORE_VICTORY;
    expect(first.events.some((event) => event.type === "level_complete")).toBe(true);
    expect(first.events.some((event) => event.type === "victory")).toBe(true);
    expect(first.world.status).toBe("victory");
    expect(first.world.score).toBe(expectedFinalScore);
    expect(first.world.levelScores["3"]).toBe(
      currentPreBeaconScore +
      PLATFORMER_SCORE_BEACON +
      PLATFORMER_SCORE_FULL_COLLECTION +
      PLATFORMER_SCORE_ZERO_DEATH +
      PLATFORMER_SCORE_VICTORY,
    );

    const second = stepPlatformer(first.world, createPlatformerInput());
    expect(second.events).toEqual([]);
    expect(second.world.score).toBe(expectedFinalScore);
    expect(createLevelContext(second.world).score).toBe(expectedFinalScore);

    const replay = stepPlatformer(
      { ...first.world, status: "playing" },
      createPlatformerInput(),
    );
    expect(replay.events.some((event) => event.type === "victory")).toBe(false);
    expect(replay.world.score).toBe(expectedFinalScore);

    const submission = createPlatformerMatchSubmission(first.world);
    expect(submission).toMatchObject({
      outcome: "victory",
      score: expectedFinalScore,
      levelsCompleted: 3,
      crystalsCollected: 36,
      sentinelsDefeated: 6,
      deaths: 0,
    });
    expect(submission.levelResults.map((result) => result.completed)).toEqual([
      true,
      true,
      true,
    ]);
    expect(submission.levelResults.map((result) => result.crystalsCollected)).toEqual([
      9,
      12,
      15,
    ]);
  });
});
describe("crystal pickup tolerance", () => {
  it("collects when the player body touches the crystal pickup box", () => {
    const level = levelAt(0);
    const crystal = level.crystals[0];
    if (!crystal) throw new Error("missing crystal for pickup tolerance test");
    const world = createPlatformerWorld(createInitialPlatformerContext("pickup-tolerance"), 0);
    // 玩家中心距水晶 26px（超过旧的中心距离 20px 阈值），但身体左缘仍进入水晶判定盒（半宽 18px）。
    world.player.x = crystal.x + 10;
    world.player.y = crystal.y - world.player.height * 0.5;
    world.player.previousX = world.player.x;
    world.player.previousY = world.player.y;
    world.player.vx = 0;
    world.player.vy = 0;

    const result = stepPlatformer(world, createPlatformerInput());
    expect(result.world.collectedItemIds).toContain(crystal.id);
    expect(result.events.some((event) => event.type === "crystal")).toBe(true);
  });

  it("does not collect when clearly far away", () => {
    const level = levelAt(0);
    const crystal = level.crystals[0];
    if (!crystal) throw new Error("missing crystal for pickup tolerance test");
    const world = createPlatformerWorld(createInitialPlatformerContext("pickup-tolerance"), 0);
    world.player.x = crystal.x - 100;
    world.player.y = crystal.y - world.player.height * 0.5;
    world.player.previousX = world.player.x;
    world.player.previousY = world.player.y;
    world.player.vx = 0;
    world.player.vy = 0;

    const result = stepPlatformer(world, createPlatformerInput());
    expect(result.world.collectedItemIds).not.toContain(crystal.id);
  });
});
