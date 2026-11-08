export const GAME_IDS = ["platformer", "snake", "gomoku"] as const;

export type GameId = (typeof GAME_IDS)[number];
export type GameArtKind = "platformer" | "snake" | "gomoku";

export interface GameDefinition {
  id: GameId;
  index: string;
  title: string;
  category: string;
  genre: string;
  description: string;
  milestone: string;
  art: GameArtKind;
  plannedFeatures: readonly string[];
}

export const GAMES: readonly GameDefinition[] = [
  {
    id: "platformer",
    index: "01 / PLATFORMER",
    title: "冰原跃迁",
    category: "PLATFORMER",
    genre: "横版平台跳跃 · 单人",
    description: "沿着 Europa 的冰脊与轨道，在三个手工关卡间跃迁。",
    milestone: "M3",
    art: "platformer",
    plannedFeatures: ["跳跃手感", "检查点存档", "收集物 / 计分", "三条生命"],
  },
  {
    id: "snake",
    index: "02 / ARCADE",
    title: "环带贪吃蛇",
    category: "ARCADE",
    genre: "街机 · 无尽模式",
    description: "在环形轨道上收集星点，让速度与长度一同增长。",
    milestone: "M2",
    art: "snake",
    plannedFeatures: ["20×20 棋盘", "方向队列", "速度曲线", "最高分"],
  },
  {
    id: "gomoku",
    index: "03 / STRATEGY",
    title: "星盘五子棋",
    category: "STRATEGY",
    genre: "策略 · 双人对战 / 人机",
    description: "在十五路星盘上连成五子，与本地对手或三级 AI 对弈。",
    milestone: "M4",
    art: "gomoku",
    plannedFeatures: ["15×15 棋盘", "本地双人", "三级 AI", "悔棋 / 胜线"],
  },
];

export function getGame(gameId: GameId): GameDefinition {
  const game = GAMES.find((item) => item.id === gameId);
  if (!game) {
    throw new Error(`Unknown Europa game: ${gameId}`);
  }
  return game;
}

export function isGameId(value: string): value is GameId {
  return GAME_IDS.some((gameId) => gameId === value);
}
