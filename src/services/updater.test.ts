import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCheck = vi.fn();
const mockGetVersion = vi.fn();
const mockIsTauri = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => mockIsTauri(),
}));

vi.mock("@tauri-apps/api/app", () => ({
  getVersion: () => mockGetVersion(),
}));

vi.mock("@tauri-apps/plugin-updater", () => ({
  check: (options?: unknown) => mockCheck(options),
}));

import { FALLBACK_VERSION, getAppVersion, useUpdater } from "./updater";

function makeUpdate(overrides: Record<string, unknown> = {}) {
  return {
    version: "1.1.0",
    body: "新增离线更新功能",
    close: vi.fn(),
    downloadAndInstall: vi.fn(
      async (onEvent: (event: {
        event: string;
        data?: { contentLength?: number; chunkLength?: number };
      }) => void) => {
        onEvent({ event: "Started", data: { contentLength: 100 } });
        onEvent({ event: "Progress", data: { chunkLength: 50 } });
        onEvent({ event: "Finished" });
      },
    ),
    ...overrides,
  };
}

describe("Europa updater service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTauri.mockReturnValue(false);
    mockGetVersion.mockResolvedValue("1.0.0");
    mockCheck.mockResolvedValue(null);
  });

  it("falls back to FALLBACK_VERSION outside Tauri", async () => {
    mockIsTauri.mockReturnValue(false);
    await expect(getAppVersion()).resolves.toBe(FALLBACK_VERSION);
    expect(FALLBACK_VERSION).toBe("1.0.0");
  });

  it("reads the real version inside Tauri", async () => {
    mockIsTauri.mockReturnValue(true);
    await expect(getAppVersion()).resolves.toBe("1.0.0");
  });

  it("reports unsupported outside Tauri", async () => {
    const { result } = renderHook(() => useUpdater({ autoCheck: false }));

    await act(async () => {
      await result.current.checkNow();
    });

    expect(result.current.state.status).toBe("error");
    expect(result.current.state.message).toBe("unsupported");
  });

  it("marks the app as latest when no update is available", async () => {
    mockIsTauri.mockReturnValue(true);
    mockCheck.mockResolvedValue(null);
    const { result } = renderHook(() => useUpdater({ autoCheck: false }));

    await act(async () => {
      await result.current.checkNow();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("latest");
    });
    expect(result.current.state.currentVersion).toBe("1.0.0");
  });

  it("exposes an available update and installs it with progress", async () => {
    mockIsTauri.mockReturnValue(true);
    const update = makeUpdate();
    mockCheck.mockResolvedValue(update);
    const { result } = renderHook(() => useUpdater({ autoCheck: false }));

    await act(async () => {
      await result.current.checkNow();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("available");
    });
    expect(result.current.state.version).toBe("1.1.0");
    expect(result.current.state.body).toBe("新增离线更新功能");

    await act(async () => {
      await result.current.install();
    });

    await waitFor(() => {
      expect(result.current.state.status).toBe("installing");
    });
    expect(update.downloadAndInstall).toHaveBeenCalledTimes(1);
    expect(result.current.state.progress).toBe(50);
  });
});
