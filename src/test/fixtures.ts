import type { BootstrapData } from "../services/ipc";
import { useAppStore } from "../state/appStore";

export function createBootstrapData(overrides: Partial<BootstrapData> = {}): BootstrapData {
  return {
    settings: {
      theme: "light",
      sound_enabled: true,
      reduced_motion: false,
      ...overrides.settings,
    },
    gameStats: overrides.gameStats ?? [],
    latestPlatformerSave: overrides.latestPlatformerSave ?? null,
    schema: overrides.schema ?? {
      version: 3,
      path: "C:\\Users\\tester\\AppData\\Roaming\\com.europa.desktop\\Europa\\europa.db",
      storageMode: "sqlite",
    },
    ...overrides,
  };
}

export function hydrateStore(overrides: Partial<BootstrapData> = {}): void {
  useAppStore.getState().hydrate(createBootstrapData(overrides));
}

