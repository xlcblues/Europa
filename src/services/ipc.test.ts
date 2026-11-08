import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BROWSER_GOMOKU_LEDGER_KEY,
  BROWSER_PLATFORMER_LEDGER_KEY,
  BROWSER_PLATFORMER_SAVE_KEY,
  BROWSER_SETTINGS_KEY,
  BROWSER_SNAKE_LEDGER_KEY,
  clearPlatformerCheckpoint,
  isTauriEnvironment,
  loadBootstrap,
  loadPlatformerCheckpoint,
  readBrowserSettings,
  savePlatformerCheckpoint,
  saveSetting,
  submitGomokuMatch,
  submitPlatformerMatch,
  submitSnakeMatch,
  type GameStat,
  type GomokuMatchSubmission,
  type PlatformerMatchSubmission,
  type PlatformerSave,
  type SnakeMatchSubmission,
} from "./ipc";

interface TauriTestWindow extends Window {
  __TAURI_INTERNALS__?: {
    invoke: (...args: unknown[]) => Promise<unknown>;
  };
}

const invokeMock = vi.fn<(...args: unknown[]) => Promise<unknown>>();

function snakeSubmission(
  overrides: Partial<SnakeMatchSubmission> = {},
): SnakeMatchSubmission {
  return {
    sessionId: "browser-session-0001",
    outcome: "game_over",
    score: 30,
    durationMs: 900,
    foodEaten: 3,
    finalLength: 7,
    speedLevel: 1,
    tickMs: 130,
    ...overrides,
  };
}

function snakeStat(overrides: Partial<GameStat> = {}): GameStat {
  return {
    gameId: "snake",
    bestScore: 30,
    gamesPlayed: 1,
    wins: 0,
    losses: 1,
    draws: 0,
    totalPlayMs: 900,
    lastPlayedAt: 1_760_000_000_000,
    currentStreak: 0,
    longestStreak: 0,
    fastestWinMoves: null,
    fastestWinMs: null,
    ...overrides,
  };
}

function platformerVictorySubmission(
  overrides: Partial<PlatformerMatchSubmission> = {},
): PlatformerMatchSubmission {
  return {
    sessionId: "platformer-session-0001",
    outcome: "victory",
    score: 15750,
    durationMs: 6000,
    levelsCompleted: 3,
    crystalsCollected: 36,
    sentinelsDefeated: 6,
    deaths: 0,
    levelResults: [
      {
        levelId: 1,
        score: 4000,
        crystalsCollected: 9,
        crystalsTotal: 9,
        sentinelsDefeated: 1,
        sentinelsTotal: 1,
        checkpointsActivated: 1,
        checkpointsTotal: 1,
        deaths: 0,
        durationMs: 1000,
        completed: true,
        reachedBeacon: true,
      },
      {
        levelId: 2,
        score: 4550,
        crystalsCollected: 12,
        crystalsTotal: 12,
        sentinelsDefeated: 2,
        sentinelsTotal: 2,
        checkpointsActivated: 1,
        checkpointsTotal: 1,
        deaths: 0,
        durationMs: 2000,
        completed: true,
        reachedBeacon: true,
      },
      {
        levelId: 3,
        score: 7200,
        crystalsCollected: 15,
        crystalsTotal: 15,
        sentinelsDefeated: 3,
        sentinelsTotal: 3,
        checkpointsActivated: 2,
        checkpointsTotal: 2,
        deaths: 0,
        durationMs: 3000,
        completed: true,
        reachedBeacon: true,
      },
    ],
    ...overrides,
  };
}

function platformerGameOverSubmission(
  overrides: Partial<PlatformerMatchSubmission> = {},
): PlatformerMatchSubmission {
  return {
    sessionId: "platformer-session-0002",
    outcome: "game_over",
    score: 4850,
    durationMs: 3000,
    levelsCompleted: 1,
    crystalsCollected: 14,
    sentinelsDefeated: 2,
    deaths: 1,
    levelResults: [
      {
        levelId: 1,
        score: 4000,
        crystalsCollected: 9,
        crystalsTotal: 9,
        sentinelsDefeated: 1,
        sentinelsTotal: 1,
        checkpointsActivated: 1,
        checkpointsTotal: 1,
        deaths: 0,
        durationMs: 1000,
        completed: true,
        reachedBeacon: true,
      },
      {
        levelId: 2,
        score: 850,
        crystalsCollected: 5,
        crystalsTotal: 12,
        sentinelsDefeated: 1,
        sentinelsTotal: 2,
        checkpointsActivated: 1,
        checkpointsTotal: 1,
        deaths: 1,
        durationMs: 2000,
        completed: false,
        reachedBeacon: false,
      },
      {
        levelId: 3,
        score: 0,
        crystalsCollected: 0,
        crystalsTotal: 15,
        sentinelsDefeated: 0,
        sentinelsTotal: 3,
        checkpointsActivated: 0,
        checkpointsTotal: 2,
        deaths: 0,
        durationMs: 0,
        completed: false,
        reachedBeacon: false,
      },
    ],
    ...overrides,
  };
}

function gomokuStat(overrides: Partial<GameStat> = {}): GameStat {
  return {
    gameId: "gomoku",
    bestScore: 9,
    gamesPlayed: 1,
    wins: 1,
    losses: 0,
    draws: 0,
    totalPlayMs: 4_200,
    lastPlayedAt: 1_760_000_000_000,
    currentStreak: 1,
    longestStreak: 1,
    fastestWinMoves: 9,
    fastestWinMs: 4_200,
    ...overrides,
  };
}

function gomokuSubmission(
  overrides: Partial<GomokuMatchSubmission> = {},
): GomokuMatchSubmission {
  return {
    sessionId: "gomoku-session-0001",
    mode: "ai",
    difficulty: "intermediate",
    outcome: "win",
    winner: "black",
    moveCount: 9,
    durationMs: 4_200,
    usedUndo: false,
    undoCount: 0,
    moves: [
      { x: 7, y: 7 },
      { x: 7, y: 8 },
      { x: 8, y: 7 },
      { x: 8, y: 8 },
      { x: 9, y: 7 },
      { x: 9, y: 8 },
      { x: 10, y: 7 },
      { x: 10, y: 8 },
      { x: 11, y: 7 },
    ],
    victoryLine: [
      { x: 7, y: 7 },
      { x: 8, y: 7 },
      { x: 9, y: 7 },
      { x: 10, y: 7 },
      { x: 11, y: 7 },
    ],
    ...overrides,
  };
}

describe("browser persistence fallback", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("reports a browser preview with empty real data", async () => {
    const data = await loadBootstrap();
    expect(isTauriEnvironment()).toBe(false);
    expect(data.settings).toEqual({});
    expect(data.gameStats).toEqual([]);
    expect(data.latestPlatformerSave).toBeNull();
    expect(data.schema).toMatchObject({ version: 0, storageMode: "browser" });
  });

  it("writes settings to a namespaced localStorage record", async () => {
    const saved = await saveSetting("theme", "dark");
    expect(saved).toMatchObject({ key: "theme", value: "dark" });
    expect(readBrowserSettings()).toEqual({ theme: "dark" });
    expect(JSON.parse(localStorage.getItem(BROWSER_SETTINGS_KEY) ?? "{}")).toEqual({
      theme: "dark",
    });
  });

  it("falls back to empty settings when stored JSON is corrupt", () => {
    localStorage.setItem(BROWSER_SETTINGS_KEY, "{not-json");
    expect(readBrowserSettings()).toEqual({});
  });

  it("records snake matches idempotently and accumulates their statistics", async () => {
    const firstSubmission = snakeSubmission();
    const first = await submitSnakeMatch(firstSubmission);

    expect(first.recorded).toBe(true);
    expect(first.stat).toMatchObject({
      gameId: "snake",
      bestScore: 30,
      gamesPlayed: 1,
      losses: 1,
      totalPlayMs: 900,
    });

    const secondSubmission = snakeSubmission({
      sessionId: "browser-session-0002",
      score: 50,
      durationMs: 1_600,
      foodEaten: 5,
      finalLength: 9,
      speedLevel: 2,
      tickMs: 122,
    });
    const second = await submitSnakeMatch(secondSubmission);
    expect(second.stat).toMatchObject({
      bestScore: 50,
      gamesPlayed: 2,
      losses: 2,
      totalPlayMs: 2_500,
    });

    const duplicate = await submitSnakeMatch(secondSubmission);
    expect(duplicate.recorded).toBe(false);
    expect(duplicate.stat).toEqual(second.stat);

    const bootstrap = await loadBootstrap();
    expect(bootstrap.gameStats).toEqual([second.stat]);
  });

  it("records victories and reads the snake statistic during bootstrap", async () => {
    const victory = await submitSnakeMatch(
      snakeSubmission({
        sessionId: "browser-victory-001",
        outcome: "victory",
        score: 4460,
        durationMs: 90_000,
        foodEaten: 396,
        finalLength: 400,
        speedLevel: 80,
        tickMs: 65,
      }),
    );

    expect(victory.stat).toMatchObject({ bestScore: 4460, wins: 1, losses: 0 });

    const ledger = JSON.parse(localStorage.getItem(BROWSER_SNAKE_LEDGER_KEY) ?? "{}");
    expect(ledger.sessionIds).toEqual(["browser-victory-001"]);

    const bootstrap = await loadBootstrap();
    expect(bootstrap.gameStats).toEqual([victory.stat]);
  });

  it("rejects inconsistent snake submissions without writing local data", async () => {
    await expect(
      submitSnakeMatch(snakeSubmission({ score: 999 })),
    ).rejects.toThrow("对局分数无效。");

    const bootstrap = await loadBootstrap();
    expect(bootstrap.gameStats).toEqual([]);
    expect(localStorage.getItem(BROWSER_SNAKE_LEDGER_KEY)).toBeNull();
  });

  it("persists platformer checkpoints and reads them back during bootstrap", async () => {
    const record: PlatformerSave = {
      slot: "platformer_main",
      levelId: 2,
      checkpointId: "checkpoint_1",
      score: 2500,
      lives: 2,
      details: { frozen: true },
      updatedAt: 0,
    };

    const saved = await savePlatformerCheckpoint(record);
    expect(saved.updatedAt).toBeGreaterThan(0);
    expect(localStorage.getItem(BROWSER_PLATFORMER_SAVE_KEY)).not.toBeNull();

    const loaded = await loadPlatformerCheckpoint("platformer_main");
    expect(loaded).toMatchObject({
      slot: "platformer_main",
      levelId: 2,
      checkpointId: "checkpoint_1",
      score: 2500,
      lives: 2,
    });

    const bootstrap = await loadBootstrap();
    expect(bootstrap.latestPlatformerSave).toMatchObject({
      slot: "platformer_main",
      checkpointId: "checkpoint_1",
    });

    await clearPlatformerCheckpoint("platformer_main");
    expect(await loadPlatformerCheckpoint("platformer_main")).toBeNull();
    expect((await loadBootstrap()).latestPlatformerSave).toBeNull();
  });

  it("records platformer matches idempotently and accumulates statistics", async () => {
    const victory = await submitPlatformerMatch(platformerVictorySubmission());
    expect(victory.recorded).toBe(true);
    expect(victory.stat).toMatchObject({
      gameId: "platformer",
      bestScore: 15750,
      gamesPlayed: 1,
      wins: 1,
      losses: 0,
      totalPlayMs: 6000,
    });

    const defeat = await submitPlatformerMatch(platformerGameOverSubmission());
    expect(defeat.stat).toMatchObject({
      bestScore: 15750,
      gamesPlayed: 2,
      wins: 1,
      losses: 1,
      totalPlayMs: 9000,
    });

    const duplicate = await submitPlatformerMatch(platformerGameOverSubmission());
    expect(duplicate.recorded).toBe(false);
    expect(duplicate.stat).toEqual(defeat.stat);

    const bootstrap = await loadBootstrap();
    expect(bootstrap.gameStats).toEqual([defeat.stat]);
  });

  it("rejects inconsistent platformer submissions without writing local data", async () => {
    await expect(
      submitPlatformerMatch(platformerVictorySubmission({ score: 1_000_001 })),
    ).rejects.toThrow("对局分数无效。");
    expect(localStorage.getItem(BROWSER_PLATFORMER_LEDGER_KEY)).toBeNull();

    await expect(
      submitPlatformerMatch(
        platformerVictorySubmission({
          sessionId: "platformer-session-0009",
          deaths: 5,
        }),
      ),
    ).rejects.toThrow("死亡总数不一致。");
    expect(localStorage.getItem(BROWSER_PLATFORMER_LEDGER_KEY)).toBeNull();
  });
  it("records gomoku wins, losses and draws with streak statistics", async () => {
    const win = await submitGomokuMatch(gomokuSubmission());
    expect(win.recorded).toBe(true);
    expect(win.stat).toMatchObject({
      gameId: "gomoku",
      bestScore: 9,
      gamesPlayed: 1,
      wins: 1,
      losses: 0,
      draws: 0,
      totalPlayMs: 4_200,
      currentStreak: 1,
      longestStreak: 1,
      fastestWinMoves: 9,
      fastestWinMs: 4_200,
    });

    const loss = await submitGomokuMatch(
      gomokuSubmission({
        sessionId: "gomoku-session-0002",
        outcome: "loss",
        winner: "white",
        moveCount: 10,
        durationMs: 6_000,
        moves: [
          { x: 7, y: 7 },
          { x: 7, y: 8 },
          { x: 8, y: 7 },
          { x: 8, y: 8 },
          { x: 9, y: 7 },
          { x: 9, y: 8 },
          { x: 10, y: 7 },
          { x: 10, y: 8 },
          { x: 11, y: 7 },
          { x: 11, y: 8 },
        ],
        victoryLine: [
          { x: 7, y: 8 },
          { x: 8, y: 8 },
          { x: 9, y: 8 },
          { x: 10, y: 8 },
          { x: 11, y: 8 },
        ],
      }),
    );
    expect(loss.stat).toMatchObject({
      gamesPlayed: 2,
      wins: 1,
      losses: 1,
      totalPlayMs: 10_200,
      currentStreak: 0,
      longestStreak: 1,
      fastestWinMoves: 9,
      fastestWinMs: 4_200,
    });

    const draw = await submitGomokuMatch(
      gomokuSubmission({
        sessionId: "gomoku-session-0003",
        outcome: "draw",
        winner: null,
        moveCount: 9,
        durationMs: 8_000,
        moves: [
          { x: 7, y: 7 },
          { x: 7, y: 8 },
          { x: 8, y: 7 },
          { x: 8, y: 8 },
          { x: 9, y: 7 },
          { x: 9, y: 8 },
          { x: 10, y: 7 },
          { x: 10, y: 8 },
          { x: 11, y: 7 },
        ],
        victoryLine: null,
      }),
    );
    expect(draw.stat).toMatchObject({
      gamesPlayed: 3,
      wins: 1,
      losses: 1,
      draws: 1,
      totalPlayMs: 18_200,
      currentStreak: 0,
    });

    const duplicate = await submitGomokuMatch(gomokuSubmission());
    expect(duplicate.recorded).toBe(false);
    expect(duplicate.stat).toEqual(draw.stat);

    const bootstrap = await loadBootstrap();
    expect(bootstrap.gameStats).toEqual([draw.stat]);
  });

  it("rejects inconsistent gomoku submissions without writing local data", async () => {
    await expect(
      submitGomokuMatch(gomokuSubmission({ sessionId: "gomoku invalid session" })),
    ).rejects.toThrow("对局会话 ID 无效。");
    expect(localStorage.getItem(BROWSER_GOMOKU_LEDGER_KEY)).toBeNull();

    await expect(
      submitGomokuMatch(
        gomokuSubmission({
          sessionId: "gomoku-invalid-02",
          mode: "pvp",
          difficulty: "beginner",
        }),
      ),
    ).rejects.toThrow("双人模式不应包含 AI 难度。");

    await expect(
      submitGomokuMatch(
        gomokuSubmission({ sessionId: "gomoku-invalid-03", outcome: "loss" }),
      ),
    ).rejects.toThrow("失败视角与胜方不一致。");

    await expect(
      submitGomokuMatch(
        gomokuSubmission({
          sessionId: "gomoku-invalid-04",
          undoCount: 2,
          usedUndo: false,
        }),
      ),
    ).rejects.toThrow("悔棋标记不一致。");

    await expect(
      submitGomokuMatch(
        gomokuSubmission({
          sessionId: "gomoku-invalid-05",
          victoryLine: [
            { x: 7, y: 7 },
            { x: 8, y: 7 },
            { x: 9, y: 7 },
            { x: 10, y: 7 },
            { x: 12, y: 7 },
          ],
        }),
      ),
    ).rejects.toThrow("胜利线包含非胜方棋子。");

    await expect(
      submitGomokuMatch(
        gomokuSubmission({
          sessionId: "gomoku-invalid-06",
          outcome: "loss",
          winner: "white",
        }),
      ),
    ).rejects.toThrow("最后落子与胜方不一致。");
    expect(localStorage.getItem(BROWSER_GOMOKU_LEDGER_KEY)).toBeNull();
  });
});

describe("Tauri IPC boundary", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: { invoke: invokeMock },
    });
  });

  it("loads bootstrap through the Rust command", async () => {
    invokeMock.mockResolvedValue({
      settings: {},
      gameStats: [],
      latestPlatformerSave: null,
      schema: { version: 3, path: "europa.db", storageMode: "sqlite" },
    });

    await loadBootstrap();
    expect(invokeMock).toHaveBeenCalledWith("load_bootstrap", {}, undefined);
  });

  it("serializes setting value JSON before invoking the Rust command", async () => {
    invokeMock.mockResolvedValue({ key: "sound_enabled", value: false, updatedAt: 1 });

    await saveSetting("sound_enabled", false);
    expect(invokeMock).toHaveBeenCalledWith(
      "save_setting",
      {
        key: "sound_enabled",
        valueJson: "false",
      },
      undefined,
    );
  });

  it("submits snake results through the Rust command with a session id", async () => {
    const submission = snakeSubmission({ sessionId: "tauri-session-0001" });
    invokeMock.mockResolvedValue({ recorded: true, stat: snakeStat() });

    await submitSnakeMatch(submission);
    expect(invokeMock).toHaveBeenCalledWith(
      "submit_snake_match",
      { submission },
      undefined,
    );
  });

  it("routes platformer checkpoints and results through the Rust commands", async () => {
    const record: PlatformerSave = {
      slot: "platformer_main",
      levelId: 1,
      checkpointId: "checkpoint_0",
      score: 0,
      lives: 3,
      details: {},
      updatedAt: 1,
    };
    const submission = platformerVictorySubmission({
      sessionId: "tauri-platformer-0001",
    });

    invokeMock.mockResolvedValue(null);
    await loadPlatformerCheckpoint("platformer_main");
    expect(invokeMock).toHaveBeenCalledWith(
      "load_platformer_checkpoint",
      { slot: "platformer_main" },
      undefined,
    );

    invokeMock.mockResolvedValue(record);
    await savePlatformerCheckpoint(record);
    expect(invokeMock).toHaveBeenCalledWith(
      "save_platformer_checkpoint",
      { record },
      undefined,
    );

    invokeMock.mockReset();
    invokeMock.mockResolvedValue(null);
    await clearPlatformerCheckpoint("platformer_main");
    expect(invokeMock).toHaveBeenCalledWith(
      "clear_platformer_checkpoint",
      { slot: "platformer_main" },
      undefined,
    );

    invokeMock.mockReset();
    invokeMock.mockResolvedValue({
      recorded: true,
      stat: {
        gameId: "platformer",
        bestScore: 15750,
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        draws: 0,
        totalPlayMs: 6000,
        lastPlayedAt: 1,
        currentStreak: 0,
        longestStreak: 0,
        fastestWinMoves: null,
        fastestWinMs: null,
      },
    });
    await submitPlatformerMatch(submission);
    expect(invokeMock).toHaveBeenCalledWith(
      "submit_platformer_match",
      { submission },
      undefined,
    );
  });

  it("submits gomoku results through the Rust command", async () => {
    const submission = gomokuSubmission({ sessionId: "tauri-gomoku-0001" });
    invokeMock.mockResolvedValue({ recorded: true, stat: gomokuStat() });

    await submitGomokuMatch(submission);
    expect(invokeMock).toHaveBeenCalledWith(
      "submit_gomoku_match",
      { submission },
      undefined,
    );
  });
});

afterAll(() => {
  delete (window as TauriTestWindow).__TAURI_INTERNALS__;
});
