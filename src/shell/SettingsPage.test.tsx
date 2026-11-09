import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAppStore } from "../state/appStore";
import { hydrateStore } from "../test/fixtures";
import { SettingsPage } from "./SettingsPage";

function renderPage() {
  const onThemeChange = vi.fn();
  const onSoundChange = vi.fn();
  const onVolumeChange = vi.fn();
  const onReducedMotionChange = vi.fn();
  const onCheckUpdate = vi.fn();
  const onInstallUpdate = vi.fn();
  const view = render(
    <SettingsPage
      onThemeChange={onThemeChange}
      onSoundChange={onSoundChange}
      onVolumeChange={onVolumeChange}
      onReducedMotionChange={onReducedMotionChange}
      updaterState={{ status: "idle" }}
      onCheckUpdate={onCheckUpdate}
      onInstallUpdate={onInstallUpdate}
    />,
  );
  return {
    onThemeChange,
    onSoundChange,
    onVolumeChange,
    onReducedMotionChange,
    onCheckUpdate,
    onInstallUpdate,
    view,
  };
}

describe("Europa settings shell", () => {
  it("forwards theme, sound, volume, and reduced-motion choices", () => {
    const { onThemeChange, onSoundChange, onVolumeChange, onReducedMotionChange } = renderPage();

    fireEvent.click(screen.getByRole("radio", { name: /浅色/u }));
    expect(onThemeChange).toHaveBeenCalledWith("light");

    fireEvent.click(screen.getByRole("switch", { name: "游戏音效" }));
    expect(onSoundChange).toHaveBeenCalledWith(false);

    fireEvent.change(screen.getByRole("slider", { name: "主音量" }), {
      target: { value: "40" },
    });
    expect(onVolumeChange).toHaveBeenCalledWith(0.4);

    fireEvent.click(screen.getByRole("switch", { name: "额外减少动态效果" }));
    expect(onReducedMotionChange).toHaveBeenCalledWith(true);
  });

  it("labels the platformer-only checkpoint metadata accurately when empty", () => {
    hydrateStore();
    renderPage();

    expect(screen.getByText("最近检查点")).toBeInTheDocument();
    expect(screen.getByText("检查点更新")).toBeInTheDocument();
    expect(screen.getAllByText("暂无")).toHaveLength(2);
    expect(screen.getByText(/三款游戏统一读取此开关/u)).toBeInTheDocument();
  });

  it("renders persistence errors supplied by the app shell", () => {
    useAppStore.getState().setPersistenceError("主题已应用，但未能写入本地存储。");
    renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("未能写入本地存储");
  });

  it("reflects the persisted master volume in the slider", () => {
    useAppStore.getState().hydrate({
      settings: { theme: "dark", sound_enabled: true, master_volume: 0.55, reduced_motion: false },
      gameStats: [],
      latestPlatformerSave: null,
      schema: {
        version: 1,
        path: "测试路径",
        storageMode: "sqlite",
      },
    });
    renderPage();

    const slider = screen.getByRole("slider", { name: "主音量" }) as HTMLInputElement;
    expect(slider.value).toBe("55");
    expect(screen.getByText("55%")).toBeInTheDocument();
  });

  it("renders the about & updater card with version and actions", () => {
    const { onCheckUpdate, onInstallUpdate } = renderPage();

    expect(screen.getByText("关于与更新")).toBeInTheDocument();
    expect(screen.getByText("当前版本")).toBeInTheDocument();
    expect(screen.getByText("v1.0.0")).toBeInTheDocument();
    expect(screen.getByText("未检查")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "检查更新" }));
    expect(onCheckUpdate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "下载并安装" })).not.toBeInTheDocument();
    expect(onInstallUpdate).not.toHaveBeenCalled();
  });

  it("offers install when an update is available and shows release notes", () => {
    const {
      onThemeChange,
      onSoundChange,
      onVolumeChange,
      onReducedMotionChange,
      onCheckUpdate,
      onInstallUpdate,
      view,
    } = renderPage();
    view.rerender(
      <SettingsPage
        onThemeChange={onThemeChange}
        onSoundChange={onSoundChange}
        onVolumeChange={onVolumeChange}
        onReducedMotionChange={onReducedMotionChange}
        updaterState={{
          status: "available",
          currentVersion: "1.0.0",
          version: "1.1.0",
          body: "新增离线更新功能",
        }}
        onCheckUpdate={onCheckUpdate}
        onInstallUpdate={onInstallUpdate}
      />,
    );

    expect(screen.getByText(/发现新版本 v1.1.0/u)).toBeInTheDocument();
    expect(screen.getByText("新增离线更新功能")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "下载并安装" }));
    expect(onInstallUpdate).toHaveBeenCalledTimes(1);
  });
});
