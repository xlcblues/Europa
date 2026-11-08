import { PLATFORMER_LEVELS, validatePlatformerLevels } from "./platformerLevels";
import {
  PLATFORMER_LEVEL_CHECKPOINTS,
  PLATFORMER_LEVEL_CRYSTALS,
  PLATFORMER_LEVEL_SENTINELS,
} from "./platformerTypes";

describe("platformer level design", () => {
  it("matches the designed entity counts and has valid geometry", () => {
    expect(validatePlatformerLevels()).toEqual([]);
    expect(PLATFORMER_LEVELS.map((level) => level.crystals.length)).toEqual(
      PLATFORMER_LEVEL_CRYSTALS,
    );
    expect(PLATFORMER_LEVELS.map((level) => level.sentinels.length)).toEqual(
      PLATFORMER_LEVEL_SENTINELS,
    );
    expect(PLATFORMER_LEVELS.map((level) => level.checkpoints.length)).toEqual(
      PLATFORMER_LEVEL_CHECKPOINTS,
    );
  });

  it("uses globally unique object ids across all levels", () => {
    const ids = PLATFORMER_LEVELS.flatMap((level) => [
      ...level.platforms.map((item) => item.id),
      ...level.crystals.map((item) => item.id),
      ...level.sentinels.map((item) => item.id),
      ...level.checkpoints.map((item) => item.id),
      level.beacon.id,
    ]);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps every interactive entity inside the logical viewport", () => {
    for (const level of PLATFORMER_LEVELS) {
      expect(level.width).toBeGreaterThanOrEqual(1280);
      expect(level.height).toBe(720);

      for (const sentinel of level.sentinels) {
        expect(sentinel.y + sentinel.height).toBeLessThanOrEqual(level.height);
        expect(sentinel.patrolMinX).toBeGreaterThanOrEqual(0);
        expect(sentinel.patrolMaxX).toBeLessThanOrEqual(level.width);
      }

      for (const checkpoint of level.checkpoints) {
        expect(checkpoint.x + checkpoint.width).toBeLessThanOrEqual(level.width);
        expect(checkpoint.y + checkpoint.height).toBeLessThanOrEqual(level.height);
      }

      expect(level.crystals.length).toBeGreaterThan(0);
      expect(level.sentinels.length).toBeGreaterThan(0);
      expect(level.checkpoints.length).toBeGreaterThan(0);
    }
  });
});