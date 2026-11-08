import { useCallback, useEffect, useState } from "react";

import { ensureInitialRoute, navigateTo, parseRoute, type AppRoute } from "./router";
import {
  applyResolvedTheme,
  cacheThemeMode,
  resolveTheme,
  watchSystemTheme,
  type ThemeMode,
} from "./theme";
import type { SettingKey } from "../services/ipc";
import { saveSetting } from "../services/ipc";
import { GomokuGame } from "../games/gomoku/GomokuGame";
import { PlatformerGame } from "../games/platformer/PlatformerGame";
import { SnakeGame } from "../games/snake/SnakeGame";
import { LibraryPage } from "../shell/LibraryPage";
import { RecordsPage } from "../shell/RecordsPage";
import { SettingsPage } from "../shell/SettingsPage";
import { Sidebar } from "../shell/Sidebar";
import { TitleBar } from "../shell/TitleBar";
import { useAppStore } from "../state/appStore";

function persistenceMessage(label: string): string {
  return `${label}已应用，但未能写入本地存储。请检查数据库状态后重试。`;
}

export function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute());
  const resolvedTheme = useAppStore((state) => state.resolvedTheme);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const stats = useAppStore((state) => state.gameStats);
  const schema = useAppStore((state) => state.schema);
  const bootstrapStatus = useAppStore((state) => state.bootstrapStatus);
  const latestPlatformerLevel = useAppStore((state) => state.latestPlatformerSave?.levelId ?? null);

  useEffect(() => {
    ensureInitialRoute();
    const handleHashChange = () => setRoute(parseRoute());

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    return watchSystemTheme(
      () => useAppStore.getState().themeMode,
      (nextTheme) => {
        useAppStore.getState().setResolvedTheme(nextTheme);
        applyResolvedTheme(nextTheme);
      },
    );
  }, []);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? "true" : "false";
  }, [reducedMotion]);

  const handleNavigate = useCallback((nextRoute: AppRoute) => {
    setRoute(nextRoute);
    navigateTo(nextRoute);
  }, []);

  const persistSetting = useCallback(async (key: SettingKey, value: unknown, label: string) => {
    const store = useAppStore.getState();
    store.setPersistenceError(null);

    try {
      await saveSetting(key, value);
    } catch {
      useAppStore.getState().setPersistenceError(persistenceMessage(label));
    }
  }, []);

  const handleThemeChange = useCallback(
    (mode: ThemeMode) => {
      const resolved = resolveTheme(mode);
      useAppStore.getState().setThemeMode(mode, resolved);
      applyResolvedTheme(resolved);
      cacheThemeMode(mode);
      void persistSetting("theme", mode, "主题");
    },
    [persistSetting],
  );

  const handleToggleTheme = useCallback(() => {
    handleThemeChange(resolvedTheme === "dark" ? "light" : "dark");
  }, [handleThemeChange, resolvedTheme]);

  const handleSoundChange = useCallback(
    (enabled: boolean) => {
      useAppStore.getState().setSoundEnabled(enabled);
      void persistSetting("sound_enabled", enabled, "音效设置");
    },
    [persistSetting],
  );

  const handleReducedMotionChange = useCallback(
    (enabled: boolean) => {
      useAppStore.getState().setReducedMotion(enabled);
      void persistSetting("reduced_motion", enabled, "动态效果设置");
    },
    [persistSetting],
  );

  const isGamePage = route.page === "game";

  return (
    <div className={`app-shell${isGamePage ? " is-game-page" : ""}`}>
      <TitleBar
        route={route}
        resolvedTheme={resolvedTheme}
        soundEnabled={soundEnabled}
        onNavigate={handleNavigate}
        onToggleTheme={handleToggleTheme}
        onToggleSound={() => handleSoundChange(!soundEnabled)}
      />

      <div className="app-body">
        {!isGamePage ? (
          <Sidebar
            route={route}
            stats={stats}
            schema={schema}
            bootstrapStatus={bootstrapStatus}
            latestPlatformerLevel={latestPlatformerLevel}
            onNavigate={handleNavigate}
          />
        ) : null}

        <main className="content-area">
          {route.page === "library" ? <LibraryPage onNavigate={handleNavigate} /> : null}
          {route.page === "records" ? <RecordsPage onNavigate={handleNavigate} /> : null}
          {route.page === "settings" ? (
            <SettingsPage
              onThemeChange={handleThemeChange}
              onSoundChange={handleSoundChange}
              onReducedMotionChange={handleReducedMotionChange}
            />
          ) : null}
          {route.page === "game" && route.gameId === "platformer" ? (
            <PlatformerGame onBack={() => handleNavigate({ page: "library" })} />
          ) : null}
          {route.page === "game" && route.gameId === "snake" ? (
            <SnakeGame onBack={() => handleNavigate({ page: "library" })} />
          ) : null}
          {route.page === "game" && route.gameId === "gomoku" ? (
            <GomokuGame onBack={() => handleNavigate({ page: "library" })} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
