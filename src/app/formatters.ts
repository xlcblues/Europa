import { getGame, type GameId } from "../services/gameCatalog";
import type { GameStat } from "../services/ipc";

const integerFormatter = new Intl.NumberFormat("zh-CN");

export function formatScore(score: number): string {
  return integerFormatter.format(Math.max(0, Math.trunc(score)));
}

export function formatDuration(milliseconds: number): string {
  if (milliseconds <= 0) {
    return "0 分钟";
  }

  const totalMinutes = Math.floor(milliseconds / 60_000);
  if (totalMinutes < 1) {
    return "不足 1 分钟";
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} 分钟`;
  }
  if (minutes === 0) {
    return `${hours} 小时`;
  }
  return `${hours} 小时 ${minutes} 分`;
}

export function formatShortDuration(milliseconds: number): string {
  if (milliseconds <= 0) {
    return "0m";
  }
  const totalMinutes = Math.max(1, Math.floor(milliseconds / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

export function formatRelativeTime(timestamp: number | null, now = Date.now()): string {
  if (!timestamp) {
    return "尚无记录";
  }

  const delta = Math.max(0, now - timestamp);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) {
    return "刚刚";
  }
  if (minutes < 60) {
    return `${minutes} 分钟前`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} 小时前`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} 天前`;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

export function getGameStat(stats: GameStat[], gameId: GameId): GameStat | undefined {
  return stats.find((stat) => stat.gameId === gameId);
}

export function formatGameStatus(gameId: GameId, stat: GameStat | undefined): string {
  if (!stat || stat.gamesPlayed <= 0) {
    return "暂无记录";
  }

  if (gameId === "gomoku") {
    return `${stat.wins} 胜 · ${stat.losses} 负`;
  }

  if (stat.bestScore > 0) {
    return `最高分 ${formatScore(stat.bestScore)}`;
  }

  return `${stat.gamesPlayed} 局`;
}

export function aggregateStats(stats: GameStat[]) {
  const totalPlayMs = stats.reduce((total, stat) => total + stat.totalPlayMs, 0);
  const gamesPlayed = stats.reduce((total, stat) => total + stat.gamesPlayed, 0);
  const wins = stats.reduce((total, stat) => total + stat.wins, 0);
  const losses = stats.reduce((total, stat) => total + stat.losses, 0);
  const draws = stats.reduce((total, stat) => total + stat.draws, 0);
  const best = stats.reduce<GameStat | null>((current, stat) => {
    if (stat.bestScore <= 0) {
      return current;
    }
    return !current || stat.bestScore > current.bestScore ? stat : current;
  }, null);

  return {
    totalPlayMs,
    gamesPlayed,
    wins,
    losses,
    draws,
    bestScore: best?.bestScore ?? null,
    bestGameId: best?.gameId ?? null,
  };
}

export function getBestGameName(gameId: string | null): string {
  if (gameId === "platformer" || gameId === "snake" || gameId === "gomoku") {
    return getGame(gameId).title;
  }
  return "暂无记录";
}
