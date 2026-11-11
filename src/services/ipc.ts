import { invoke } from "@tauri-apps/api/core";

import { boardFromMoves, detectWinAt, getCell } from "../games/gomoku/gomokuEngine";
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
  currentStreak: number;
  longestStreak: number;
  fastestWinMoves: number | null;
  fastestWinMs: number | null;
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

export type GomokuMatchOutcome = "win" | "loss" | "draw";

export interface GomokuPoint {
  x: number;
  y: number;
}

export interface GomokuMatchSubmission {
  sessionId: string;
  mode: "pvp" | "ai";
  difficulty: "beginner" | "intermediate" | "master" | null;
  outcome: GomokuMatchOutcome;
  winner: "black" | "white" | null;
  moveCount: number;
  durationMs: number;
  usedUndo: boolean;
  undoCount: number;
  moves: GomokuPoint[];
  victoryLine: GomokuPoint[] | null;
}

export interface GomokuMatchSubmissionResult {
  recorded: boolean;
  stat: GameStat;
}

export interface MatchHistoryEntry {
  id: number;
  gameId: string;
  outcome: string;
  score: number;
  durationMs: number;
  createdAt: number;
  detail: unknown;
}

export interface ClearResult {
  removedHistory: number;
  resetStats: number;
}

export interface SavesClearResult {
  clearedSaves: number;
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
export const BROWSER_GOMOKU_LEDGER_KEY = "europa.browser-gomoku-ledger";
export const BROWSER_HISTORY_KEY = "europa.browser-history";

interface BrowserSnakeLedger {
  sessionIds: string[];
  stat: GameStat | null;
}

interface BrowserPlatformerLedger {
  sessionIds: string[];
  submissions: PlatformerMatchSubmission[];
  stat: GameStat | null;
}

interface BrowserGomokuLedger {
  sessionIds: string[];
  submissions: GomokuMatchSubmission[];
  stat: GameStat | null;
}

interface BrowserHistoryLedger {
  entries: MatchHistoryEntry[];
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

export async function submitGomokuMatch(
  submission: GomokuMatchSubmission,
): Promise<GomokuMatchSubmissionResult> {
  if (!isTauriEnvironment()) {
    return submitBrowserGomokuMatch(submission);
  }

  return invoke<GomokuMatchSubmissionResult>("submit_gomoku_match", { submission });
}

export async function loadMatchHistory(
  gameId?: string,
  limit?: number,
): Promise<MatchHistoryEntry[]> {
  if (!isTauriEnvironment()) {
    return loadBrowserMatchHistory(gameId, limit);
  }

  return invoke<MatchHistoryEntry[]>("load_match_history", {
    gameId: gameId ?? null,
    limit: limit ?? 50,
  });
}

export async function clearGameHistory(gameId?: string): Promise<ClearResult> {
  if (!isTauriEnvironment()) {
    return clearBrowserGameHistory(gameId);
  }

  return invoke<ClearResult>("clear_game_history", { gameId: gameId ?? null });
}

export async function clearPlatformerSaves(): Promise<SavesClearResult> {
  if (!isTauriEnvironment()) {
    return clearBrowserPlatformerSaves();
  }

  return invoke<SavesClearResult>("clear_platformer_saves");
}

function loadBrowserBootstrap(): BootstrapData {
  const settings = safelyReadBrowserSettings();
  const snakeLedger = readBrowserSnakeLedger();
  const platformerLedger = readBrowserPlatformerLedger();
  const gomokuLedger = readBrowserGomokuLedger();
  const gameStats: GameStat[] = [];
  if (snakeLedger.stat) {
    gameStats.push(snakeLedger.stat);
  }
  if (platformerLedger.stat) {
    gameStats.push(platformerLedger.stat);
  }
  if (gomokuLedger.stat) {
    gameStats.push(gomokuLedger.stat);
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
    currentStreak: existingStat.currentStreak,
    longestStreak: existingStat.longestStreak,
    fastestWinMoves: existingStat.fastestWinMoves,
    fastestWinMs: existingStat.fastestWinMs,
  };
  const nextLedger: BrowserSnakeLedger = {
    sessionIds: [...ledger.sessionIds, submission.sessionId],
    stat,
  };
  localStorage.setItem(BROWSER_SNAKE_LEDGER_KEY, JSON.stringify(nextLedger));
  appendBrowserHistoryEntry({
    id: nextHistoryId(),
    gameId: "snake",
    outcome: submission.outcome,
    score: submission.score,
    durationMs: submission.durationMs,
    createdAt: now,
    detail: {
      foodEaten: submission.foodEaten,
      finalLength: submission.finalLength,
      speedLevel: submission.speedLevel,
      tickMs: submission.tickMs,
    },
  });

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
    currentStreak: 0,
    longestStreak: 0,
    fastestWinMoves: null,
    fastestWinMs: null,
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
    currentStreak: 0,
    longestStreak: 0,
    fastestWinMoves: null,
    fastestWinMs: null,
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
    currentStreak: existingStat.currentStreak,
    longestStreak: existingStat.longestStreak,
    fastestWinMoves: existingStat.fastestWinMoves,
    fastestWinMs: existingStat.fastestWinMs,
  };
  const nextLedger: BrowserPlatformerLedger = {
    sessionIds: [...ledger.sessionIds, submission.sessionId],
    submissions: [...ledger.submissions, submission],
    stat,
  };
  localStorage.setItem(BROWSER_PLATFORMER_LEDGER_KEY, JSON.stringify(nextLedger));
  appendBrowserHistoryEntry({
    id: nextHistoryId(),
    gameId: "platformer",
    outcome: submission.outcome,
    score: submission.score,
    durationMs: submission.durationMs,
    createdAt: now,
    detail: {
      levelsCompleted: submission.levelsCompleted,
      crystalsCollected: submission.crystalsCollected,
      sentinelsDefeated: submission.sentinelsDefeated,
      deaths: submission.deaths,
    },
  });

  return { recorded: true, stat };
}

function submitBrowserGomokuMatch(
  submission: GomokuMatchSubmission,
): GomokuMatchSubmissionResult {
  validateBrowserGomokuSubmission(submission);
  const ledger = readBrowserGomokuLedger();
  const existingStat = ledger.stat ?? emptyGomokuStat();

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
  const stat = nextGomokuStat(existingStat, submission, now);
  const nextLedger: BrowserGomokuLedger = {
    sessionIds: [...ledger.sessionIds, submission.sessionId],
    submissions: [...ledger.submissions, submission],
    stat,
  };
  localStorage.setItem(BROWSER_GOMOKU_LEDGER_KEY, JSON.stringify(nextLedger));
  appendBrowserHistoryEntry({
    id: nextHistoryId(),
    gameId: "gomoku",
    outcome: submission.outcome,
    score: submission.moveCount,
    durationMs: submission.durationMs,
    createdAt: now,
    detail: {
      mode: submission.mode,
      difficulty: submission.difficulty,
      winner: submission.winner,
      moveCount: submission.moveCount,
      usedUndo: submission.usedUndo,
      undoCount: submission.undoCount,
    },
  });

  return { recorded: true, stat };
}

function readBrowserHistory(): MatchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(BROWSER_HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return [];
    }

    const candidate = (parsed as Partial<BrowserHistoryLedger>).entries;
    if (!Array.isArray(candidate)) {
      return [];
    }

    const entries = candidate.filter(isMatchHistoryEntry);
    return entries.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id);
  } catch {
    return [];
  }
}

function writeBrowserHistory(entries: MatchHistoryEntry[]): void {
  const ledger: BrowserHistoryLedger = { entries };
  localStorage.setItem(BROWSER_HISTORY_KEY, JSON.stringify(ledger));
}

function appendBrowserHistoryEntry(entry: MatchHistoryEntry): void {
  const entries = readBrowserHistory();
  const nextEntries = [...entries, entry]
    .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)
    .slice(0, 200);
  writeBrowserHistory(nextEntries);
}

function nextHistoryId(): number {
  const entries = readBrowserHistory();
  return entries.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
}

function isMatchHistoryEntry(value: unknown): value is MatchHistoryEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const entry = value as Partial<MatchHistoryEntry>;
  return (
    typeof entry.id === "number" &&
    typeof entry.gameId === "string" &&
    typeof entry.outcome === "string" &&
    typeof entry.score === "number" &&
    typeof entry.durationMs === "number" &&
    typeof entry.createdAt === "number"
  );
}

function loadBrowserMatchHistory(gameId?: string, limit?: number): MatchHistoryEntry[] {
  const clampedLimit = Math.max(1, Math.min(200, limit ?? 50));
  return readBrowserHistory()
    .filter((entry) => !gameId || entry.gameId === gameId)
    .slice(0, clampedLimit);
}

function clearBrowserGameHistory(gameId?: string): ClearResult {
  const entries = readBrowserHistory();
  const removedHistory = gameId
    ? entries.filter((entry) => entry.gameId === gameId).length
    : entries.length;
  const remaining = gameId ? entries.filter((entry) => entry.gameId !== gameId) : [];
  writeBrowserHistory(remaining);

  let resetStats = 0;
  if (!gameId || gameId === "snake") {
    resetStats += resetBrowserLedger(BROWSER_SNAKE_LEDGER_KEY);
  }
  if (!gameId || gameId === "platformer") {
    resetStats += resetBrowserLedger(BROWSER_PLATFORMER_LEDGER_KEY);
  }
  if (!gameId || gameId === "gomoku") {
    resetStats += resetBrowserLedger(BROWSER_GOMOKU_LEDGER_KEY);
  }

  return { removedHistory, resetStats };
}

function resetBrowserLedger(key: string): number {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return 0;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return 0;
    }

    const candidate = parsed as Partial<
      BrowserSnakeLedger | BrowserPlatformerLedger | BrowserGomokuLedger
    >;
    const submissions = Array.isArray(
      (candidate as Partial<BrowserPlatformerLedger>).submissions,
    )
      ? ((candidate as Partial<BrowserPlatformerLedger>).submissions ?? [])
      : [];
    const hadData =
      Boolean(candidate.stat) ||
      (candidate.sessionIds ?? []).length > 0 ||
      submissions.length > 0;

    const reset: Record<string, unknown> = { sessionIds: [], stat: null };
    if (Array.isArray((candidate as Partial<BrowserPlatformerLedger>).submissions)) {
      reset.submissions = [];
    }
    localStorage.setItem(key, JSON.stringify(reset));
    return hadData ? 1 : 0;
  } catch {
    return 0;
  }
}

function clearBrowserPlatformerSaves(): SavesClearResult {
  const hadSave = localStorage.getItem(BROWSER_PLATFORMER_SAVE_KEY) !== null;
  localStorage.removeItem(BROWSER_PLATFORMER_SAVE_KEY);
  return { clearedSaves: hadSave ? 1 : 0 };
}

function nextGomokuStat(
  existingStat: GameStat,
  submission: GomokuMatchSubmission,
  now: number,
): GameStat {
  const blackWon = submission.outcome === "win";
  const whiteWon = submission.outcome === "loss";
  const draw = submission.outcome === "draw";

  let currentStreak = existingStat.currentStreak;
  let longestStreak = existingStat.longestStreak;
  let fastestWinMoves = existingStat.fastestWinMoves;
  let fastestWinMs = existingStat.fastestWinMs;

  if (blackWon) {
    currentStreak += 1;
    longestStreak = Math.max(longestStreak, currentStreak);
    if (fastestWinMoves === null || submission.moveCount < fastestWinMoves) {
      fastestWinMoves = submission.moveCount;
    }
    if (fastestWinMs === null || submission.durationMs < fastestWinMs) {
      fastestWinMs = submission.durationMs;
    }
  } else {
    currentStreak = 0;
  }

  return {
    gameId: "gomoku",
    bestScore: Math.max(existingStat.bestScore, submission.moveCount),
    gamesPlayed: existingStat.gamesPlayed + 1,
    wins: existingStat.wins + (blackWon ? 1 : 0),
    losses: existingStat.losses + (whiteWon ? 1 : 0),
    draws: existingStat.draws + (draw ? 1 : 0),
    totalPlayMs: existingStat.totalPlayMs + submission.durationMs,
    lastPlayedAt: now,
    currentStreak,
    longestStreak,
    fastestWinMoves,
    fastestWinMs,
  };
}

function validateBrowserGomokuSubmission(submission: GomokuMatchSubmission): void {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(submission.sessionId)) {
    throw new Error("对局会话 ID 无效。");
  }
  if (submission.mode !== "pvp" && submission.mode !== "ai") {
    throw new Error("对局模式无效。");
  }
  const validDifficulty =
    submission.difficulty === null ||
    submission.difficulty === "beginner" ||
    submission.difficulty === "intermediate" ||
    submission.difficulty === "master";
  if (!validDifficulty) {
    throw new Error("AI 难度无效。");
  }
  if (submission.mode === "pvp" && submission.difficulty !== null) {
    throw new Error("双人模式不应包含 AI 难度。");
  }
  if (submission.mode === "ai" && submission.difficulty === null) {
    throw new Error("人机模式缺少 AI 难度。");
  }
  if (submission.outcome !== "win" && submission.outcome !== "loss" && submission.outcome !== "draw") {
    throw new Error("对局结果无效。");
  }
  if (submission.winner !== "black" && submission.winner !== "white" && submission.winner !== null) {
    throw new Error("胜方无效。");
  }
  if (submission.outcome === "draw" && submission.winner !== null) {
    throw new Error("平局不应包含胜方。");
  }
  if (submission.outcome === "win" && submission.winner !== "black") {
    throw new Error("胜利视角与胜方不一致。");
  }
  if (submission.outcome === "loss" && submission.winner !== "white") {
    throw new Error("失败视角与胜方不一致。");
  }
  if (
    !Number.isInteger(submission.durationMs) ||
    submission.durationMs < 0 ||
    submission.durationMs > 86_400_000
  ) {
    throw new Error("对局时长无效。");
  }
  if (!Number.isInteger(submission.undoCount) || submission.undoCount < 0 || submission.undoCount > 3) {
    throw new Error("悔棋次数无效。");
  }
  if (submission.usedUndo !== (submission.undoCount > 0)) {
    throw new Error("悔棋标记不一致。");
  }
  if (!Number.isInteger(submission.moveCount) || submission.moveCount < 1 || submission.moveCount > 225) {
    throw new Error("落子数量无效。");
  }
  if (!Array.isArray(submission.moves) || submission.moves.length !== submission.moveCount) {
    throw new Error("落子记录与数量不一致。");
  }

  const seen = new Set<string>();
  for (const point of submission.moves) {
    if (
      !Number.isInteger(point.x) ||
      !Number.isInteger(point.y) ||
      point.x < 0 ||
      point.x > 14 ||
      point.y < 0 ||
      point.y > 14
    ) {
      throw new Error("落点坐标无效。");
    }
    const key = `${point.x},${point.y}`;
    if (seen.has(key)) {
      throw new Error("落点存在重复。");
    }
    seen.add(key);
  }

  if (submission.winner !== null) {
    if (!Array.isArray(submission.victoryLine) || submission.victoryLine.length === 0) {
      throw new Error("胜利对局缺少胜利线。");
    }
    const board = boardFromMoves(submission.moves);
    const lastMove = submission.moves[submission.moves.length - 1] ?? null;
    if (!lastMove) {
      throw new Error("落子记录无效。");
    }
    if (getCell(board, lastMove.x, lastMove.y) !== submission.winner) {
      throw new Error("最后落子与胜方不一致。");
    }
    if (detectWinAt(board, lastMove, submission.winner) === null) {
      throw new Error("胜利线与落子记录不一致。");
    }
    for (const point of submission.victoryLine) {
      if (
        !Number.isInteger(point.x) ||
        !Number.isInteger(point.y) ||
        point.x < 0 ||
        point.x > 14 ||
        point.y < 0 ||
        point.y > 14
      ) {
        throw new Error("胜利线坐标无效。");
      }
      if (getCell(board, point.x, point.y) !== submission.winner) {
        throw new Error("胜利线包含非胜方棋子。");
      }
    }
  } else if (submission.victoryLine !== null) {
    throw new Error("未获胜对局不应包含胜利线。");
  }
}

function emptyGomokuStat(): GameStat {
  return {
    gameId: "gomoku",
    bestScore: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalPlayMs: 0,
    lastPlayedAt: null,
    currentStreak: 0,
    longestStreak: 0,
    fastestWinMoves: null,
    fastestWinMs: null,
  };
}

function readBrowserGomokuLedger(): BrowserGomokuLedger {
  try {
    const raw = localStorage.getItem(BROWSER_GOMOKU_LEDGER_KEY);
    if (!raw) {
      return { sessionIds: [], submissions: [], stat: null };
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { sessionIds: [], submissions: [], stat: null };
    }

    const candidate = parsed as Partial<BrowserGomokuLedger>;
    const sessionIds = Array.isArray(candidate.sessionIds)
      ? candidate.sessionIds.filter((value): value is string => typeof value === "string")
      : [];
    const submissions = Array.isArray(candidate.submissions)
      ? candidate.submissions.filter((value): value is GomokuMatchSubmission =>
          isGomokuSubmission(value),
        )
      : [];
    const stat = isGameStat(candidate.stat) ? candidate.stat : null;
    return { sessionIds, submissions, stat };
  } catch {
    return { sessionIds: [], submissions: [], stat: null };
  }
}

function isGomokuSubmission(value: unknown): value is GomokuMatchSubmission {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const submission = value as Partial<GomokuMatchSubmission>;
  return (
    typeof submission.sessionId === "string" &&
    (submission.mode === "pvp" || submission.mode === "ai") &&
    (submission.difficulty === null ||
      submission.difficulty === "beginner" ||
      submission.difficulty === "intermediate" ||
      submission.difficulty === "master") &&
    (submission.outcome === "win" || submission.outcome === "loss" || submission.outcome === "draw") &&
    (submission.winner === "black" || submission.winner === "white" || submission.winner === null) &&
    typeof submission.moveCount === "number" &&
    typeof submission.durationMs === "number" &&
    typeof submission.usedUndo === "boolean" &&
    typeof submission.undoCount === "number" &&
    Array.isArray(submission.moves) &&
    (submission.victoryLine === null || Array.isArray(submission.victoryLine))
  );
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
    throw new Error("敌人数量无效。");
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
      throw new Error("关卡敌人数量无效。");
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
    throw new Error("敌人总数不一致。");
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
    (typeof stat.lastPlayedAt === "number" || stat.lastPlayedAt === null) &&
    typeof stat.currentStreak === "number" &&
    typeof stat.longestStreak === "number" &&
    (typeof stat.fastestWinMoves === "number" || stat.fastestWinMoves === null) &&
    (typeof stat.fastestWinMs === "number" || stat.fastestWinMs === null)
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