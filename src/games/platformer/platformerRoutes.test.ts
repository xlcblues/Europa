import {
  createInitialPlatformerContext,
  createPlatformerInput,
  createPlatformerWorld,
  getPlatformOffset,
  stepPlatformer,
} from "./platformerEngine";
import { getPlatformerLevel } from "./platformerLevels";
import { PLATFORMER_DECELERATION } from "./platformerTypes";
import type { PlatformerInput, PlatformerWorld } from "./platformerTypes";

type Controls = Partial<Pick<PlatformerInput, "left" | "right" | "jumpPressed" | "jumpHeld" | "downPressed">>;

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