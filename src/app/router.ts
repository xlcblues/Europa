import { isGameId, type GameId } from "../services/gameCatalog";

export type AppRoute =
  | { page: "library" }
  | { page: "records" }
  | { page: "settings" }
  | { page: "game"; gameId: GameId };

export const HOME_ROUTE: AppRoute = { page: "library" };

export function parseRoute(hash: string = window.location.hash): AppRoute {
  const normalized = hash.replace(/^#\/?/, "");
  if (normalized === "records") {
    return { page: "records" };
  }
  if (normalized === "settings") {
    return { page: "settings" };
  }

  const gameMatch = /^game\/([^/]+)$/.exec(normalized);
  const candidate = gameMatch?.[1];
  if (candidate && isGameId(candidate)) {
    return { page: "game", gameId: candidate };
  }

  return HOME_ROUTE;
}

export function routeToHash(route: AppRoute): string {
  switch (route.page) {
    case "library":
      return "#/library";
    case "records":
      return "#/records";
    case "settings":
      return "#/settings";
    case "game":
      return `#/game/${route.gameId}`;
  }
}

export function navigateTo(route: AppRoute): void {
  const nextHash = routeToHash(route);
  if (window.location.hash === nextHash) {
    return;
  }
  window.location.hash = nextHash;
}

export function ensureInitialRoute(): void {
  if (!window.location.hash) {
    window.history.replaceState(null, "", routeToHash(HOME_ROUTE));
  }
}
