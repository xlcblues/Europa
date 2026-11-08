import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as IpcModule from "../../services/ipc";
import { hydrateStore } from "../../test/fixtures";
import { GomokuGame } from "./GomokuGame";
import type * as GomokuAiModule from "./gomokuAi";
import type { GomokuCell, GomokuDifficulty, GomokuPoint, GomokuStone } from "./gomokuTypes";

const submitGomokuMatchMock = vi.hoisted(() =>
  vi.fn<
    (submission: IpcModule.GomokuMatchSubmission) => Promise<IpcModule.GomokuMatchSubmissionResult>
  >(),
);

const chooseAiMoveMock = vi.hoisted(() =>
  vi.fn<
    (
      board: GomokuCell[][],
      stone: GomokuStone,
      difficulty: GomokuDifficulty,
    ) => GomokuPoint | null
  >(),
);

vi.mock("../../services/ipc", async (importOriginal) => {
  const actual = await importOriginal<typeof IpcModule>();
  return { ...actual, submitGomokuMatch: submitGomokuMatchMock };
});

vi.mock("./gomokuAi", async (importOriginal) => {
  const actual = await importOriginal<typeof GomokuAiModule>();
  return { ...actual, chooseAiMove: chooseAiMoveMock };
});

function statForSubmission(submission: IpcModule.GomokuMatchSubmission): IpcModule.GameStat {
  const win = submission.outcome === "win";
  const loss = submission.outcome === "loss";
  return {
    gameId: "gomoku",
    bestScore: 0,
    gamesPlayed: 1,
    wins: win ? 1 : 0,
    losses: loss ? 1 : 0,
    draws: submission.outcome === "draw" ? 1 : 0,
    totalPlayMs: submission.durationMs,
    lastPlayedAt: Date.now(),
    currentStreak: win ? 1 : 0,
    longestStreak: win ? 1 : 0,
    fastestWinMoves: win ? submission.moveCount : null,
    fastestWinMs: win ? submission.durationMs : null,
  };
}

const WIN_SEQUENCE: readonly GomokuPoint[] = [
  { x: 7, y: 7 },
  { x: 7, y: 8 },
  { x: 8, y: 7 },
  { x: 8, y: 8 },
  { x: 9, y: 7 },
  { x: 9, y: 8 },
  { x: 10, y: 7 },
  { x: 10, y: 8 },
  { x: 11, y: 7 },
];

function pressKey(code: string): void {
  fireEvent.keyDown(window, { code });
}

function createPlacer() {
  let cursor: GomokuPoint = { x: 7, y: 7 };
  return {
    moveTo(x: number, y: number): void {
      while (cursor.x < x) {
        pressKey("ArrowRight");
        cursor = { x: cursor.x + 1, y: cursor.y };
      }
      while (cursor.x > x) {
        pressKey("ArrowLeft");
        cursor = { x: cursor.x - 1, y: cursor.y };
      }
      while (cursor.y < y) {
        pressKey("ArrowDown");
        cursor = { x: cursor.x, y: cursor.y + 1 };
      }
      while (cursor.y > y) {
        pressKey("ArrowUp");
        cursor = { x: cursor.x, y: cursor.y - 1 };
      }
    },
    place(x: number, y: number): void {
      this.moveTo(x, y);
      pressKey("Enter");
    },
  };
}

async function startPvp(): Promise<void> {
  fireEvent.click(screen.getByRole("button", { name: "本地双人" }));
  pressKey("Enter");
  expect(screen.getByText("对弈中")).toBeInTheDocument();
}

describe("GomokuGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    submitGomokuMatchMock.mockReset();
    submitGomokuMatchMock.mockImplementation(async (submission) => ({
      recorded: true,
      stat: statForSubmission(submission),
    }));
    chooseAiMoveMock.mockReset();
    chooseAiMoveMock.mockReturnValue({ x: 7, y: 8 });
    hydrateStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts from the ready overlay and enters the playing phase", () => {
    render(<GomokuGame onBack={vi.fn()} />);

    expect(screen.getByText("待开始")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "星盘待战" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /星盘五子棋棋盘/u })).toBeInTheDocument();

    pressKey("Enter");
    expect(screen.getByText("对弈中")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "星盘待战" })).not.toBeInTheDocument();
  });

  it("plays a full PVP match and submits the black win exactly once", async () => {
    render(<GomokuGame onBack={vi.fn()} />);
    await startPvp();

    const placer = createPlacer();
    for (const point of WIN_SEQUENCE) {
      placer.place(point.x, point.y);
    }

    expect(screen.getByRole("heading", { name: "黑棋获胜" })).toBeInTheDocument();
    expect(screen.getByText("黑棋率先连成五子，星盘定格。")).toBeInTheDocument();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByText("成绩已保存到本地")).toBeInTheDocument();
    expect(submitGomokuMatchMock).toHaveBeenCalledTimes(1);
    expect(submitGomokuMatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: expect.stringMatching(/^[A-Za-z0-9_-]{8,64}$/u),
        mode: "pvp",
        difficulty: null,
        outcome: "win",
        winner: "black",
        moveCount: 9,
        usedUndo: false,
        undoCount: 0,
        moves: WIN_SEQUENCE,
        victoryLine: [
          { x: 7, y: 7 },
          { x: 8, y: 7 },
          { x: 9, y: 7 },
          { x: 10, y: 7 },
          { x: 11, y: 7 },
        ],
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(submitGomokuMatchMock).toHaveBeenCalledTimes(1);
  });

  it("undo removes plies and decrements the undo budget", async () => {
    render(<GomokuGame onBack={vi.fn()} />);
    await startPvp();
    const placer = createPlacer();
    placer.place(7, 7);
    placer.place(7, 8);
    expect(screen.getByText("已落子")).toBeInTheDocument();

    pressKey("KeyU");
    expect(screen.getAllByText("1/3").length).toBeGreaterThan(0);
    expect(screen.getByText("已悔棋，可重新落子。")).toBeInTheDocument();

    pressKey("KeyU");
    expect(screen.getAllByText("2/3").length).toBeGreaterThan(0);
  });

  it("freezes the round while paused, then resumes in place", async () => {
    render(<GomokuGame onBack={vi.fn()} />);
    await startPvp();
    createPlacer().place(7, 7);

    pressKey("Escape");
    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "对弈已暂停" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /对局已暂停/u })).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(screen.getByText("已暂停")).toBeInTheDocument();
    expect(submitGomokuMatchMock).not.toHaveBeenCalled();

    pressKey("Space");
    expect(screen.getByText("对弈中")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /已落子 1，对局进行中/u })).toBeInTheDocument();
  });

  it("auto-pauses when the window loses focus", () => {
    render(<GomokuGame onBack={vi.fn()} />);
    pressKey("Enter");
    createPlacer().place(7, 7);

    fireEvent.blur(window);
    expect(screen.getByText("已暂停")).toBeInTheDocument();
  });

  it("lets the AI reply after the player's move in AI mode", async () => {
    render(<GomokuGame onBack={vi.fn()} />);
    pressKey("Enter");
    expect(screen.getByText("对弈中")).toBeInTheDocument();

    createPlacer().place(7, 7);
    expect(screen.getByText("AI 思考中")).toBeInTheDocument();
    expect(screen.getByText("AI · 白棋")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(screen.queryByText("AI 思考中")).not.toBeInTheDocument();
    expect(screen.getAllByText("你 · 黑棋").length).toBeGreaterThan(0);
    expect(submitGomokuMatchMock).not.toHaveBeenCalled();
  });

  it("does not submit an unfinished round when unmounted", async () => {
    const { unmount } = render(<GomokuGame onBack={vi.fn()} />);
    await startPvp();
    createPlacer().place(7, 7);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(submitGomokuMatchMock).not.toHaveBeenCalled();
  });

  it("reuses the same result when saving fails and the player retries", async () => {
    submitGomokuMatchMock.mockRejectedValueOnce(new Error("database unavailable"));
    render(<GomokuGame onBack={vi.fn()} />);
    await startPvp();

    const placer = createPlacer();
    for (const point of WIN_SEQUENCE) {
      placer.place(point.x, point.y);
    }

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole("alert")).toHaveTextContent("未能保存本局成绩，可重新尝试。");
    expect(submitGomokuMatchMock).toHaveBeenCalledTimes(1);
    const firstSubmission = submitGomokuMatchMock.mock.calls[0]?.[0];
    expect(firstSubmission).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(submitGomokuMatchMock).toHaveBeenCalledTimes(2);
    expect(submitGomokuMatchMock.mock.calls[1]?.[0]).toEqual(firstSubmission);
    expect(screen.getByText("成绩已保存到本地")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
