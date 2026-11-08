import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { hydrateStore } from "../test/fixtures";
import { LibraryPage } from "./LibraryPage";

describe("Europa library", () => {
  it("always renders all three games with truthful empty values", () => {
    hydrateStore();
    render(<LibraryPage onNavigate={vi.fn()} />);

    expect(screen.getAllByRole("button", { name: /^打开/u })).toHaveLength(3);
    const platformerCard = screen.getByRole("button", { name: /打开冰原跃迁/u });
    expect(platformerCard).toBeInTheDocument();
    expect(within(platformerCard).getByText("可游玩")).toBeInTheDocument();
    expect(within(platformerCard).queryByText("即将开放")).not.toBeInTheDocument();
    const snakeCard = screen.getByRole("button", { name: "打开环带贪吃蛇" });
    expect(snakeCard).toBeInTheDocument();
    expect(within(snakeCard).getByText("可游玩")).toBeInTheDocument();
    expect(within(snakeCard).queryByText("即将开放")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /打开星盘五子棋/u })).toBeInTheDocument();
    expect(screen.getByText(/尚无游玩记录/u)).toBeInTheDocument();
  });

  it("shows a recorded snake best score instead of a future-release label", () => {
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
        },
      ],
    });
    render(<LibraryPage onNavigate={vi.fn()} />);

    const snakeCard = screen.getByRole("button", { name: "打开环带贪吃蛇" });
    expect(within(snakeCard).getByText("最高 120")).toBeInTheDocument();
    expect(within(snakeCard).queryByText("即将开放")).not.toBeInTheDocument();
  });

  it("shows a platformer continue badge when a checkpoint save exists", () => {
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
    render(<LibraryPage onNavigate={vi.fn()} />);

    const platformerCard = screen.getByRole("button", { name: /打开冰原跃迁/u });
    expect(within(platformerCard).getByText("继续 · 第 2 关")).toBeInTheDocument();
  });

  it("navigates from the third card to the gomoku placeholder route", () => {
    const onNavigate = vi.fn();
    hydrateStore();
    render(<LibraryPage onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole("button", { name: /打开星盘五子棋/u }));
    expect(onNavigate).toHaveBeenCalledWith({ page: "game", gameId: "gomoku" });
  });
});
