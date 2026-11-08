import type { PlatformerLevel } from "./platformerTypes";
import {
  PLATFORMER_LEVEL_CHECKPOINTS,
  PLATFORMER_LEVEL_CRYSTALS,
  PLATFORMER_LEVEL_SENTINELS,
  PLATFORMER_TOTAL_LEVELS,
} from "./platformerTypes";

const CRYO_PALETTE = {
  skyTop: "#06131d",
  skyBottom: "#102b39",
  iceLight: "#d8f7fb",
  iceMid: "#6fc2d2",
  iceDeep: "#173c4b",
  accent: "#58d9ec",
  accentSoft: "rgba(88, 217, 236, 0.16)",
  beacon: "#e8b84f",
} as const;

export const PLATFORMER_LEVELS: readonly PlatformerLevel[] = [
  {
    id: 1,
    code: "EUROPA / E-17 / 01",
    name: "初醒冰原",
    subtitle: "校准探测器，收集第一批轨道冰晶。",
    objective: "移动、跳跃，并抵达冰脊尽头的轨道信标。",
    width: 2860,
    height: 720,
    spawnX: 96,
    spawnY: 574,
    palette: { ...CRYO_PALETTE },
    platforms: [
      { id: "l1-ground-a", x: 0, y: 620, width: 1180, height: 100, kind: "solid" },
      { id: "l1-step-a", x: 280, y: 590, width: 250, height: 30, kind: "solid" },
      { id: "l1-ground-b", x: 1230, y: 620, width: 680, height: 100, kind: "solid" },
      { id: "l1-ground-c", x: 1980, y: 620, width: 880, height: 100, kind: "solid" },
      { id: "l1-ice-shelf-a", x: 760, y: 530, width: 190, height: 18, kind: "oneWay" },
      { id: "l1-ice-shelf-b", x: 1060, y: 450, width: 210, height: 18, kind: "oneWay" },
      { id: "l1-ledge-a", x: 2030, y: 530, width: 270, height: 22, kind: "solid" },
    ],
    crystals: [
      { id: "l1-crystal-01", groupId: "l1-group-a", x: 790, y: 458 },
      { id: "l1-crystal-02", groupId: "l1-group-a", x: 855, y: 458 },
      { id: "l1-crystal-03", groupId: "l1-group-a", x: 920, y: 458 },
      { id: "l1-crystal-04", groupId: "l1-group-b", x: 1090, y: 388 },
      { id: "l1-crystal-05", groupId: "l1-group-b", x: 1165, y: 388 },
      { id: "l1-crystal-06", groupId: "l1-group-b", x: 1240, y: 388 },
      { id: "l1-crystal-07", groupId: "l1-group-c", x: 2090, y: 486 },
      { id: "l1-crystal-08", groupId: "l1-group-c", x: 2165, y: 486 },
      { id: "l1-crystal-09", groupId: "l1-group-c", x: 2240, y: 486 },
    ],
    sentinels: [
      {
        id: "l1-sentinel-01",
        x: 980,
        y: 574,
        width: 54,
        height: 46,
        patrolMinX: 930,
        patrolMaxX: 1130,
        speed: 62,
      },
    ],
    checkpoints: [
      {
        id: "l1-checkpoint-01",
        x: 1635,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 1665,
        spawnY: 574,
        label: "冰脊中继",
      },
    ],
    beacon: { id: "l1-beacon", x: 2700, y: 488, width: 64, height: 132 },
  },
  {
    id: 2,
    code: "EUROPA / E-17 / 02",
    name: "裂隙回廊",
    subtitle: "在断裂冰壳上校准移动平台与长距跳跃。",
    objective: "跨过裂隙，找到穿过回廊的中继信标。",
    width: 3480,
    height: 720,
    spawnX: 92,
    spawnY: 574,
    palette: {
      ...CRYO_PALETTE,
      skyTop: "#04111a",
      skyBottom: "#123441",
      iceMid: "#63b7c8",
      accent: "#63e4f4",
      beacon: "#f0bf55",
    },
    platforms: [
      { id: "l2-ground-a", x: 0, y: 620, width: 760, height: 100, kind: "solid" },
      { id: "l2-step-a", x: 690, y: 530, width: 160, height: 22, kind: "solid" },
      { id: "l2-ground-b", x: 880, y: 620, width: 340, height: 100, kind: "solid" },
      { id: "l2-upper-a", x: 900, y: 440, width: 280, height: 20, kind: "solid" },
      { id: "l2-upper-b", x: 1180, y: 390, width: 240, height: 20, kind: "solid" },
      { id: "l2-ground-c", x: 1370, y: 620, width: 490, height: 100, kind: "solid" },
      { id: "l2-lower-lift", x: 1230, y: 535, width: 150, height: 20, kind: "solid", motion: { axis: "x", amplitude: 58, speed: 1.15, phase: 0 } },
      { id: "l2-upper-c", x: 1500, y: 430, width: 180, height: 18, kind: "oneWay" },
      { id: "l2-ground-d", x: 2010, y: 620, width: 440, height: 100, kind: "solid" },
      { id: "l2-vertical-lift", x: 1880, y: 510, width: 130, height: 20, kind: "solid", motion: { axis: "y", amplitude: 42, speed: 1.05, phase: 1.4 } },
      { id: "l2-ground-e", x: 2600, y: 620, width: 880, height: 100, kind: "solid" },
      { id: "l2-upper-d", x: 2280, y: 485, width: 210, height: 20, kind: "solid" },
      { id: "l2-upper-approach", x: 2160, y: 540, width: 110, height: 18, kind: "solid" },
    ],
    crystals: [
      { id: "l2-crystal-01", groupId: "l2-group-a", x: 718, y: 486 },
      { id: "l2-crystal-02", groupId: "l2-group-a", x: 775, y: 486 },
      { id: "l2-crystal-03", groupId: "l2-group-a", x: 832, y: 486 },
      { id: "l2-crystal-04", groupId: "l2-group-b", x: 980, y: 396 },
      { id: "l2-crystal-05", groupId: "l2-group-b", x: 1055, y: 396 },
      { id: "l2-crystal-06", groupId: "l2-group-b", x: 1130, y: 396 },
      { id: "l2-crystal-07", groupId: "l2-group-c", x: 1490, y: 396 },
      { id: "l2-crystal-08", groupId: "l2-group-c", x: 1560, y: 396 },
      { id: "l2-crystal-09", groupId: "l2-group-c", x: 1630, y: 396 },
      { id: "l2-crystal-10", groupId: "l2-group-d", x: 2280, y: 451 },
      { id: "l2-crystal-11", groupId: "l2-group-d", x: 2350, y: 451 },
      { id: "l2-crystal-12", groupId: "l2-group-d", x: 2420, y: 451 },
    ],
    sentinels: [
      { id: "l2-sentinel-01", x: 970, y: 574, width: 54, height: 46, patrolMinX: 915, patrolMaxX: 1170, speed: 74 },
      { id: "l2-sentinel-02", x: 2100, y: 574, width: 54, height: 46, patrolMinX: 2030, patrolMaxX: 2410, speed: 84 },
    ],
    checkpoints: [
      {
        id: "l2-checkpoint-01",
        x: 1710,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 1740,
        spawnY: 574,
        label: "裂隙中继",
      },
    ],
    beacon: { id: "l2-beacon", x: 3320, y: 488, width: 64, height: 132 },
  },
  {
    id: 3,
    code: "EUROPA / E-17 / 03",
    name: "潮汐之眼",
    subtitle: "上下层冰道在潮汐中交错，隐藏采样点等待回收。",
    objective: "穿行潮汐之眼，在生命耗尽前点亮最终信标。",
    width: 4200,
    height: 720,
    spawnX: 92,
    spawnY: 574,
    palette: {
      ...CRYO_PALETTE,
      skyTop: "#030c15",
      skyBottom: "#0a2633",
      iceLight: "#e4fbff",
      iceMid: "#54afc2",
      iceDeep: "#103747",
      accent: "#6de7f3",
      accentSoft: "rgba(109, 231, 243, 0.18)",
      beacon: "#f2c65e",
    },
    platforms: [
      { id: "l3-ground-a", x: 0, y: 620, width: 780, height: 100, kind: "solid" },
      { id: "l3-upper-a", x: 620, y: 530, width: 220, height: 20, kind: "solid" },
      { id: "l3-ground-b", x: 880, y: 620, width: 260, height: 100, kind: "solid" },
      { id: "l3-upper-b", x: 930, y: 450, width: 230, height: 18, kind: "solid" },
      { id: "l3-ground-c", x: 1300, y: 620, width: 480, height: 100, kind: "solid" },
      { id: "l3-upper-c", x: 1240, y: 360, width: 180, height: 18, kind: "solid" },
      { id: "l3-narrow-a", x: 1510, y: 410, width: 120, height: 18, kind: "solid" },
      { id: "l3-ground-d", x: 1870, y: 620, width: 330, height: 100, kind: "solid" },
      { id: "l3-upper-d", x: 1760, y: 340, width: 220, height: 18, kind: "solid" },
      { id: "l3-oneway-a", x: 1200, y: 540, width: 170, height: 16, kind: "oneWay" },
      { id: "l3-oneway-b", x: 1840, y: 540, width: 140, height: 16, kind: "oneWay" },
      { id: "l3-ground-e", x: 2380, y: 620, width: 470, height: 100, kind: "solid" },
      { id: "l3-upper-e", x: 2100, y: 420, width: 180, height: 18, kind: "solid" },
      { id: "l3-hidden-lift", x: 2370, y: 500, width: 130, height: 18, kind: "solid", motion: { axis: "y", amplitude: 46, speed: 1.1, phase: 0.4 } },
      { id: "l3-hidden-a", x: 2600, y: 390, width: 160, height: 16, kind: "oneWay" },
      { id: "l3-hidden-b", x: 2800, y: 310, width: 180, height: 16, kind: "oneWay" },
      { id: "l3-ground-f", x: 2970, y: 620, width: 430, height: 100, kind: "solid" },
      { id: "l3-upper-f", x: 2420, y: 370, width: 180, height: 18, kind: "oneWay" },
      { id: "l3-ground-g", x: 3540, y: 620, width: 660, height: 100, kind: "solid" },
      { id: "l3-upper-g", x: 3400, y: 540, width: 280, height: 18, kind: "solid" },
      { id: "l3-lower-lift", x: 2900, y: 520, width: 120, height: 18, kind: "solid", motion: { axis: "x", amplitude: 45, speed: 1.2, phase: 1.2 } },
    ],
    crystals: [
      { id: "l3-crystal-01", groupId: "l3-group-a", x: 630, y: 431 },
      { id: "l3-crystal-02", groupId: "l3-group-a", x: 700, y: 431 },
      { id: "l3-crystal-03", groupId: "l3-group-a", x: 770, y: 431 },
      { id: "l3-crystal-04", groupId: "l3-group-b", x: 1000, y: 386 },
      { id: "l3-crystal-05", groupId: "l3-group-b", x: 1070, y: 386 },
      { id: "l3-crystal-06", groupId: "l3-group-b", x: 1140, y: 386 },
      { id: "l3-crystal-07", groupId: "l3-group-c", x: 2110, y: 386 },
      { id: "l3-crystal-08", groupId: "l3-group-c", x: 2180, y: 386 },
      { id: "l3-crystal-09", groupId: "l3-group-c", x: 2250, y: 386 },
      { id: "l3-crystal-10", groupId: "l3-group-d", x: 2720, y: 214 },
      { id: "l3-crystal-11", groupId: "l3-group-d", x: 2790, y: 214 },
      { id: "l3-crystal-12", groupId: "l3-group-d", x: 2860, y: 214 },
      { id: "l3-crystal-13", groupId: "l3-group-e", x: 3470, y: 476 },
      { id: "l3-crystal-14", groupId: "l3-group-e", x: 3540, y: 476 },
      { id: "l3-crystal-15", groupId: "l3-group-e", x: 3610, y: 476 },
    ],
    sentinels: [
      { id: "l3-sentinel-01", x: 610, y: 574, width: 54, height: 46, patrolMinX: 540, patrolMaxX: 750, speed: 78 },
      { id: "l3-sentinel-02", x: 1970, y: 574, width: 54, height: 46, patrolMinX: 1910, patrolMaxX: 2160, speed: 82 },
      { id: "l3-sentinel-03", x: 2670, y: 574, width: 54, height: 46, patrolMinX: 2410, patrolMaxX: 2820, speed: 90 },
    ],
    checkpoints: [
      {
        id: "l3-checkpoint-01",
        x: 1580,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 1610,
        spawnY: 574,
        label: "潮眼中继 A",
      },
      {
        id: "l3-checkpoint-02",
        x: 3140,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 3165,
        spawnY: 574,
        label: "潮眼中继 B",
      },
    ],
    beacon: { id: "l3-beacon", x: 4010, y: 488, width: 64, height: 132 },
  },
];

export const PLATFORMER_LEVELS_BY_ID = new Map(
  PLATFORMER_LEVELS.map((level) => [level.id, level]),
);

export function getPlatformerLevel(index: number): PlatformerLevel {
  const level = PLATFORMER_LEVELS[index];
  if (!level) {
    throw new Error(`Unknown platformer level index: ${index}`);
  }
  return level;
}

export function getPlatformerLevelById(id: number): PlatformerLevel {
  const level = PLATFORMER_LEVELS_BY_ID.get(id);
  if (!level) {
    throw new Error(`Unknown platformer level id: ${id}`);
  }
  return level;
}

export function getPlatformerLevelIndex(id: number): number {
  return PLATFORMER_LEVELS.findIndex((level) => level.id === id);
}

export function getLevelStartCheckpointId(level: PlatformerLevel): string {
  return `level-${level.id}-start`;
}

export function getPlatformerLevelCrystalCount(level: PlatformerLevel): number {
  return level.crystals.length;
}

export function validatePlatformerLevels(
  levels: readonly PlatformerLevel[] = PLATFORMER_LEVELS,
): string[] {
  const errors: string[] = [];
  if (levels.length !== PLATFORMER_TOTAL_LEVELS) {
    errors.push(`Expected ${PLATFORMER_TOTAL_LEVELS} levels, received ${levels.length}.`);
  }

  levels.forEach((level, index) => {
    if (level.id !== index + 1) {
      errors.push(`Level at index ${index} must have id ${index + 1}.`);
    }
    if (level.width < 1280 || level.height !== 720) {
      errors.push(`Level ${level.id} has an invalid logical size.`);
    }
    if (level.crystals.length !== PLATFORMER_LEVEL_CRYSTALS[index]) {
      errors.push(`Level ${level.id} crystal count does not match the design.`);
    }
    if (level.sentinels.length !== PLATFORMER_LEVEL_SENTINELS[index]) {
      errors.push(`Level ${level.id} sentinel count does not match the design.`);
    }
    if (level.checkpoints.length !== PLATFORMER_LEVEL_CHECKPOINTS[index]) {
      errors.push(`Level ${level.id} checkpoint count does not match the design.`);
    }

    const ids = [
      ...level.platforms.map((item) => item.id),
      ...level.crystals.map((item) => item.id),
      ...level.sentinels.map((item) => item.id),
      ...level.checkpoints.map((item) => item.id),
      level.beacon.id,
    ];
    if (new Set(ids).size !== ids.length) {
      errors.push(`Level ${level.id} contains duplicate object ids.`);
    }

    for (const platform of level.platforms) {
      if (
        platform.width <= 0 ||
        platform.height <= 0 ||
        platform.x < 0 ||
        platform.x + platform.width > level.width ||
        platform.y < 0 ||
        platform.y + platform.height > level.height
      ) {
        errors.push(`Platform ${platform.id} is outside level ${level.id}.`);
      }
    }

    for (const crystal of level.crystals) {
      if (crystal.x < 0 || crystal.x > level.width || crystal.y < 0 || crystal.y > level.height) {
        errors.push(`Crystal ${crystal.id} is outside level ${level.id}.`);
      }
    }

    for (const sentinel of level.sentinels) {
      if (sentinel.patrolMinX > sentinel.x || sentinel.patrolMaxX < sentinel.x + sentinel.width) {
        errors.push(`Sentinel ${sentinel.id} starts outside its patrol range.`);
      }
    }

    if (
      level.beacon.x < 0 ||
      level.beacon.x + level.beacon.width > level.width ||
      level.beacon.y < 0 ||
      level.beacon.y + level.beacon.height > level.height
    ) {
      errors.push(`Beacon ${level.beacon.id} is outside level ${level.id}.`);
    }
  });

  return errors;
}



