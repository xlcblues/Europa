import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createInitialPlatformerContext,
  createPlatformerWorld,
} from "./platformerEngine";
import type { PlatformerWorld } from "./platformerTypes";
import { PlatformerCanvas } from "./PlatformerCanvas";

function createWorld(levelTimeMs = 0): PlatformerWorld {
  return createPlatformerWorld(createInitialPlatformerContext(), 0, undefined, {
    levelTimeMs,
  });
}

function clearRectCount(): number {
  const canvas = document.querySelector("canvas");
  const context = canvas?.getContext("2d") as unknown as
    | { clearRect: { mock: { calls: unknown[] } } }
    | null;
  return context?.clearRect.mock.calls.length ?? 0;
}

describe("PlatformerCanvas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not redraw while the world reference is unchanged (pause freeze)", async () => {
    render(
      <PlatformerCanvas
        world={createWorld()}
        reducedMotion={false}
        ariaLabel="冰原跃迁画布"
      />,
    );
    const drawsAfterMount = clearRectCount();
    expect(drawsAfterMount).toBeGreaterThan(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(clearRectCount()).toBe(drawsAfterMount);
  });

  it("resumes drawing when a new world reference arrives", async () => {
    const { rerender } = render(
      <PlatformerCanvas
        world={createWorld()}
        reducedMotion={false}
        ariaLabel="冰原跃迁画布"
      />,
    );
    const drawsBefore = clearRectCount();
    expect(drawsBefore).toBeGreaterThan(0);

    rerender(
      <PlatformerCanvas
        world={createWorld(500)}
        reducedMotion={false}
        ariaLabel="冰原跃迁画布"
      />,
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(clearRectCount()).toBeGreaterThan(drawsBefore);
  });

  it("renders with reduced motion enabled using static visuals", async () => {
    render(
      <PlatformerCanvas
        world={createWorld()}
        reducedMotion={true}
        ariaLabel="冰原跃迁画布"
      />,
    );
    const drawsAfterMount = clearRectCount();
    expect(drawsAfterMount).toBeGreaterThan(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });
    expect(clearRectCount()).toBe(drawsAfterMount);
  });
});
