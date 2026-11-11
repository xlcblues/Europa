import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as IpcModule from "../../services/ipc";
import { hydrateStore } from "../../test/fixtures";
import { PlatformerGame } from "./PlatformerGame";

const submitPlatformerMatchMock = vi.hoisted(() =>
  vi.fn<
    (
      submission: IpcModule.PlatformerMatchSubmission,
    ) => Promise<IpcModule.PlatformerMatchSubmissionResult>
  >(),
);
const savePlatformerCheckpointMock = vi.hoisted(() =>
  vi.fn<(record: IpcModule.PlatformerSave) => Promise<IpcModule.PlatformerSave>>(),
);
const clearPlatformerCheckpointMock = vi.hoisted(() =>
  vi.fn<(slot: string) => Promise<void>>(),
);
const platformerAudioPlayMock = vi.hoisted(() => vi.fn<(sound: string) => void>());

vi.mock("../../services/ipc", async (importOriginal) => {
  const actual = await importOriginal<typeof IpcModule>();
  return {
    ...actual,
    submitPlatformerMatch: submitPlatformerMatchMock,
    savePlatformerCheckpoint: savePlatformerCheckpointMock,
    clearPlatformerCheckpoint: clearPlatformerCheckpointMock,
  };
});

vi.mock("./platformerAudio", () => ({
  PlatformerAudio: class {
    setEnabled(): void {}
    play(sound: string): void {
      platformerAudioPlayMock(sound);
    }
    close(): void {}
  },
}));

function statForSubmission(submission: IpcModule.PlatformerMatchSubmission): IpcModule.GameStat {
  return {
    gameId: "platformer",
    bestScore: submission.score,
    gamesPlayed: 1,
    wins: submission.outcome === "victory" ? 1 : 0,
    losses: submission.outcome === "game_over" ? 1 : 0,
    draws: 0,
    totalPlayMs: submission.durationMs,
    lastPlayedAt: Date.now(),
    currentStreak: 0,
    longestStreak: 0,
    fastestWinMoves: null,
    fastestWinMs: null,
  };
}

async function beginPlaying(): Promise<void> {
  fireEvent.keyDown(window, { code: "Enter" });
  expect(screen.getByText("关卡简报")).toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_200);
  });
  expect(screen.getByText("运行中")).toBeInTheDocument();
}

async function loseAllLives(): Promise<void> {
  fireEvent.keyDown(window, { code: "KeyA" });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(6_000);
  });
  expect(screen.getByRole("heading", { name: "远征结束" })).toBeInTheDocument();
}

describe("PlatformerGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    submitPlatformerMatchMock.mockReset();
    submitPlatformerMatchMock.mockImplementation(async (submission) => ({
      recorded: true,
      stat: statForSubmission(submission),
    }));
    savePlatformerCheckpointMock.mockReset();
    savePlatformerCheckpointMock.mockImplementation(async (record) => record);
    clearPlatformerCheckpointMock.mockReset();
    clearPlatformerCheckpointMock.mockResolvedValue(undefined);
    platformerAudioPlayMock.mockClear();
    hydrateStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts from the ready overlay and enters the level intro before playing", async () => {
    render(<PlatformerGame onBack={vi.fn()} />);

    expect(screen.getByText("待开始")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "远征待启" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "开始远征" }).length).toBeGreaterThan(0);

    await beginPlaying();
    expect(screen.queryByText("关卡简报")).not.toBeInTheDocument();
    expect(screen.getByText("运行中")).toBeInTheDocument();
    expect(savePlatformerCheckpointMock).toHaveBeenCalled();
  });

  it("offers to continue from a local checkpoint save", () => {
    hydrateStore({
      latestPlatformerSave: {
        slot: "platformer_main",
        levelId: 2,
        checkpointId: "l2-checkpoint-01",
        score: 320,
        lives: 2,
        details: null,
        updatedAt: Date.now(),
      },
    });
    render(<PlatformerGame onBack={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "继续远征" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "继续 · 第 2 关" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新的远征" })).toBeInTheDocument();
  });

  it("pauses with Escape, freezes game time, and does not submit", async () => {
    render(<PlatformerGame onBack={vi.fn()} />);
    await beginPlaying();

    fireEvent.keyDown(window, { code: "Escape" });
    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "远征已暂停" })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(submitPlatformerMatchMock).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { code: "Escape" });
    expect(screen.getByText("运行中")).toBeInTheDocument();
  });

  it("auto-pauses when the window loses focus", async () => {
    render(<PlatformerGame onBack={vi.fn()} />);
    await beginPlaying();

    fireEvent.blur(window);
    expect(screen.getByText("已暂停")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(submitPlatformerMatchMock).not.toHaveBeenCalled();
  });

  it("ends with game over after losing all lives and submits exactly once", async () => {
    render(<PlatformerGame onBack={vi.fn()} />);
    await beginPlaying();
    await loseAllLives();

    expect(submitPlatformerMatchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "查看结算" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("heading", { name: "本局结束" })).toBeInTheDocument();
    expect(submitPlatformerMatchMock).toHaveBeenCalledTimes(1);
    expect(submitPlatformerMatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: expect.stringMatching(/^platformer-/u),
        outcome: "game_over",
        deaths: 3,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(submitPlatformerMatchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the same submission when saving fails and the player retries", async () => {
    submitPlatformerMatchMock.mockRejectedValueOnce(new Error("database unavailable"));
    render(<PlatformerGame onBack={vi.fn()} />);
    await beginPlaying();
    await loseAllLives();

    fireEvent.click(screen.getByRole("button", { name: "查看结算" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("alert")).toHaveTextContent("未能保存本局成绩，可重新尝试。");
    expect(submitPlatformerMatchMock).toHaveBeenCalledTimes(1);
    const firstSubmission = submitPlatformerMatchMock.mock.calls[0]?.[0];
    expect(firstSubmission).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(submitPlatformerMatchMock).toHaveBeenCalledTimes(2);
    expect(submitPlatformerMatchMock.mock.calls[1]?.[0]).toEqual(firstSubmission);
    expect(screen.getByText("成绩已保存到本地")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("saves a checkpoint but does not submit when unmounted mid-run", async () => {
    const { unmount } = render(<PlatformerGame onBack={vi.fn()} />);
    await beginPlaying();
    savePlatformerCheckpointMock.mockClear();

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(submitPlatformerMatchMock).not.toHaveBeenCalled();
    expect(savePlatformerCheckpointMock).toHaveBeenCalled();
  });
  it("renders and keeps drawing with reduced motion enabled", async () => {
    hydrateStore({
      settings: { theme: "light", sound_enabled: true, reduced_motion: true },
    });
    render(<PlatformerGame onBack={vi.fn()} />);
    await beginPlaying();

    const canvas = document.querySelector("canvas");
    const context = canvas?.getContext("2d") as unknown as
      | { clearRect: { mock: { calls: unknown[] } } }
      | null;
    expect(context).not.toBeNull();
    const drawCount = (): number => context?.clearRect.mock.calls.length ?? 0;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(drawCount()).toBeGreaterThan(0);
  });


  it("does not auto re-jump on landing while the jump key is held", async () => {
    render(<PlatformerGame onBack={vi.fn()} />);
    await beginPlaying();

    // 按下跳跃（首次按下，非系统重复）。
    fireEvent.keyDown(window, { code: "Space", repeat: false });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(120);
    });

    // 模拟 Windows 按住按键产生的系统 key-repeat，必须不会重新触发跳跃。
    fireEvent.keyDown(window, { code: "Space", repeat: true });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(650);
    });
    fireEvent.keyDown(window, { code: "Space", repeat: true });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    const jumps = platformerAudioPlayMock.mock.calls.filter(
      ([sound]) => sound === "jump",
    ).length;
    expect(jumps).toBe(1);
  });

});