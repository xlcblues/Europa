import { create } from "zustand";

import {
  getInitialThemeMode,
  getThemeQueryOverride,
  isThemeMode,
  resolveTheme,
  type ResolvedTheme,
  type ThemeMode,
} from "../app/theme";
import type { BootstrapData, GameStat, PlatformerSave, SchemaInfo } from "../services/ipc";

export type BootstrapStatus = "loading" | "ready" | "error";

interface AppStore {
  bootstrapStatus: BootstrapStatus;
  bootstrapError: string | null;
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  soundEnabled: boolean;
  reducedMotion: boolean;
  persistenceError: string | null;
  gameStats: GameStat[];
  latestPlatformerSave: PlatformerSave | null;
  schema: SchemaInfo | null;
  hydrate: (data: BootstrapData) => void;
  setBootstrapError: (message: string | null) => void;
  setThemeMode: (mode: ThemeMode, resolved: ResolvedTheme) => void;
  setResolvedTheme: (resolved: ResolvedTheme) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setPersistenceError: (message: string | null) => void;
  mergeGameStat: (stat: GameStat) => void;
  setLatestPlatformerSave: (save: PlatformerSave) => void;
  clearLatestPlatformerSave: () => void;
}

const initialThemeMode = getInitialThemeMode();

export const useAppStore = create<AppStore>((set) => ({
  bootstrapStatus: "loading",
  bootstrapError: null,
  themeMode: initialThemeMode,
  resolvedTheme: resolveTheme(initialThemeMode),
  soundEnabled: true,
  reducedMotion: false,
  persistenceError: null,
  gameStats: [],
  latestPlatformerSave: null,
  schema: null,
  hydrate: (data) => {
    const queryTheme = getThemeQueryOverride();
    const themeMode = queryTheme ?? (isThemeMode(data.settings.theme) ? data.settings.theme : initialThemeMode);
    set({
      bootstrapStatus: "ready",
      bootstrapError: null,
      themeMode,
      resolvedTheme: resolveTheme(themeMode),
      soundEnabled:
        typeof data.settings.sound_enabled === "boolean" ? data.settings.sound_enabled : true,
      reducedMotion:
        typeof data.settings.reduced_motion === "boolean" ? data.settings.reduced_motion : false,
      gameStats: data.gameStats,
      latestPlatformerSave: data.latestPlatformerSave,
      schema: data.schema,
    });
  },
  setBootstrapError: (bootstrapError) =>
    set({
      bootstrapStatus: bootstrapError ? "error" : "loading",
      bootstrapError,
    }),
  setThemeMode: (themeMode, resolvedTheme) => set({ themeMode, resolvedTheme }),
  setResolvedTheme: (resolvedTheme) => set({ resolvedTheme }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setPersistenceError: (persistenceError) => set({ persistenceError }),
  mergeGameStat: (stat) =>
    set((state) => {
      const existingIndex = state.gameStats.findIndex((item) => item.gameId === stat.gameId);
      if (existingIndex === -1) {
        return { gameStats: [...state.gameStats, stat] };
      }

      const gameStats = [...state.gameStats];
      gameStats[existingIndex] = stat;
      return { gameStats };
    }),
  setLatestPlatformerSave: (latestPlatformerSave) => set({ latestPlatformerSave }),
  clearLatestPlatformerSave: () => set({ latestPlatformerSave: null }),
}));

export function resetAppStoreForTests(): void {
  useAppStore.setState({
    bootstrapStatus: "loading",
    bootstrapError: null,
    themeMode: "system",
    resolvedTheme: "light",
    soundEnabled: true,
    reducedMotion: false,
    persistenceError: null,
    gameStats: [],
    latestPlatformerSave: null,
    schema: null,
  });
}

