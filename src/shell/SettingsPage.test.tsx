import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppStore } from "../state/appStore";
import { hydrateStore } from "../test/fixtures";
import { SettingsPage } from "./SettingsPage";

describe("Europa settings shell", () => {
  it("forwards theme, sound, and reduced-motion choices", () => {
    const onThemeChange = vi.fn();
    const onSoundChange = vi.fn();
    const onReducedMotionChange = vi.fn();

    render(
      <SettingsPage
        onThemeChange={onThemeChange}
        onSoundChange={onSoundChange}
        onReducedMotionChange={onReducedMotionChange}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /浅色/u }));
    expect(onThemeChange).toHaveBeenCalledWith("light");

    fireEvent.click(screen.getByRole("switch", { name: "游戏音效" }));
    expect(onSoundChange).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole("switch", { name: "额外减少动态效果" }));
    expect(onReducedMotionChange).toHaveBeenCalledWith(true);
  });

  it("labels the platformer-only checkpoint metadata accurately when empty", () => {
    hydrateStore();
    render(
      <SettingsPage
        onThemeChange={vi.fn()}
        onSoundChange={vi.fn()}
        onReducedMotionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("最近检查点")).toBeInTheDocument();
    expect(screen.getByText("检查点更新")).toBeInTheDocument();
    expect(screen.getAllByText("暂无")).toHaveLength(2);
    expect(screen.getByText(/程序化冰环音效/u)).toBeInTheDocument();
  });

  it("renders persistence errors supplied by the app shell", () => {
    useAppStore.getState().setPersistenceError("主题已应用，但未能写入本地存储。");
    render(
      <SettingsPage
        onThemeChange={vi.fn()}
        onSoundChange={vi.fn()}
        onReducedMotionChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("未能写入本地存储");
  });
});

