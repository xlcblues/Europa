import { useCallback, useEffect, useState } from "react";

import {
  aggregateStats,
  formatDuration,
  formatRelativeTime,
  formatScore,
  formatShortDuration,
  getGameStat,
} from "../app/formatters";
import type { AppRoute } from "../app/router";
import { GAMES, isGameId } from "../services/gameCatalog";
import type { GameId } from "../services/gameCatalog";
import {
  clearGameHistory,
  clearPlatformerSaves,
  loadMatchHistory,
  type MatchHistoryEntry,
} from "../services/ipc";
import { useAppStore } from "../state/appStore";
import { GameGlyph, InfoIcon, SparkIcon, StorageIcon } from "../components/Icons";

interface RecordsPageProps {
  onNavigate: (route: AppRoute) => void;
}

interface ClearRequest {
  action: "game" | "all" | "saves";
  gameId?: GameId;
  title: string;
  description: string;
  confirmLabel: string;
}

function EmptyRecords({ onOpenLibrary }: { onOpenLibrary: () => void }) {
  return (
    <section className="records-empty" aria-labelledby="records-empty-title">
      <div className="empty-orbit" aria-hidden="true">
        <div className="empty-orbit-arc" />
        <div className="empty-orbit-core">
          <SparkIcon size={24} />
        </div>
        <i className="empty-star empty-star-a" />
        <i className="empty-star empty-star-b" />
      </div>
      <div className="eyebrow">LOCAL RECORDS</div>
      <h2 id="records-empty-title">还没有游玩记录</h2>
      <p>完成第一局后，这里会出现真实的最高分、胜负、游玩时长与最近时间。</p>
      <button className="button button-primary" type="button" onClick={onOpenLibrary}>
        前往游戏库
      </button>
    </section>
  );
}

function outcomeLabel(entry: MatchHistoryEntry): string {
  switch (entry.outcome) {
    case "victory":
      return "通关";
    case "game_over":
      return "结束";
    case "win":
      return "胜利";
    case "loss":
      return "落败";
    case "draw":
      return "平局";
    default:
      return "已结束";
  }
}

function scoreLabel(entry: MatchHistoryEntry): string {
  if (entry.gameId === "gomoku") {
    return `${formatScore(entry.score)} 手`;
  }
  return entry.score > 0 ? formatScore(entry.score) : "0 分";
}

function gameTitle(gameId: string): string | null {
  if (!isGameId(gameId)) {
    return null;
  }
  return GAMES.find((game) => game.id === gameId)?.title ?? null;
}

function ConfirmDialog({
  request,
  busy,
  onConfirm,
  onCancel,
}: {
  request: ClearRequest;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="confirm-overlay" role="presentation">
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title">{request.title}</h3>
        <p>{request.description}</p>
        <div className="confirm-actions">
          <button className="button" type="button" onClick={onCancel} disabled={busy}>
            取消
          </button>
          <button
            className="button button-danger"
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "正在清除…" : request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecordsPage({ onNavigate }: RecordsPageProps) {
  const stats = useAppStore((state) => state.gameStats);
  const latestSave = useAppStore((state) => state.latestPlatformerSave);
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [historyStatus, setHistoryStatus] = useState<"loading" | "ready" | "error">("loading");
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ClearRequest | null>(null);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const refreshHistory = useCallback(async () => {
    try {
      const entries = await loadMatchHistory(undefined, 50);
      setHistory(entries);
      setHistoryError(null);
      setHistoryStatus("ready");
    } catch {
      setHistoryError("最近对局加载失败，统计与历史操作暂不可用。");
      setHistoryStatus("error");
    }
  }, []);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  const totals = aggregateStats(stats);
  const hasRecords = stats.some((stat) => stat.gamesPlayed > 0);
  const gameHasData = (gameId: GameId): boolean =>
    Boolean(getGameStat(stats, gameId)?.gamesPlayed) ||
    history.some((entry) => entry.gameId === gameId);
  const showEmpty =
    historyStatus === "ready" &&
    !hasRecords &&
    history.length === 0 &&
    !latestSave;

  const requestClear = useCallback((action: "game" | "all" | "saves", gameId?: GameId) => {
    setClearError(null);
    if (action === "saves") {
      setConfirm({
        action,
        title: "清除检查点存档",
        description: "将删除冰原跃迁的当前进度存档，关卡进度、分数与生命值都会回到初始状态。",
        confirmLabel: "清除存档",
      });
      return;
    }
    if (action === "all") {
      setConfirm({
        action,
        title: "清空全部数据",
        description: "将删除所有游戏的记录、统计与检查点存档，此操作无法撤销。",
        confirmLabel: "清空全部",
      });
      return;
    }
    const game = gameId ? GAMES.find((item) => item.id === gameId) : undefined;
    setConfirm({
      action,
      gameId,
      title: `清除 ${game?.title ?? "该游戏"} 的记录`,
      description: `将删除 ${game?.title ?? "该游戏"} 的全部对局记录与统计，此操作无法撤销。`,
      confirmLabel: "确认清除",
    });
  }, []);

  const runClear = useCallback(async () => {
    if (!confirm) {
      return;
    }
    setClearing(true);
    setClearError(null);
    try {
      if (confirm.action === "saves") {
        await clearPlatformerSaves();
        useAppStore.getState().clearLatestPlatformerSave();
      } else {
        await clearGameHistory(confirm.action === "all" ? undefined : confirm.gameId);
        useAppStore
          .getState()
          .resetGameStats(confirm.action === "all" ? "all" : [confirm.gameId ?? "snake"]);
      }
      setConfirm(null);
      void refreshHistory();
    } catch {
      setClearError("清除失败，本地数据未做改动，请重试。");
    } finally {
      setClearing(false);
    }
  }, [confirm, refreshHistory]);

  const closeConfirm = useCallback(() => {
    if (clearing) {
      return;
    }
    setConfirm(null);
  }, [clearing]);

  return (
    <div className="page records-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">PLAY HISTORY</div>
          <h1>游玩记录</h1>
          <p>每一局都只记录在本机，随时可以查看或清理。</p>
        </div>
        <div className="head-meta">
          <span className="meta-pill">
            <b aria-hidden="true" />
            {hasRecords ? `累计 ${totals.gamesPlayed} 局` : "本机暂无记录"}
          </span>
        </div>
      </header>

      {showEmpty ? (
        <EmptyRecords onOpenLibrary={() => onNavigate({ page: "library" })} />
      ) : (
        <>
          <section className="records-summary" aria-label="游玩记录概览">
            <div className="record-summary-cell">
              <span>累计游玩</span>
              <strong>{formatDuration(totals.totalPlayMs)}</strong>
              <small>{totals.gamesPlayed} 局游戏</small>
            </div>
            <div className="record-summary-cell">
              <span>最佳成绩</span>
              <strong className={totals.bestScore ? "gold" : ""}>
                {totals.bestScore ? formatScore(totals.bestScore) : "—"}
              </strong>
              <small>{totals.bestGameId ? "本机最高分" : "暂无分数记录"}</small>
            </div>
            <div className="record-summary-cell">
              <span>对局结果</span>
              <strong>
                {totals.wins} / {totals.losses}
              </strong>
              <small>{totals.draws} 次平局</small>
            </div>
          </section>

          <section className="records-table-card" aria-labelledby="records-table-title">
            <div className="section-heading">
              <div>
                <div className="eyebrow">BY GAME</div>
                <h2 id="records-table-title">分游戏统计</h2>
              </div>
              <span className="section-note">真实本地数据</span>
            </div>
            <div className="records-table" role="table" aria-label="分游戏游玩统计">
              {GAMES.map((game) => {
                const stat = getGameStat(stats, game.id);
                const hasGameData = Boolean(stat?.gamesPlayed);
                return (
                  <div className="record-row" role="row" key={game.id}>
                    <div className="record-game" role="cell">
                      <span className="mini-icon">
                        <GameGlyph gameId={game.id} />
                      </span>
                      <span>
                        <strong>{game.title}</strong>
                        <small>{game.genre}</small>
                      </span>
                    </div>
                    <div role="cell">
                      <span className="cell-label">游玩</span>
                      <strong>{hasGameData ? `${stat?.gamesPlayed} 局` : "—"}</strong>
                    </div>
                    <div role="cell">
                      <span className="cell-label">成绩</span>
                      <strong className={stat?.bestScore ? "gold" : ""}>
                        {game.id === "gomoku"
                          ? hasGameData
                            ? `${stat?.wins} 胜`
                            : "—"
                          : stat?.bestScore
                            ? formatScore(stat.bestScore)
                            : "—"}
                      </strong>
                    </div>
                    <div role="cell">
                      <span className="cell-label">时长</span>
                      <strong>{formatDuration(stat?.totalPlayMs ?? 0)}</strong>
                    </div>
                    <div role="cell">
                      <span className="cell-label">最近</span>
                      <strong>{formatRelativeTime(stat?.lastPlayedAt ?? null)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="records-history-card" aria-labelledby="records-history-title">
            <div className="section-heading">
              <div>
                <div className="eyebrow">RECENT MATCHES</div>
                <h2 id="records-history-title">最近对局</h2>
              </div>
              <span className="section-note">
                {historyStatus === "ready" && history.length > 0
                  ? `最近 ${history.length} 局`
                  : "仅保存在本机"}
              </span>
            </div>
            {historyStatus === "loading" ? (
              <div className="history-state">正在读取最近对局…</div>
            ) : historyStatus === "error" ? (
              <div className="inline-notice" role="alert">
                <InfoIcon size={17} />
                <span>{historyError}</span>
              </div>
            ) : history.length === 0 ? (
              <div className="history-state">完成对局后，最近记录会显示在这里。</div>
            ) : (
              <div className="history-list">
                {history.map((entry) => {
                  const title = gameTitle(entry.gameId);
                  const validId = isGameId(entry.gameId) ? entry.gameId : undefined;
                  return (
                    <div className="history-row" key={entry.id}>
                      <div className="history-game">
                        <span className="mini-icon">
                          {validId ? <GameGlyph gameId={validId} /> : <SparkIcon size={18} />}
                        </span>
                        <span>
                          <strong>{title ?? "未知游戏"}</strong>
                          <small>{outcomeLabel(entry)}</small>
                        </span>
                      </div>
                      <div>
                        <span className="cell-label">成绩</span>
                        <strong>{scoreLabel(entry)}</strong>
                      </div>
                      <div>
                        <span className="cell-label">时长</span>
                        <strong>{formatShortDuration(entry.durationMs)}</strong>
                      </div>
                      <div>
                        <span className="cell-label">时间</span>
                        <strong>{formatRelativeTime(entry.createdAt)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="records-clear-card" aria-labelledby="records-clear-title">
            <div className="section-heading">
              <div>
                <div className="eyebrow">DATA MANAGEMENT</div>
                <h2 id="records-clear-title">数据管理</h2>
              </div>
              <span className="section-note">删除后不可恢复</span>
            </div>

            {clearError ? (
              <div className="inline-notice" role="alert">
                <InfoIcon size={17} />
                <span>{clearError}</span>
              </div>
            ) : null}

            <div className="clear-rows">
              {GAMES.map((game) => (
                <div className="clear-row" key={game.id}>
                  <div className="clear-game">
                    <span className="mini-icon">
                      <GameGlyph gameId={game.id} />
                    </span>
                    <span>
                      <strong>{game.title}</strong>
                      <small>清空该游戏的记录与统计</small>
                    </span>
                  </div>
                  <button
                    className="button clear-button"
                    type="button"
                    disabled={!gameHasData(game.id)}
                    aria-label={`清除${game.title}记录`}
                    onClick={() => requestClear("game", game.id)}
                  >
                    清除记录
                  </button>
                </div>
              ))}
              <div className="clear-row">
                <div className="clear-game">
                  <span className="mini-icon">
                    <StorageIcon size={18} />
                  </span>
                  <span>
                    <strong>冰原跃迁 · 检查点存档</strong>
                    <small>清除当前进度存档，不影响历史记录</small>
                  </span>
                </div>
                <button
                  className="button clear-button"
                  type="button"
                  disabled={!latestSave}
                  aria-label="清除冰原跃迁检查点存档"
                  onClick={() => requestClear("saves")}
                >
                  清除存档
                </button>
              </div>
            </div>

            <div className="clear-all-row">
              <div className="clear-all-copy">
                <strong>清空全部数据</strong>
                <small>删除所有游戏的记录、统计与检查点存档。</small>
              </div>
              <button
                className="button clear-all-button"
                type="button"
                disabled={!hasRecords && history.length === 0 && !latestSave}
                onClick={() => requestClear("all")}
              >
                清空全部
              </button>
            </div>
          </section>
        </>
      )}

      {confirm ? (
        <ConfirmDialog
          request={confirm}
          busy={clearing}
          onConfirm={() => void runClear()}
          onCancel={closeConfirm}
        />
      ) : null}
    </div>
  );
}
