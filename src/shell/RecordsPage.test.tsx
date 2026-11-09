import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import * as ipc from "../services/ipc";
import { hydrateStore } from "../test/fixtures";
import { useAppStore } from "../state/appStore";
import { RecordsPage } from "./RecordsPage";

function seedHistory(entries: ipc.MatchHistoryEntry[]): void {
  localStorage.setItem(ipc.BROWSER_HISTORY_KEY, JSON.stringify({ entries }));
}

function seedSnakeRecord(): void {
  hydrateStore({
    gameStats: [
      {
        gameId: "snake",
        bestScore: 120,
        gamesPlayed: 4,
        wins: 0,
        losses: 4,
        draws: 0,
        totalPlayMs: 6_000,
        lastPlayedAt: Date.now(),
        currentStreak: 0,
        longestStreak: 0,
        fastestWinMoves: null,
        fastestWinMs: null,
      },
    ],
  });
  seedHistory([
    {
      id: 1,
      gameId: "snake",
      outcome: "game_over",
      score: 120,
      durationMs: 4_200,
      createdAt: Date.now() - 5_000,
      detail: { foodEaten: 12 },
    },
    {
      id: 2,
      gameId: "gomoku",
      outcome: "win",
      score: 9,
      durationMs: 2_400,
      createdAt: Date.now() - 10_000,
      detail: { moveCount: 9 },
    },
  ]);
}

describe("Europa records page", () => {
  it("shows the empty state before any game is played", async () => {
    hydrateStore();
    render(<RecordsPage onNavigate={vi.fn()} />);

    expect(
      await screen.findByRole("heading", { name: "还没有游玩记录" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "前往游戏库" })).toBeInTheDocument();
  });

  it("renders per-game statistics with truthful placeholder values", () => {
    seedSnakeRecord();
    render(<RecordsPage onNavigate={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "游玩记录", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("累计 4 局")).toBeInTheDocument();

    const table = screen.getByRole("table", { name: "分游戏游玩统计" });
    const snakeRow = within(table).getByText("环带贪吃蛇").closest(".record-row");
    expect(snakeRow).not.toBeNull();
    expect(within(snakeRow as HTMLElement).getByText("4 局")).toBeInTheDocument();
    expect(within(snakeRow as HTMLElement).getByText("120")).toBeInTheDocument();
  });

  it("lists recent matches with game, outcome, score and relative time", async () => {
    seedSnakeRecord();
    render(<RecordsPage onNavigate={vi.fn()} />);

    expect(await screen.findByText("最近 2 局")).toBeInTheDocument();
    const list = screen.getByText("最近对局").closest(".records-history-card");
    expect(list).not.toBeNull();
    expect(within(list as HTMLElement).getByText("环带贪吃蛇")).toBeInTheDocument();
    expect(within(list as HTMLElement).getByText("星盘五子棋")).toBeInTheDocument();
    expect(within(list as HTMLElement).getAllByText("刚刚")).toHaveLength(2);
    expect(within(list as HTMLElement).getByText("120")).toBeInTheDocument();
    expect(within(list as HTMLElement).getByText("9 手")).toBeInTheDocument();
  });

  it("opens a confirmation dialog and cancels without deleting anything", async () => {
    seedSnakeRecord();
    render(<RecordsPage onNavigate={vi.fn()} />);
    await screen.findByText("最近 2 局");

    fireEvent.click(screen.getByRole("button", { name: "清除环带贪吃蛇记录" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("清除 环带贪吃蛇 的记录")).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "取消" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    expect(useAppStore.getState().gameStats).toHaveLength(1);
    const history = JSON.parse(localStorage.getItem(ipc.BROWSER_HISTORY_KEY) ?? "{}");
    expect((history as { entries: unknown[] }).entries).toHaveLength(2);
  });

  it("clears a single game history and resets its statistic after confirmation", async () => {
    seedSnakeRecord();
    render(<RecordsPage onNavigate={vi.fn()} />);
    await screen.findByText("最近 2 局");

    fireEvent.click(screen.getByRole("button", { name: "清除环带贪吃蛇记录" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "确认清除" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(useAppStore.getState().gameStats).toHaveLength(0);
    expect(await screen.findByText("最近 1 局")).toBeInTheDocument();
    const list = screen.getByText("最近对局").closest(".records-history-card");
    expect(within(list as HTMLElement).queryByText("环带贪吃蛇")).not.toBeInTheDocument();
    expect(within(list as HTMLElement).getByText("星盘五子棋")).toBeInTheDocument();
  });

  it("keeps local data intact and reports an error when clearing fails", async () => {
    seedSnakeRecord();
    const spy = vi
      .spyOn(ipc, "clearGameHistory")
      .mockRejectedValue(new Error("database unavailable"));
    render(<RecordsPage onNavigate={vi.fn()} />);
    await screen.findByText("最近 2 局");

    fireEvent.click(screen.getByRole("button", { name: "清除环带贪吃蛇记录" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "确认清除" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "清除失败，本地数据未做改动，请重试。",
    );
    expect(useAppStore.getState().gameStats).toHaveLength(1);
    const history = JSON.parse(localStorage.getItem(ipc.BROWSER_HISTORY_KEY) ?? "{}");
    expect((history as { entries: unknown[] }).entries).toHaveLength(2);

    spy.mockRestore();
  });

  it("clears the platformer checkpoint save after confirmation", async () => {
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
    localStorage.setItem(
      ipc.BROWSER_PLATFORMER_SAVE_KEY,
      JSON.stringify({
        slot: "platformer_main",
        levelId: 2,
        checkpointId: "l2-checkpoint-01",
        score: 320,
        lives: 2,
        details: null,
        updatedAt: Date.now(),
      }),
    );
    render(<RecordsPage onNavigate={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "清除冰原跃迁检查点存档" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("清除检查点存档")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "清除存档" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(useAppStore.getState().latestPlatformerSave).toBeNull();
    expect(localStorage.getItem(ipc.BROWSER_PLATFORMER_SAVE_KEY)).toBeNull();
  });
});
