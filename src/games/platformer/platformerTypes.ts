export const PLATFORMER_LOGICAL_WIDTH = 1280;
export const PLATFORMER_LOGICAL_HEIGHT = 720;
export const PLATFORMER_STEP_SECONDS = 1 / 60;
export const PLATFORMER_STEP_MS = 1000 / 60;
export const PLATFORMER_TOTAL_LEVELS = 6;
export const PLATFORMER_INITIAL_LIVES = 3;
export const PLATFORMER_SAVE_SLOT = "platformer_main";

export const PLATFORMER_MOVE_SPEED = 260;
export const PLATFORMER_ACCELERATION = 1200;
export const PLATFORMER_DECELERATION = 1600;
export const PLATFORMER_JUMP_SPEED = 560;
export const PLATFORMER_GRAVITY = 1600;
export const PLATFORMER_MAX_FALL_SPEED = 900;
export const PLATFORMER_JUMP_CUTOFF = 0.6;
export const PLATFORMER_COYOTE_MS = 100;
export const PLATFORMER_JUMP_BUFFER_MS = 120;
export const PLATFORMER_HIT_INVINCIBILITY_MS = 1500;
export const PLATFORMER_ASSISTED_COYOTE_MS = 160;
export const PLATFORMER_ASSISTED_JUMP_BUFFER_MS = 200;

export const PLATFORMER_SCORE_CRYSTAL = 100;
export const PLATFORMER_SCORE_SENTINEL = 250;
export const PLATFORMER_SCORE_CHECKPOINT = 100;
export const PLATFORMER_SCORE_FULL_COLLECTION = 750;
export const PLATFORMER_SCORE_ZERO_DEATH = 1000;
export const PLATFORMER_SCORE_BEACON = 1000;
export const PLATFORMER_SCORE_VICTORY = 2000;

export const PLATFORMER_LEVEL_CRYSTALS = [15, 18, 21, 24, 27, 30] as const;
export const PLATFORMER_LEVEL_SENTINELS = [3, 4, 5, 6, 7, 8] as const;
export const PLATFORMER_LEVEL_CHECKPOINTS = [2, 2, 3, 3, 3, 4] as const;

// 武器系统常量
export const PLATFORMER_WEAPON_START_AMMO = 6;
export const PLATFORMER_WEAPON_MAX_AMMO = 30;
export const PLATFORMER_WEAPON_PICKUP_AMMO = 4;
export const PLATFORMER_SHOOT_COOLDOWN_MS = 240;
export const PLATFORMER_PROJECTILE_SPEED = 560;
export const PLATFORMER_PROJECTILE_LIFE_MS = 850;
export const PLATFORMER_PROJECTILE_WIDTH = 10;
export const PLATFORMER_PROJECTILE_HEIGHT = 8;

export type PlatformKind = "solid" | "oneWay";

export interface PlatformMotion {
  axis: "x" | "y";
  amplitude: number;
  speed: number;
  phase: number;
}

export interface PlatformDefinition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: PlatformKind;
  motion?: PlatformMotion;
}

export interface CrystalDefinition {
  id: string;
  groupId: string;
  x: number;
  y: number;
}

export type SentinelKind =
  | "sentinel"
  | "crawler"
  | "drifter"
  | "hopper"
  | "gunner"
  | "charger"
  | "spiker";

export interface SentinelDefinition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  patrolMinX: number;
  patrolMaxX: number;
  speed: number;
  /** 怪物种类，默认 "sentinel"（经典哨兵）。 */
  kind?: SentinelKind;
  /** 浮游体垂直正弦摆动幅度（像素），默认 5。 */
  bobAmplitude?: number;
  /** 浮游体水平漂移周期（毫秒）。 */
  bobPeriodMs?: number;
  /** 弹跳兽跳跃峰值高度（像素）。 */
  hopHeight?: number;
  /** 弹跳兽一次跳跃的周期（毫秒）。 */
  hopPeriodMs?: number;
  /** 枪手/冲锋兽开始攻击的距离（像素），默认 460。 */
  aggroRange?: number;
  /** 枪手射击间隔（毫秒），默认 1900。 */
  fireIntervalMs?: number;
  /** 枪手弹体速度（像素/秒），默认 300。 */
  projectileSpeed?: number;
  /** 冲锋兽冲锋速度（像素/秒），默认 520。 */
  chargeSpeed?: number;
  /** 冲锋兽冲锋持续时间（毫秒），默认 720。 */
  chargeDurationMs?: number;
  /** 冲锋兽恢复/眩晕时间（毫秒），默认 620。 */
  recoverDurationMs?: number;
  /** 尖刺傀儡伸出尖刺的高度（像素），默认 22。 */
  spikeHeight?: number;
  /** 尖刺傀儡尖刺周期（毫秒），默认 2000。 */
  spikeCycleMs?: number;
  /** 尖刺傀儡尖刺保持时间（毫秒），默认 650。 */
  spikeUpMs?: number;
}

export interface CheckpointDefinition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  label: string;
}

export interface BeaconDefinition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WeaponPickupDefinition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PlatformerTheme = "icefield" | "gorge" | "tide" | "night" | "cavern" | "core";

export type LevelDecorationKind =
  | "aurora"
  | "nebula"
  | "iceSpire"
  | "crystalSpire"
  | "rockColumn"
  | "tideWisp"
  | "emberVent"
  | "floatingShard";

/** 场景装饰物：仅影响背景渲染，不参与碰撞。 */
export interface LevelDecoration {
  id: string;
  kind: LevelDecorationKind;
  x: number;
  y: number;
  width: number;
  height: number;
  variant: number;
}

export interface LevelPalette {
  skyTop: string;
  skyBottom: string;
  iceLight: string;
  iceMid: string;
  iceDeep: string;
  accent: string;
  accentSoft: string;
  beacon: string;
}

export interface PlatformerLevel {
  id: number;
  code: string;
  name: string;
  subtitle: string;
  objective: string;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  theme: PlatformerTheme;
  palette: LevelPalette;
  platforms: PlatformDefinition[];
  crystals: CrystalDefinition[];
  sentinels: SentinelDefinition[];
  checkpoints: CheckpointDefinition[];
  weaponPickups: WeaponPickupDefinition[];
  decorations: LevelDecoration[];
  beacon: BeaconDefinition;
}

export interface PlatformerInput {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpPressed: boolean;
  downPressed: boolean;
  firePressed: boolean;
  assisted: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  previousX: number;
  previousY: number;
  facing: -1 | 1;
  onGround: boolean;
  groundPlatformId: string | null;
  coyoteMs: number;
  jumpBufferMs: number;
  jumpHeldLast: boolean;
  invincibleMs: number;
  dropThroughPlatformId: string | null;
}

export interface CameraState {
  x: number;
  previousX: number;
}

export type ProjectileKind = "plasma" | "crystalShot";

export interface ProjectileState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  kind: ProjectileKind;
  owner: "player" | "enemy";
  lifeMs: number;
  fromSentinelId?: string;
}

export interface PlayerWeaponState {
  ammo: number;
  maxAmmo: number;
  cooldownMs: number;
}

export interface RuntimeSentinel {
  definition: SentinelDefinition;
  x: number;
  /** 相对 definition.y 的垂直偏移（像素），用于浮游/弹跳动画。 */
  y: number;
  direction: -1 | 1;
  /** 动画相位（毫秒），与 levelTimeMs 同步，暂停时冻结。 */
  phaseMs: number;
  defeated: boolean;
  /** 攻击冷却计时（毫秒）：枪手射击间隔、冲锋兽恢复、尖刺傀儡周期。 */
  attackTimerMs?: number;
  /** 冲锋兽行为状态。 */
  mode?: "patrol" | "charge" | "recover";
}

export interface PlatformOffset {
  x: number;
  y: number;
}

export type PlatformerWorldStatus = "playing" | "level_complete" | "game_over" | "victory";

export interface PlatformerWorld {
  levelIndex: number;
  levelId: number;
  status: PlatformerWorldStatus;
  player: PlayerState;
  camera: CameraState;
  platformOffsets: Record<string, PlatformOffset>;
  sentinels: RuntimeSentinel[];
  projectiles: ProjectileState[];
  weapon: PlayerWeaponState;
  collectedPickupIds: string[];
  score: number;
  lives: number;
  sessionId: string;
  assisted: boolean;
  collectedItemIds: string[];
  defeatedSentinelIds: string[];
  activatedCheckpointIds: string[];
  lastCheckpointIdByLevel: Record<string, string>;
  deathsByLevel: Record<string, number>;
  completedLevelIds: number[];
  reachedBeaconLevelIds: number[];
  levelDurations: Record<string, number>;
  levelScores: Record<string, number>;
  totalDurationMs: number;
  levelDurationMs: number;
  levelTimeMs: number;
  lastDeathReason: "fall" | "sentinel" | null;
  deathFlashMs: number;
  checkpointFlashMs: number;
  crystalFlashMs: number;
  landedFlashMs: number;
}

export interface PlatformerLevelContext {
  score: number;
  lives: number;
  sessionId: string;
  assisted: boolean;
  collectedItemIds: string[];
  defeatedSentinelIds: string[];
  activatedCheckpointIds: string[];
  lastCheckpointIdByLevel: Record<string, string>;
  deathsByLevel: Record<string, number>;
  completedLevelIds: number[];
  reachedBeaconLevelIds: number[];
  levelDurations: Record<string, number>;
  levelScores: Record<string, number>;
  totalDurationMs: number;
}

export type PlatformerEvent =
  | { type: "jump" }
  | { type: "land" }
  | { type: "crystal"; crystalId: string; score: number }
  | { type: "sentinel_stomped"; sentinelId: string; score: number }
  | { type: "sentinel_shot"; sentinelId: string; score: number }
  | { type: "shot_fired" }
  | { type: "projectile_hit"; source: "player" | "enemy" }
  | { type: "weapon_pickup"; pickupId: string; ammo: number }
  | { type: "checkpoint"; checkpointId: string; score: number }
  | { type: "damage"; reason: "fall" | "sentinel"; lives: number }
  | { type: "level_complete"; levelId: number; scoreEarned: number }
  | { type: "game_over" }
  | { type: "victory" };

export interface PlatformerStepResult {
  world: PlatformerWorld;
  events: PlatformerEvent[];
}

export interface PlatformerRestoreSnapshot {
  levelIndex: number;
  context: PlatformerLevelContext;
  lastCheckpointId: string;
  levelDurationMs: number;
  levelTimeMs: number;
}

export interface PlatformerSaveDetails {
  schemaVersion: 1;
  levelIndex: number;
  sessionId: string;
  assisted: boolean;
  collectedItemIds: string[];
  defeatedSentinelIds: string[];
  activatedCheckpointIds: string[];
  lastCheckpointIdByLevel: Record<string, string>;
  deathsByLevel: Record<string, number>;
  completedLevelIds: number[];
  reachedBeaconLevelIds: number[];
  levelDurations: Record<string, number>;
  levelScores: Record<string, number>;
  totalDurationMs: number;
  levelDurationMs: number;
  levelTimeMs: number;
}

export interface PlatformerMatchLevelResult {
  levelId: number;
  score: number;
  crystalsCollected: number;
  crystalsTotal: number;
  sentinelsDefeated: number;
  sentinelsTotal: number;
  checkpointsActivated: number;
  checkpointsTotal: number;
  deaths: number;
  durationMs: number;
  completed: boolean;
  reachedBeacon: boolean;
}

export interface PlatformerMatchSubmission {
  sessionId: string;
  outcome: "game_over" | "victory";
  score: number;
  durationMs: number;
  levelsCompleted: number;
  crystalsCollected: number;
  sentinelsDefeated: number;
  deaths: number;
  levelResults: PlatformerMatchLevelResult[];
}

export type PlatformerPhase =
  | "ready"
  | "level_intro"
  | "playing"
  | "paused"
  | "level_complete"
  | "game_over"
  | "victory"
  | "result";

export type PlatformerSubmissionStatus = "idle" | "saving" | "saved" | "failed";

export interface PlatformerRunResult {
  submission: PlatformerMatchSubmission;
  sessionId: string;
  outcome: "game_over" | "victory";
  score: number;
  durationMs: number;
  levelsCompleted: number;
  crystalsCollected: number;
  sentinelsDefeated: number;
  deaths: number;
  levelResults: PlatformerMatchLevelResult[];
}

export interface PlatformerSaveRecord {
  slot: string;
  levelId: number;
  checkpointId: string;
  score: number;
  lives: number;
  details: unknown;
  updatedAt: number;
}
