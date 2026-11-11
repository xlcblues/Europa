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
        id: "l1-crawler-01",
        x: 980,
        y: 590,
        width: 54,
        height: 30,
        patrolMinX: 930,
        patrolMaxX: 1130,
        speed: 62,
        kind: "crawler",
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
      {
        id: "l2-crawler-01",
        x: 970,
        y: 590,
        width: 54,
        height: 30,
        patrolMinX: 915,
        patrolMaxX: 1170,
        speed: 74,
        kind: "crawler",
      },
      {
        id: "l2-drifter-01",
        x: 3005,
        y: 500,
        width: 40,
        height: 34,
        patrolMinX: 2900,
        patrolMaxX: 3150,
        speed: 40,
        kind: "drifter",
        bobAmplitude: 6,
        bobPeriodMs: 4200,
      },
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
      { id: "l3-upper-a", x: 560, y: 530, width: 280, height: 20, kind: "solid" },
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
      {
        id: "l3-hopper-01",
        x: 1990,
        y: 574,
        width: 54,
        height: 46,
        patrolMinX: 1990,
        patrolMaxX: 2160,
        speed: 78,
        kind: "hopper",
        hopHeight: 48,
        hopPeriodMs: 1400,
      },
      {
        id: "l3-drifter-01",
        x: 3880,
        y: 500,
        width: 40,
        height: 34,
        patrolMinX: 3750,
        patrolMaxX: 4050,
        speed: 40,
        kind: "drifter",
        bobAmplitude: 6,
        bobPeriodMs: 3600,
      },
      {
        id: "l3-sentinel-01",
        x: 2670,
        y: 574,
        width: 54,
        height: 46,
        patrolMinX: 2410,
        patrolMaxX: 2820,
        speed: 90,
        kind: "sentinel",
      },
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
  {
    id: 4,
    code: "EUROPA / E-17 / 04",
    name: "永夜冰脊",
    subtitle: "移动冰台与高悬冰脊交错，夜航探测进入冰原纵深。",
    objective: "越过永夜冰脊，在冰雾尽头校准轨道信标。",
    width: 4800,
    height: 720,
    spawnX: 92,
    spawnY: 574,
    palette: {
      ...CRYO_PALETTE,
      skyTop: "#030a13",
      skyBottom: "#0c1f2c",
      iceLight: "#e0faff",
      iceMid: "#4fabbd",
      iceDeep: "#0e3240",
      accent: "#72e8f4",
      accentSoft: "rgba(114, 232, 244, 0.18)",
      beacon: "#f3c75f",
    },
    platforms: [
      { id: "l4-ground-a", x: 0, y: 620, width: 840, height: 100, kind: "solid" },
      { id: "l4-step-a", x: 600, y: 545, width: 190, height: 20, kind: "solid" },
      { id: "l4-ground-b", x: 980, y: 620, width: 320, height: 100, kind: "solid" },
      { id: "l4-upper-low-a", x: 1030, y: 545, width: 220, height: 18, kind: "solid" },
      { id: "l4-upper-a", x: 1030, y: 465, width: 220, height: 18, kind: "oneWay" },
      { id: "l4-ground-c", x: 1430, y: 620, width: 430, height: 100, kind: "solid" },
      { id: "l4-upper-low-b", x: 1380, y: 530, width: 200, height: 18, kind: "solid" },
      { id: "l4-upper-mid-b", x: 1380, y: 450, width: 200, height: 18, kind: "oneWay" },
      { id: "l4-upper-b", x: 1380, y: 370, width: 200, height: 18, kind: "oneWay" },
      { id: "l4-lift-a", x: 1720, y: 545, width: 140, height: 18, kind: "solid", motion: { axis: "x", amplitude: 55, speed: 1.15, phase: 0 } },
      { id: "l4-ground-d", x: 1990, y: 620, width: 530, height: 100, kind: "solid" },
      { id: "l4-upper-low-c", x: 2030, y: 545, width: 220, height: 18, kind: "solid" },
      { id: "l4-upper-c", x: 2030, y: 455, width: 220, height: 18, kind: "oneWay" },
      { id: "l4-ground-e", x: 2520, y: 620, width: 500, height: 100, kind: "solid" },
      { id: "l4-lift-b", x: 3060, y: 545, width: 130, height: 18, kind: "solid", motion: { axis: "x", amplitude: 40, speed: 1.15, phase: 1.2 } },
      { id: "l4-upper-low-d", x: 2580, y: 545, width: 200, height: 18, kind: "solid" },
      { id: "l4-upper-d", x: 2580, y: 455, width: 200, height: 18, kind: "oneWay" },
      { id: "l4-ground-f", x: 3160, y: 620, width: 520, height: 100, kind: "solid" },
      { id: "l4-oneway-a", x: 3340, y: 545, width: 160, height: 16, kind: "oneWay" },
      { id: "l4-ground-g", x: 3820, y: 620, width: 980, height: 100, kind: "solid" },
      { id: "l4-upper-e", x: 3920, y: 550, width: 230, height: 18, kind: "oneWay" },
      { id: "l4-upper-f", x: 4240, y: 475, width: 190, height: 18, kind: "oneWay" },
    ],
    crystals: [
      { id: "l4-crystal-01", groupId: "l4-group-a", x: 630, y: 481 },
      { id: "l4-crystal-02", groupId: "l4-group-a", x: 700, y: 481 },
      { id: "l4-crystal-03", groupId: "l4-group-a", x: 770, y: 481 },
      { id: "l4-crystal-04", groupId: "l4-group-b", x: 1080, y: 401 },
      { id: "l4-crystal-05", groupId: "l4-group-b", x: 1150, y: 401 },
      { id: "l4-crystal-06", groupId: "l4-group-b", x: 1220, y: 401 },
      { id: "l4-crystal-07", groupId: "l4-group-c", x: 1430, y: 306 },
      { id: "l4-crystal-08", groupId: "l4-group-c", x: 1500, y: 306 },
      { id: "l4-crystal-09", groupId: "l4-group-c", x: 1570, y: 306 },
      { id: "l4-crystal-10", groupId: "l4-group-d", x: 2080, y: 391 },
      { id: "l4-crystal-11", groupId: "l4-group-d", x: 2150, y: 391 },
      { id: "l4-crystal-12", groupId: "l4-group-d", x: 2220, y: 391 },
      { id: "l4-crystal-13", groupId: "l4-group-e", x: 2630, y: 391 },
      { id: "l4-crystal-14", groupId: "l4-group-e", x: 2700, y: 391 },
      { id: "l4-crystal-15", groupId: "l4-group-e", x: 2770, y: 391 },
    ],
    sentinels: [
      {
        id: "l4-crawler-01",
        x: 1080,
        y: 590,
        width: 54,
        height: 30,
        patrolMinX: 1030,
        patrolMaxX: 1220,
        speed: 72,
        kind: "crawler",
      },
      {
        id: "l4-drifter-01",
        x: 2860,
        y: 505,
        width: 40,
        height: 34,
        patrolMinX: 2800,
        patrolMaxX: 3000,
        speed: 42,
        kind: "drifter",
        bobAmplitude: 6,
        bobPeriodMs: 3800,
      },
      {
        id: "l4-sentinel-01",
        x: 4000,
        y: 574,
        width: 54,
        height: 46,
        patrolMinX: 3950,
        patrolMaxX: 4250,
        speed: 60,
        kind: "sentinel",
      },
    ],
    checkpoints: [
      {
        id: "l4-checkpoint-01",
        x: 2210,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 2240,
        spawnY: 574,
        label: "永夜中继 A",
      },
      {
        id: "l4-checkpoint-02",
        x: 3830,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 3860,
        spawnY: 574,
        label: "永夜中继 B",
      },
    ],
    beacon: { id: "l4-beacon", x: 4580, y: 488, width: 64, height: 132 },
  },
  {
    id: 5,
    code: "EUROPA / E-17 / 05",
    name: "静默冰层",
    subtitle: "冰层深处的浮游哨兵增多，垂直冰台考验落点判断。",
    objective: "穿过静默冰层，在深渊之上点亮最终信标。",
    width: 5400,
    height: 720,
    spawnX: 92,
    spawnY: 574,
    palette: {
      ...CRYO_PALETTE,
      skyTop: "#02101a",
      skyBottom: "#0a2533",
      iceLight: "#e8fbff",
      iceMid: "#45a6ba",
      iceDeep: "#0b2d3c",
      accent: "#7aebf6",
      accentSoft: "rgba(122, 235, 246, 0.2)",
      beacon: "#f4c961",
    },
    platforms: [
      { id: "l5-ground-a", x: 0, y: 620, width: 760, height: 100, kind: "solid" },
      { id: "l5-step-a", x: 520, y: 540, width: 170, height: 20, kind: "solid" },
      { id: "l5-ground-b", x: 900, y: 620, width: 340, height: 100, kind: "solid" },
      { id: "l5-upper-a", x: 950, y: 455, width: 230, height: 18, kind: "oneWay" },
      { id: "l5-upper-low-a", x: 950, y: 545, width: 230, height: 18, kind: "solid" },
      { id: "l5-ground-c", x: 1380, y: 620, width: 380, height: 100, kind: "solid" },
      { id: "l5-lift-a", x: 1640, y: 535, width: 140, height: 18, kind: "solid", motion: { axis: "x", amplitude: 60, speed: 1.2, phase: 0 } },
      { id: "l5-upper-b", x: 1560, y: 450, width: 190, height: 18, kind: "oneWay" },
      { id: "l5-ground-d", x: 1900, y: 620, width: 420, height: 100, kind: "solid" },
      { id: "l5-lift-b", x: 2220, y: 515, width: 130, height: 18, kind: "solid", motion: { axis: "y", amplitude: 48, speed: 1.1, phase: 1.3 } },
      { id: "l5-upper-c", x: 2330, y: 380, width: 210, height: 18, kind: "oneWay" },
      { id: "l5-ground-e", x: 2460, y: 620, width: 460, height: 100, kind: "solid" },
      { id: "l5-ground-f", x: 3060, y: 620, width: 520, height: 100, kind: "solid" },
      { id: "l5-oneway-a", x: 2900, y: 530, width: 150, height: 16, kind: "oneWay" },
      { id: "l5-ground-g", x: 3580, y: 620, width: 460, height: 100, kind: "solid" },
      { id: "l5-lift-c", x: 3500, y: 550, width: 130, height: 18, kind: "solid", motion: { axis: "x", amplitude: 55, speed: 1.15, phase: 2.1 } },
      { id: "l5-upper-d", x: 3660, y: 465, width: 200, height: 18, kind: "oneWay" },
      { id: "l5-ground-h", x: 4180, y: 620, width: 1220, height: 100, kind: "solid" },
      { id: "l5-upper-e", x: 4280, y: 530, width: 230, height: 18, kind: "oneWay" },
      { id: "l5-upper-f", x: 4560, y: 440, width: 200, height: 18, kind: "oneWay" },
      { id: "l5-upper-g", x: 4840, y: 355, width: 170, height: 18, kind: "oneWay" },
    ],
    crystals: [
      { id: "l5-crystal-01", groupId: "l5-group-a", x: 560, y: 476 },
      { id: "l5-crystal-02", groupId: "l5-group-a", x: 630, y: 476 },
      { id: "l5-crystal-03", groupId: "l5-group-a", x: 700, y: 476 },
      { id: "l5-crystal-04", groupId: "l5-group-b", x: 1000, y: 391 },
      { id: "l5-crystal-05", groupId: "l5-group-b", x: 1070, y: 391 },
      { id: "l5-crystal-06", groupId: "l5-group-b", x: 1140, y: 391 },
      { id: "l5-crystal-07", groupId: "l5-group-c", x: 1610, y: 386 },
      { id: "l5-crystal-08", groupId: "l5-group-c", x: 1680, y: 386 },
      { id: "l5-crystal-09", groupId: "l5-group-c", x: 1750, y: 386 },
      { id: "l5-crystal-10", groupId: "l5-group-d", x: 2380, y: 316 },
      { id: "l5-crystal-11", groupId: "l5-group-d", x: 2450, y: 316 },
      { id: "l5-crystal-12", groupId: "l5-group-d", x: 2520, y: 316 },
      { id: "l5-crystal-13", groupId: "l5-group-e", x: 3710, y: 366 },
      { id: "l5-crystal-14", groupId: "l5-group-e", x: 3780, y: 366 },
      { id: "l5-crystal-15", groupId: "l5-group-e", x: 3850, y: 366 },
      { id: "l5-crystal-16", groupId: "l5-group-f", x: 4610, y: 376 },
      { id: "l5-crystal-17", groupId: "l5-group-f", x: 4680, y: 376 },
      { id: "l5-crystal-18", groupId: "l5-group-f", x: 4750, y: 376 },
    ],
    sentinels: [
      {
        id: "l5-crawler-01",
        x: 1060,
        y: 590,
        width: 54,
        height: 30,
        patrolMinX: 1010,
        patrolMaxX: 1180,
        speed: 74,
        kind: "crawler",
      },
      {
        id: "l5-drifter-01",
        x: 2050,
        y: 500,
        width: 40,
        height: 34,
        patrolMinX: 1980,
        patrolMaxX: 2240,
        speed: 44,
        kind: "drifter",
        bobAmplitude: 6,
        bobPeriodMs: 3600,
      },
      {
        id: "l5-hopper-01",
        x: 3150,
        y: 574,
        width: 54,
        height: 46,
        patrolMinX: 3150,
        patrolMaxX: 3320,
        speed: 80,
        kind: "hopper",
        hopHeight: 52,
        hopPeriodMs: 1500,
      },
      {
        id: "l5-sentinel-01",
        x: 4350,
        y: 574,
        width: 54,
        height: 46,
        patrolMinX: 4300,
        patrolMaxX: 4580,
        speed: 92,
        kind: "sentinel",
      },
    ],
    checkpoints: [
      {
        id: "l5-checkpoint-01",
        x: 2700,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 2730,
        spawnY: 574,
        label: "静默中继 A",
      },
      {
        id: "l5-checkpoint-02",
        x: 3900,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 3930,
        spawnY: 574,
        label: "静默中继 B",
      },
    ],
    beacon: { id: "l5-beacon", x: 5140, y: 488, width: 64, height: 132 },
  },
  {
    id: 6,
    code: "EUROPA / E-17 / 06",
    name: "欧罗巴之心",
    subtitle: "冰壳之下的终极航道，多层冰台与浮游哨兵密布。",
    objective: "抵达欧罗巴之心，点燃冰海深处的最终信标。",
    width: 6000,
    height: 720,
    spawnX: 92,
    spawnY: 574,
    palette: {
      ...CRYO_PALETTE,
      skyTop: "#010a13",
      skyBottom: "#071c2a",
      iceLight: "#ecfdff",
      iceMid: "#3e9cb1",
      iceDeep: "#092836",
      accent: "#84eef8",
      accentSoft: "rgba(132, 238, 248, 0.22)",
      beacon: "#f5cc64",
    },
    platforms: [
      { id: "l6-ground-a", x: 0, y: 620, width: 720, height: 100, kind: "solid" },
      { id: "l6-step-a", x: 460, y: 545, width: 160, height: 20, kind: "solid" },
      { id: "l6-ground-b", x: 860, y: 620, width: 380, height: 100, kind: "solid" },
      { id: "l6-upper-a", x: 910, y: 530, width: 220, height: 18, kind: "solid" },
      { id: "l6-upper-b", x: 980, y: 440, width: 200, height: 18, kind: "oneWay" },
      { id: "l6-ground-c", x: 1380, y: 620, width: 360, height: 100, kind: "solid" },
      { id: "l6-lift-a", x: 1600, y: 545, width: 140, height: 18, kind: "solid", motion: { axis: "x", amplitude: 60, speed: 1.25, phase: 0 } },
      { id: "l6-upper-c", x: 1560, y: 455, width: 180, height: 18, kind: "oneWay" },
      { id: "l6-ground-d", x: 1860, y: 620, width: 400, height: 100, kind: "solid" },
      { id: "l6-lift-b", x: 2180, y: 520, width: 130, height: 18, kind: "solid", motion: { axis: "y", amplitude: 48, speed: 1.15, phase: 1.1 } },
      { id: "l6-upper-d", x: 2280, y: 400, width: 210, height: 18, kind: "oneWay" },
      { id: "l6-ground-e", x: 2400, y: 620, width: 460, height: 100, kind: "solid" },
      { id: "l6-ground-f", x: 3000, y: 620, width: 360, height: 100, kind: "solid" },
      { id: "l6-oneway-a", x: 2840, y: 535, width: 130, height: 16, kind: "oneWay" },
      { id: "l6-ground-g", x: 3500, y: 620, width: 440, height: 100, kind: "solid" },
      { id: "l6-lift-c", x: 3420, y: 525, width: 130, height: 18, kind: "solid", motion: { axis: "x", amplitude: 58, speed: 1.2, phase: 2.3 } },
      { id: "l6-upper-e", x: 3560, y: 435, width: 200, height: 18, kind: "oneWay" },
      { id: "l6-ground-h", x: 4080, y: 620, width: 420, height: 100, kind: "solid" },
      { id: "l6-lift-d", x: 4400, y: 505, width: 130, height: 18, kind: "solid", motion: { axis: "y", amplitude: 52, speed: 1.1, phase: 0.8 } },
      { id: "l6-upper-f", x: 4500, y: 385, width: 200, height: 18, kind: "oneWay" },
      { id: "l6-ground-i", x: 4640, y: 620, width: 1360, height: 100, kind: "solid" },
      { id: "l6-upper-g", x: 4740, y: 535, width: 220, height: 18, kind: "solid" },
      { id: "l6-upper-h", x: 5020, y: 445, width: 190, height: 18, kind: "oneWay" },
      { id: "l6-upper-i", x: 5300, y: 360, width: 170, height: 18, kind: "oneWay" },
    ],
    crystals: [
      { id: "l6-crystal-01", groupId: "l6-group-a", x: 500, y: 481 },
      { id: "l6-crystal-02", groupId: "l6-group-a", x: 570, y: 481 },
      { id: "l6-crystal-03", groupId: "l6-group-a", x: 640, y: 481 },
      { id: "l6-crystal-04", groupId: "l6-group-b", x: 1030, y: 376 },
      { id: "l6-crystal-05", groupId: "l6-group-b", x: 1100, y: 376 },
      { id: "l6-crystal-06", groupId: "l6-group-b", x: 1170, y: 376 },
      { id: "l6-crystal-07", groupId: "l6-group-c", x: 1610, y: 391 },
      { id: "l6-crystal-08", groupId: "l6-group-c", x: 1680, y: 391 },
      { id: "l6-crystal-09", groupId: "l6-group-c", x: 1750, y: 391 },
      { id: "l6-crystal-10", groupId: "l6-group-d", x: 2330, y: 336 },
      { id: "l6-crystal-11", groupId: "l6-group-d", x: 2400, y: 336 },
      { id: "l6-crystal-12", groupId: "l6-group-d", x: 2470, y: 336 },
      { id: "l6-crystal-13", groupId: "l6-group-e", x: 3610, y: 371 },
      { id: "l6-crystal-14", groupId: "l6-group-e", x: 3680, y: 371 },
      { id: "l6-crystal-15", groupId: "l6-group-e", x: 3750, y: 371 },
      { id: "l6-crystal-16", groupId: "l6-group-f", x: 4550, y: 321 },
      { id: "l6-crystal-17", groupId: "l6-group-f", x: 4620, y: 321 },
      { id: "l6-crystal-18", groupId: "l6-group-f", x: 4690, y: 321 },
      { id: "l6-crystal-19", groupId: "l6-group-g", x: 5070, y: 381 },
      { id: "l6-crystal-20", groupId: "l6-group-g", x: 5140, y: 381 },
      { id: "l6-crystal-21", groupId: "l6-group-g", x: 5210, y: 381 },
    ],
    sentinels: [
      {
        id: "l6-crawler-01",
        x: 1040,
        y: 590,
        width: 54,
        height: 30,
        patrolMinX: 990,
        patrolMaxX: 1170,
        speed: 76,
        kind: "crawler",
      },
      {
        id: "l6-drifter-01",
        x: 1950,
        y: 500,
        width: 40,
        height: 34,
        patrolMinX: 1880,
        patrolMaxX: 2140,
        speed: 46,
        kind: "drifter",
        bobAmplitude: 6,
        bobPeriodMs: 3400,
      },
      {
        id: "l6-hopper-01",
        x: 3100,
        y: 574,
        width: 54,
        height: 46,
        patrolMinX: 3100,
        patrolMaxX: 3280,
        speed: 82,
        kind: "hopper",
        hopHeight: 54,
        hopPeriodMs: 1450,
      },
      {
        id: "l6-sentinel-01",
        x: 3700,
        y: 574,
        width: 54,
        height: 46,
        patrolMinX: 3660,
        patrolMaxX: 3860,
        speed: 94,
        kind: "sentinel",
      },
      {
        id: "l6-drifter-02",
        x: 4840,
        y: 470,
        width: 40,
        height: 34,
        patrolMinX: 4770,
        patrolMaxX: 5040,
        speed: 48,
        kind: "drifter",
        bobAmplitude: 7,
        bobPeriodMs: 3200,
      },
    ],
    checkpoints: [
      {
        id: "l6-checkpoint-01",
        x: 2080,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 2110,
        spawnY: 574,
        label: "欧罗巴中继 A",
      },
      {
        id: "l6-checkpoint-02",
        x: 3540,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 3570,
        spawnY: 574,
        label: "欧罗巴中继 B",
      },
      {
        id: "l6-checkpoint-03",
        x: 5400,
        y: 486,
        width: 42,
        height: 134,
        spawnX: 5430,
        spawnY: 574,
        label: "欧罗巴中继 C",
      },
    ],
    beacon: { id: "l6-beacon", x: 5740, y: 488, width: 64, height: 132 },
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



