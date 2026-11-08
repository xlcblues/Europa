import { readBrowserSettings } from "../services/ipc";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_CACHE_KEY = "europa.theme";

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function getThemeQueryOverride(): ThemeMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const queryTheme = new URLSearchParams(window.location.search).get("theme");
  return isThemeMode(queryTheme) ? queryTheme : null;
}

export function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const queryTheme = getThemeQueryOverride();
  if (queryTheme) {
    return queryTheme;
  }

  try {
    const cached = localStorage.getItem(THEME_CACHE_KEY);
    if (isThemeMode(cached)) {
      return cached;
    }
  } catch {
    // A restricted webview can deny storage; system theme remains a safe fallback.
  }

  try {
    const bootstrapTheme = readBrowserSettings().theme;
    if (isThemeMode(bootstrapTheme)) {
      return bootstrapTheme;
    }
  } catch {
    // Browser preview persistence is optional.
  }

  return "system";
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "light" || mode === "dark") {
    return mode;
  }

  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return "light";
}

export function applyResolvedTheme(theme: ResolvedTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.content = theme === "dark" ? "#07161e" : "#f4f9fa";
  }
}

export function cacheThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_CACHE_KEY, mode);
  } catch {
    // The SQLite setting remains authoritative when web storage is unavailable.
  }
}

export function watchSystemTheme(
  getMode: () => ThemeMode,
  onChange: (theme: ResolvedTheme) => void,
): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }

  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => {
    if (getMode() === "system") {
      onChange(query.matches ? "dark" : "light");
    }
  };

  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}
