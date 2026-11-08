import type { AppRoute } from "../app/router";
import { formatGameStatus, getGameStat } from "../app/formatters";
import { GAMES, type GameId } from "../services/gameCatalog";
import type { BootstrapStatus } from "../state/appStore";
import type { GameStat, SchemaInfo } from "../services/ipc";
import {
  GameGlyph,
  LibraryIcon,
  RecordsIcon,
  SettingsIcon,
} from "../components/Icons";

interface SidebarProps {
  route: AppRoute;
  stats: GameStat[];
  schema: SchemaInfo | null;
  bootstrapStatus: BootstrapStatus;
  latestPlatformerLevel: number | null;
  onNavigate: (route: AppRoute) => void;
}

type GameStatShape = GameStat;

function sidebarGameMeta(gameId: GameId, stats: GameStatShape[], latestLevel: number | null): string {
  if (gameId === "platformer") {
    return latestLevel !== null ? `继续 · 第 ${latestLevel} 关` : "可游玩";
  }

  const stat = getGameStat(stats, gameId);
  if (stat?.gamesPlayed) {
    return formatGameStatus(gameId, stat);
  }

  if (gameId === "snake") {
    return "可游玩";
  }

  return "即将开放";
}

function StorageSummary({
  schema,
  bootstrapStatus,
}: {
  schema: SchemaInfo | null;
  bootstrapStatus: BootstrapStatus;
}) {
  if (bootstrapStatus === "loading") {
    return (
      <div className="save-card">
        <div className="save-line save-line-loading">
          <i />
          正在连接本地存储
          <span>读取中</span>
        </div>
        <div className="save-meta">
          <span>SQLite</span>
          <span>v—</span>
        </div>
      </div>
    );
  }

  if (bootstrapStatus === "error") {
    return (
      <div className="save-card save-card-error">
        <div className="save-line">
          <i />
          本地存储暂不可用
          <span>未连接</span>
        </div>
        <div className="save-meta">
          <span>设置仍可浏览</span>
          <span>v—</span>
        </div>
      </div>
    );
  }

  const isBrowser = schema?.storageMode === "browser";
  return (
    <div className="save-card">
      <div className="save-line">
        <i />
        {isBrowser ? "浏览器预览模式" : "本地存档已就绪"}
        <span>{isBrowser ? "预览" : "已保存"}</span>
      </div>
      <div className="save-meta">
        <span>{isBrowser ? "localStorage" : "SQLite · WAL"}</span>
        <span>{schema ? `v${schema.version}` : "v—"}</span>
      </div>
    </div>
  );
}

export function Sidebar({
  route,
  stats,
  schema,
  bootstrapStatus,
  latestPlatformerLevel,
  onNavigate,
}: SidebarProps) {
  const activePage = route.page;

  return (
    <aside className="sidebar" aria-label="Europa 导航">
      <nav className="side-nav">
        <div className="nav-label">工作区</div>
        <button
          className={`nav-item${activePage === "library" ? " active" : ""}`}
          type="button"
          aria-current={activePage === "library" ? "page" : undefined}
          onClick={() => onNavigate({ page: "library" })}
        >
          <LibraryIcon />
          <span>游戏库</span>
          <span className="nav-count">{GAMES.length}</span>
        </button>
        <button
          className={`nav-item${activePage === "records" ? " active" : ""}`}
          type="button"
          aria-current={activePage === "records" ? "page" : undefined}
          onClick={() => onNavigate({ page: "records" })}
        >
          <RecordsIcon />
          <span>游玩记录</span>
          <span className="nav-count">{stats.length}</span>
        </button>
        <button
          className={`nav-item${activePage === "settings" ? " active" : ""}`}
          type="button"
          aria-current={activePage === "settings" ? "page" : undefined}
          onClick={() => onNavigate({ page: "settings" })}
        >
          <SettingsIcon />
          <span>设置</span>
        </button>
      </nav>

      <nav className="side-nav nav-group" aria-label="快速开始">
        <div className="nav-label">快速开始</div>
        {GAMES.map((game) => (
          <button
            key={game.id}
            className="game-mini"
            type="button"
            onClick={() => onNavigate({ page: "game", gameId: game.id })}
            aria-label={`打开${game.title}`}
          >
            <span className="mini-icon">
              <GameGlyph gameId={game.id} />
            </span>
            <span className="mini-copy">
              <strong>{game.title}</strong>
              <small>{sidebarGameMeta(game.id, stats, latestPlatformerLevel)}</small>
            </span>
          </button>
        ))}
      </nav>

      <div className="side-bottom">
        <StorageSummary schema={schema} bootstrapStatus={bootstrapStatus} />
        <div className="side-version">
          <span>EUROPA ARCADE</span>
          <span>M3 · 0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
