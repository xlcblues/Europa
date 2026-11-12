import {
  createLevelContext,
  createPlatformerInput,
  createPlatformerMatchSubmission,
  createPlatformerSave,
  createPlatformerWorld,
  createInitialPlatformerContext,
  getActiveCheckpointId,
  parsePlatformerSaveDetails,
  restorePlatformerWorld,
  stepPlatformer,
} from "./platformerEngine";
import { getPlatformerLevel, PLATFORMER_LEVELS } from "./platformerLevels";
import {
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

describe("movement assists", () => {
  it("allows a coyote-time jump after leaving a ledge", () => {
    let world = createPlatformerWorld(createInitialPlatformerContext("coyote-test"), 0);
    world.player.x = 2450;
    world.player.previousX = world.player.x;
    world.player.y = 574;
    world.player.previousY = world.player.y;
    world.player.vx = 0;
    world.player.vy = 0;
    world.player.onGround = true;
    world.player.groundPlatformId = "l1-ground-b";
    world.player.coyoteMs = 100;

    let leftGround = false;
    for (let frame = 0; frame < 40; frame += 1) {
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
    world.player.x = 600;
    world.player.previousX = world.player.x;
    world.player.y = 545 - world.player.height;
    world.player.previousY = world.player.y;
    world.player.vx = 0;
    world.player.vy = 0;
    world.player.onGround = true;
    world.player.groundPlatformId = "l1-shelf-a";

    const result = stepPlatformer(world, {
      ...createPlatformerInput(),
      downPressed: true,
    });
    expect(result.world.player.onGround).toBe(false);
    expect(result.world.player.groundPlatformId).toBeNull();
    expect(result.world.player.dropThroughPlatformId).toBe("l1-shelf-a");
    expect(result.world.player.y).toBeGreaterThan(world.player.y);
  });
});

describe("level 3 sentinel interactions", () => {
  const level = getPlatformerLevel(2);

  it("lets the player stomp each sentinel exactly once", () => {
    for (const definition of level.sentinels.filter((item) => item.kind === "sentinel" || item.kind === "crawler" || item.kind === "hopper")) {
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
    for (const definition of level.sentinels.filter((item) => item.kind === "sentinel" || item.kind === "crawler" || item.kind === "hopper")) {
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
        collectedItemIds: ["l1-group-a-01"],
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
