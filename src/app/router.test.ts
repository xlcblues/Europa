import { describe, expect, it } from "vitest";

import {
  ensureInitialRoute,
  navigateTo,
  parseRoute,
  routeToHash,
  type AppRoute,
} from "./router";

const routeCases: readonly [AppRoute, string][] = [
  [{ page: "library" }, "#/library"],
  [{ page: "records" }, "#/records"],
  [{ page: "settings" }, "#/settings"],
  [{ page: "game", gameId: "platformer" }, "#/game/platformer"],
  [{ page: "game", gameId: "snake" }, "#/game/snake"],
  [{ page: "game", gameId: "gomoku" }, "#/game/gomoku"],
];

describe("Europa hash router", () => {
  it.each(routeCases)("round-trips $0", (route, hash) => {
    expect(routeToHash(route)).toBe(hash);
    expect(parseRoute(hash)).toEqual(route);
  });

  it("falls back to the library for unknown or malformed routes", () => {
    expect(parseRoute("")).toEqual({ page: "library" });
    expect(parseRoute("#/game/unknown")).toEqual({ page: "library" });
    expect(parseRoute("#/records/extra")).toEqual({ page: "library" });
  });

  it("normalizes an empty initial hash without adding a history entry", () => {
    window.history.replaceState(null, "", "/");
    ensureInitialRoute();
    expect(window.location.hash).toBe("#/library");
  });

  it("navigates by hash and ignores a repeated navigation", () => {
    window.history.replaceState(null, "", "/");
    navigateTo({ page: "records" });
    expect(window.location.hash).toBe("#/records");

    navigateTo({ page: "records" });
    expect(window.location.hash).toBe("#/records");
  });
});
