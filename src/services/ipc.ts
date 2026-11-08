import { invoke } from "@tauri-apps/api/core";

import type { GameId } from "./gameCatalog";

export interface GameStat {
  gameId: string;
  bestScore: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalPlayMs: number;
  lastPlayedAt: number | null;
}

export type SnakeMatchOutcome = "game_over" | "victory";

export interface SnakeMatchSubmission {
  sessionId: string;
  outcome: SnakeMatchOutcome;
  score: number;
  durationMs: number;
  foodEaten: number;
  finalLength: number;
  speedLevel: number;
  tickMs: number;
}

export interface SnakeMatchSubmissionResult {
  recorded: boolean;
  stat: GameStat;
}

export interface PlatformerSave {
  slot: string;
  levelId: number;
  checkpointId: string;
  score: number;
  lives: number;
  details: unknown;
  updatedAt: number;
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

export interface PlatformerMatchSubmissionResult {
  recorded: boolean;
  stat: GameStat;
}

export interface SchemaInfo {
  version: number;
  path: string;
  storageMode: "sqlite" | "browser";
}

export interface BootstrapData {
  settings: Record<string, unknown>;
  gameStats: GameStat[];
  latestPlatformerSave: PlatformerSave | null;
  schema: SchemaInfo;
}

export interface SettingRecord {
  key: string;
  value: unknown;
  updatedAt: number;
}

export type SettingKey = "theme" | "sound_enabled" | "reduced_motion" | "master_volume";

export const BROWSER_SETTINGS_KEY = "europa.browser-settings";
export const BROWSER_SNAKE_LEDGER_KEY = "europa.browser-snake-ledger";
export const BROWSER_PLATFORMER_SAVE_KEY = "europa.browser-platformer-save";
export const BROWSER_PLATFORMER_LEDGER_KEY = "europa.browser-platformer-ledger";

interface BrowserSnakeLedger {
  sessionIds: string[];
  stat: GameStat | null;
}

interface BrowserPlatformerLedger {
  sessionIds: string[];
  submissions: PlatformerMatchSubmission[];
  stat: GameStat | null;
}

type TauriWindow = Window & {
  __TAURI_INTERNALS__?: unknown;
};

export function isTauriEnvironment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return Boolean((window as TauriWindow).__TAURI_INTERNALS__);
}

export async function loadBootstrap(): Promise<BootstrapData> {
  if (!isTauriEnvironment()) {
    return loadBrowserBootstrap();
  }

  return invoke<BootstrapData>("load_bootstrap");
}

export async function saveSetting(key: SettingKey, value: unknown): Promise<SettingRecord> {
  if (!isTauriEnvironment()) {
    return saveBrowserSetting(key, value);
  }

  return invoke<SettingRecord>("save_setting", {
    key,
    valueJson: JSON.stringify(value),
  });
}

export async function submitSnakeMatch(
  submission: SnakeMatchSubmission,
): Promise<SnakeMatchSubmissionResult> {
  if (!isTauriEnvironment()) {
    return submitBrowserSnakeMatch(submission);
  }

  return invoke<SnakeMatchSubmissionResult>("submit_snake_match", { submission });
}

export async function loadPlatformerCheckpoint(slot: string): Promise<PlatformerSave | null> {
  if (!isTauriEnvironment()) {
    return readBrowserPlatformerSave();
  }

  return invoke<PlatformerSave | null>("load_platformer_checkpoint", { slot });
}

export async function savePlatformerCheckpoint(record: PlatformerSave): Promise<PlatformerSave> {
  if (!isTauriEnvironment()) {
    return saveBrowserPlatformerCheckpoint(record);
  }

  return invoke<PlatformerSave>("save_platformer_checkpoint", { record });
}

export async function clearPlatformerCheckpoint(slot: string): Promise<null> {
  if (!isTauriEnvironment()) {
    clearBrowserPlatformerCheckpoint(slot);
    return null;
  }

  return invoke<null>("clear_platformer_checkpoint", { slot });
}

export async function submitPlatformerMatch(
  submission: PlatformerMatchSubmission,
): Promise<PlatformerMatchSubmissionResult> {
  if (!isTauriEnvironment()) {
    return submitBrowserPlatformerMatch(submission);
  }

  return invoke<PlatformerMatchSubmissionResult>("submit_platformer_match", { submission });
}

function loadBrowserBootstrap(): BootstrapData {
  const settings = safelyReadBrowserSettings();
  const snakeLedger = readBrowserSnakeLedger();
  const platformerLedger = readBrowserPlatformerLedger();
  const gameStats: GameStat[] = [];
  if (snakeLedger.stat) {
    gameStats.push(snakeLedger.stat);
  }
  if (platformerLedger.stat) {
    gameStats.push(platformerLedger.stat);
  }

  return {
    settings,
    gameStats,
    latestPlatformerSave: readBrowserPlatformerSave(),
    schema: {
      version: 0,
      path: "浏览器预览模式 · 不写入 SQLite",
      storageMode: "browser",
    },
  };
}

function saveBrowserSetting(key: SettingKey, value: unknown): SettingRecord {
  const settings = safelyReadBrowserSettings();
  const updatedAt = Date.now();
  settings[key] = value;
  localStorage.setItem(BROWSER_SETTINGS_KEY, JSON.stringify(settings));

  return {
    key,
    value,
    updatedAt,
  };
}

function submitBrowserSnakeMatch(
  submission: SnakeMatchSubmission,
): SnakeMatchSubmissionResult {
  validateBrowserSnakeSubmission(submission);
  const ledger = readBrowserSnakeLedger();
  const existingStat = ledger.stat ?? emptySnakeStat();

  if (ledger.sessionIds.includes(submission.sessionId)) {
    return { recorded: false, stat: existingStat };
  }

  const now = Date.now();
  const victory = submission.outcome === "victory";
  const stat: GameStat = {
    gameId: "snake",
    bestScore: Math.max(existingStat.bestScore, submission.score),
    gamesPlayed: existingStat.gamesPlayed + 1,
    wins: existingStat.wins + (victory ? 1 : 0),
    losses: existingStat.losses + (victory ? 0 : 1),
    draws: existingStat.draws,
    totalPlayMs: existingStat.totalPlayMs + submission.durationMs,
    lastPlayedAt: now,
  };
  const nextLedger: BrowserSnakeLedger = {
    sessionIds: [...ledger.sessionIds, submission.sessionId],
    stat,
  };
  localStorage.setItem(BROWSER_SNAKE_LEDGER_KEY, JSON.stringify(nextLedger));

  return { recorded: true, stat };
}

function validateBrowserSnakeSubmission(submission: SnakeMatchSubmission): void {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(submission.sessionId)) {
    throw new Error("对局会话 ID 无效。");
  }
  if (submission.outcome !== "game_over" && submission.outcome !== "victory") {
    throw new Error("对局结果无效。");
  }
  if (!Number.isInteger(submission.durationMs) || submission.durationMs < 0 || submission.durationMs > 86_400_000) {
    throw new Error("对局时长无效。");
  }
  if (!Number.isInteger(submission.foodEaten) || submission.foodEaten < 0 || submission.foodEaten > 396) {
    throw new Error("食物数量无效。");
  }
  if (submission.finalLength !== 4 + submission.foodEaten) {
    throw new Error("蛇身长度无效。");
  }

  const expectedSpeedLevel = Math.floor(submission.foodEaten / 5) + 1;
  const expectedTickMs = Math.max(65, 130 - Math.floor(submission.foodEaten / 5) * 8);
  if (submission.speedLevel !== expectedSpeedLevel || submission.tickMs !== expectedTickMs) {
    throw new Error("速度数据无效。");
  }

  const victory = submission.outcome === "victory";
  const expectedScore = submission.foodEaten * 10 + (victory ? 500 : 0);
  if (submission.score !== expectedScore || victory !== (submission.foodEaten === 396)) {
    throw new Error("对局分数无效。");
  }
}

function emptySnakeStat(): GameStat {
  return {
    gameId: "snake",
    bestScore: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalPlayMs: 0,
    lastPlayedAt: null,
  };
}

function emptyPlatformerStat(): GameStat {
  return {
    gameId: "platformer",
    bestScore: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalPlayMs: 0,
    lastPlayedAt: null,
  };
}

function readBrowserSnakeLedger(): BrowserSnakeLedger {
  try {
    const raw = localStorage.getItem(BROWSER_SNAKE_LEDGER_KEY);
    if (!raw) {
      return { sessionIds: [], stat: null };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { sessionIds: [], stat: null };
    }

    const candidate = parsed as Partial<BrowserSnakeLedger>;
    const sessionIds = Array.isArray(candidate.sessionIds)
      ? candidate.sessionIds.filter((value): value is string => typeof value === "string")
      : [];
    const stat = isGameStat(candidate.stat) ? candidate.stat : null;
    return { sessionIds, stat };
  } catch {
    return { sessionIds: [], stat: null };
  }
}

function readBrowserPlatformerLedger(): BrowserPlatformerLedger {
  try {
    const raw = localStorage.getItem(BROWSER_PLATFORMER_LEDGER_KEY);
    if (!raw) {
      return { sessionIds: [], submissions: [], stat: null };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { sessionIds: [], submissions: [], stat: null };
    }

    const candidate = parsed as Partial<BrowserPlatformerLedger>;
    const sessionIds = Array.isArray(candidate.sessionIds)
      ? candidate.sessionIds.filter((value): value is string => typeof value === "string")
      : [];
    const submissions = Array.isArray(candidate.submissions)
      ? candidate.submissions.filter((value): value is PlatformerMatchSubmission =>
          isPlatformerSubmission(value),
        )
      : [];
    const stat = isGameStat(candidate.stat) ? candidate.stat : null;
    return { sessionIds, submissions, stat };
  } catch {
    return { sessionIds: [], submissions: [], stat: null };
  }
}

function readBrowserPlatformerSave(): PlatformerSave | null {
  try {
    const raw = localStorage.getItem(BROWSER_PLATFORMER_SAVE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    const candidate = parsed as Partial<PlatformerSave>;
    if (
      typeof candidate.slot !== "string" ||
      typeof candidate.levelId !== "number" ||
      typeof candidate.checkpointId !== "string" ||
      typeof candidate.score !== "number" ||
      typeof candidate.lives !== "number" ||
      typeof candidate.updatedAt !== "number"
    ) {
      return null;
    }

    return {
      slot: candidate.slot,
      levelId: candidate.levelId,
      checkpointId: candidate.checkpointId,
      score: candidate.score,
      lives: candidate.lives,
      details: candidate.details ?? null,
      updatedAt: candidate.updatedAt,
    };
  } catch {
    return null;
  }
}

function saveBrowserPlatformerCheckpoint(record: PlatformerSave): PlatformerSave {
  const normalized: PlatformerSave = {
    ...record,
    updatedAt: Date.now(),
  };
  localStorage.setItem(BROWSER_PLATFORMER_SAVE_KEY, JSON.stringify(normalized));
  return normalized;
}

function clearBrowserPlatformerCheckpoint(slot: string): void {
  void slot;
  localStorage.removeItem(BROWSER_PLATFORMER_SAVE_KEY);
}

function submitBrowserPlatformerMatch(
  submission: PlatformerMatchSubmission,
): PlatformerMatchSubmissionResult {
  validateBrowserPlatformerSubmission(submission);
  const ledger = readBrowserPlatformerLedger();
  const existingStat = ledger.stat ?? emptyPlatformerStat();

  const existing = ledger.submissions.find(
    (item) => item.sessionId === submission.sessionId,
  );
  if (existing) {
    if (JSON.stringify(existing) !== JSON.stringify(submission)) {
      throw new Error("同一会话提交了不一致的对局数据。");
    }
    return { recorded: false, stat: existingStat };
  }

  const now = Date.now();
  const victory = submission.outcome === "victory";
  const stat: GameStat = {
    gameId: "platformer",
    bestScore: Math.max(existingStat.bestScore, submission.score),
    gamesPlayed: existingStat.gamesPlayed + 1,
    wins: existingStat.wins + (victory ? 1 : 0),
    losses: existingStat.losses + (victory ? 0 : 1),
    draws: existingStat.draws,
    totalPlayMs: existingStat.totalPlayMs + submission.durationMs,
    lastPlayedAt: now,
  };
  const nextLedger: BrowserPlatformerLedger = {
    sessionIds: [...ledger.sessionIds, submission.sessionId],
    submissions: [...ledger.submissions, submission],
    stat,
  };
  localStorage.setItem(BROWSER_PLATFORMER_LEDGER_KEY, JSON.stringify(nextLedger));

  return { recorded: true, stat };
}

const PLATFORMER_LEVEL_CRYSTALS = [9, 12, 15] as const;
const PLATFORMER_LEVEL_SENTINELS = [1, 2, 3] as const;
const PLATFORMER_LEVEL_CHECKPOINTS = [1, 1, 2] as const;
const PLATFORMER_TOTAL_LEVELS = 3;
const SCORE_CRYSTAL = 100;
const SCORE_SENTINEL = 250;
const SCORE_CHECKPOINT = 100;
const SCORE_BEACON = 1000;
const SCORE_FULL_COLLECTION = 750;
const SCORE_ZERO_DEATH = 1000;
const SCORE_VICTORY = 2000;

function validateBrowserPlatformerSubmission(
  submission: PlatformerMatchSubmission,
): void {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(submission.sessionId)) {
    throw new Error("对局会话 ID 无效。");
  }
  if (submission.outcome !== "game_over" && submission.outcome !== "victory") {
    throw new Error("对局结果无效。");
  }
  if (
    !Number.isInteger(submission.score) ||
    submission.score < 0 ||
    submission.score > 1_000_000
  ) {
    throw new Error("对局分数无效。");
  }
  if (
    !Number.isInteger(submission.durationMs) ||
    submission.durationMs < 0 ||
    submission.durationMs > 86_400_000
  ) {
    throw new Error("对局时长无效。");
  }
  if (
    !Number.isInteger(submission.levelsCompleted) ||
    submission.levelsCompleted < 0 ||
    submission.levelsCompleted > PLATFORMER_TOTAL_LEVELS
  ) {
    throw new Error("通关进度无效。");
  }
  if (
    !Number.isInteger(submission.crystalsCollected) ||
    submission.crystalsCollected < 0 ||
    submission.crystalsCollected > 36
  ) {
    throw new Error("收集数量无效。");
  }
  if (
    !Number.isInteger(submission.sentinelsDefeated) ||
    submission.sentinelsDefeated < 0 ||
    submission.sentinelsDefeated > 6
  ) {
    throw new Error("哨兵数量无效。");
  }
  if (!Number.isInteger(submission.deaths) || submission.deaths < 0) {
    throw new Error("死亡次数无效。");
  }

  const results = submission.levelResults;
  if (!Array.isArray(results) || results.length !== PLATFORMER_TOTAL_LEVELS) {
    throw new Error("关卡结果无效。");
  }

  let expectedScore = 0;
  let expectedDurationMs = 0;
  let expectedCrystals = 0;
  let expectedSentinels = 0;
  let expectedDeaths = 0;
  let completedCount = 0;
  let seenIncomplete = false;

  results.forEach((result, index) => {
    if (!result || typeof result !== "object") {
      throw new Error("关卡结果无效。");
    }
    const levelId = index + 1;
    const crystalsTotal = PLATFORMER_LEVEL_CRYSTALS[index] ?? 0;
    const sentinelsTotal = PLATFORMER_LEVEL_SENTINELS[index] ?? 0;
    const checkpointsTotal = PLATFORMER_LEVEL_CHECKPOINTS[index] ?? 0;

    if (result.levelId !== levelId) {
      throw new Error("关卡顺序无效。");
    }
    if (!Number.isInteger(result.score) || result.score < 0) {
      throw new Error("关卡得分无效。");
    }
    if (
      !Number.isInteger(result.crystalsCollected) ||
      result.crystalsCollected < 0 ||
      result.crystalsCollected > crystalsTotal
    ) {
      throw new Error("关卡收集数量无效。");
    }
    if (
      !Number.isInteger(result.sentinelsDefeated) ||
      result.sentinelsDefeated < 0 ||
      result.sentinelsDefeated > sentinelsTotal
    ) {
      throw new Error("关卡哨兵数量无效。");
    }
    if (
      !Number.isInteger(result.checkpointsActivated) ||
      result.checkpointsActivated < 0 ||
      result.checkpointsActivated > checkpointsTotal
    ) {
      throw new Error("关卡检查点数量无效。");
    }
    if (!Number.isInteger(result.deaths) || result.deaths < 0) {
      throw new Error("关卡死亡次数无效。");
    }
    if (
      !Number.isInteger(result.durationMs) ||
      result.durationMs < 0 ||
      result.durationMs > 86_400_000
    ) {
      throw new Error("关卡时长无效。");
    }
    if (typeof result.completed !== "boolean" || typeof result.reachedBeacon !== "boolean") {
      throw new Error("关卡状态无效。");
    }

    if (
      seenIncomplete &&
      (result.completed ||
        result.reachedBeacon ||
        result.score !== 0 ||
        result.crystalsCollected !== 0 ||
        result.sentinelsDefeated !== 0 ||
        result.checkpointsActivated !== 0 ||
        result.deaths !== 0 ||
        result.durationMs !== 0)
    ) {
      throw new Error("未完成关卡之后存在进度数据。");
    }

    if (result.completed) {
      if (!result.reachedBeacon) {
        throw new Error("已通关关卡缺少信标记录。");
      }
      completedCount += 1;
    } else {
      seenIncomplete = true;
    }

    let levelScore = result.crystalsCollected * SCORE_CRYSTAL;
    levelScore += result.sentinelsDefeated * SCORE_SENTINEL;
    levelScore += result.checkpointsActivated * SCORE_CHECKPOINT;
    if (result.reachedBeacon) {
      levelScore += SCORE_BEACON;
    }
    if (result.completed) {
      if (result.crystalsCollected === crystalsTotal) {
        levelScore += SCORE_FULL_COLLECTION;
      }
      if (result.deaths === 0) {
        levelScore += SCORE_ZERO_DEATH;
      }
    }
    if (levelId === PLATFORMER_TOTAL_LEVELS && completedCount === PLATFORMER_TOTAL_LEVELS) {
      levelScore += SCORE_VICTORY;
    }

    if (result.score !== levelScore) {
      throw new Error("关卡得分与收集进度不一致。");
    }

    expectedScore += levelScore;
    expectedDurationMs += result.durationMs;
    expectedCrystals += result.crystalsCollected;
    expectedSentinels += result.sentinelsDefeated;
    expectedDeaths += result.deaths;
  });

  if (completedCount !== submission.levelsCompleted) {
    throw new Error("通关进度不一致。");
  }
  if (completedCount === PLATFORMER_TOTAL_LEVELS && submission.outcome !== "victory") {
    throw new Error("胜利状态与通关进度不一致。");
  }
  if (completedCount < PLATFORMER_TOTAL_LEVELS && submission.outcome !== "game_over") {
    throw new Error("对局结果与通关进度不一致。");
  }
  if (submission.score !== expectedScore) {
    throw new Error("对局总分与关卡得分不一致。");
  }
  if (submission.durationMs !== expectedDurationMs) {
    throw new Error("对局时长与关卡时长不一致。");
  }
  if (submission.crystalsCollected !== expectedCrystals) {
    throw new Error("收集总数不一致。");
  }
  if (submission.sentinelsDefeated !== expectedSentinels) {
    throw new Error("哨兵总数不一致。");
  }
  if (submission.deaths !== expectedDeaths) {
    throw new Error("死亡总数不一致。");
  }
}

function isGameStat(value: unknown): value is GameStat {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const stat = value as Partial<GameStat>;
  return (
    typeof stat.gameId === "string" &&
    typeof stat.bestScore === "number" &&
    typeof stat.gamesPlayed === "number" &&
    typeof stat.wins === "number" &&
    typeof stat.losses === "number" &&
    typeof stat.draws === "number" &&
    typeof stat.totalPlayMs === "number" &&
    (typeof stat.lastPlayedAt === "number" || stat.lastPlayedAt === null)
  );
}

function isPlatformerSubmission(value: unknown): value is PlatformerMatchSubmission {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const submission = value as Partial<PlatformerMatchSubmission>;
  return (
    typeof submission.sessionId === "string" &&
    (submission.outcome === "game_over" || submission.outcome === "victory") &&
    typeof submission.score === "number" &&
    typeof submission.durationMs === "number" &&
    typeof submission.levelsCompleted === "number" &&
    typeof submission.crystalsCollected === "number" &&
    typeof submission.sentinelsDefeated === "number" &&
    typeof submission.deaths === "number" &&
    Array.isArray(submission.levelResults)
  );
}

export function readBrowserSettings(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(BROWSER_SETTINGS_KEY);
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function safelyReadBrowserSettings(): Record<string, unknown> {
  try {
    return readBrowserSettings();
  } catch {
    return {};
  }
}

export function getUnknownGameStats(stats: GameStat[], gameId: GameId): GameStat | undefined {
  return stats.find((stat) => stat.gameId === gameId);
}