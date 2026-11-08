import {
  aggregateStats,
  formatRelativeTime,
  formatScore,
  formatShortDuration,
  getBestGameName,
  getGameStat,
} from "../app/formatters";
import type { AppRoute } from "../app/router";
import { GAMES, type GameDefinition, type GameId } from "../services/gameCatalog";
import type { GameStat } from "../services/ipc";
import { useAppStore } from "../state/appStore";
import { GameArtwork } from "../components/GameArtwork";
import {
  CheckIcon,
  ChevronRightIcon,
  PlayIcon,
  PlatformIcon,
  SparkIcon,
} from "../components/Icons";

interface LibraryPageProps {
  onNavigate: (route: AppRoute) => void;
}

function cardBadge(game: GameDefinition, stats: GameStat[], latestLevel: number | null) {
  if (game.id === "platformer") {
    return latestLevel !== null
      ? { text: `继续 · 第 ${latestLevel} 关`, gold: false }
      : { text: "可游玩", gold: false };
  }

  const stat = getGameStat(stats, game.id);
  if (game.id === "snake") {
    return stat?.gamesPlayed
      ? { text: `最高 ${formatScore(stat.bestScore)}`, gold: stat.bestScore > 0 }
      : { text: "可游玩", gold: false };
  }
  if (game.id === "gomoku") {
    return stat?.gamesPlayed
      ? { text: `${stat.wins} 胜`, gold: stat.wins > 0 }
      : { text: "可游玩", gold: false };
  }
  if (stat?.bestScore) {
    return { text: `最高 ${formatScore(stat.bestScore)}`, gold: true };
  }
  return { text: "即将开放", gold: false };
}

function cardNumbers(gameId: GameId, stats: GameStat[]) {
  const stat = getGameStat(stats, gameId);
  if (gameId === "gomoku") {
    return {
      label: "胜场",
      value: stat?.wins ? formatScore(stat.wins) : "—",
      gold: Boolean(stat?.wins),
    };
  }
  return {
    label: "最高分",
    value: stat?.bestScore ? formatScore(stat.bestScore) : "—",
    gold: Boolean(stat?.bestScore),
  };
}

function LibraryCard({
  game,
  stats,
  latestPlatformerLevel,
  onOpen,
}: {
  game: GameDefinition;
  stats: GameStat[];
  latestPlatformerLevel: number | null;
  onOpen: () => void;
}) {
  const badge = cardBadge(game, stats, latestPlatformerLevel);
  const stat = getGameStat(stats, game.id);
  const numbers = cardNumbers(game.id, stats);

  return (
    <button
      className="game-card"
      type="button"
      onClick={onOpen}
      aria-label={`打开${game.title}${badge.text === "即将开放" ? "，玩法即将开放" : ""}`}
    >
      <div className="game-art">
        <GameArtwork art={game.art} />
        <div className="art-topline">
          <span className="game-index">{game.index}</span>
          <span className={`art-badge${badge.gold ? " gold" : ""}`}>
            <i aria-hidden="true" />
            {badge.text}
          </span>
        </div>
      </div>
      <div className="game-body">
        <div className="card-title-row">
          <div className="card-title-copy">
            <h2>{game.title}</h2>
            <div className="card-genre">{game.genre}</div>
          </div>
          <span className="play-btn" aria-hidden="true">
            <PlayIcon size={14} />
          </span>
        </div>
        <div className="card-meta">
          <span>
            {numbers.label} <strong className={numbers.gold ? "gold" : ""}>{numbers.value}</strong>
          </span>
          <span>{stat?.lastPlayedAt ? `上次 · ${formatRelativeTime(stat.lastPlayedAt)}` : "暂无记录"}</span>
        </div>
      </div>
    </button>
  );
}

function ResumePanel({
  level,
  checkpoint,
  updatedAt,
  onOpen,
}: {
  level: number | null;
  checkpoint: string | null;
  updatedAt: number | null;
  onOpen: () => void;
}) {
  const hasSave = level !== null;
  return (
    <section className="resume" aria-labelledby="resume-title">
      <div className="resume-icon">
        {hasSave ? <CheckIcon size={23} /> : <PlatformIcon size={24} />}
      </div>
      <div className="resume-copy">
        <div className="resume-title" id="resume-title">
          <i aria-hidden="true" />
          {hasSave ? "继续上次游玩" : "准备开始"}
        </div>
        <strong>{hasSave ? `冰原跃迁 · 第 ${level} 关` : "冰原跃迁 · 从第一关开始"}</strong>
        <small>
          {hasSave
            ? `${checkpoint ?? "检查点已记录"} · ${formatRelativeTime(updatedAt)}`
            : "冰原跃迁已可游玩，随时开始。"}
        </small>
      </div>
      <button className="resume-btn" type="button" onClick={onOpen}>
        {hasSave ? "继续游戏" : "从第一关开始"}
        <ChevronRightIcon size={14} />
      </button>
    </section>
  );
}

function QuickStats({ stats, storageLabel }: { stats: GameStat[]; storageLabel: string }) {
  const totals = aggregateStats(stats);

  return (
    <section className="quick-stats" aria-label="游玩统计">
      <div className="stat">
        <span>累计游玩</span>
        <strong>{formatShortDuration(totals.totalPlayMs)}</strong>
        <small>{totals.gamesPlayed ? `${totals.gamesPlayed} 局` : "等待第一局"}</small>
      </div>
      <div className="stat">
        <span>最佳成绩</span>
        <strong className={totals.bestScore ? "gold" : ""}>
          {totals.bestScore ? formatScore(totals.bestScore) : "—"}
        </strong>
        <small>{getBestGameName(totals.bestGameId)}</small>
      </div>
      <div className="stat">
        <span>存档状态</span>
        <strong className="stat-storage">{storageLabel}</strong>
        <small>
          {storageLabel === "本地存储"
            ? "设置与记录可用"
            : storageLabel === "预览模式"
              ? "不写入 SQLite"
              : "本地存储未连接"}
        </small>
      </div>
    </section>
  );
}

export function LibraryPage({ onNavigate }: LibraryPageProps) {
  const gameStats = useAppStore((state) => state.gameStats);
  const latestSave = useAppStore((state) => state.latestPlatformerSave);
  const schema = useAppStore((state) => state.schema);
  const bootstrapStatus = useAppStore((state) => state.bootstrapStatus);
  const storageLabel =
    bootstrapStatus === "loading"
      ? "读取中"
      : bootstrapStatus === "error"
        ? "暂不可用"
        : schema?.storageMode === "browser"
          ? "预览模式"
          : "本地存储";

  return (
    <div className="page library-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">EUROPA ARCADE</div>
          <h1>游戏库</h1>
          <p>三个小世界，随时开始。</p>
        </div>
        <div className="head-meta">
          <span className="meta-pill">
            <b aria-hidden="true" />3 个游戏 · 全部可离线游玩
          </span>
        </div>
      </header>

      <section className="game-grid" aria-label="Europa 小游戏">
        {GAMES.map((game) => (
          <LibraryCard
            key={game.id}
            game={game}
            stats={gameStats}
            latestPlatformerLevel={game.id === "platformer" ? latestSave?.levelId ?? null : null}
            onOpen={() => onNavigate({ page: "game", gameId: game.id })}
          />
        ))}
      </section>

      <footer className="library-footer">
        <ResumePanel
          level={latestSave?.levelId ?? null}
          checkpoint={latestSave?.checkpointId ?? null}
          updatedAt={latestSave?.updatedAt ?? null}
          onOpen={() => onNavigate({ page: "game", gameId: "platformer" })}
        />
        <QuickStats stats={gameStats} storageLabel={storageLabel} />
      </footer>

      {bootstrapStatus === "ready" && gameStats.length === 0 ? (
        <p className="library-note">
          <SparkIcon size={14} />
          尚无游玩记录。最高分、胜负与时长只会显示真实本地数据。
        </p>
      ) : null}
    </div>
  );
}
