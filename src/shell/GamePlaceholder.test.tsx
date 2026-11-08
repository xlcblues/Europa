import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GamePlaceholder } from "./GamePlaceholder";

describe("future game placeholder", () => {
  it("shows the selected game profile and planned abilities without fake gameplay", () => {
    render(<GamePlaceholder gameId="gomoku" onBack={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "星盘五子棋", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("界面已就绪 · 玩法开发中")).toBeInTheDocument();
    expect(screen.getByText("星盘对弈将在下一里程碑开放")).toBeInTheDocument();
    expect(screen.getByText("15×15 棋盘")).toBeInTheDocument();
    expect(screen.getByText(/该游戏尚未接入可操作循环、计分或胜负结算/u)).toBeInTheDocument();
  });

  it("returns to the game library", () => {
    const onBack = vi.fn();
    render(<GamePlaceholder gameId="gomoku" onBack={onBack} />);

    fireEvent.click(screen.getByRole("button", { name: "返回游戏库" }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});