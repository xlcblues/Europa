import type { LevelDecoration, LevelDecorationKind, PlatformerLevel } from "./platformerTypes";
import {
  PLATFORMER_LEVEL_CHECKPOINTS,
  PLATFORMER_LEVEL_CRYSTALS,
  PLATFORMER_LEVEL_SENTINELS,
  PLATFORMER_TOTAL_LEVELS,
} from "./platformerTypes";

export const PLATFORMER_LEVELS: readonly PlatformerLevel[] = [
  {
    "id": 1,
    "code": "EUROPA / E-17 / 01",
    "name": "初醒冰原",
    "subtitle": "黎明极光下的冰原，校准探测器并收集第一批轨道冰晶。",
    "objective": "移动、跳跃、射击，抵达冰脊尽头的轨道信标。",
    "width": 9000,
    "height": 720,
    "spawnX": 96,
    "spawnY": 574,
    "theme": "icefield",
    "palette": {
      "skyTop": "#06131d",
      "skyBottom": "#102b39",
      "iceLight": "#d8f7fb",
      "iceMid": "#6fc2d2",
      "iceDeep": "#173c4b",
      "accent": "#58d9ec",
      "accentSoft": "rgba(88, 217, 236, 0.16)",
      "beacon": "#e8b84f"
    },
    "platforms": [
      {
        "id": "l1-ground-a",
        "x": 0,
        "y": 620,
        "width": 1180,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l1-ground-b",
        "x": 1330,
        "y": 620,
        "width": 1200,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l1-ground-c",
        "x": 2680,
        "y": 620,
        "width": 1200,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l1-ground-d",
        "x": 4030,
        "y": 620,
        "width": 1200,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l1-ground-e",
        "x": 5380,
        "y": 620,
        "width": 1200,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l1-ground-f",
        "x": 6730,
        "y": 620,
        "width": 1200,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l1-ground-g",
        "x": 8080,
        "y": 620,
        "width": 920,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l1-shelf-a",
        "x": 520,
        "y": 545,
        "width": 240,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l1-shelf-b",
        "x": 780,
        "y": 505,
        "width": 250,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l1-shelf-c",
        "x": 2960,
        "y": 545,
        "width": 250,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l1-shelf-d",
        "x": 5620,
        "y": 545,
        "width": 250,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l1-step-a",
        "x": 1180,
        "y": 560,
        "width": 160,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l1-step-b",
        "x": 4030,
        "y": 560,
        "width": 170,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l1-step-c",
        "x": 6730,
        "y": 530,
        "width": 180,
        "height": 20,
        "kind": "solid"
      }
    ],
    "crystals": [
      {
        "id": "l1-group-a-01",
        "x": 240,
        "y": 540,
        "groupId": "l1-group-a"
      },
      {
        "id": "l1-group-a-02",
        "x": 460,
        "y": 540,
        "groupId": "l1-group-a"
      },
      {
        "id": "l1-group-b-01",
        "x": 560,
        "y": 465,
        "groupId": "l1-group-b"
      },
      {
        "id": "l1-group-b-02",
        "x": 650,
        "y": 465,
        "groupId": "l1-group-b"
      },
      {
        "id": "l1-group-b-03",
        "x": 740,
        "y": 465,
        "groupId": "l1-group-b"
      },
      {
        "id": "l1-group-c-01",
        "x": 820,
        "y": 425,
        "groupId": "l1-group-c"
      },
      {
        "id": "l1-group-c-02",
        "x": 910,
        "y": 425,
        "groupId": "l1-group-c"
      },
      {
        "id": "l1-group-c-03",
        "x": 1000,
        "y": 425,
        "groupId": "l1-group-c"
      },
      {
        "id": "l1-group-d-01",
        "x": 2850,
        "y": 540,
        "groupId": "l1-group-d"
      },
      {
        "id": "l1-group-d-02",
        "x": 3070,
        "y": 540,
        "groupId": "l1-group-d"
      },
      {
        "id": "l1-group-e-01",
        "x": 3000,
        "y": 465,
        "groupId": "l1-group-e"
      },
      {
        "id": "l1-group-e-02",
        "x": 3090,
        "y": 465,
        "groupId": "l1-group-e"
      },
      {
        "id": "l1-group-e-03",
        "x": 3180,
        "y": 465,
        "groupId": "l1-group-e"
      },
      {
        "id": "l1-group-f-01",
        "x": 5560,
        "y": 540,
        "groupId": "l1-group-f"
      },
      {
        "id": "l1-group-f-02",
        "x": 5780,
        "y": 540,
        "groupId": "l1-group-f"
      }
    ],
    "sentinels": [
      {
        "id": "l1-crawler-01",
        "kind": "crawler",
        "x": 1750,
        "y": 590,
        "width": 54,
        "height": 30,
        "patrolMinX": 1750,
        "patrolMaxX": 2200,
        "speed": 58
      },
      {
        "id": "l1-sentinel-01",
        "kind": "sentinel",
        "x": 4450,
        "y": 576,
        "width": 44,
        "height": 44,
        "patrolMinX": 4450,
        "patrolMaxX": 4900,
        "speed": 52
      },
      {
        "id": "l1-hopper-01",
        "kind": "hopper",
        "x": 7150,
        "y": 584,
        "width": 42,
        "height": 36,
        "patrolMinX": 7150,
        "patrolMaxX": 7600,
        "speed": 46,
        "hopHeight": 50,
        "hopPeriodMs": 1500
      }
    ],
    "checkpoints": [
      {
        "id": "l1-checkpoint-01",
        "x": 3200,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 3230,
        "spawnY": 574,
        "label": "冰脊中继 A"
      },
      {
        "id": "l1-checkpoint-02",
        "x": 5900,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 5930,
        "spawnY": 574,
        "label": "冰脊中继 B"
      }
    ],
    "weaponPickups": [
      {
        "id": "l1-pickup-01",
        "x": 2150,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l1-pickup-02",
        "x": 6050,
        "y": 592,
        "width": 26,
        "height": 26
      }
    ],
    "decorations": [
      {
        "id": "l1-deco-aurora-01",
        "kind": "aurora",
        "x": 540,
        "y": 28,
        "width": 460,
        "height": 86,
        "variant": 0
      },
      {
        "id": "l1-deco-aurora-02",
        "kind": "aurora",
        "x": 2430,
        "y": 80,
        "width": 690,
        "height": 138,
        "variant": 1
      },
      {
        "id": "l1-deco-aurora-03",
        "kind": "aurora",
        "x": 4320,
        "y": 132,
        "width": 920,
        "height": 190,
        "variant": 2
      },
      {
        "id": "l1-deco-aurora-04",
        "kind": "aurora",
        "x": 6210,
        "y": 184,
        "width": 460,
        "height": 86,
        "variant": 3
      },
      {
        "id": "l1-deco-iceSpire-05",
        "kind": "iceSpire",
        "x": 70,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l1-deco-iceSpire-06",
        "kind": "iceSpire",
        "x": 590,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l1-deco-iceSpire-07",
        "kind": "iceSpire",
        "x": 1110,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l1-deco-iceSpire-08",
        "kind": "iceSpire",
        "x": 1400,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l1-deco-iceSpire-09",
        "kind": "iceSpire",
        "x": 1930,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l1-deco-iceSpire-10",
        "kind": "iceSpire",
        "x": 2460,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l1-deco-iceSpire-11",
        "kind": "iceSpire",
        "x": 2750,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l1-deco-iceSpire-12",
        "kind": "iceSpire",
        "x": 3280,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l1-deco-iceSpire-13",
        "kind": "iceSpire",
        "x": 3810,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l1-deco-iceSpire-14",
        "kind": "iceSpire",
        "x": 4100,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l1-deco-iceSpire-15",
        "kind": "iceSpire",
        "x": 4630,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l1-deco-iceSpire-16",
        "kind": "iceSpire",
        "x": 5160,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l1-deco-iceSpire-17",
        "kind": "iceSpire",
        "x": 5450,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l1-deco-iceSpire-18",
        "kind": "iceSpire",
        "x": 5980,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l1-deco-iceSpire-19",
        "kind": "iceSpire",
        "x": 6510,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l1-deco-iceSpire-20",
        "kind": "iceSpire",
        "x": 6800,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l1-deco-iceSpire-21",
        "kind": "iceSpire",
        "x": 7330,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l1-deco-iceSpire-22",
        "kind": "iceSpire",
        "x": 7860,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l1-deco-iceSpire-23",
        "kind": "iceSpire",
        "x": 8150,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l1-deco-iceSpire-24",
        "kind": "iceSpire",
        "x": 8540,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l1-deco-iceSpire-25",
        "kind": "iceSpire",
        "x": 8930,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      }
    ],
    "beacon": {
      "id": "l1-beacon",
      "x": 8830,
      "y": 488,
      "width": 64,
      "height": 132
    }
  },
  {
    "id": 2,
    "code": "EUROPA / E-17 / 02",
    "name": "裂隙回廊",
    "subtitle": "断裂冰壳与深蓝裂隙之间的长廊，移动平台横跨深渊。",
    "objective": "跨过裂隙与移动平台，点亮回廊尽头的中继信标。",
    "width": 11000,
    "height": 720,
    "spawnX": 92,
    "spawnY": 574,
    "theme": "gorge",
    "palette": {
      "skyTop": "#04111a",
      "skyBottom": "#123441",
      "iceLight": "#d9f6fb",
      "iceMid": "#63b7c8",
      "iceDeep": "#0f3342",
      "accent": "#63e4f4",
      "accentSoft": "rgba(99, 228, 244, 0.18)",
      "beacon": "#f0bf55"
    },
    "platforms": [
      {
        "id": "l2-ground-a",
        "x": 0,
        "y": 620,
        "width": 1200,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l2-ground-b",
        "x": 1350,
        "y": 620,
        "width": 1300,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l2-ground-c",
        "x": 2800,
        "y": 620,
        "width": 1200,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l2-ground-d",
        "x": 4150,
        "y": 620,
        "width": 1300,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l2-ground-e",
        "x": 5600,
        "y": 620,
        "width": 1300,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l2-ground-f",
        "x": 7130,
        "y": 620,
        "width": 1220,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l2-ground-g",
        "x": 8500,
        "y": 620,
        "width": 1300,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l2-ground-h",
        "x": 9950,
        "y": 620,
        "width": 1050,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l2-shelf-a",
        "x": 420,
        "y": 545,
        "width": 250,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l2-shelf-b",
        "x": 690,
        "y": 505,
        "width": 260,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l2-shelf-c",
        "x": 2960,
        "y": 545,
        "width": 270,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l2-shelf-d",
        "x": 5770,
        "y": 545,
        "width": 270,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l2-step-a",
        "x": 1350,
        "y": 560,
        "width": 170,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l2-step-b",
        "x": 5600,
        "y": 560,
        "width": 180,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l2-mover-a",
        "x": 6900,
        "y": 598,
        "width": 150,
        "height": 20,
        "kind": "solid",
        "motion": {
          "axis": "x",
          "amplitude": 55,
          "speed": 1.1,
          "phase": 0
        }
      }
    ],
    "crystals": [
      {
        "id": "l2-group-a-01",
        "x": 220,
        "y": 540,
        "groupId": "l2-group-a"
      },
      {
        "id": "l2-group-a-02",
        "x": 440,
        "y": 540,
        "groupId": "l2-group-a"
      },
      {
        "id": "l2-group-a-03",
        "x": 660,
        "y": 540,
        "groupId": "l2-group-a"
      },
      {
        "id": "l2-group-b-01",
        "x": 460,
        "y": 465,
        "groupId": "l2-group-b"
      },
      {
        "id": "l2-group-b-02",
        "x": 550,
        "y": 465,
        "groupId": "l2-group-b"
      },
      {
        "id": "l2-group-b-03",
        "x": 640,
        "y": 465,
        "groupId": "l2-group-b"
      },
      {
        "id": "l2-group-c-01",
        "x": 730,
        "y": 425,
        "groupId": "l2-group-c"
      },
      {
        "id": "l2-group-c-02",
        "x": 820,
        "y": 425,
        "groupId": "l2-group-c"
      },
      {
        "id": "l2-group-c-03",
        "x": 910,
        "y": 425,
        "groupId": "l2-group-c"
      },
      {
        "id": "l2-group-d-01",
        "x": 4380,
        "y": 540,
        "groupId": "l2-group-d"
      },
      {
        "id": "l2-group-d-02",
        "x": 4600,
        "y": 540,
        "groupId": "l2-group-d"
      },
      {
        "id": "l2-group-d-03",
        "x": 4820,
        "y": 540,
        "groupId": "l2-group-d"
      },
      {
        "id": "l2-group-e-01",
        "x": 3000,
        "y": 465,
        "groupId": "l2-group-e"
      },
      {
        "id": "l2-group-e-02",
        "x": 3090,
        "y": 465,
        "groupId": "l2-group-e"
      },
      {
        "id": "l2-group-e-03",
        "x": 3180,
        "y": 465,
        "groupId": "l2-group-e"
      },
      {
        "id": "l2-group-f-01",
        "x": 7460,
        "y": 540,
        "groupId": "l2-group-f"
      },
      {
        "id": "l2-group-f-02",
        "x": 7680,
        "y": 540,
        "groupId": "l2-group-f"
      },
      {
        "id": "l2-group-f-03",
        "x": 7900,
        "y": 540,
        "groupId": "l2-group-f"
      }
    ],
    "sentinels": [
      {
        "id": "l2-crawler-01",
        "kind": "crawler",
        "x": 1750,
        "y": 590,
        "width": 54,
        "height": 30,
        "patrolMinX": 1750,
        "patrolMaxX": 2200,
        "speed": 62
      },
      {
        "id": "l2-drifter-01",
        "kind": "drifter",
        "x": 3350,
        "y": 500,
        "width": 40,
        "height": 34,
        "patrolMinX": 3200,
        "patrolMaxX": 3650,
        "speed": 40,
        "bobAmplitude": 6,
        "bobPeriodMs": 4200
      },
      {
        "id": "l2-gunner-01",
        "kind": "gunner",
        "x": 4550,
        "y": 574,
        "width": 46,
        "height": 46,
        "patrolMinX": 4550,
        "patrolMaxX": 5100,
        "speed": 45,
        "aggroRange": 340,
        "fireIntervalMs": 1700,
        "projectileSpeed": 300
      },
      {
        "id": "l2-crawler-02",
        "kind": "crawler",
        "x": 9250,
        "y": 590,
        "width": 54,
        "height": 30,
        "patrolMinX": 9250,
        "patrolMaxX": 9700,
        "speed": 66
      }
    ],
    "checkpoints": [
      {
        "id": "l2-checkpoint-01",
        "x": 3300,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 3330,
        "spawnY": 574,
        "label": "裂隙中继 A"
      },
      {
        "id": "l2-checkpoint-02",
        "x": 7600,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 7630,
        "spawnY": 574,
        "label": "裂隙中继 B"
      }
    ],
    "weaponPickups": [
      {
        "id": "l2-pickup-01",
        "x": 2450,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l2-pickup-02",
        "x": 9600,
        "y": 592,
        "width": 26,
        "height": 26
      }
    ],
    "decorations": [
      {
        "id": "l2-deco-nebula-01",
        "kind": "nebula",
        "x": 660,
        "y": 28,
        "width": 460,
        "height": 86,
        "variant": 0
      },
      {
        "id": "l2-deco-nebula-02",
        "kind": "nebula",
        "x": 2970,
        "y": 80,
        "width": 690,
        "height": 138,
        "variant": 1
      },
      {
        "id": "l2-deco-nebula-03",
        "kind": "nebula",
        "x": 5280,
        "y": 132,
        "width": 920,
        "height": 190,
        "variant": 2
      },
      {
        "id": "l2-deco-nebula-04",
        "kind": "nebula",
        "x": 7590,
        "y": 184,
        "width": 460,
        "height": 86,
        "variant": 3
      },
      {
        "id": "l2-deco-iceSpire-05",
        "kind": "iceSpire",
        "x": 70,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l2-deco-rockColumn-06",
        "kind": "rockColumn",
        "x": 600,
        "y": 516,
        "width": 58,
        "height": 148,
        "variant": 1
      },
      {
        "id": "l2-deco-iceSpire-07",
        "kind": "iceSpire",
        "x": 1130,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l2-deco-iceSpire-08",
        "kind": "iceSpire",
        "x": 1420,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l2-deco-rockColumn-09",
        "kind": "rockColumn",
        "x": 2000,
        "y": 516,
        "width": 58,
        "height": 148,
        "variant": 1
      },
      {
        "id": "l2-deco-iceSpire-10",
        "kind": "iceSpire",
        "x": 2580,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l2-deco-iceSpire-11",
        "kind": "iceSpire",
        "x": 2870,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l2-deco-rockColumn-12",
        "kind": "rockColumn",
        "x": 3400,
        "y": 516,
        "width": 58,
        "height": 148,
        "variant": 1
      },
      {
        "id": "l2-deco-iceSpire-13",
        "kind": "iceSpire",
        "x": 3930,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l2-deco-iceSpire-14",
        "kind": "iceSpire",
        "x": 4220,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l2-deco-rockColumn-15",
        "kind": "rockColumn",
        "x": 4800,
        "y": 516,
        "width": 58,
        "height": 148,
        "variant": 1
      },
      {
        "id": "l2-deco-iceSpire-16",
        "kind": "iceSpire",
        "x": 5380,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l2-deco-iceSpire-17",
        "kind": "iceSpire",
        "x": 5670,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l2-deco-rockColumn-18",
        "kind": "rockColumn",
        "x": 6250,
        "y": 516,
        "width": 58,
        "height": 148,
        "variant": 1
      },
      {
        "id": "l2-deco-iceSpire-19",
        "kind": "iceSpire",
        "x": 6830,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l2-deco-iceSpire-20",
        "kind": "iceSpire",
        "x": 7270,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l2-deco-rockColumn-21",
        "kind": "rockColumn",
        "x": 7775,
        "y": 516,
        "width": 58,
        "height": 148,
        "variant": 1
      },
      {
        "id": "l2-deco-iceSpire-22",
        "kind": "iceSpire",
        "x": 8280,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l2-deco-iceSpire-23",
        "kind": "iceSpire",
        "x": 8570,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l2-deco-rockColumn-24",
        "kind": "rockColumn",
        "x": 9150,
        "y": 516,
        "width": 58,
        "height": 148,
        "variant": 1
      },
      {
        "id": "l2-deco-iceSpire-25",
        "kind": "iceSpire",
        "x": 9730,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l2-deco-iceSpire-26",
        "kind": "iceSpire",
        "x": 10020,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l2-deco-rockColumn-27",
        "kind": "rockColumn",
        "x": 10475,
        "y": 516,
        "width": 58,
        "height": 148,
        "variant": 1
      },
      {
        "id": "l2-deco-iceSpire-28",
        "kind": "iceSpire",
        "x": 10930,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      }
    ],
    "beacon": {
      "id": "l2-beacon",
      "x": 10880,
      "y": 488,
      "width": 64,
      "height": 132
    }
  },
  {
    "id": 3,
    "code": "EUROPA / E-17 / 03",
    "name": "潮汐回响",
    "subtitle": "冰下潮汐涌动，青碧荧光与晶体尖塔在回廊间闪烁。",
    "objective": "穿越潮汐回廊与悬浮平台，抵达尽头的轨道信标。",
    "width": 13000,
    "height": 720,
    "spawnX": 92,
    "spawnY": 574,
    "theme": "tide",
    "palette": {
      "skyTop": "#03211f",
      "skyBottom": "#0b3a38",
      "iceLight": "#d9fffb",
      "iceMid": "#47d6c4",
      "iceDeep": "#0d3a35",
      "accent": "#5cf0dd",
      "accentSoft": "rgba(92, 240, 221, 0.18)",
      "beacon": "#f5c95e"
    },
    "platforms": [
      {
        "id": "l3-ground-a",
        "x": 0,
        "y": 620,
        "width": 1250,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l3-ground-b",
        "x": 1330,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l3-ground-c",
        "x": 2780,
        "y": 620,
        "width": 1300,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l3-ground-d",
        "x": 4200,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l3-ground-e",
        "x": 5670,
        "y": 620,
        "width": 1300,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l3-ground-f",
        "x": 7100,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l3-ground-g",
        "x": 8580,
        "y": 620,
        "width": 1300,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l3-ground-h",
        "x": 10000,
        "y": 620,
        "width": 1300,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l3-ground-i",
        "x": 11500,
        "y": 620,
        "width": 1500,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l3-shelf-a",
        "x": 430,
        "y": 545,
        "width": 250,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l3-shelf-b",
        "x": 700,
        "y": 505,
        "width": 260,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l3-shelf-c",
        "x": 2960,
        "y": 545,
        "width": 270,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l3-shelf-d",
        "x": 5860,
        "y": 545,
        "width": 270,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l3-step-a",
        "x": 1330,
        "y": 560,
        "width": 170,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l3-step-b",
        "x": 5670,
        "y": 560,
        "width": 180,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l3-mover-a",
        "x": 11420,
        "y": 590,
        "width": 150,
        "height": 20,
        "kind": "solid",
        "motion": {
          "axis": "x",
          "amplitude": 55,
          "speed": 1.1,
          "phase": 0
        }
      }
    ],
    "crystals": [
      {
        "id": "l3-group-a-01",
        "x": 240,
        "y": 540,
        "groupId": "l3-group-a"
      },
      {
        "id": "l3-group-a-02",
        "x": 440,
        "y": 540,
        "groupId": "l3-group-a"
      },
      {
        "id": "l3-group-a-03",
        "x": 640,
        "y": 540,
        "groupId": "l3-group-a"
      },
      {
        "id": "l3-group-b-01",
        "x": 460,
        "y": 465,
        "groupId": "l3-group-b"
      },
      {
        "id": "l3-group-b-02",
        "x": 550,
        "y": 465,
        "groupId": "l3-group-b"
      },
      {
        "id": "l3-group-b-03",
        "x": 640,
        "y": 465,
        "groupId": "l3-group-b"
      },
      {
        "id": "l3-group-c-01",
        "x": 730,
        "y": 425,
        "groupId": "l3-group-c"
      },
      {
        "id": "l3-group-c-02",
        "x": 820,
        "y": 425,
        "groupId": "l3-group-c"
      },
      {
        "id": "l3-group-c-03",
        "x": 910,
        "y": 425,
        "groupId": "l3-group-c"
      },
      {
        "id": "l3-group-d-01",
        "x": 2900,
        "y": 540,
        "groupId": "l3-group-d"
      },
      {
        "id": "l3-group-d-02",
        "x": 3120,
        "y": 540,
        "groupId": "l3-group-d"
      },
      {
        "id": "l3-group-d-03",
        "x": 3340,
        "y": 540,
        "groupId": "l3-group-d"
      },
      {
        "id": "l3-group-e-01",
        "x": 3000,
        "y": 465,
        "groupId": "l3-group-e"
      },
      {
        "id": "l3-group-e-02",
        "x": 3090,
        "y": 465,
        "groupId": "l3-group-e"
      },
      {
        "id": "l3-group-e-03",
        "x": 3180,
        "y": 465,
        "groupId": "l3-group-e"
      },
      {
        "id": "l3-group-f-01",
        "x": 5900,
        "y": 540,
        "groupId": "l3-group-f"
      },
      {
        "id": "l3-group-f-02",
        "x": 6120,
        "y": 540,
        "groupId": "l3-group-f"
      },
      {
        "id": "l3-group-f-03",
        "x": 6340,
        "y": 540,
        "groupId": "l3-group-f"
      },
      {
        "id": "l3-group-g-01",
        "x": 10350,
        "y": 540,
        "groupId": "l3-group-g"
      },
      {
        "id": "l3-group-g-02",
        "x": 10570,
        "y": 540,
        "groupId": "l3-group-g"
      },
      {
        "id": "l3-group-g-03",
        "x": 10790,
        "y": 540,
        "groupId": "l3-group-g"
      }
    ],
    "sentinels": [
      {
        "id": "l3-hopper-01",
        "kind": "hopper",
        "x": 1750,
        "y": 584,
        "width": 42,
        "height": 36,
        "patrolMinX": 1750,
        "patrolMaxX": 2200,
        "speed": 46,
        "hopHeight": 50,
        "hopPeriodMs": 1500
      },
      {
        "id": "l3-drifter-01",
        "kind": "drifter",
        "x": 3350,
        "y": 500,
        "width": 40,
        "height": 34,
        "patrolMinX": 3200,
        "patrolMaxX": 3650,
        "speed": 40,
        "bobAmplitude": 6,
        "bobPeriodMs": 4200
      },
      {
        "id": "l3-sentinel-01",
        "kind": "sentinel",
        "x": 4450,
        "y": 576,
        "width": 44,
        "height": 44,
        "patrolMinX": 4450,
        "patrolMaxX": 4900,
        "speed": 52
      },
      {
        "id": "l3-gunner-01",
        "kind": "gunner",
        "x": 6300,
        "y": 574,
        "width": 46,
        "height": 46,
        "patrolMinX": 6300,
        "patrolMaxX": 6600,
        "speed": 45,
        "aggroRange": 340,
        "fireIntervalMs": 1700,
        "projectileSpeed": 300
      },
      {
        "id": "l3-hopper-02",
        "kind": "hopper",
        "x": 10250,
        "y": 584,
        "width": 42,
        "height": 36,
        "patrolMinX": 10250,
        "patrolMaxX": 10800,
        "speed": 46,
        "hopHeight": 46,
        "hopPeriodMs": 1400
      }
    ],
    "checkpoints": [
      {
        "id": "l3-checkpoint-01",
        "x": 3250,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 3280,
        "spawnY": 574,
        "label": "潮汐中继 A"
      },
      {
        "id": "l3-checkpoint-02",
        "x": 6200,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 6230,
        "spawnY": 574,
        "label": "潮汐中继 B"
      },
      {
        "id": "l3-checkpoint-03",
        "x": 8950,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 8980,
        "spawnY": 574,
        "label": "潮汐中继 C"
      }
    ],
    "weaponPickups": [
      {
        "id": "l3-pickup-01",
        "x": 2300,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l3-pickup-02",
        "x": 7800,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l3-pickup-03",
        "x": 11600,
        "y": 592,
        "width": 26,
        "height": 26
      }
    ],
    "decorations": [
      {
        "id": "l3-deco-nebula-01",
        "kind": "nebula",
        "x": 780,
        "y": 28,
        "width": 460,
        "height": 86,
        "variant": 0
      },
      {
        "id": "l3-deco-nebula-02",
        "kind": "nebula",
        "x": 3510,
        "y": 80,
        "width": 690,
        "height": 138,
        "variant": 1
      },
      {
        "id": "l3-deco-nebula-03",
        "kind": "nebula",
        "x": 6240,
        "y": 132,
        "width": 920,
        "height": 190,
        "variant": 2
      },
      {
        "id": "l3-deco-nebula-04",
        "kind": "nebula",
        "x": 8970,
        "y": 184,
        "width": 460,
        "height": 86,
        "variant": 3
      },
      {
        "id": "l3-deco-crystalSpire-05",
        "kind": "crystalSpire",
        "x": 70,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l3-deco-tideWisp-06",
        "kind": "tideWisp",
        "x": 625,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l3-deco-crystalSpire-07",
        "kind": "crystalSpire",
        "x": 1180,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l3-deco-crystalSpire-08",
        "kind": "crystalSpire",
        "x": 1400,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l3-deco-tideWisp-09",
        "kind": "tideWisp",
        "x": 2005,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l3-deco-crystalSpire-10",
        "kind": "crystalSpire",
        "x": 2610,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l3-deco-crystalSpire-11",
        "kind": "crystalSpire",
        "x": 2850,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l3-deco-tideWisp-12",
        "kind": "tideWisp",
        "x": 3430,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l3-deco-crystalSpire-13",
        "kind": "crystalSpire",
        "x": 4010,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l3-deco-crystalSpire-14",
        "kind": "crystalSpire",
        "x": 4270,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l3-deco-tideWisp-15",
        "kind": "tideWisp",
        "x": 4875,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l3-deco-crystalSpire-16",
        "kind": "crystalSpire",
        "x": 5480,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l3-deco-crystalSpire-17",
        "kind": "crystalSpire",
        "x": 5740,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l3-deco-tideWisp-18",
        "kind": "tideWisp",
        "x": 6320,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l3-deco-crystalSpire-19",
        "kind": "crystalSpire",
        "x": 6900,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l3-deco-crystalSpire-20",
        "kind": "crystalSpire",
        "x": 7170,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l3-deco-tideWisp-21",
        "kind": "tideWisp",
        "x": 7775,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l3-deco-crystalSpire-22",
        "kind": "crystalSpire",
        "x": 8380,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l3-deco-crystalSpire-23",
        "kind": "crystalSpire",
        "x": 8650,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l3-deco-tideWisp-24",
        "kind": "tideWisp",
        "x": 9230,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l3-deco-crystalSpire-25",
        "kind": "crystalSpire",
        "x": 9810,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l3-deco-crystalSpire-26",
        "kind": "crystalSpire",
        "x": 10070,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l3-deco-tideWisp-27",
        "kind": "tideWisp",
        "x": 10650,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l3-deco-crystalSpire-28",
        "kind": "crystalSpire",
        "x": 11230,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l3-deco-crystalSpire-29",
        "kind": "crystalSpire",
        "x": 11570,
        "y": 582,
        "width": 34,
        "height": 56,
        "variant": 0
      },
      {
        "id": "l3-deco-tideWisp-30",
        "kind": "tideWisp",
        "x": 12023,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l3-deco-crystalSpire-31",
        "kind": "crystalSpire",
        "x": 12477,
        "y": 582,
        "width": 58,
        "height": 96,
        "variant": 2
      },
      {
        "id": "l3-deco-tideWisp-32",
        "kind": "tideWisp",
        "x": 12930,
        "y": 441,
        "width": 22,
        "height": 22,
        "variant": 0
      }
    ],
    "beacon": {
      "id": "l3-beacon",
      "x": 12900,
      "y": 488,
      "width": 64,
      "height": 132
    }
  },
  {
    "id": 4,
    "code": "EUROPA / E-17 / 04",
    "name": "永夜星云",
    "subtitle": "永不落下的星云悬在冰壳之上，浮空碎片在黑暗中缓缓旋转。",
    "objective": "穿过星云笼罩的夜廊，规避冲锋与射击，抵达信标。",
    "width": 15000,
    "height": 720,
    "spawnX": 92,
    "spawnY": 574,
    "theme": "night",
    "palette": {
      "skyTop": "#07091e",
      "skyBottom": "#1a1f45",
      "iceLight": "#e4e9ff",
      "iceMid": "#8f9bf0",
      "iceDeep": "#20244d",
      "accent": "#a78bfa",
      "accentSoft": "rgba(167, 139, 250, 0.18)",
      "beacon": "#ffd76b"
    },
    "platforms": [
      {
        "id": "l4-ground-a",
        "x": 0,
        "y": 620,
        "width": 1250,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l4-ground-b",
        "x": 1330,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l4-ground-c",
        "x": 2780,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l4-ground-d",
        "x": 4230,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l4-ground-e",
        "x": 5700,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l4-ground-f",
        "x": 7180,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l4-ground-g",
        "x": 8660,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l4-ground-h",
        "x": 10140,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l4-ground-i",
        "x": 11620,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l4-ground-j",
        "x": 13150,
        "y": 620,
        "width": 1850,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l4-shelf-a",
        "x": 430,
        "y": 545,
        "width": 250,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l4-shelf-b",
        "x": 700,
        "y": 505,
        "width": 260,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l4-shelf-c",
        "x": 2960,
        "y": 545,
        "width": 280,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l4-shelf-d",
        "x": 6000,
        "y": 545,
        "width": 280,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l4-step-a",
        "x": 1330,
        "y": 560,
        "width": 180,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l4-step-b",
        "x": 8660,
        "y": 560,
        "width": 180,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l4-step-c",
        "x": 11620,
        "y": 540,
        "width": 190,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l4-mover-a",
        "x": 13050,
        "y": 590,
        "width": 150,
        "height": 20,
        "kind": "solid",
        "motion": {
          "axis": "x",
          "amplitude": 55,
          "speed": 1.1,
          "phase": 0
        }
      }
    ],
    "crystals": [
      {
        "id": "l4-group-a-01",
        "x": 240,
        "y": 540,
        "groupId": "l4-group-a"
      },
      {
        "id": "l4-group-a-02",
        "x": 440,
        "y": 540,
        "groupId": "l4-group-a"
      },
      {
        "id": "l4-group-a-03",
        "x": 640,
        "y": 540,
        "groupId": "l4-group-a"
      },
      {
        "id": "l4-group-b-01",
        "x": 460,
        "y": 465,
        "groupId": "l4-group-b"
      },
      {
        "id": "l4-group-b-02",
        "x": 550,
        "y": 465,
        "groupId": "l4-group-b"
      },
      {
        "id": "l4-group-b-03",
        "x": 640,
        "y": 465,
        "groupId": "l4-group-b"
      },
      {
        "id": "l4-group-c-01",
        "x": 730,
        "y": 425,
        "groupId": "l4-group-c"
      },
      {
        "id": "l4-group-c-02",
        "x": 820,
        "y": 425,
        "groupId": "l4-group-c"
      },
      {
        "id": "l4-group-c-03",
        "x": 910,
        "y": 425,
        "groupId": "l4-group-c"
      },
      {
        "id": "l4-group-d-01",
        "x": 2900,
        "y": 540,
        "groupId": "l4-group-d"
      },
      {
        "id": "l4-group-d-02",
        "x": 3120,
        "y": 540,
        "groupId": "l4-group-d"
      },
      {
        "id": "l4-group-d-03",
        "x": 3340,
        "y": 540,
        "groupId": "l4-group-d"
      },
      {
        "id": "l4-group-e-01",
        "x": 5950,
        "y": 540,
        "groupId": "l4-group-e"
      },
      {
        "id": "l4-group-e-02",
        "x": 6170,
        "y": 540,
        "groupId": "l4-group-e"
      },
      {
        "id": "l4-group-e-03",
        "x": 6390,
        "y": 540,
        "groupId": "l4-group-e"
      },
      {
        "id": "l4-group-f-01",
        "x": 8850,
        "y": 540,
        "groupId": "l4-group-f"
      },
      {
        "id": "l4-group-f-02",
        "x": 9070,
        "y": 540,
        "groupId": "l4-group-f"
      },
      {
        "id": "l4-group-f-03",
        "x": 9290,
        "y": 540,
        "groupId": "l4-group-f"
      },
      {
        "id": "l4-group-g-01",
        "x": 11800,
        "y": 540,
        "groupId": "l4-group-g"
      },
      {
        "id": "l4-group-g-02",
        "x": 12020,
        "y": 540,
        "groupId": "l4-group-g"
      },
      {
        "id": "l4-group-g-03",
        "x": 12240,
        "y": 540,
        "groupId": "l4-group-g"
      },
      {
        "id": "l4-group-h-01",
        "x": 13450,
        "y": 540,
        "groupId": "l4-group-h"
      },
      {
        "id": "l4-group-h-02",
        "x": 13670,
        "y": 540,
        "groupId": "l4-group-h"
      },
      {
        "id": "l4-group-h-03",
        "x": 13890,
        "y": 540,
        "groupId": "l4-group-h"
      }
    ],
    "sentinels": [
      {
        "id": "l4-crawler-01",
        "kind": "crawler",
        "x": 1750,
        "y": 590,
        "width": 54,
        "height": 30,
        "patrolMinX": 1750,
        "patrolMaxX": 2200,
        "speed": 62
      },
      {
        "id": "l4-drifter-01",
        "kind": "drifter",
        "x": 3350,
        "y": 500,
        "width": 40,
        "height": 34,
        "patrolMinX": 3200,
        "patrolMaxX": 3650,
        "speed": 40,
        "bobAmplitude": 6,
        "bobPeriodMs": 4200
      },
      {
        "id": "l4-gunner-01",
        "kind": "gunner",
        "x": 4600,
        "y": 574,
        "width": 46,
        "height": 46,
        "patrolMinX": 4600,
        "patrolMaxX": 5150,
        "speed": 45,
        "aggroRange": 360,
        "fireIntervalMs": 1700,
        "projectileSpeed": 320
      },
      {
        "id": "l4-charger-01",
        "kind": "charger",
        "x": 6150,
        "y": 580,
        "width": 52,
        "height": 40,
        "patrolMinX": 6150,
        "patrolMaxX": 6700,
        "speed": 55,
        "aggroRange": 420,
        "chargeSpeed": 540,
        "chargeDurationMs": 720,
        "recoverDurationMs": 620
      },
      {
        "id": "l4-crawler-02",
        "kind": "crawler",
        "x": 9200,
        "y": 590,
        "width": 54,
        "height": 30,
        "patrolMinX": 9200,
        "patrolMaxX": 9750,
        "speed": 64
      },
      {
        "id": "l4-sentinel-01",
        "kind": "sentinel",
        "x": 12050,
        "y": 576,
        "width": 44,
        "height": 44,
        "patrolMinX": 12050,
        "patrolMaxX": 12600,
        "speed": 52
      }
    ],
    "checkpoints": [
      {
        "id": "l4-checkpoint-01",
        "x": 3350,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 3380,
        "spawnY": 574,
        "label": "永夜中继 A"
      },
      {
        "id": "l4-checkpoint-02",
        "x": 6500,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 6530,
        "spawnY": 574,
        "label": "永夜中继 B"
      },
      {
        "id": "l4-checkpoint-03",
        "x": 9500,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 9530,
        "spawnY": 574,
        "label": "永夜中继 C"
      }
    ],
    "weaponPickups": [
      {
        "id": "l4-pickup-01",
        "x": 2350,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l4-pickup-02",
        "x": 8000,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l4-pickup-03",
        "x": 12400,
        "y": 592,
        "width": 26,
        "height": 26
      }
    ],
    "decorations": [
      {
        "id": "l4-deco-nebula-01",
        "kind": "nebula",
        "x": 900,
        "y": 28,
        "width": 460,
        "height": 86,
        "variant": 0
      },
      {
        "id": "l4-deco-nebula-02",
        "kind": "nebula",
        "x": 4050,
        "y": 80,
        "width": 690,
        "height": 138,
        "variant": 1
      },
      {
        "id": "l4-deco-nebula-03",
        "kind": "nebula",
        "x": 7200,
        "y": 132,
        "width": 920,
        "height": 190,
        "variant": 2
      },
      {
        "id": "l4-deco-nebula-04",
        "kind": "nebula",
        "x": 10350,
        "y": 184,
        "width": 460,
        "height": 86,
        "variant": 3
      },
      {
        "id": "l4-deco-nebula-05",
        "kind": "nebula",
        "x": 13500,
        "y": 28,
        "width": 690,
        "height": 138,
        "variant": 0
      },
      {
        "id": "l4-deco-rockColumn-06",
        "kind": "rockColumn",
        "x": 70,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l4-deco-floatingShard-07",
        "kind": "floatingShard",
        "x": 625,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l4-deco-rockColumn-08",
        "kind": "rockColumn",
        "x": 1180,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l4-deco-rockColumn-09",
        "kind": "rockColumn",
        "x": 1400,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l4-deco-floatingShard-10",
        "kind": "floatingShard",
        "x": 2005,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l4-deco-rockColumn-11",
        "kind": "rockColumn",
        "x": 2610,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l4-deco-rockColumn-12",
        "kind": "rockColumn",
        "x": 2850,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l4-deco-floatingShard-13",
        "kind": "floatingShard",
        "x": 3455,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l4-deco-rockColumn-14",
        "kind": "rockColumn",
        "x": 4060,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l4-deco-rockColumn-15",
        "kind": "rockColumn",
        "x": 4300,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l4-deco-floatingShard-16",
        "kind": "floatingShard",
        "x": 4905,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l4-deco-rockColumn-17",
        "kind": "rockColumn",
        "x": 5510,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l4-deco-rockColumn-18",
        "kind": "rockColumn",
        "x": 5770,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l4-deco-floatingShard-19",
        "kind": "floatingShard",
        "x": 6375,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l4-deco-rockColumn-20",
        "kind": "rockColumn",
        "x": 6980,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l4-deco-rockColumn-21",
        "kind": "rockColumn",
        "x": 7250,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l4-deco-floatingShard-22",
        "kind": "floatingShard",
        "x": 7855,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l4-deco-rockColumn-23",
        "kind": "rockColumn",
        "x": 8460,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l4-deco-rockColumn-24",
        "kind": "rockColumn",
        "x": 8730,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l4-deco-floatingShard-25",
        "kind": "floatingShard",
        "x": 9335,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l4-deco-rockColumn-26",
        "kind": "rockColumn",
        "x": 9940,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l4-deco-rockColumn-27",
        "kind": "rockColumn",
        "x": 10210,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l4-deco-floatingShard-28",
        "kind": "floatingShard",
        "x": 10815,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l4-deco-rockColumn-29",
        "kind": "rockColumn",
        "x": 11420,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l4-deco-rockColumn-30",
        "kind": "rockColumn",
        "x": 11690,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l4-deco-floatingShard-31",
        "kind": "floatingShard",
        "x": 12295,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l4-deco-rockColumn-32",
        "kind": "rockColumn",
        "x": 12900,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l4-deco-rockColumn-33",
        "kind": "rockColumn",
        "x": 13220,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l4-deco-floatingShard-34",
        "kind": "floatingShard",
        "x": 13790,
        "y": 437,
        "width": 22,
        "height": 22,
        "variant": 1
      },
      {
        "id": "l4-deco-rockColumn-35",
        "kind": "rockColumn",
        "x": 14360,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l4-deco-floatingShard-36",
        "kind": "floatingShard",
        "x": 14930,
        "y": 441,
        "width": 22,
        "height": 22,
        "variant": 0
      }
    ],
    "beacon": {
      "id": "l4-beacon",
      "x": 14890,
      "y": 488,
      "width": 64,
      "height": 132
    }
  },
  {
    "id": 5,
    "code": "EUROPA / E-17 / 05",
    "name": "幽暗冰洞",
    "subtitle": "熔岩喷口在幽暗洞壁间忽明忽暗，冰晶折射出紫色的微光。",
    "objective": "在熔岩与尖刺之间穿行，点亮洞穴深处的中继信标。",
    "width": 17000,
    "height": 720,
    "spawnX": 92,
    "spawnY": 574,
    "theme": "cavern",
    "palette": {
      "skyTop": "#0d0a16",
      "skyBottom": "#241b38",
      "iceLight": "#ecdfff",
      "iceMid": "#9d7bd6",
      "iceDeep": "#241a3a",
      "accent": "#c58cff",
      "accentSoft": "rgba(197, 140, 255, 0.16)",
      "beacon": "#ffb45e"
    },
    "platforms": [
      {
        "id": "l5-ground-a",
        "x": 0,
        "y": 620,
        "width": 1250,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-ground-b",
        "x": 1330,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-ground-c",
        "x": 2780,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-ground-d",
        "x": 4230,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-ground-e",
        "x": 5700,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-ground-f",
        "x": 7180,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-ground-g",
        "x": 8660,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-ground-h",
        "x": 10190,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-ground-i",
        "x": 11720,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-ground-j",
        "x": 13250,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-ground-k",
        "x": 14780,
        "y": 620,
        "width": 2220,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l5-shelf-a",
        "x": 430,
        "y": 545,
        "width": 260,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l5-shelf-b",
        "x": 700,
        "y": 505,
        "width": 270,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l5-shelf-c",
        "x": 2960,
        "y": 545,
        "width": 280,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l5-shelf-d",
        "x": 6000,
        "y": 545,
        "width": 280,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l5-step-a",
        "x": 1330,
        "y": 560,
        "width": 180,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l5-step-b",
        "x": 8660,
        "y": 540,
        "width": 190,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l5-step-c",
        "x": 13250,
        "y": 560,
        "width": 180,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l5-mover-a",
        "x": 14670,
        "y": 590,
        "width": 150,
        "height": 20,
        "kind": "solid",
        "motion": {
          "axis": "x",
          "amplitude": 55,
          "speed": 1,
          "phase": 0
        }
      }
    ],
    "crystals": [
      {
        "id": "l5-group-a-01",
        "x": 240,
        "y": 540,
        "groupId": "l5-group-a"
      },
      {
        "id": "l5-group-a-02",
        "x": 440,
        "y": 540,
        "groupId": "l5-group-a"
      },
      {
        "id": "l5-group-a-03",
        "x": 640,
        "y": 540,
        "groupId": "l5-group-a"
      },
      {
        "id": "l5-group-b-01",
        "x": 460,
        "y": 465,
        "groupId": "l5-group-b"
      },
      {
        "id": "l5-group-b-02",
        "x": 550,
        "y": 465,
        "groupId": "l5-group-b"
      },
      {
        "id": "l5-group-b-03",
        "x": 640,
        "y": 465,
        "groupId": "l5-group-b"
      },
      {
        "id": "l5-group-c-01",
        "x": 730,
        "y": 425,
        "groupId": "l5-group-c"
      },
      {
        "id": "l5-group-c-02",
        "x": 820,
        "y": 425,
        "groupId": "l5-group-c"
      },
      {
        "id": "l5-group-c-03",
        "x": 910,
        "y": 425,
        "groupId": "l5-group-c"
      },
      {
        "id": "l5-group-d-01",
        "x": 2900,
        "y": 540,
        "groupId": "l5-group-d"
      },
      {
        "id": "l5-group-d-02",
        "x": 3120,
        "y": 540,
        "groupId": "l5-group-d"
      },
      {
        "id": "l5-group-d-03",
        "x": 3340,
        "y": 540,
        "groupId": "l5-group-d"
      },
      {
        "id": "l5-group-e-01",
        "x": 5950,
        "y": 540,
        "groupId": "l5-group-e"
      },
      {
        "id": "l5-group-e-02",
        "x": 6170,
        "y": 540,
        "groupId": "l5-group-e"
      },
      {
        "id": "l5-group-e-03",
        "x": 6390,
        "y": 540,
        "groupId": "l5-group-e"
      },
      {
        "id": "l5-group-f-01",
        "x": 8800,
        "y": 540,
        "groupId": "l5-group-f"
      },
      {
        "id": "l5-group-f-02",
        "x": 9020,
        "y": 540,
        "groupId": "l5-group-f"
      },
      {
        "id": "l5-group-f-03",
        "x": 9240,
        "y": 540,
        "groupId": "l5-group-f"
      },
      {
        "id": "l5-group-g-01",
        "x": 10400,
        "y": 540,
        "groupId": "l5-group-g"
      },
      {
        "id": "l5-group-g-02",
        "x": 10620,
        "y": 540,
        "groupId": "l5-group-g"
      },
      {
        "id": "l5-group-g-03",
        "x": 10840,
        "y": 540,
        "groupId": "l5-group-g"
      },
      {
        "id": "l5-group-h-01",
        "x": 11900,
        "y": 540,
        "groupId": "l5-group-h"
      },
      {
        "id": "l5-group-h-02",
        "x": 12120,
        "y": 540,
        "groupId": "l5-group-h"
      },
      {
        "id": "l5-group-h-03",
        "x": 12340,
        "y": 540,
        "groupId": "l5-group-h"
      },
      {
        "id": "l5-group-i-01",
        "x": 13450,
        "y": 540,
        "groupId": "l5-group-i"
      },
      {
        "id": "l5-group-i-02",
        "x": 13670,
        "y": 540,
        "groupId": "l5-group-i"
      },
      {
        "id": "l5-group-i-03",
        "x": 13890,
        "y": 540,
        "groupId": "l5-group-i"
      }
    ],
    "sentinels": [
      {
        "id": "l5-hopper-01",
        "kind": "hopper",
        "x": 1750,
        "y": 584,
        "width": 42,
        "height": 36,
        "patrolMinX": 1750,
        "patrolMaxX": 2200,
        "speed": 46,
        "hopHeight": 50,
        "hopPeriodMs": 1500
      },
      {
        "id": "l5-gunner-01",
        "kind": "gunner",
        "x": 3350,
        "y": 574,
        "width": 46,
        "height": 46,
        "patrolMinX": 3350,
        "patrolMaxX": 3900,
        "speed": 45,
        "aggroRange": 340,
        "fireIntervalMs": 1650,
        "projectileSpeed": 310
      },
      {
        "id": "l5-charger-01",
        "kind": "charger",
        "x": 4750,
        "y": 580,
        "width": 52,
        "height": 40,
        "patrolMinX": 4750,
        "patrolMaxX": 5300,
        "speed": 55,
        "aggroRange": 400,
        "chargeSpeed": 540,
        "chargeDurationMs": 700,
        "recoverDurationMs": 600
      },
      {
        "id": "l5-drifter-01",
        "kind": "drifter",
        "x": 6200,
        "y": 500,
        "width": 40,
        "height": 34,
        "patrolMinX": 6000,
        "patrolMaxX": 6500,
        "speed": 40,
        "bobAmplitude": 6,
        "bobPeriodMs": 4200
      },
      {
        "id": "l5-sentinel-01",
        "kind": "sentinel",
        "x": 7800,
        "y": 576,
        "width": 44,
        "height": 44,
        "patrolMinX": 7800,
        "patrolMaxX": 8350,
        "speed": 52
      },
      {
        "id": "l5-hopper-02",
        "kind": "hopper",
        "x": 9400,
        "y": 584,
        "width": 42,
        "height": 36,
        "patrolMinX": 9400,
        "patrolMaxX": 9950,
        "speed": 46,
        "hopHeight": 46,
        "hopPeriodMs": 1400
      },
      {
        "id": "l5-crawler-01",
        "kind": "crawler",
        "x": 12050,
        "y": 590,
        "width": 54,
        "height": 30,
        "patrolMinX": 12050,
        "patrolMaxX": 12600,
        "speed": 62
      }
    ],
    "checkpoints": [
      {
        "id": "l5-checkpoint-01",
        "x": 3350,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 3380,
        "spawnY": 574,
        "label": "洞窟中继 A"
      },
      {
        "id": "l5-checkpoint-02",
        "x": 6400,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 6430,
        "spawnY": 574,
        "label": "洞窟中继 B"
      },
      {
        "id": "l5-checkpoint-03",
        "x": 10800,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 10830,
        "spawnY": 574,
        "label": "洞窟中继 C"
      }
    ],
    "weaponPickups": [
      {
        "id": "l5-pickup-01",
        "x": 2300,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l5-pickup-02",
        "x": 7000,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l5-pickup-03",
        "x": 10000,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l5-pickup-04",
        "x": 13900,
        "y": 592,
        "width": 26,
        "height": 26
      }
    ],
    "decorations": [
      {
        "id": "l5-deco-nebula-01",
        "kind": "nebula",
        "x": 1020,
        "y": 28,
        "width": 460,
        "height": 86,
        "variant": 0
      },
      {
        "id": "l5-deco-nebula-02",
        "kind": "nebula",
        "x": 4590,
        "y": 80,
        "width": 690,
        "height": 138,
        "variant": 1
      },
      {
        "id": "l5-deco-nebula-03",
        "kind": "nebula",
        "x": 8160,
        "y": 132,
        "width": 920,
        "height": 190,
        "variant": 2
      },
      {
        "id": "l5-deco-nebula-04",
        "kind": "nebula",
        "x": 11730,
        "y": 184,
        "width": 460,
        "height": 86,
        "variant": 3
      },
      {
        "id": "l5-deco-rockColumn-05",
        "kind": "rockColumn",
        "x": 70,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-06",
        "kind": "emberVent",
        "x": 625,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-07",
        "kind": "rockColumn",
        "x": 1180,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-rockColumn-08",
        "kind": "rockColumn",
        "x": 1400,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-09",
        "kind": "emberVent",
        "x": 2005,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-10",
        "kind": "rockColumn",
        "x": 2610,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-rockColumn-11",
        "kind": "rockColumn",
        "x": 2850,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-12",
        "kind": "emberVent",
        "x": 3455,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-13",
        "kind": "rockColumn",
        "x": 4060,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-rockColumn-14",
        "kind": "rockColumn",
        "x": 4300,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-15",
        "kind": "emberVent",
        "x": 4905,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-16",
        "kind": "rockColumn",
        "x": 5510,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-rockColumn-17",
        "kind": "rockColumn",
        "x": 5770,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-18",
        "kind": "emberVent",
        "x": 6375,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-19",
        "kind": "rockColumn",
        "x": 6980,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-rockColumn-20",
        "kind": "rockColumn",
        "x": 7250,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-21",
        "kind": "emberVent",
        "x": 7855,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-22",
        "kind": "rockColumn",
        "x": 8460,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-rockColumn-23",
        "kind": "rockColumn",
        "x": 8730,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-24",
        "kind": "emberVent",
        "x": 9360,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-25",
        "kind": "rockColumn",
        "x": 9990,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-rockColumn-26",
        "kind": "rockColumn",
        "x": 10260,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-27",
        "kind": "emberVent",
        "x": 10890,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-28",
        "kind": "rockColumn",
        "x": 11520,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-rockColumn-29",
        "kind": "rockColumn",
        "x": 11790,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-30",
        "kind": "emberVent",
        "x": 12420,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-31",
        "kind": "rockColumn",
        "x": 13050,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-rockColumn-32",
        "kind": "rockColumn",
        "x": 13320,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-33",
        "kind": "emberVent",
        "x": 13950,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-34",
        "kind": "rockColumn",
        "x": 14580,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-rockColumn-35",
        "kind": "rockColumn",
        "x": 14850,
        "y": 516,
        "width": 44,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l5-deco-emberVent-36",
        "kind": "emberVent",
        "x": 15370,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-37",
        "kind": "rockColumn",
        "x": 15890,
        "y": 516,
        "width": 72,
        "height": 180,
        "variant": 2
      },
      {
        "id": "l5-deco-emberVent-38",
        "kind": "emberVent",
        "x": 16410,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 1
      },
      {
        "id": "l5-deco-rockColumn-39",
        "kind": "rockColumn",
        "x": 16930,
        "y": 516,
        "width": 58,
        "height": 148,
        "variant": 1
      }
    ],
    "beacon": {
      "id": "l5-beacon",
      "x": 16880,
      "y": 488,
      "width": 64,
      "height": 132
    }
  },
  {
    "id": 6,
    "code": "EUROPA / E-17 / 06",
    "name": "冰核核心",
    "subtitle": "欧罗巴最深处，熔岩暖光与冰晶尖塔交织，所有怪物在此汇聚。",
    "objective": "突破核心防线，击败所有威胁，点亮冰核尽头的最终信标。",
    "width": 19000,
    "height": 720,
    "spawnX": 92,
    "spawnY": 574,
    "theme": "core",
    "palette": {
      "skyTop": "#1a0a10",
      "skyBottom": "#3a1620",
      "iceLight": "#ffe9f0",
      "iceMid": "#f27fa4",
      "iceDeep": "#451a2c",
      "accent": "#ff9ec6",
      "accentSoft": "rgba(255, 158, 198, 0.16)",
      "beacon": "#ffd35e"
    },
    "platforms": [
      {
        "id": "l6-ground-a",
        "x": 0,
        "y": 620,
        "width": 1250,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-b",
        "x": 1330,
        "y": 620,
        "width": 1350,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-c",
        "x": 2780,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-d",
        "x": 4300,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-e",
        "x": 5830,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-f",
        "x": 7360,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-g",
        "x": 8890,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-h",
        "x": 10420,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-i",
        "x": 11950,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-j",
        "x": 13480,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-k",
        "x": 15010,
        "y": 620,
        "width": 1400,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-ground-l",
        "x": 16540,
        "y": 620,
        "width": 2460,
        "height": 100,
        "kind": "solid"
      },
      {
        "id": "l6-shelf-a",
        "x": 430,
        "y": 545,
        "width": 260,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l6-shelf-b",
        "x": 700,
        "y": 505,
        "width": 270,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l6-shelf-c",
        "x": 2960,
        "y": 545,
        "width": 280,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l6-shelf-d",
        "x": 6100,
        "y": 545,
        "width": 280,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l6-shelf-e",
        "x": 12100,
        "y": 545,
        "width": 280,
        "height": 16,
        "kind": "oneWay"
      },
      {
        "id": "l6-step-a",
        "x": 1330,
        "y": 560,
        "width": 180,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l6-step-b",
        "x": 8890,
        "y": 540,
        "width": 190,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l6-step-c",
        "x": 15010,
        "y": 560,
        "width": 180,
        "height": 20,
        "kind": "solid"
      },
      {
        "id": "l6-mover-a",
        "x": 16490,
        "y": 590,
        "width": 150,
        "height": 20,
        "kind": "solid",
        "motion": {
          "axis": "x",
          "amplitude": 55,
          "speed": 1,
          "phase": 0
        }
      }
    ],
    "crystals": [
      {
        "id": "l6-group-a-01",
        "x": 240,
        "y": 540,
        "groupId": "l6-group-a"
      },
      {
        "id": "l6-group-a-02",
        "x": 440,
        "y": 540,
        "groupId": "l6-group-a"
      },
      {
        "id": "l6-group-a-03",
        "x": 640,
        "y": 540,
        "groupId": "l6-group-a"
      },
      {
        "id": "l6-group-b-01",
        "x": 460,
        "y": 465,
        "groupId": "l6-group-b"
      },
      {
        "id": "l6-group-b-02",
        "x": 550,
        "y": 465,
        "groupId": "l6-group-b"
      },
      {
        "id": "l6-group-b-03",
        "x": 640,
        "y": 465,
        "groupId": "l6-group-b"
      },
      {
        "id": "l6-group-c-01",
        "x": 730,
        "y": 425,
        "groupId": "l6-group-c"
      },
      {
        "id": "l6-group-c-02",
        "x": 820,
        "y": 425,
        "groupId": "l6-group-c"
      },
      {
        "id": "l6-group-c-03",
        "x": 910,
        "y": 425,
        "groupId": "l6-group-c"
      },
      {
        "id": "l6-group-d-01",
        "x": 2900,
        "y": 540,
        "groupId": "l6-group-d"
      },
      {
        "id": "l6-group-d-02",
        "x": 3120,
        "y": 540,
        "groupId": "l6-group-d"
      },
      {
        "id": "l6-group-d-03",
        "x": 3340,
        "y": 540,
        "groupId": "l6-group-d"
      },
      {
        "id": "l6-group-e-01",
        "x": 6000,
        "y": 540,
        "groupId": "l6-group-e"
      },
      {
        "id": "l6-group-e-02",
        "x": 6220,
        "y": 540,
        "groupId": "l6-group-e"
      },
      {
        "id": "l6-group-e-03",
        "x": 6440,
        "y": 540,
        "groupId": "l6-group-e"
      },
      {
        "id": "l6-group-f-01",
        "x": 9000,
        "y": 540,
        "groupId": "l6-group-f"
      },
      {
        "id": "l6-group-f-02",
        "x": 9220,
        "y": 540,
        "groupId": "l6-group-f"
      },
      {
        "id": "l6-group-f-03",
        "x": 9440,
        "y": 540,
        "groupId": "l6-group-f"
      },
      {
        "id": "l6-group-g-01",
        "x": 10600,
        "y": 540,
        "groupId": "l6-group-g"
      },
      {
        "id": "l6-group-g-02",
        "x": 10820,
        "y": 540,
        "groupId": "l6-group-g"
      },
      {
        "id": "l6-group-g-03",
        "x": 11040,
        "y": 540,
        "groupId": "l6-group-g"
      },
      {
        "id": "l6-group-h-01",
        "x": 12100,
        "y": 540,
        "groupId": "l6-group-h"
      },
      {
        "id": "l6-group-h-02",
        "x": 12320,
        "y": 540,
        "groupId": "l6-group-h"
      },
      {
        "id": "l6-group-h-03",
        "x": 12540,
        "y": 540,
        "groupId": "l6-group-h"
      },
      {
        "id": "l6-group-i-01",
        "x": 13650,
        "y": 540,
        "groupId": "l6-group-i"
      },
      {
        "id": "l6-group-i-02",
        "x": 13870,
        "y": 540,
        "groupId": "l6-group-i"
      },
      {
        "id": "l6-group-i-03",
        "x": 14090,
        "y": 540,
        "groupId": "l6-group-i"
      },
      {
        "id": "l6-group-j-01",
        "x": 15200,
        "y": 540,
        "groupId": "l6-group-j"
      },
      {
        "id": "l6-group-j-02",
        "x": 15420,
        "y": 540,
        "groupId": "l6-group-j"
      },
      {
        "id": "l6-group-j-03",
        "x": 15640,
        "y": 540,
        "groupId": "l6-group-j"
      }
    ],
    "sentinels": [
      {
        "id": "l6-crawler-01",
        "kind": "crawler",
        "x": 1750,
        "y": 590,
        "width": 54,
        "height": 30,
        "patrolMinX": 1750,
        "patrolMaxX": 2200,
        "speed": 62
      },
      {
        "id": "l6-drifter-01",
        "kind": "drifter",
        "x": 3400,
        "y": 500,
        "width": 40,
        "height": 34,
        "patrolMinX": 3250,
        "patrolMaxX": 3700,
        "speed": 40,
        "bobAmplitude": 6,
        "bobPeriodMs": 4200
      },
      {
        "id": "l6-sentinel-01",
        "kind": "sentinel",
        "x": 4600,
        "y": 576,
        "width": 44,
        "height": 44,
        "patrolMinX": 4600,
        "patrolMaxX": 5150,
        "speed": 52
      },
      {
        "id": "l6-hopper-01",
        "kind": "hopper",
        "x": 6300,
        "y": 584,
        "width": 42,
        "height": 36,
        "patrolMinX": 6300,
        "patrolMaxX": 6850,
        "speed": 46,
        "hopHeight": 50,
        "hopPeriodMs": 1500
      },
      {
        "id": "l6-gunner-01",
        "kind": "gunner",
        "x": 8000,
        "y": 574,
        "width": 46,
        "height": 46,
        "patrolMinX": 8000,
        "patrolMaxX": 8550,
        "speed": 45,
        "aggroRange": 360,
        "fireIntervalMs": 1700,
        "projectileSpeed": 330
      },
      {
        "id": "l6-charger-01",
        "kind": "charger",
        "x": 9600,
        "y": 580,
        "width": 52,
        "height": 40,
        "patrolMinX": 9600,
        "patrolMaxX": 10150,
        "speed": 55,
        "aggroRange": 420,
        "chargeSpeed": 560,
        "chargeDurationMs": 740,
        "recoverDurationMs": 640
      },
      {
        "id": "l6-spiker-01",
        "kind": "spiker",
        "x": 11100,
        "y": 600,
        "width": 56,
        "height": 20,
        "patrolMinX": 11100,
        "patrolMaxX": 11650,
        "speed": 0,
        "spikeHeight": 26,
        "spikeCycleMs": 1900,
        "spikeUpMs": 620
      },
      {
        "id": "l6-gunner-02",
        "kind": "gunner",
        "x": 12550,
        "y": 574,
        "width": 46,
        "height": 46,
        "patrolMinX": 12550,
        "patrolMaxX": 13100,
        "speed": 45,
        "aggroRange": 340,
        "fireIntervalMs": 1700,
        "projectileSpeed": 310
      }
    ],
    "checkpoints": [
      {
        "id": "l6-checkpoint-01",
        "x": 3400,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 3430,
        "spawnY": 574,
        "label": "核心中继 A"
      },
      {
        "id": "l6-checkpoint-02",
        "x": 6500,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 6530,
        "spawnY": 574,
        "label": "核心中继 B"
      },
      {
        "id": "l6-checkpoint-03",
        "x": 9700,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 9730,
        "spawnY": 574,
        "label": "核心中继 C"
      },
      {
        "id": "l6-checkpoint-04",
        "x": 12700,
        "y": 486,
        "width": 42,
        "height": 134,
        "spawnX": 12730,
        "spawnY": 574,
        "label": "核心中继 D"
      }
    ],
    "weaponPickups": [
      {
        "id": "l6-pickup-01",
        "x": 2300,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l6-pickup-02",
        "x": 7100,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l6-pickup-03",
        "x": 10500,
        "y": 592,
        "width": 26,
        "height": 26
      },
      {
        "id": "l6-pickup-04",
        "x": 15600,
        "y": 592,
        "width": 26,
        "height": 26
      }
    ],
    "decorations": [
      {
        "id": "l6-deco-aurora-01",
        "kind": "aurora",
        "x": 1140,
        "y": 28,
        "width": 460,
        "height": 86,
        "variant": 0
      },
      {
        "id": "l6-deco-aurora-02",
        "kind": "aurora",
        "x": 5130,
        "y": 80,
        "width": 690,
        "height": 138,
        "variant": 1
      },
      {
        "id": "l6-deco-aurora-03",
        "kind": "aurora",
        "x": 9120,
        "y": 132,
        "width": 920,
        "height": 190,
        "variant": 2
      },
      {
        "id": "l6-deco-aurora-04",
        "kind": "aurora",
        "x": 13110,
        "y": 184,
        "width": 460,
        "height": 86,
        "variant": 3
      },
      {
        "id": "l6-deco-aurora-05",
        "kind": "aurora",
        "x": 17100,
        "y": 28,
        "width": 690,
        "height": 138,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-06",
        "kind": "emberVent",
        "x": 70,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-07",
        "kind": "crystalSpire",
        "x": 625,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-08",
        "kind": "emberVent",
        "x": 1180,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-09",
        "kind": "emberVent",
        "x": 1400,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-10",
        "kind": "crystalSpire",
        "x": 2005,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-11",
        "kind": "emberVent",
        "x": 2610,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-12",
        "kind": "emberVent",
        "x": 2850,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-13",
        "kind": "crystalSpire",
        "x": 3480,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-14",
        "kind": "emberVent",
        "x": 4110,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-15",
        "kind": "emberVent",
        "x": 4370,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-16",
        "kind": "crystalSpire",
        "x": 5000,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-17",
        "kind": "emberVent",
        "x": 5630,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-18",
        "kind": "emberVent",
        "x": 5900,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-19",
        "kind": "crystalSpire",
        "x": 6530,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-20",
        "kind": "emberVent",
        "x": 7160,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-21",
        "kind": "emberVent",
        "x": 7430,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-22",
        "kind": "crystalSpire",
        "x": 8060,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-23",
        "kind": "emberVent",
        "x": 8690,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-24",
        "kind": "emberVent",
        "x": 8960,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-25",
        "kind": "crystalSpire",
        "x": 9590,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-26",
        "kind": "emberVent",
        "x": 10220,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-27",
        "kind": "emberVent",
        "x": 10490,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-28",
        "kind": "crystalSpire",
        "x": 11120,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-29",
        "kind": "emberVent",
        "x": 11750,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-30",
        "kind": "emberVent",
        "x": 12020,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-31",
        "kind": "crystalSpire",
        "x": 12650,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-32",
        "kind": "emberVent",
        "x": 13280,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-33",
        "kind": "emberVent",
        "x": 13550,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-34",
        "kind": "crystalSpire",
        "x": 14180,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-35",
        "kind": "emberVent",
        "x": 14810,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-36",
        "kind": "emberVent",
        "x": 15080,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-37",
        "kind": "crystalSpire",
        "x": 15710,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-38",
        "kind": "emberVent",
        "x": 16340,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-39",
        "kind": "emberVent",
        "x": 16610,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-40",
        "kind": "crystalSpire",
        "x": 17074,
        "y": 582,
        "width": 46,
        "height": 76,
        "variant": 1
      },
      {
        "id": "l6-deco-emberVent-41",
        "kind": "emberVent",
        "x": 17538,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-42",
        "kind": "crystalSpire",
        "x": 18002,
        "y": 582,
        "width": 34,
        "height": 116,
        "variant": 0
      },
      {
        "id": "l6-deco-emberVent-43",
        "kind": "emberVent",
        "x": 18466,
        "y": 596,
        "width": 30,
        "height": 46,
        "variant": 0
      },
      {
        "id": "l6-deco-crystalSpire-44",
        "kind": "crystalSpire",
        "x": 18930,
        "y": 582,
        "width": 58,
        "height": 76,
        "variant": 2
      }
    ],
    "beacon": {
      "id": "l6-beacon",
      "x": 18880,
      "y": 488,
      "width": 64,
      "height": 132
    }
  }
];

/** 地形装饰板：按关卡主题批量生成近景地形装饰（雪堆/碎石/晶簇/钟乳石/冰山/松树/熔岩缝/气泡）。 */
const TERRAIN_PLATES: ReadonlyArray<{
  levelId: number;
  plates: Array<{
    kind: LevelDecorationKind;
    x: number;
    y: number;
    width: number;
    height: number;
    count: number;
    step: number;
  }>;
}> = [
  {
    levelId: 1,
    plates: [
      { kind: "snowDrift", x: 40, y: 585, width: 90, height: 35, count: 70, step: 120 },
      { kind: "crystalCluster", x: 240, y: 588, width: 34, height: 32, count: 12, step: 640 },
    ],
  },
  {
    levelId: 2,
    plates: [
      { kind: "rockRubble", x: 40, y: 598, width: 70, height: 22, count: 86, step: 120 },
      { kind: "stalactite", x: 160, y: 0, width: 60, height: 120, count: 10, step: 1000 },
    ],
  },
  {
    levelId: 3,
    plates: [
      { kind: "iceberg", x: 120, y: 480, width: 140, height: 110, count: 14, step: 880 },
      { kind: "bubbleRise", x: 40, y: 430, width: 100, height: 170, count: 80, step: 150 },
    ],
  },
  {
    levelId: 4,
    plates: [
      { kind: "frozenPine", x: 80, y: 530, width: 56, height: 90, count: 40, step: 340 },
      { kind: "snowDrift", x: 40, y: 585, width: 90, height: 35, count: 50, step: 260 },
    ],
  },
  {
    levelId: 5,
    plates: [
      { kind: "stalactite", x: 60, y: 0, width: 60, height: 120, count: 30, step: 520 },
      { kind: "rockRubble", x: 40, y: 598, width: 70, height: 22, count: 70, step: 220 },
      { kind: "crystalCluster", x: 260, y: 588, width: 34, height: 32, count: 14, step: 1080 },
    ],
  },
  {
    levelId: 6,
    plates: [
      { kind: "magmaVein", x: 40, y: 600, width: 80, height: 20, count: 70, step: 240 },
      { kind: "crystalCluster", x: 220, y: 588, width: 34, height: 32, count: 16, step: 1080 },
      { kind: "stalactite", x: 140, y: 0, width: 60, height: 120, count: 12, step: 1440 },
    ],
  },
];

/** 将地形装饰板扩展为具体装饰物（纯背景，不参与碰撞）。 */
function expandTerrainDecorations(levels: readonly PlatformerLevel[]): void {
  for (const entry of TERRAIN_PLATES) {
    const level = levels.find((item) => item.id === entry.levelId);
    if (!level) {
      throw new Error(`Unknown terrain plate level id: ${entry.levelId}`);
    }
    const generated: LevelDecoration[] = [];
    for (const plate of entry.plates) {
      for (let i = 0; i < plate.count; i += 1) {
        const x = plate.x + i * plate.step;
        if (x + plate.width > level.width) {
          throw new Error(`Terrain plate overflows level ${level.id}.`);
        }
        generated.push({
          id: `l${level.id}-terrain-${plate.kind}-${String(i + 1).padStart(2, "0")}`,
          kind: plate.kind,
          x,
          y: plate.y,
          width: plate.width,
          height: plate.height,
          variant: i % 4,
        });
      }
    }
    level.decorations.push(...generated);
  }
}
expandTerrainDecorations(PLATFORMER_LEVELS);

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

