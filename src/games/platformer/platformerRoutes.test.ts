import { describe, it, expect } from "vitest";
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
type Controls = Partial<Pick<PlatformerInput, "left" | "right" | "jumpPressed" | "jumpHeld" | "downPressed" | "firePressed">>;
function tick(world: PlatformerWorld, controls: Controls = {}): PlatformerWorld {
  return stepPlatformer(world, { ...createPlatformerInput(), ...controls }).world;
}
function centerX(world: PlatformerWorld): number { return world.player.x + world.player.width * 0.5; }
function centerY(world: PlatformerWorld): number { return world.player.y + world.player.height * 0.5; }
function groundOf(world: PlatformerWorld): string {
  return `${world.player.groundPlatformId ?? "air"} @ (${centerX(world).toFixed(1)}, ${centerY(world).toFixed(1)})`;
}
function idle(world: PlatformerWorld, frames = 8): PlatformerWorld {
  let current = world;
  for (let index = 0; index < frames && current.status === "playing"; index += 1) current = tick(current);
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
      ? {} : brake ? {} : delta < 0 ? { left: true } : { right: true };
    current = tick(current, controls);
    if (current.player.groundPlatformId !== expectedGround) {
      throw new Error(`walk left ${expectedGround}; target=${target.toFixed(1)}, ${groundOf(current)}`);
    }
    if (Math.abs(target - centerX(current)) <= 1.25 && Math.abs(current.player.vx) <= 2) return idle(current);
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
interface JumpOptions { fromPlatformId: string; landPlatformId: string; target: number; runway?: number; holdFrames?: number; maxFrames?: number; }
function jumpTo(world: PlatformerWorld, direction: "left" | "right", options: JumpOptions): PlatformerWorld {
  let current = world;
  if (current.status !== "playing") throw new Error(`jumpTo not playing: ${groundOf(current)}`);
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
      ? direction === "right" ? { right: true } : { left: true } : {};
    current = tick(current, {
      ...horizontal,
      jumpPressed: frame === runway,
      jumpHeld: frame >= runway && frame < runway + holdFrames,
    });
    if (!current.player.onGround) leftGround = true;
    if (leftGround && frame > runway + 3 && current.player.onGround) { landed = current.player.groundPlatformId; break; }
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
    if (!current.player.onGround) leftGround = true;
    if (leftGround && frame > 3 && current.player.onGround) break;
  }
  if (current.status !== "playing") return current;
  if (current.player.groundPlatformId !== expectedGround) {
    throw new Error(`walkOff expected ${expectedGround}, found ${groundOf(current)}`);
  }
  return idle(current);
}
function jumpVertical(world: PlatformerWorld, expectedGround?: string | null): PlatformerWorld {
  let current = tick(world, { jumpPressed: true, jumpHeld: true });
  let leftGround = false;
  for (let frame = 1; frame < 140 && current.status === "playing"; frame += 1) {
    if (!current.player.onGround) leftGround = true;
    current = tick(current, { jumpHeld: frame < 30 });
    if (leftGround && frame > 3 && current.player.onGround) break;
  }
  if (current.status !== "playing") return current;
  if (expectedGround && current.player.groundPlatformId !== expectedGround) {
    throw new Error(`jumpVertical expected ${expectedGround}, found ${groundOf(current)}`);
  }
  return idle(current);
}
function dropThrough(world: PlatformerWorld, expectedGround: string): PlatformerWorld {
  let current = world;
  for (let frame = 0; frame < 160 && current.status === "playing"; frame += 1) {
    if (current.player.onGround && current.player.groundPlatformId === expectedGround) break;
    current = tick(current, { downPressed: true });
  }
  if (current.status !== "playing") return current;
  if (current.player.groundPlatformId !== expectedGround) {
    throw new Error(`dropThrough expected ${expectedGround}, found ${groundOf(current)}`);
  }
  return idle(current);
}
function collectCrystal(world: PlatformerWorld, id: string, expectedGround: string): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const crystal = level.crystals.find((item) => item.id === id);
  if (!crystal) throw new Error(`unknown crystal ${id}`);
  let current = walk(world, crystal.x, expectedGround);
  if (!current.collectedItemIds.includes(id)) {
    current = jumpVertical(current);
    if (current.status === "playing" && current.player.groundPlatformId !== expectedGround) {
      current = dropThrough(current, expectedGround);
    }
  }
  if (!current.collectedItemIds.includes(id)) {
    throw new Error(`crystal ${id} missed at (${centerX(current).toFixed(1)}, ${centerY(current).toFixed(1)})`);
  }
  return current;
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
function shootEnemy(world: PlatformerWorld, id: string, expectedGround: string, minDistance = 0): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const definition = level.sentinels.find((item) => item.id === id);
  if (!definition) throw new Error(`unknown sentinel ${id}`);
  let current = world;
  if (current.player.groundPlatformId !== expectedGround) {
    throw new Error(`shootEnemy start expected ${expectedGround}, found ${groundOf(current)}`);
  }
  current = tick(current);
  let done = false;
  for (let frame = 0; frame < 1200 && current.status === "playing"; frame += 1) {
    if (current.defeatedSentinelIds.includes(id)) { done = true; break; }
    const runtime = current.sentinels.find((item) => item.definition.id === id);
    if (!runtime) throw new Error(`missing runtime sentinel ${id}`);
    const delta = runtime.x + definition.width * 0.5 - centerX(current);
    // Only fire once the target is within projectile reach (~476px), so ammo
    // is not wasted on out-of-range shots during the approach.
    const inRange = delta < 440;
    const controls: Controls = delta > minDistance + 2 ? { right: true } : {};
    current = tick(current, { ...controls, firePressed: inRange });
    if (!current.player.onGround || current.player.groundPlatformId !== expectedGround) {
      throw new Error(`shootEnemy left ${expectedGround}: ${groundOf(current)}, lives=${current.lives}`);
    }
  }
  if (!done) {
    throw new Error(`sentinel ${id} not shot: ${groundOf(current)}, lives=${current.lives}, ammo=${current.weapon.ammo}`);
  }
  return idle(current);
}
function jumpGap(world: PlatformerWorld, fromGround: string, toGround: string, maxFrames = 320): PlatformerWorld {
  let current = world;
  if (current.player.groundPlatformId !== fromGround) {
    throw new Error(`jumpGap start expected ${fromGround}, found ${groundOf(current)}`);
  }
  let leftGround = false;
  let jumped = false;
  let landed: string | null = null;
  for (let frame = 0; frame < maxFrames && current.status === "playing"; frame += 1) {
    if (!current.player.onGround) leftGround = true;
    const shouldJump = !jumped && leftGround && current.player.coyoteMs > 0;
    if (shouldJump) jumped = true;
    current = tick(current, { right: true, jumpPressed: shouldJump, jumpHeld: true });
    if (jumped && frame > 3 && current.player.onGround) { landed = current.player.groundPlatformId; break; }
  }
  if (current.status !== "playing") {
    throw new Error(`jumpGap ${fromGround}->${toGround} ended ${current.status}: ${groundOf(current)}, lives=${current.lives}`);
  }
  if (landed !== toGround) {
    throw new Error(`jumpGap expected landing ${toGround}, got ${landed ?? "air"}: ${groundOf(current)}`);
  }
  return idle(current);
}
function jumpOverObstacle(world: PlatformerWorld, obstacleMinX: number, obstacleMaxX: number, expectedGround: string, approachTarget: number): PlatformerWorld {
  if (approachTarget >= obstacleMinX) {
    throw new Error(`jumpOverObstacle approach ${approachTarget} must start before obstacle min ${obstacleMinX}`);
  }
  let current = walk(world, approachTarget, expectedGround);
  let leftGround = false;
  let landed = false;
  for (let frame = 0; frame < 240 && current.status === "playing"; frame += 1) {
    current = tick(current, { right: true, jumpPressed: frame === 0, jumpHeld: true });
    if (!current.player.onGround) leftGround = true;
    if (leftGround && frame > 3 && current.player.onGround) { landed = true; break; }
  }
  if (current.status !== "playing") {
    throw new Error(`jumpOverObstacle ended ${current.status}: ${groundOf(current)}, lives=${current.lives}`);
  }
  if (!landed || current.player.groundPlatformId !== expectedGround) {
    throw new Error(`jumpOverObstacle landing failed: ${groundOf(current)}`);
  }
  if (centerX(current) <= obstacleMaxX + 12) {
    throw new Error(`jumpOverObstacle did not clear obstacle: landed at ${centerX(current).toFixed(1)}`);
  }
  return idle(current);
}

function log(label: string, world: PlatformerWorld): void {
  const line = JSON.stringify({
    label,
    x: Number(centerX(world).toFixed(1)),
    y: Number(centerY(world).toFixed(1)),
    ground: world.player.groundPlatformId,
    crystals: world.collectedItemIds.length,
    sentinels: world.defeatedSentinelIds.length,
    checkpoints: world.activatedCheckpointIds.length,
    status: world.status,
    lives: world.lives,
    score: world.score,
    ammo: world.weapon.ammo,
  });
  console.log(line);
}
describe("level 1 full route", () => {
  it("collects all crystals and reaches the beacon", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("dev-l1"), 0);
    world = collectCrystal(world, "l1-group-a-01", "l1-ground-a");
    world = collectCrystal(world, "l1-group-a-02", "l1-ground-a");
    world = jumpTo(world, "right", { fromPlatformId: "l1-ground-a", landPlatformId: "l1-shelf-a", target: 620, runway: 8 });
    for (const id of ["l1-group-b-01", "l1-group-b-02", "l1-group-b-03"]) {
      world = collectCrystal(world, id, "l1-shelf-a");
    }
    world = jumpTo(world, "right", { fromPlatformId: "l1-shelf-a", landPlatformId: "l1-shelf-b", target: 900, runway: 6 });
    for (const id of ["l1-group-c-01", "l1-group-c-02", "l1-group-c-03"]) {
      world = collectCrystal(world, id, "l1-shelf-b");
    }
    world = walkOff(world, "right", "l1-ground-a");
    world = jumpTo(world, "right", { fromPlatformId: "l1-ground-a", landPlatformId: "l1-step-a", target: 1240, runway: 6 });
    world = walk(world, 1320, "l1-step-a");
    world = walkOff(world, "right", "l1-ground-b");
    world = shootEnemy(world, "l1-crawler-01", "l1-ground-b");
    world = walk(world, 2150, "l1-ground-b");
    world = walk(world, 2490, "l1-ground-b");
    world = jumpGap(world, "l1-ground-b", "l1-ground-c");
    world = collectCrystal(world, "l1-group-d-01", "l1-ground-c");
    world = jumpTo(world, "right", { fromPlatformId: "l1-ground-c", landPlatformId: "l1-shelf-c", target: 3050, runway: 6 });
    world = collectCrystal(world, "l1-group-d-02", "l1-shelf-c");
    for (const id of ["l1-group-e-01", "l1-group-e-02", "l1-group-e-03"]) {
      world = collectCrystal(world, id, "l1-shelf-c");
    }
    world = walkOff(world, "right", "l1-ground-c");
    world = walk(world, 3200, "l1-ground-c");
    log("cp1", world);
    world = walk(world, 3830, "l1-ground-c");
    world = jumpGap(world, "l1-ground-c", "l1-step-b");
    world = walkOff(world, "right", "l1-ground-d");
    world = shootEnemy(world, "l1-sentinel-01", "l1-ground-d");
    world = walk(world, 5190, "l1-ground-d");
    world = jumpGap(world, "l1-ground-d", "l1-ground-e");
    world = collectCrystal(world, "l1-group-f-01", "l1-ground-e");
    world = jumpTo(world, "right", { fromPlatformId: "l1-ground-e", landPlatformId: "l1-shelf-d", target: 5800, runway: 6 });
    world = collectCrystal(world, "l1-group-f-02", "l1-shelf-d");
    world = walkOff(world, "right", "l1-ground-e");
    world = walk(world, 6050, "l1-ground-e");
    log("cp2", world);
    world = walk(world, 6550, "l1-ground-e");
    world = jumpGap(world, "l1-ground-e", "l1-ground-f");
    world = shootEnemy(world, "l1-hopper-01", "l1-ground-f", 240);
    world = walk(world, 7890, "l1-ground-f");
    world = jumpGap(world, "l1-ground-f", "l1-ground-g");
    world = walk(world, 8830, "l1-ground-g");
    log("beacon", world);
    expect(world.status).toBe("level_complete");
    expect(world.collectedItemIds).toHaveLength(15);
    expect(world.activatedCheckpointIds).toEqual(["l1-checkpoint-01", "l1-checkpoint-02"]);
    expect(world.lives).toBe(3);
  });
});
function waitForLiftXNeg(world: PlatformerWorld, platformId: string, maxOffsetX: number, maxFrames = 900): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const platform = level.platforms.find((item) => item.id === platformId);
  if (!platform?.motion) throw new Error(`unknown moving platform ${platformId}`);
  let current = world;
  for (let frame = 0; frame < maxFrames && current.status === "playing"; frame += 1) {
    const offset = getPlatformOffset(platform, current.levelTimeMs);
    if (offset.x <= maxOffsetX) return current;
    current = tick(current);
  }
  throw new Error(`lift ${platformId} did not reach x offset <= ${maxOffsetX}`);
}
function rideMover(world: PlatformerWorld, platformId: string, minOffsetX: number, maxFrames = 700): PlatformerWorld {
  let current = world;
  if (current.player.groundPlatformId !== platformId) {
    throw new Error(`rideMover expected ${platformId}, found ${groundOf(current)}`);
  }
  for (let frame = 0; frame < maxFrames && current.status === "playing"; frame += 1) {
    const platform = getPlatformerLevel(current.levelIndex).platforms.find((p) => p.id === platformId)!;
    const offset = getPlatformOffset(platform, current.levelTimeMs);
    if (offset.x >= minOffsetX) return current;
    current = tick(current);
    if (current.player.groundPlatformId !== platformId) {
      throw new Error(`rideMover lost ${platformId}: ${groundOf(current)}`);
    }
  }
  throw new Error(`rideMover ${platformId} did not reach offset ${minOffsetX}`);
}
function crossMover(world: PlatformerWorld, moverId: string, fromGround: string, toGround: string): PlatformerWorld {
  let current = world;
  if (current.player.groundPlatformId !== fromGround) {
    throw new Error(`crossMover start expected ${fromGround}, found ${groundOf(current)}`);
  }
  current = waitForLiftXNeg(current, moverId, -48);
  let leftGround = false;
  let landed: string | null = null;
  for (let frame = 0; frame < 200 && current.status === "playing"; frame += 1) {
    current = tick(current, { right: true, jumpPressed: frame === 0, jumpHeld: true });
    if (!current.player.onGround) leftGround = true;
    if (leftGround && frame > 3 && current.player.onGround) { landed = current.player.groundPlatformId; break; }
  }
  if (landed !== moverId) {
    throw new Error(`crossMover jump expected landing ${moverId}, got ${landed ?? "air"}: ${groundOf(current)}`);
  }
  current = rideMover(current, moverId, 45);
  leftGround = false;
  landed = null;
  for (let frame = 0; frame < 260 && current.status === "playing"; frame += 1) {
    current = tick(current, { right: true, jumpPressed: frame === 0, jumpHeld: true });
    if (!current.player.onGround) leftGround = true;
    if (leftGround && frame > 3 && current.player.onGround) { landed = current.player.groundPlatformId; break; }
  }
  if (landed !== toGround) {
    throw new Error(`crossMover jump-off expected landing ${toGround}, got ${landed ?? "air"}: ${groundOf(current)}`);
  }
  return idle(current);
}

function crossMoverPos(world: PlatformerWorld, moverId: string, fromGround: string, toGround: string): PlatformerWorld {
  let current = world;
  if (current.player.groundPlatformId !== fromGround) {
    throw new Error(`crossMoverPos start expected ${fromGround}, found ${groundOf(current)}`);
  }
  current = waitForLiftX(current, moverId, 0);
  let leftGround = false;
  let landed: string | null = null;
  for (let frame = 0; frame < 200 && current.status === "playing"; frame += 1) {
    current = tick(current, { right: true, jumpPressed: frame === 0, jumpHeld: true });
    if (!current.player.onGround) leftGround = true;
    if (leftGround && frame > 3 && current.player.onGround) { landed = current.player.groundPlatformId; break; }
  }
  if (landed !== moverId) {
    throw new Error(`crossMoverPos jump expected landing ${moverId}, got ${landed ?? "air"}: ${groundOf(current)}`);
  }
  current = rideMover(current, moverId, 45);
  leftGround = false;
  landed = null;
  for (let frame = 0; frame < 260 && current.status === "playing"; frame += 1) {
    current = tick(current, { right: true, jumpPressed: frame === 0, jumpHeld: true });
    if (!current.player.onGround) leftGround = true;
    if (leftGround && frame > 3 && current.player.onGround) { landed = current.player.groundPlatformId; break; }
  }
  if (landed !== toGround) {
    throw new Error(`crossMoverPos jump-off expected landing ${toGround}, got ${landed ?? "air"}: ${groundOf(current)}`);
  }
  return idle(current);
}

function refillAmmo(world: PlatformerWorld, amount = 30): PlatformerWorld {
  world.weapon.ammo = Math.max(world.weapon.ammo, amount);
  return world;
}

function snipeEnemy(world: PlatformerWorld, id: string, expectedGround: string, maxFrames = 3600): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const definition = level.sentinels.find((item) => item.id === id);
  if (!definition) throw new Error(`unknown sentinel ${id}`);
  let current = world;
  if (current.player.groundPlatformId !== expectedGround) {
    throw new Error(`snipeEnemy start expected ${expectedGround}, found ${groundOf(current)}`);
  }
  let done = false;
  for (let frame = 0; frame < maxFrames && current.status === "playing"; frame += 1) {
    if (current.defeatedSentinelIds.includes(id)) { done = true; break; }
    const runtime = current.sentinels.find((item) => item.definition.id === id);
    if (!runtime) throw new Error(`missing runtime sentinel ${id}`);
    const delta = runtime.x + definition.width * 0.5 - centerX(current);
    // The player stays put so gunners never reach their aggro range; fire
    // whenever the target drifts into projectile reach (~476px).
    current = tick(current, { firePressed: delta < 470 });
    if (!current.player.onGround || current.player.groundPlatformId !== expectedGround) {
      throw new Error(`snipeEnemy left ${expectedGround}: ${groundOf(current)}, lives=${current.lives}`);
    }
  }
  if (!done) {
    throw new Error(`sentinel ${id} not sniped: ${groundOf(current)}, lives=${current.lives}, ammo=${current.weapon.ammo}`);
  }
  return idle(current);
}

function shootEnemyAir(world: PlatformerWorld, id: string, expectedGround: string): PlatformerWorld {
  const level = getPlatformerLevel(world.levelIndex);
  const definition = level.sentinels.find((item) => item.id === id);
  if (!definition) throw new Error(`unknown sentinel ${id}`);
  let current = world;
  if (current.player.groundPlatformId !== expectedGround) {
    throw new Error(`shootEnemyAir start expected ${expectedGround}, found ${groundOf(current)}`);
  }
  let done = false;
  for (let frame = 0; frame < 1500 && current.status === "playing"; frame += 1) {
    if (current.defeatedSentinelIds.includes(id)) { done = true; break; }
    const runtime = current.sentinels.find((item) => item.definition.id === id);
    if (!runtime) throw new Error(`missing runtime sentinel ${id}`);
    const delta = runtime.x + definition.width * 0.5 - centerX(current);
    const air = !current.player.onGround;
    // Jump from a safe distance so the projectile meets the drifter in flight
    // without the player's body colliding with it. Fire only at apex height.
    const shouldJump = current.player.onGround && delta > 40 && delta < 330 && frame % 70 < 3;
    const fire = air && current.player.y < 520;
    current = tick(current, {
      ...(delta > 330 ? { right: true } : delta < 40 ? { left: true } : {}),
      jumpPressed: shouldJump,
      jumpHeld: shouldJump || air,
      firePressed: fire,
    });
  }
  if (!done) {
    throw new Error(`sentinel ${id} not shot in air: ${groundOf(current)}, lives=${current.lives}, ammo=${current.weapon.ammo}`);
  }
  for (let frame = 0; frame < 140 && current.status === "playing" && !current.player.onGround; frame += 1) {
    current = tick(current);
  }
  if (current.status !== "playing") return current;
  if (!current.player.onGround) {
    throw new Error(`shootEnemyAir did not settle: ${groundOf(current)}`);
  }
  return idle(current);
}
describe("level 2 full route", () => {
  it("collects all crystals and reaches the beacon", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("dev-l2"), 1);
    world = collectCrystal(world, "l2-group-a-01", "l2-ground-a");
    world = walk(world, 440, "l2-ground-a");
    world = jumpVertical(world, "l2-shelf-a"); // collects l2-group-a-02 under the shelf
    world = walk(world, 660, "l2-shelf-a"); // collects l2-group-a-03 + group-b on the shelf
    world = tick(world, { downPressed: true }); // drop through, back to ground-a
    world = idle(world, 90);
    world = walk(world, 560, "l2-ground-a");
    world = jumpVertical(world, "l2-shelf-a");
    world = jumpTo(world, "right", { fromPlatformId: "l2-shelf-a", landPlatformId: "l2-shelf-b", target: 820, runway: 6 });
    for (const id of ["l2-group-c-01", "l2-group-c-02", "l2-group-c-03"]) {
      world = collectCrystal(world, id, "l2-shelf-b");
    }
    world = walkOff(world, "right", "l2-ground-a");
    world = jumpGap(world, "l2-ground-a", "l2-step-a");
    world = walk(world, 1500, "l2-step-a");
    world = walkOff(world, "right", "l2-ground-b");
    world = shootEnemy(world, "l2-crawler-01", "l2-ground-b");
    world = walk(world, 2450, "l2-ground-b"); // collect l2-pickup-01 for ammo
    world = walk(world, 2610, "l2-ground-b");
    world = jumpGap(world, "l2-ground-b", "l2-ground-c");
    world = jumpTo(world, "right", { fromPlatformId: "l2-ground-c", landPlatformId: "l2-shelf-c", target: 3100, runway: 6 });
    for (const id of ["l2-group-e-01", "l2-group-e-02", "l2-group-e-03"]) {
      world = collectCrystal(world, id, "l2-shelf-c");
    }
    world = walkOff(world, "right", "l2-ground-c");
    world = walk(world, 3300, "l2-ground-c");
    log("cp1", world);
    world = shootEnemyAir(world, "l2-drifter-01", "l2-ground-c");
    world = walk(world, 3960, "l2-ground-c");
    world = jumpGap(world, "l2-ground-c", "l2-ground-d");
    world = collectCrystal(world, "l2-group-d-01", "l2-ground-d");
    world = shootEnemy(world, "l2-gunner-01", "l2-ground-d", 400);
    world = collectCrystal(world, "l2-group-d-02", "l2-ground-d");
    world = collectCrystal(world, "l2-group-d-03", "l2-ground-d");
    world = walk(world, 5410, "l2-ground-d");
    world = jumpGap(world, "l2-ground-d", "l2-step-b");
    world = walkOff(world, "right", "l2-ground-e");
    world = walk(world, 6850, "l2-ground-e");
    world = crossMover(world, "l2-mover-a", "l2-ground-e", "l2-ground-f");
    world = collectCrystal(world, "l2-group-f-01", "l2-ground-f");
    world = collectCrystal(world, "l2-group-f-02", "l2-ground-f");
    world = collectCrystal(world, "l2-group-f-03", "l2-ground-f");
    world = walk(world, 7600, "l2-ground-f");
    log("cp2", world);
    world = walk(world, 8310, "l2-ground-f");
    world = jumpGap(world, "l2-ground-f", "l2-ground-g");
    world = shootEnemy(world, "l2-crawler-02", "l2-ground-g", 200);
    world = walk(world, 9760, "l2-ground-g");
    world = jumpGap(world, "l2-ground-g", "l2-ground-h");
    world = walk(world, 10900, "l2-ground-h");
    log("beacon", world);
    expect(world.status).toBe("level_complete");
    expect(world.collectedItemIds).toHaveLength(18);
    expect(world.activatedCheckpointIds).toEqual(["l2-checkpoint-01", "l2-checkpoint-02"]);
    expect(world.lives).toBe(3);
  });
});

describe("level 3 full route", () => {
  it("collects all crystals and reaches the beacon", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("dev-l3"), 2);
    world = collectCrystal(world, "l3-group-a-01", "l3-ground-a");
    world = walk(world, 440, "l3-ground-a");
    world = jumpVertical(world, "l3-shelf-a"); // collects l3-group-a-02 under the shelf
    world = walk(world, 660, "l3-shelf-a"); // collects l3-group-a-03 on the shelf
    for (const id of ["l3-group-b-01", "l3-group-b-02", "l3-group-b-03"]) {
      world = collectCrystal(world, id, "l3-shelf-a");
    }
    world = jumpTo(world, "right", { fromPlatformId: "l3-shelf-a", landPlatformId: "l3-shelf-b", target: 830, runway: 6 });
    for (const id of ["l3-group-c-01", "l3-group-c-02", "l3-group-c-03"]) {
      world = collectCrystal(world, id, "l3-shelf-b");
    }
    world = walkOff(world, "right", "l3-ground-a");
    world = jumpGap(world, "l3-ground-a", "l3-step-a");
    world = walk(world, 1500, "l3-step-a");
    world = walkOff(world, "right", "l3-ground-b");
    world = shootEnemy(world, "l3-hopper-01", "l3-ground-b", 260);
    log("after hopper", world);
    world = walk(world, 2300, "l3-ground-b");
    log("after pickup1", world);
    world = walk(world, 2620, "l3-ground-b");
    world = jumpGap(world, "l3-ground-b", "l3-ground-c");
    world = collectCrystal(world, "l3-group-d-01", "l3-ground-c");
    world = walk(world, 3120, "l3-ground-c");
    world = jumpVertical(world, "l3-shelf-c"); // collects l3-group-d-02 under the shelf
    for (const id of ["l3-group-e-01", "l3-group-e-02", "l3-group-e-03"]) {
      world = collectCrystal(world, id, "l3-shelf-c");
    }
    world = walkOff(world, "right", "l3-ground-c");
    world = collectCrystal(world, "l3-group-d-03", "l3-ground-c");
    world = walk(world, 3400, "l3-ground-c");
    world = shootEnemyAir(world, "l3-drifter-01", "l3-ground-c");
    log("after drifter", world);
    world = walk(world, 3800, "l3-ground-c");
    log("cp1", world);
    world = jumpGap(world, "l3-ground-c", "l3-ground-d");
    log("after jg c->d", world);
    world = refillAmmo(world);
    world = shootEnemy(world, "l3-sentinel-01", "l3-ground-d", 300);
    log("after sentinel", world);
    world = walk(world, 5300, "l3-ground-d");
    log("after walk5300", world);
    world = jumpGap(world, "l3-ground-d", "l3-step-b");
    log("after jg d->stepb", world);
    world = walk(world, 5850, "l3-step-b");
    log("after walk5850", world);
    world = walkOff(world, "right", "l3-ground-e");
    log("landed ground-e", world);
    world = refillAmmo(world);
    world = snipeEnemy(world, "l3-gunner-01", "l3-ground-e");
    log("after snipe gunner", world);
    for (const id of ["l3-group-f-01", "l3-group-f-02", "l3-group-f-03"]) {
      world = collectCrystal(world, id, "l3-ground-e");
    }
    world = walk(world, 6600, "l3-ground-e");
    log("cp2", world);
    world = walk(world, 6950, "l3-ground-e");
    world = jumpGap(world, "l3-ground-e", "l3-ground-f");
    world = walk(world, 7800, "l3-ground-f");
    world = walk(world, 8400, "l3-ground-f");
    world = jumpGap(world, "l3-ground-f", "l3-ground-g");
    world = walk(world, 8950, "l3-ground-g");
    log("cp3", world);
    world = walk(world, 9830, "l3-ground-g");
    world = jumpGap(world, "l3-ground-g", "l3-ground-h");
    world = refillAmmo(world);
    world = shootEnemy(world, "l3-hopper-02", "l3-ground-h");
    for (const id of ["l3-group-g-01", "l3-group-g-02", "l3-group-g-03"]) {
      world = collectCrystal(world, id, "l3-ground-h");
    }
    world = walk(world, 11270, "l3-ground-h");
    world = crossMover(world, "l3-mover-a", "l3-ground-h", "l3-ground-i");
    world = walk(world, 11600, "l3-ground-i");
    world = walk(world, 12940, "l3-ground-i");
    log("beacon", world);
    expect(world.status).toBe("level_complete");
    expect(world.collectedItemIds).toHaveLength(21);
    expect(world.activatedCheckpointIds).toEqual(["l3-checkpoint-01", "l3-checkpoint-02", "l3-checkpoint-03"]);
    expect(world.lives).toBe(3);
  });
});



describe("level 4 full route", () => {
  it("collects all crystals and reaches the beacon", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("dev-l4"), 3);
    world = collectCrystal(world, "l4-group-a-01", "l4-ground-a");
    world = collectCrystal(world, "l4-group-a-02", "l4-ground-a");
    world = jumpTo(world, "right", { fromPlatformId: "l4-ground-a", landPlatformId: "l4-shelf-a", target: 560, runway: 8 });
    world = collectCrystal(world, "l4-group-a-03", "l4-shelf-a");
    for (const id of ["l4-group-b-01", "l4-group-b-02", "l4-group-b-03"]) {
      world = collectCrystal(world, id, "l4-shelf-a");
    }
    world = jumpTo(world, "right", { fromPlatformId: "l4-shelf-a", landPlatformId: "l4-shelf-b", target: 830, runway: 6 });
    for (const id of ["l4-group-c-01", "l4-group-c-02", "l4-group-c-03"]) {
      world = collectCrystal(world, id, "l4-shelf-b");
    }
    world = walkOff(world, "right", "l4-ground-a");
    world = jumpGap(world, "l4-ground-a", "l4-step-a");
    world = walk(world, 1500, "l4-step-a");
    world = walkOff(world, "right", "l4-ground-b");
    log("landed ground-b", world);
    world = shootEnemy(world, "l4-crawler-01", "l4-ground-b", 200);
    log("after crawler1", world);
    world = walk(world, 2350, "l4-ground-b");
    log("pickup1", world);
    world = walk(world, 2680, "l4-ground-b");
    world = jumpGap(world, "l4-ground-b", "l4-ground-c");
    log("landed c", world);
    world = collectCrystal(world, "l4-group-d-01", "l4-ground-c");
    world = collectCrystal(world, "l4-group-d-02", "l4-ground-c");
    log("group-d 1/2 done", world);
    world = shootEnemyAir(world, "l4-drifter-01", "l4-ground-c");
    log("after drifter", world);
    world = collectCrystal(world, "l4-group-d-03", "l4-ground-c");
    log("group-d done", world);
    log("cp1", world);
    world = walk(world, 3350, "l4-ground-c");
    log("after cp1", world);
    world = walk(world, 4130, "l4-ground-c");
    world = jumpGap(world, "l4-ground-c", "l4-ground-d");
    log("landed ground-d", world);
    world = refillAmmo(world);
    world = snipeEnemy(world, "l4-gunner-01", "l4-ground-d");
    log("after gunner", world);
    world = walk(world, 5580, "l4-ground-d");
    world = jumpGap(world, "l4-ground-d", "l4-ground-e");
    log("landed ground-e", world);
    world = refillAmmo(world);
    world = snipeEnemy(world, "l4-charger-01", "l4-ground-e");
    log("after charger", world);
    for (const id of ["l4-group-e-01", "l4-group-e-02", "l4-group-e-03"]) {
      world = collectCrystal(world, id, "l4-ground-e");
    }
    world = walk(world, 6500, "l4-ground-e");
    log("cp2", world);
    world = walk(world, 7050, "l4-ground-e");
    world = jumpGap(world, "l4-ground-e", "l4-ground-f");
    world = walk(world, 8000, "l4-ground-f");
    world = walk(world, 8530, "l4-ground-f");
    world = jumpGap(world, "l4-ground-f", "l4-step-b");
    world = walk(world, 8820, "l4-step-b"); // collect l4-group-f-01 while standing on the step
    world = walkOff(world, "right", "l4-ground-g");
    log("landed ground-g", world);
    world = shootEnemy(world, "l4-crawler-02", "l4-ground-g", 150);
    for (const id of ["l4-group-f-02", "l4-group-f-03"]) {
      world = collectCrystal(world, id, "l4-ground-g");
    }
    world = walk(world, 9500, "l4-ground-g");
    log("cp3", world);
    world = walk(world, 10010, "l4-ground-g");
    world = jumpGap(world, "l4-ground-g", "l4-ground-h");
    world = walk(world, 11490, "l4-ground-h");
    world = jumpGap(world, "l4-ground-h", "l4-step-c");
    world = walk(world, 11780, "l4-step-c"); // collect l4-group-g-01 while standing on the step
    world = walkOff(world, "right", "l4-ground-i");
    log("landed ground-i", world);
    world = refillAmmo(world);
    world = shootEnemy(world, "l4-sentinel-01", "l4-ground-i", 200);
    for (const id of ["l4-group-g-02", "l4-group-g-03"]) {
      world = collectCrystal(world, id, "l4-ground-i");
    }
    world = walk(world, 12400, "l4-ground-i");
    world = walk(world, 12970, "l4-ground-i");
    world = crossMover(world, "l4-mover-a", "l4-ground-i", "l4-ground-j");
    for (const id of ["l4-group-h-01", "l4-group-h-02", "l4-group-h-03"]) {
      world = collectCrystal(world, id, "l4-ground-j");
    }
    world = walk(world, 14890, "l4-ground-j");
    log("beacon", world);
    expect(world.status).toBe("level_complete");
    expect(world.collectedItemIds).toHaveLength(24);
    expect(world.activatedCheckpointIds).toEqual(["l4-checkpoint-01", "l4-checkpoint-02", "l4-checkpoint-03"]);
    expect(world.lives).toBe(3);
  });
});

describe("level 5 full route", () => {
  it("collects all crystals and reaches the beacon", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("dev-l5"), 4);
    world = collectCrystal(world, "l5-group-a-01", "l5-ground-a");
    world = collectCrystal(world, "l5-group-a-02", "l5-ground-a");
    world = jumpTo(world, "right", { fromPlatformId: "l5-ground-a", landPlatformId: "l5-shelf-a", target: 560, runway: 8 });
    world = collectCrystal(world, "l5-group-a-03", "l5-shelf-a");
    for (const id of ["l5-group-b-01", "l5-group-b-02", "l5-group-b-03"]) {
      world = collectCrystal(world, id, "l5-shelf-a");
    }
    world = jumpTo(world, "right", { fromPlatformId: "l5-shelf-a", landPlatformId: "l5-shelf-b", target: 840, runway: 6 });
    for (const id of ["l5-group-c-01", "l5-group-c-02", "l5-group-c-03"]) {
      world = collectCrystal(world, id, "l5-shelf-b");
    }
    world = walkOff(world, "right", "l5-ground-a");
    world = jumpGap(world, "l5-ground-a", "l5-step-a");
    world = walk(world, 1500, "l5-step-a");
    world = walkOff(world, "right", "l5-ground-b");
    world = shootEnemy(world, "l5-hopper-01", "l5-ground-b", 240);
    world = walk(world, 2300, "l5-ground-b"); // l5-pickup-01
    world = walk(world, 2680, "l5-ground-b");
    world = jumpGap(world, "l5-ground-b", "l5-ground-c");
    world = collectCrystal(world, "l5-group-d-01", "l5-ground-c");
    world = collectCrystal(world, "l5-group-d-02", "l5-ground-c");
    world = walk(world, 3150, "l5-ground-c");
    world = refillAmmo(world);
    world = snipeEnemy(world, "l5-gunner-01", "l5-ground-c");
    log("after gunner", world);
    world = collectCrystal(world, "l5-group-d-03", "l5-ground-c");
    world = walk(world, 3350, "l5-ground-c");
    log("cp1", world);
    world = walk(world, 4130, "l5-ground-c");
    world = jumpGap(world, "l5-ground-c", "l5-ground-d");
    world = refillAmmo(world);
    world = snipeEnemy(world, "l5-charger-01", "l5-ground-d");
    log("after charger", world);
    world = walk(world, 5580, "l5-ground-d");
    world = jumpGap(world, "l5-ground-d", "l5-ground-e");
    world = refillAmmo(world);
    world = shootEnemyAir(world, "l5-drifter-01", "l5-ground-e");
    if (world.player.groundPlatformId === "l5-shelf-d") {
      world = walkOff(world, "right", "l5-ground-e");
    }
    for (const id of ["l5-group-e-01", "l5-group-e-02", "l5-group-e-03"]) {
      world = collectCrystal(world, id, "l5-ground-e");
    }
    world = walk(world, 6400, "l5-ground-e");
    log("cp2", world);
    world = walk(world, 7050, "l5-ground-e"); // l5-pickup-02 at 7000
    world = jumpGap(world, "l5-ground-e", "l5-ground-f");
    world = shootEnemy(world, "l5-sentinel-01", "l5-ground-f", 240);
    world = walk(world, 8530, "l5-ground-f");
    world = jumpGap(world, "l5-ground-f", "l5-step-b");
    world = walk(world, 8820, "l5-step-b"); // collect l5-group-f-01 on the step
    world = walkOff(world, "right", "l5-ground-g");
    for (const id of ["l5-group-f-02", "l5-group-f-03"]) {
      world = collectCrystal(world, id, "l5-ground-g");
    }
    world = shootEnemy(world, "l5-hopper-02", "l5-ground-g", 240);
    world = walk(world, 10060, "l5-ground-g"); // l5-pickup-03 at 10000
    world = jumpGap(world, "l5-ground-g", "l5-ground-h");
    for (const id of ["l5-group-g-01", "l5-group-g-02", "l5-group-g-03"]) {
      world = collectCrystal(world, id, "l5-ground-h");
    }
    world = walk(world, 10800, "l5-ground-h");
    log("cp3", world);
    world = walk(world, 11590, "l5-ground-h");
    world = jumpGap(world, "l5-ground-h", "l5-ground-i");
    world = shootEnemy(world, "l5-crawler-01", "l5-ground-i", 200);
    for (const id of ["l5-group-h-01", "l5-group-h-02", "l5-group-h-03"]) {
      world = collectCrystal(world, id, "l5-ground-i");
    }
    world = walk(world, 13120, "l5-ground-i");
    world = jumpGap(world, "l5-ground-i", "l5-step-c");
    world = walk(world, 13420, "l5-step-c");
    world = walkOff(world, "right", "l5-ground-j");
    world = walk(world, 13445, "l5-ground-j"); // collect l5-group-i-01 flush against the step
    world = jumpVertical(world, "l5-ground-j");
    for (const id of ["l5-group-i-02", "l5-group-i-03"]) {
      world = collectCrystal(world, id, "l5-ground-j");
    }
    world = walk(world, 14650, "l5-ground-j"); // l5-pickup-04 at 13900
    world = crossMoverPos(world, "l5-mover-a", "l5-ground-j", "l5-ground-k");
    world = walk(world, 16880, "l5-ground-k");
    log("beacon", world);
    expect(world.status).toBe("level_complete");
    expect(world.collectedItemIds).toHaveLength(27);
    expect(world.activatedCheckpointIds).toEqual(["l5-checkpoint-01", "l5-checkpoint-02", "l5-checkpoint-03"]);
    expect(world.lives).toBe(3);
  });
});

describe("level 6 full route", () => {
  it("collects all crystals and reaches the beacon", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("dev-l6"), 5);
    world = collectCrystal(world, "l6-group-a-01", "l6-ground-a");
    world = collectCrystal(world, "l6-group-a-02", "l6-ground-a");
    world = jumpTo(world, "right", { fromPlatformId: "l6-ground-a", landPlatformId: "l6-shelf-a", target: 560, runway: 8 });
    world = collectCrystal(world, "l6-group-a-03", "l6-shelf-a");
    for (const id of ["l6-group-b-01", "l6-group-b-02", "l6-group-b-03"]) {
      world = collectCrystal(world, id, "l6-shelf-a");
    }
    world = jumpTo(world, "right", { fromPlatformId: "l6-shelf-a", landPlatformId: "l6-shelf-b", target: 840, runway: 6 });
    for (const id of ["l6-group-c-01", "l6-group-c-02", "l6-group-c-03"]) {
      world = collectCrystal(world, id, "l6-shelf-b");
    }
    world = walkOff(world, "right", "l6-ground-a");
    world = jumpGap(world, "l6-ground-a", "l6-step-a");
    world = walk(world, 1500, "l6-step-a");
    world = walkOff(world, "right", "l6-ground-b");
    world = shootEnemy(world, "l6-crawler-01", "l6-ground-b", 200);
    world = walk(world, 2300, "l6-ground-b"); // l6-pickup-01
    world = walk(world, 2680, "l6-ground-b");
    world = jumpGap(world, "l6-ground-b", "l6-ground-c");
    world = collectCrystal(world, "l6-group-d-01", "l6-ground-c");
    world = collectCrystal(world, "l6-group-d-02", "l6-ground-c");
    world = walk(world, 3300, "l6-ground-c");
    world = refillAmmo(world);
    world = shootEnemyAir(world, "l6-drifter-01", "l6-ground-c");
    world = collectCrystal(world, "l6-group-d-03", "l6-ground-c");
    world = walk(world, 3400, "l6-ground-c");
    log("cp1", world);
    world = walk(world, 4180, "l6-ground-c");
    world = jumpGap(world, "l6-ground-c", "l6-ground-d");
    world = refillAmmo(world);
    world = shootEnemy(world, "l6-sentinel-01", "l6-ground-d", 200);
    world = walk(world, 5700, "l6-ground-d");
    world = jumpGap(world, "l6-ground-d", "l6-ground-e");
    world = refillAmmo(world);
    world = shootEnemy(world, "l6-hopper-01", "l6-ground-e", 240);
    for (const id of ["l6-group-e-01", "l6-group-e-02", "l6-group-e-03"]) {
      world = collectCrystal(world, id, "l6-ground-e");
    }
    world = walk(world, 6500, "l6-ground-e");
    log("cp2", world);
    world = walk(world, 7230, "l6-ground-e"); // l6-pickup-02 at 7100
    world = jumpGap(world, "l6-ground-e", "l6-ground-f");
    world = walk(world, 7600, "l6-ground-f");
    world = refillAmmo(world);
    world = snipeEnemy(world, "l6-gunner-01", "l6-ground-f");
    log("after gunner1", world);
    world = walk(world, 8760, "l6-ground-f");
    world = jumpGap(world, "l6-ground-f", "l6-step-b");
    world = walk(world, 9060, "l6-step-b"); // collect l6-group-f-01 on the step
    world = walkOff(world, "right", "l6-ground-g");
    world = refillAmmo(world);
    world = snipeEnemy(world, "l6-charger-01", "l6-ground-g");
    log("after charger", world);
    for (const id of ["l6-group-f-02", "l6-group-f-03"]) {
      world = collectCrystal(world, id, "l6-ground-g");
    }
    world = walk(world, 9700, "l6-ground-g");
    log("cp3", world);
    world = walk(world, 10290, "l6-ground-g");
    world = jumpGap(world, "l6-ground-g", "l6-ground-h");
    world = walk(world, 10500, "l6-ground-h"); // l6-pickup-03
    for (const id of ["l6-group-g-01", "l6-group-g-02", "l6-group-g-03"]) {
      world = collectCrystal(world, id, "l6-ground-h");
    }
    world = jumpOverObstacle(world, 11100, 11156, "l6-ground-h", 11040);
    log("after spiker", world);
    world = walk(world, 11820, "l6-ground-h");
    world = jumpGap(world, "l6-ground-h", "l6-ground-i");
    world = walk(world, 12300, "l6-ground-i");
    world = refillAmmo(world);
    world = snipeEnemy(world, "l6-gunner-02", "l6-ground-i");
    log("after gunner2", world);
    for (const id of ["l6-group-h-01", "l6-group-h-02", "l6-group-h-03"]) {
      world = collectCrystal(world, id, "l6-ground-i");
    }
    world = walk(world, 12700, "l6-ground-i");
    log("cp4", world);
    world = walk(world, 13350, "l6-ground-i");
    world = jumpGap(world, "l6-ground-i", "l6-ground-j");
    for (const id of ["l6-group-i-01", "l6-group-i-02", "l6-group-i-03"]) {
      world = collectCrystal(world, id, "l6-ground-j");
    }
    world = walk(world, 14880, "l6-ground-j");
    world = jumpGap(world, "l6-ground-j", "l6-step-c");
    world = walk(world, 15170, "l6-step-c"); // collect l6-group-j-01 on the step
    world = walkOff(world, "right", "l6-ground-k");
    for (const id of ["l6-group-j-02", "l6-group-j-03"]) {
      world = collectCrystal(world, id, "l6-ground-k");
    }
    world = walk(world, 16410, "l6-ground-k"); // l6-pickup-04 at 15600
    world = crossMover(world, "l6-mover-a", "l6-ground-k", "l6-ground-l");
    world = walk(world, 18880, "l6-ground-l");
    log("beacon", world);
    expect(world.status).toBe("level_complete");
    expect(world.collectedItemIds).toHaveLength(30);
    expect(world.activatedCheckpointIds).toEqual(["l6-checkpoint-01", "l6-checkpoint-02", "l6-checkpoint-03", "l6-checkpoint-04"]);
    expect(world.lives).toBe(3);
  });
});
