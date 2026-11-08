import { describe, expect, it } from "vitest";

import { BROWSER_SETTINGS_KEY } from "../services/ipc";
import { installMatchMedia } from "../test/media";
import {
  THEME_CACHE_KEY,
  applyResolvedTheme,
  cacheThemeMode,
  getInitialThemeMode,
  getThemeQueryOverride,
  resolveTheme,
  watchSystemTheme,
} from "./theme";

describe("theme resolution", () => {
  it("lets the preview query parameter override stored modes", () => {
    window.history.replaceState(null, "", "/?theme=dark#/library");
    expect(getThemeQueryOverride()).toBe("dark");
    expect(getInitialThemeMode()).toBe("dark");
  });

  it("prefers the cached theme over browser settings", () => {
    localStorage.setItem(THEME_CACHE_KEY, "dark");
    localStorage.setItem(BROWSER_SETTINGS_KEY, JSON.stringify({ theme: "light" }));
    expect(getInitialThemeMode()).toBe("dark");
  });

  it("uses browser settings when no cache exists", () => {
    localStorage.setItem(BROWSER_SETTINGS_KEY, JSON.stringify({ theme: "light" }));
    expect(getInitialThemeMode()).toBe("light");
  });

  it("resolves system mode from prefers-color-scheme", () => {
    const media = installMatchMedia(true);
    expect(resolveTheme("system")).toBe("dark");
    media.setDark(false);
    expect(resolveTheme("system")).toBe("light");
  });

  it("only reacts to system changes while in system mode", () => {
    const media = installMatchMedia(false);
    const systemChanges: string[] = [];
    const fixedChanges: string[] = [];

    const stopSystem = watchSystemTheme(
      () => "system",
      (theme) => systemChanges.push(theme),
    );
    const stopFixed = watchSystemTheme(
      () => "dark",
      (theme) => fixedChanges.push(theme),
    );

    media.setDark(true);
    expect(systemChanges).toEqual(["dark"]);
    expect(fixedChanges).toEqual([]);
    expect(media.listenerCount()).toBe(2);

    stopSystem();
    media.setDark(false);
    expect(systemChanges).toEqual(["dark"]);
    expect(media.listenerCount()).toBe(1);

    stopFixed();
    expect(media.listenerCount()).toBe(0);
  });

  it("applies the resolved theme and caches the mode", () => {
    applyResolvedTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");

    cacheThemeMode("system");
    expect(localStorage.getItem(THEME_CACHE_KEY)).toBe("system");
  });
});
