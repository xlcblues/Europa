import { getCurrentWindow } from "@tauri-apps/api/window";

import { isTauriEnvironment } from "./ipc";

async function withDesktopWindow<T>(operation: (window: ReturnType<typeof getCurrentWindow>) => Promise<T>): Promise<T | null> {
  if (!isTauriEnvironment()) {
    return null;
  }

  try {
    return await operation(getCurrentWindow());
  } catch {
    return null;
  }
}

export function minimizeWindow(): Promise<null | void> {
  return withDesktopWindow((window) => window.minimize());
}

export function toggleWindowMaximize(): Promise<null | void> {
  return withDesktopWindow((window) => window.toggleMaximize());
}

export function closeWindow(): Promise<null | void> {
  return withDesktopWindow((window) => window.close());
}

export async function isWindowMaximized(): Promise<boolean> {
  return (await withDesktopWindow((window) => window.isMaximized())) ?? false;
}
