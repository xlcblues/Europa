import { vi } from "vitest";

export interface ThemeMediaController {
  readonly query: MediaQueryList;
  readonly setDark: (next: boolean) => void;
  readonly listenerCount: () => number;
}

export function installMatchMedia(initialDark = false): ThemeMediaController {
  let dark = initialDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = "(prefers-color-scheme: dark)";

  const query = {
    get matches() {
      return dark;
    },
    media,
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (typeof listener === "function") {
        listeners.add(listener as (event: MediaQueryListEvent) => void);
      }
    }),
    removeEventListener: vi.fn((_type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (typeof listener === "function") {
        listeners.delete(listener as (event: MediaQueryListEvent) => void);
      }
    }),
    addListener: vi.fn((listener: ((event: MediaQueryListEvent) => void) | null) => {
      if (listener) {
        listeners.add(listener);
      }
    }),
    removeListener: vi.fn((listener: ((event: MediaQueryListEvent) => void) | null) => {
      if (listener) {
        listeners.delete(listener);
      }
    }),
    dispatchEvent: vi.fn(() => true),
  } as unknown as MediaQueryList;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn((_query: string) => query),
  });

  return {
    query,
    listenerCount: () => listeners.size,
    setDark: (next) => {
      dark = next;
      const event = { matches: next, media } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}
