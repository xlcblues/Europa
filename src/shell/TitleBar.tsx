import { useEffect, useState } from "react";

import { getGame } from "../services/gameCatalog";
import {
  closeWindow,
  isWindowMaximized,
  minimizeWindow,
  toggleWindowMaximize,
} from "../services/windowActions";
import type { AppRoute } from "../app/router";
import type { ResolvedTheme } from "../app/theme";
import { LogoMark } from "../components/LogoMark";
import {
  ArrowLeftIcon,
  CloseIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoonIcon,
  RestoreIcon,
  SettingsIcon,
  SoundOffIcon,
  SoundOnIcon,
  SunIcon,
} from "../components/Icons";

interface TitleBarProps {
  route: AppRoute;
  resolvedTheme: ResolvedTheme;
  soundEnabled: boolean;
  onNavigate: (route: AppRoute) => void;
  onToggleTheme: () => void;
  onToggleSound: () => void;
}

function pageTitle(route: AppRoute): string {
  switch (route.page) {
    case "library":
      return "游戏库";
    case "records":
      return "游玩记录";
    case "settings":
      return "设置";
    case "game":
      return getGame(route.gameId).title;
  }
}

function GameBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="brand-back" type="button" onClick={onClick} aria-label="返回游戏库" title="返回游戏库">
      <ArrowLeftIcon size={18} />
    </button>
  );
}

export function TitleBar({
  route,
  resolvedTheme,
  soundEnabled,
  onNavigate,
  onToggleTheme,
  onToggleSound,
}: TitleBarProps) {
  const [maximized, setMaximized] = useState(false);
  const isGamePage = route.page === "game";

  useEffect(() => {
    let active = true;

    const syncWindowState = async () => {
      const next = await isWindowMaximized();
      if (active) {
        setMaximized(next);
      }
    };

    void syncWindowState();
    window.addEventListener("resize", syncWindowState);

    return () => {
      active = false;
      window.removeEventListener("resize", syncWindowState);
    };
  }, []);

  const handleMaximize = async () => {
    await toggleWindowMaximize();
    setMaximized(await isWindowMaximized());
  };

  return (
    <header className="titlebar" data-tauri-drag-region>
      <div className={`title-brand${isGamePage ? " is-game" : ""}`} data-tauri-drag-region={isGamePage ? undefined : true}>
        {isGamePage ? <GameBackButton onClick={() => onNavigate({ page: "library" })} /> : null}
        <LogoMark size={22} className="title-logo" />
        <strong>Europa</strong>
        {!isGamePage ? <span className="brand-dot" aria-hidden="true" /> : null}
      </div>

      <div className="title-center" data-tauri-drag-region>
        <span className="title-page">{pageTitle(route)}</span>
        <span className="title-separator" aria-hidden="true" />
        <span className="title-copy">小游戏合集</span>
      </div>

      <div className="title-spacer" data-tauri-drag-region />

      <div className="title-actions">
        <span className="title-status">
          <span aria-hidden="true" />本地模式
        </span>
        <button
          className="icon-btn"
          type="button"
          onClick={onToggleTheme}
          aria-label={resolvedTheme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
          title={resolvedTheme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
        >
          {resolvedTheme === "dark" ? <SunIcon size={17} /> : <MoonIcon size={17} />}
        </button>
        <button
          className="icon-btn"
          type="button"
          onClick={onToggleSound}
          aria-label={soundEnabled ? "关闭音效" : "开启音效"}
          title={soundEnabled ? "关闭音效" : "开启音效"}
        >
          {soundEnabled ? <SoundOnIcon size={17} /> : <SoundOffIcon size={17} />}
        </button>
        <button
          className="icon-btn"
          type="button"
          onClick={() => onNavigate({ page: "settings" })}
          aria-label="打开设置"
          title="打开设置"
          disabled={route.page === "settings"}
        >
          <SettingsIcon size={17} />
        </button>
      </div>

      <div className="window-divider" aria-hidden="true" />

      <div className="window-controls">
        <button
          className="win-btn"
          type="button"
          aria-label="最小化窗口"
          title="最小化"
          onClick={() => void minimizeWindow()}
        >
          <MinimizeIcon size={16} />
        </button>
        <button
          className="win-btn"
          type="button"
          aria-label={maximized ? "还原窗口" : "最大化窗口"}
          title={maximized ? "还原窗口" : "最大化窗口"}
          onClick={() => void handleMaximize()}
        >
          {maximized ? <RestoreIcon size={16} /> : <MaximizeIcon size={16} />}
        </button>
        <button
          className="win-btn win-btn-close"
          type="button"
          aria-label="关闭 Europa"
          title="关闭"
          onClick={() => void closeWindow()}
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </header>
  );
}

