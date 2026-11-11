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

function walkAcross(world: PlatformerWorld, target: number, allowedGrounds: string[], maxFrames = 900): PlatformerWorld {
  let current = world;
  for (let frame = 0; frame < maxFrames && current.status === "playing"; frame += 1) {
    if (!current.player.onGround) {
      throw new Error(`left ground mid-walk: ${groundOf(current)}`);
    }
    const g = current.player.groundPlatformId ?? "air";
    if (!allowedGrounds.includes(g)) {
      throw new Error(`unexpected ground: ${groundOf(current)}`);
    }
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
    if (Math.abs(target - centerX(current)) <= 1.25 && Math.abs(current.player.vx) <= 2) {
      return idle(current);
    }
  }
  if (current.status !== "playing") throw new Error(`walkAcross ended ${current.status}`);
  return idle(current);
}

function jumpRightFromEdge(world: PlatformerWorld, runway = 0, maxFrames = 240): PlatformerWorld {
  let current = world;
  let leftGround = false;
  for (let frame = 0; frame < maxFrames && current.status === "playing"; frame += 1) {
    current = tick(current, {
      right: true,
      jumpPressed: frame === runway,
      jumpHeld: frame >= runway && frame < runway + 30,
    });
    if (!current.player.onGround) {
      leftGround = true;
    }
    if (leftGround && frame > runway + 3 && current.player.onGround) {
      break;
    }
  }
  if (current.status !== "playing") throw new Error(`jump ended ${current.status}`);
  if (!current.player.onGround) throw new Error(`jump did not land: ${groundOf(current)}`);
  return idle(current);
}

function waitForLiftX(world: PlatformerWorld, platformId: string, minOffsetX: number, maxFrames = 700): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const platform = level.platforms.find((item) => item.id === platformId);
  if (!platform?.motion) throw new Error(`unknown moving platform ${platformId}`);
  let current = world;
  for (let frame = 0; frame < maxFrames && current.status === "playing"; frame += 1) {
    const offset = getPlatformOffset(platform, current.levelTimeMs);
    if (offset.x >= minOffsetX) return current;
    current = tick(current);
  }
  throw new Error(`lift ${platformId} did not reach x offset ${minOffsetX}`);
}

function stepOffRight(world: PlatformerWorld, expectedGround: string): PlatformerWorld {
  let current = world;
  let leftGround = false;
  for (let frame = 0; frame < 240 && current.status === "playing"; frame += 1) {
    current = tick(current, { right: true });
    if (!current.player.onGround) {
      leftGround = true;
    }
    if (leftGround && frame > 3 && current.player.onGround) {
      break;
    }
  }
  if (current.status !== "playing") throw new Error(`stepOff ended ${current.status}`);
  if (current.player.groundPlatformId !== expectedGround) {
    throw new Error(`stepOff expected ${expectedGround}, found ${groundOf(current)}`);
  }
  return idle(current);
}

function crossGapEF(world: PlatformerWorld): PlatformerWorld {
  let current = waitForLiftX(world, "l4-lift-b", 39);
  current = jumpRightFromEdge(current, 10);
  if (current.player.groundPlatformId === "l4-ground-f") return current;
  if (current.player.groundPlatformId === "l4-lift-b") {
    current = stepOffRight(current, "l4-ground-f");
    return current;
  }
  throw new Error(`cross e->f failed on ${groundOf(current)}`);
}

function stompSentinelL4(world: PlatformerWorld, id: string): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const definition = level.sentinels.find((item) => item.id === id);
  if (!definition) throw new Error(`unknown sentinel ${id}`);
  let current = world;
  let runtime = current.sentinels.find((item) => item.definition.id === id);
  if (!runtime) throw new Error(`missing runtime sentinel ${id}`);
  // Wait until the sentinel is past the l4-upper-e overhang so the drop is unobstructed.
  for (let frame = 0; frame < 900 && current.status === "playing"; frame += 1) {
    runtime = current.sentinels.find((item) => item.definition.id === id);
    if (!runtime) throw new Error(`missing runtime sentinel ${id}`);
    if (runtime.x >= 4180) break;
    current = tick(current);
  }
  runtime = current.sentinels.find((item) => item.definition.id === id);
  if (!runtime || runtime.x < 4180) throw new Error(`sentinel ${id} never reached clear zone`);
  current.player.x = runtime.x + 6;
  current.player.previousX = current.player.x;
  current.player.y = definition.y - current.player.height - 4;
  current.player.previousY = current.player.y;
  current.player.vx = 0;
  current.player.vy = 260;
  current.player.onGround = false;
  current.player.groundPlatformId = null;
  current.player.invincibleMs = 0;
  for (let frame = 0; frame < 12 && !current.defeatedSentinelIds.includes(id); frame += 1) {
    const result = stepPlatformer(current, createPlatformerInput());
    current = result.world;
  }
  if (!current.defeatedSentinelIds.includes(id)) throw new Error(`sentinel ${id} not stomped`);
  for (let frame = 0; frame < 80 && current.status === "playing" && !current.player.onGround; frame += 1) {
    current = tick(current);
  }
  if (!current.player.onGround) throw new Error(`sentinel ${id} player not settled: ${groundOf(current)}`);
  return idle(current);
}

describe("level 4 real-input route", () => {
  it("walks across the former dead-end junction and reaches the beacon", () => {
    let world = createPlatformerWorld(
      createInitialPlatformerContext("route-level-4"),
      3,
      "l4-checkpoint-01",
      { levelTimeMs: 0, levelDurationMs: 0 },
    );
    const livesBefore = world.lives;
    world = idle(world, 40);
    expect(world.player.groundPlatformId).toBe("l4-ground-d");
    world = walk(world, 2362, "l4-ground-d");
    // Regression: the former 140px gap between l4-ground-d and l4-ground-e is
    // now continuous ground, so the old "platform too high" dead end is gone.
    world = walkAcross(world, 2545, ["l4-ground-d", "l4-ground-e"]);
    expect(world.player.groundPlatformId).toBe("l4-ground-e");
    expect(world.lives).toBe(livesBefore);
    world = walk(world, 3002, "l4-ground-e");
    world = crossGapEF(world);
    expect(world.player.groundPlatformId).toBe("l4-ground-f");
    world = walk(world, 3655, "l4-ground-f");
    world = jumpRightFromEdge(world, 10);
    expect(world.player.groundPlatformId).toBe("l4-ground-g");
    world = stompSentinelL4(world, "l4-sentinel-01");
    expect(world.defeatedSentinelIds).toContain("l4-sentinel-01");
    world = walk(world, 4400, "l4-ground-g");
    for (let frame = 0; frame < 120 && world.status === "playing"; frame += 1) {
      world = tick(world, { right: true });
    }
    expect(world.status).toBe("level_complete");
    expect(world.activatedCheckpointIds).toEqual(["l4-checkpoint-01", "l4-checkpoint-02"]);
  });
});

describe("level 4 final sentinel real-input route", () => {
  it("climbs over the patrolling sentinel on the lowered platforms and reaches the beacon", () => {
    let world = createPlatformerWorld(
      createInitialPlatformerContext("route-level-4-final"),
      3,
      "l4-checkpoint-02",
      { levelTimeMs: 0, levelDurationMs: 0 },
    );
    world = idle(world, 40);
    expect(world.player.groundPlatformId).toBe("l4-ground-g");
    expect(world.activatedCheckpointIds).toEqual(["l4-checkpoint-02"]);
    // The sentinel patrols l4-ground-g (x3950-4250). The lowered one-way ledges
    // l4-upper-e / l4-upper-f carry the player over it without contact.
    world = jumpTo(world, "right", {
      fromPlatformId: "l4-ground-g",
      landPlatformId: "l4-upper-e",
      target: 4010,
    });
    world = walk(world, 4135, "l4-upper-e");
    world = jumpTo(world, "right", {
      fromPlatformId: "l4-upper-e",
      landPlatformId: "l4-upper-f",
      target: 4310,
    });
    world = walk(world, 4410, "l4-upper-f");
    world = walkOff(world, "right", "l4-ground-g");
    expect(world.lives).toBe(3);
    world = walk(world, 4500, "l4-ground-g");
    for (let frame = 0; frame < 120 && world.status === "playing"; frame += 1) {
      world = tick(world, { right: true });
    }
    expect(world.status).toBe("level_complete");
    expect(world.activatedCheckpointIds).toEqual(["l4-checkpoint-02"]);
  });
});

describe("level 5 lift-c pit regression real-input route", () => {
  it("climbs the lift to the overhang ledge and reaches the beacon without falling", () => {
    let world = createPlatformerWorld(
      createInitialPlatformerContext("route-level-5"),
      4,
      "l5-checkpoint-01",
      { levelTimeMs: 0, levelDurationMs: 0 },
    );
    const livesBefore = world.lives;
    world = idle(world, 40);
    expect(world.player.groundPlatformId).toBe("l5-ground-e");
    // Cross the one-way bridge into the filled-in pit region.
    world = walk(world, 2880, "l5-ground-e");
    world = jumpTo(world, "right", {
      fromPlatformId: "l5-ground-e",
      landPlatformId: "l5-oneway-a",
      target: 2975,
    });
    world = walk(world, 3030, "l5-oneway-a");
    world = walkOff(world, "right", "l5-ground-f");
    // Regression: the pit below l5-lift-c is now continuous ground, so the
    // player can walk all the way to l5-ground-g without falling in.
    world = walkAcross(world, 3520, ["l5-ground-f", "l5-ground-g"]);
    expect(world.lives).toBe(livesBefore);
    // Wait for the moving lift near its right end and jump onto it from the side.
    world = waitForLiftX(world, "l5-lift-c", 50);
    world = jumpTo(world, "right", {
      fromPlatformId: "l5-ground-f",
      landPlatformId: "l5-lift-c",
      target: 3600,
      runway: 6,
      holdFrames: 28,
    });
    // Step from the lift onto the overhang ledge (85px up).
    world = jumpTo(world, "right", {
      fromPlatformId: "l5-lift-c",
      landPlatformId: "l5-upper-d",
      target: 3700,
      runway: 6,
      holdFrames: 30,
    });
    world = collectCrystal(world, "l5-crystal-13", "l5-upper-d");
    world = collectCrystal(world, "l5-crystal-14", "l5-upper-d");
    world = collectCrystal(world, "l5-crystal-15", "l5-upper-d");
    expect(world.lives).toBe(livesBefore);
    // Drop back to the ground and cross the gap to the final ground.
    world = walkOff(world, "right", "l5-ground-g");
    world = walk(world, 4020, "l5-ground-g");
    world = jumpRightFromEdge(world, 10);
    expect(world.player.groundPlatformId).toBe("l5-ground-h");
    // Climb the upper ledges over the patrolling sentinel.
    world = jumpTo(world, "right", {
      fromPlatformId: "l5-ground-h",
      landPlatformId: "l5-upper-e",
      target: 4340,
      runway: 8,
      holdFrames: 30,
    });
    world = walk(world, 4490, "l5-upper-e");
    world = jumpTo(world, "right", {
      fromPlatformId: "l5-upper-e",
      landPlatformId: "l5-upper-f",
      target: 4640,
      runway: 8,
      holdFrames: 30,
    });
    world = walk(world, 4740, "l5-upper-f");
    world = jumpTo(world, "right", {
      fromPlatformId: "l5-upper-f",
      landPlatformId: "l5-upper-g",
      target: 4900,
      runway: 8,
      holdFrames: 30,
    });
    world = walk(world, 4990, "l5-upper-g");
    for (let frame = 0; frame < 180 && world.status === "playing"; frame += 1) {
      world = tick(world, { right: true });
    }
    expect(world.status).toBe("level_complete");
    expect(world.lives).toBe(livesBefore);
  });
});
describe("level 6 lift-c pit regression real-input route", () => {
  it("boards the lowered lift from the side and reaches the overhang ledge without falling", () => {
    let world = createPlatformerWorld(
      createInitialPlatformerContext("route-level-6"),
      5,
      "l6-checkpoint-02",
      { levelTimeMs: 0, levelDurationMs: 0 },
    );
    const livesBefore = world.lives;
    world = idle(world, 40);
    expect(world.player.groundPlatformId).toBe("l6-ground-g");
    expect(world.activatedCheckpointIds).toEqual(["l6-checkpoint-02"]);
    // Walk left across the now-filled pit onto l6-ground-f, clear of the
    // lift's left edge, so the jump arc can land on the lift top from the side.
    world = walkAcross(world, 3440, ["l6-ground-g", "l6-ground-f"]);
    expect(world.player.groundPlatformId).toBe("l6-ground-f");
    expect(world.lives).toBe(livesBefore);
    // Wait for the moving lift near its right end and jump onto it (65px up).
    world = waitForLiftX(world, "l6-lift-c", 50);
    world = jumpTo(world, "right", {
      fromPlatformId: "l6-ground-f",
      landPlatformId: "l6-lift-c",
      target: 3600,
      runway: 6,
      holdFrames: 28,
    });
    // Step from the lift onto the overhang ledge (70px up).
    world = jumpTo(world, "right", {
      fromPlatformId: "l6-lift-c",
      landPlatformId: "l6-upper-e",
      target: 3660,
      runway: 6,
      holdFrames: 30,
    });
    world = collectCrystal(world, "l6-crystal-13", "l6-upper-e");
    world = collectCrystal(world, "l6-crystal-14", "l6-upper-e");
    world = collectCrystal(world, "l6-crystal-15", "l6-upper-e");
    expect(world.lives).toBe(livesBefore);
    // Drop back down the left side: land either back on the moving lift or on
    // l6-ground-g, both clear of the sentinel patrolling x3660-3860.
    world = walk(world, 3580, "l6-upper-e");
    let descended = false;
    for (let frame = 0; frame < 240 && world.status === "playing"; frame += 1) {
      world = tick(world, { left: true });
      if (!world.player.onGround) {
        descended = true;
      }
      if (descended && frame > 3 && world.player.onGround) {
        break;
      }
    }
    world = idle(world);
    expect(["l6-lift-c", "l6-ground-g"]).toContain(world.player.groundPlatformId);
    expect(world.activatedCheckpointIds).toEqual(["l6-checkpoint-02"]);
    expect(world.lives).toBe(livesBefore);
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
    const lastLevel = getPlatformerLevel(PLATFORMER_LEVELS.length - 1);
    const completedLevels = PLATFORMER_LEVELS.slice(0, -1);
    const earlierIds = {
      crystals: completedLevels.flatMap((level) => level.crystals.map((item) => item.id)),
      sentinels: completedLevels.flatMap((level) => level.sentinels.map((item) => item.id)),
      checkpoints: completedLevels.flatMap((level) => level.checkpoints.map((item) => item.id)),
    };
    const currentIds = {
      crystals: lastLevel.crystals.map((item) => item.id),
      sentinels: lastLevel.sentinels.map((item) => item.id),
      checkpoints: lastLevel.checkpoints.map((item) => item.id),
    };
    const fullClearLevelScore = (level: PlatformerLevel): number =>
      level.crystals.length * PLATFORMER_SCORE_CRYSTAL +
      level.sentinels.length * PLATFORMER_SCORE_SENTINEL +
      level.checkpoints.length * PLATFORMER_SCORE_CHECKPOINT +
      PLATFORMER_SCORE_BEACON +
      PLATFORMER_SCORE_FULL_COLLECTION +
      PLATFORMER_SCORE_ZERO_DEATH;
    const earlierScore = completedLevels.reduce(
      (sum, level) => sum + fullClearLevelScore(level),
      0,
    );
    const currentPreBeaconScore =
      lastLevel.crystals.length * PLATFORMER_SCORE_CRYSTAL +
      lastLevel.sentinels.length * PLATFORMER_SCORE_SENTINEL +
      lastLevel.checkpoints.length * PLATFORMER_SCORE_CHECKPOINT;
    const context: PlatformerLevelContext = {
      score: earlierScore + currentPreBeaconScore,
      lives: 3,
      sessionId: "settlement-campaign",
      assisted: false,
      collectedItemIds: [...earlierIds.crystals, ...currentIds.crystals],
      defeatedSentinelIds: [...earlierIds.sentinels, ...currentIds.sentinels],
      activatedCheckpointIds: [...earlierIds.checkpoints, ...currentIds.checkpoints],
      lastCheckpointIdByLevel: Object.fromEntries(
        PLATFORMER_LEVELS.map((level) => [
          String(level.id),
          level.checkpoints.at(-1)?.id ?? `level-${level.id}-start`,
        ]),
      ),
      deathsByLevel: Object.fromEntries(
        PLATFORMER_LEVELS.map((level) => [String(level.id), 0]),
      ),
      completedLevelIds: completedLevels.map((level) => level.id),
      reachedBeaconLevelIds: completedLevels.map((level) => level.id),
      levelDurations: Object.fromEntries(
        completedLevels.map((level) => [String(level.id), 9000]),
      ),
      levelScores: Object.fromEntries([
        ...completedLevels.map((level) => [String(level.id), fullClearLevelScore(level)]),
        [String(lastLevel.id), currentPreBeaconScore],
      ]),
      totalDurationMs: 9000 * completedLevels.length,
    };

    const world = createPlatformerWorld(
      context,
      PLATFORMER_LEVELS.length - 1,
      lastLevel.checkpoints.at(-1)?.id ?? `level-${lastLevel.id}-start`,
      {
        levelDurationMs: 1000,
        levelTimeMs: 1000,
      },
    );
    world.player.x = lastLevel.beacon.x + 10;
    world.player.previousX = world.player.x;
    world.player.y = lastLevel.beacon.y + 20;
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
    expect(first.world.levelScores[String(lastLevel.id)]).toBe(
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
      levelsCompleted: PLATFORMER_LEVELS.length,
      crystalsCollected: PLATFORMER_LEVELS.reduce((sum, level) => sum + level.crystals.length, 0),
      sentinelsDefeated: PLATFORMER_LEVELS.reduce((sum, level) => sum + level.sentinels.length, 0),
      deaths: 0,
    });
    expect(submission.levelResults.map((result) => result.completed)).toEqual(
      PLATFORMER_LEVELS.map(() => true),
    );
    expect(submission.levelResults.map((result) => result.crystalsCollected)).toEqual(
      PLATFORMER_LEVELS.map((level) => level.crystals.length),
    );
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
