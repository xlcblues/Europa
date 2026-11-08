import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as IpcModule from "../../services/ipc";
import { hydrateStore } from "../../test/fixtures";
import { SnakeGame } from "./SnakeGame";

const submitSnakeMatchMock = vi.hoisted(() =>
  vi.fn<
    (submission: IpcModule.SnakeMatchSubmission) => Promise<IpcModule.SnakeMatchSubmissionResult>
  >(),
);

vi.mock("../../services/ipc", async (importOriginal) => {
  const actual = await importOriginal<typeof IpcModule>();
  return { ...actual, submitSnakeMatch: submitSnakeMatchMock };
});

function statForSubmission(submission: IpcModule.SnakeMatchSubmission): IpcModule.GameStat {
  const victory = submission.outcome === "victory";
  return {
    gameId: "snake",
    bestScore: submission.score,
    gamesPlayed: 1,
    wins: victory ? 1 : 0,
    losses: victory ? 0 : 1,
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
  expect(screen.getByText("准备进入环带")).toBeInTheDocument();

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1_000);
  });
  expect(screen.getByText("运行中")).toBeInTheDocument();
}

describe("SnakeGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    submitSnakeMatchMock.mockReset();
    submitSnakeMatchMock.mockImplementation(async (submission) => ({
      recorded: true,
      stat: statForSubmission(submission),
    }));
    hydrateStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts from the ready overlay and enters the countdown before playing", async () => {
    render(<SnakeGame onBack={vi.fn()} />);

    expect(screen.getByText("待开始")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "环带待启" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /等待开始/u })).toBeInTheDocument();

    await beginPlaying();
    expect(screen.queryByText("准备进入环带")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /对局进行中/u })).toBeInTheDocument();
  });

  it("freezes movement and game time while paused, then resumes in place", async () => {
    render(<SnakeGame onBack={vi.fn()} />);
    await beginPlaying();

    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "环带已暂停" })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /对局已暂停/u })).toBeInTheDocument();
    expect(submitSnakeMatchMock).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByText("运行中")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /对局进行中/u })).toBeInTheDocument();
  });

  it("auto-pauses when the window loses focus", async () => {
    render(<SnakeGame onBack={vi.fn()} />);
    await beginPlaying();

    fireEvent.blur(window);
    expect(screen.getByText("已暂停")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(submitSnakeMatchMock).not.toHaveBeenCalled();
  });

  it("ends on a wall collision and submits exactly once with a stable session id", async () => {
    render(<SnakeGame onBack={vi.fn()} />);
    await beginPlaying();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_400);
    });

    expect(screen.getByRole("heading", { name: "本局结束" })).toBeInTheDocument();
    expect(screen.getByText("蛇首越过了环带边界。")).toBeInTheDocument();
    expect(screen.getByText("成绩已保存到本地")).toBeInTheDocument();
    expect(submitSnakeMatchMock).toHaveBeenCalledTimes(1);
    expect(submitSnakeMatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: expect.stringMatching(/^[A-Za-z0-9_-]{8,64}$/u),
        outcome: "game_over",
        score: 0,
        durationMs: 1_300,
        foodEaten: 0,
        finalLength: 4,
        speedLevel: 1,
        tickMs: 130,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(submitSnakeMatchMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the same result when saving fails and the player retries", async () => {
    submitSnakeMatchMock.mockRejectedValueOnce(new Error("database unavailable"));
    render(<SnakeGame onBack={vi.fn()} />);
    await beginPlaying();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_400);
    });

    expect(screen.getByRole("alert")).toHaveTextContent("未能保存本局成绩，可重新尝试。");
    expect(submitSnakeMatchMock).toHaveBeenCalledTimes(1);
    const firstSubmission = submitSnakeMatchMock.mock.calls[0]?.[0];
    expect(firstSubmission).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(submitSnakeMatchMock).toHaveBeenCalledTimes(2);
    expect(submitSnakeMatchMock.mock.calls[1]?.[0]).toEqual(firstSubmission);
    expect(screen.getByText("成绩已保存到本地")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("does not submit an unfinished run when the game is unmounted", async () => {
    const { unmount } = render(<SnakeGame onBack={vi.fn()} />);
    await beginPlaying();

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(submitSnakeMatchMock).not.toHaveBeenCalled();
  });
});
