import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as IpcModule from "../services/ipc";
import { hydrateStore } from "../test/fixtures";
import { App } from "./App";

const saveSettingMock = vi.hoisted(() =>
  vi.fn<(key: IpcModule.SettingKey, value: unknown) => Promise<IpcModule.SettingRecord>>(),
);

vi.mock("../services/ipc", async (importOriginal) => {
  const actual = await importOriginal<typeof IpcModule>();
  return { ...actual, saveSetting: saveSettingMock };
});

describe("Europa app shell", () => {
  beforeEach(() => {
    saveSettingMock.mockReset();
    saveSettingMock.mockResolvedValue({ key: "theme", value: "light", updatedAt: 1 });
    hydrateStore();
  });

  it("opens a game placeholder from the library and returns", () => {
    window.location.hash = "#/library";
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "打开星盘五子棋，玩法即将开放" }));
    expect(screen.getByRole("heading", { name: "星盘五子棋", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("界面已就绪 · 玩法开发中")).toBeInTheDocument();

    const preview = screen.getByRole("region", { name: "星盘对弈将在下一里程碑开放" });
    fireEvent.click(within(preview).getByRole("button", { name: "返回游戏库" }));
    expect(screen.getByRole("heading", { name: "游戏库" })).toBeInTheDocument();
    expect(window.location.hash).toBe("#/library");
  });

  it("opens the playable snake game instead of its old placeholder", () => {
    window.location.hash = "#/library";
    render(<App />);

    const gameGrid = screen.getByRole("region", { name: "Europa 小游戏" });
    fireEvent.click(within(gameGrid).getByRole("button", { name: "打开环带贪吃蛇" }));

    expect(screen.getByRole("heading", { name: "环带贪吃蛇", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("环带待启")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /贪吃蛇棋盘，20×20/u })).toBeInTheDocument();
    expect(screen.queryByText("玩法待开放")).not.toBeInTheDocument();
  });
  it("opens the playable platformer game instead of its old placeholder", () => {
    window.location.hash = "#/library";
    render(<App />);

    const gameGrid = screen.getByRole("region", { name: "Europa 小游戏" });
    fireEvent.click(within(gameGrid).getByRole("button", { name: "打开冰原跃迁" }));

    expect(screen.getByRole("heading", { name: "冰原跃迁", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("待开始")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "远征待启" })).toBeInTheDocument();
    expect(screen.queryByText("玩法待开放")).not.toBeInTheDocument();
  });
  it("applies theme and sound changes and persists both settings", async () => {
    window.location.hash = "#/settings";
    render(<App />);

    fireEvent.click(screen.getByRole("radio", { name: /深色/u }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    await waitFor(() => expect(saveSettingMock).toHaveBeenCalledWith("theme", "dark"));

    fireEvent.click(screen.getByRole("switch", { name: "游戏音效" }));
    await waitFor(() => expect(saveSettingMock).toHaveBeenCalledWith("sound_enabled", false));
  });

  it("keeps the visual change and shows a warning when persistence fails", async () => {
    saveSettingMock.mockRejectedValueOnce(new Error("database unavailable"));
    window.location.hash = "#/settings";
    render(<App />);

    fireEvent.click(screen.getByRole("radio", { name: /深色/u }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "主题已应用，但未能写入本地存储。请检查数据库状态后重试。",
    );
  });
});


