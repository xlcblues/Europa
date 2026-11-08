import {
  aggregateStats,
  formatDuration,
  formatScore,
  formatRelativeTime,
  getGameStat,
} from "../app/formatters";
import type { AppRoute } from "../app/router";
import { GAMES } from "../services/gameCatalog";
import { useAppStore } from "../state/appStore";
import { GameGlyph, SparkIcon } from "../components/Icons";

interface RecordsPageProps {
  onNavigate: (route: AppRoute) => void;
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

export function RecordsPage({ onNavigate }: RecordsPageProps) {
  const stats = useAppStore((state) => state.gameStats);
  const totals = aggregateStats(stats);
  const hasRecords = stats.some((stat) => stat.gamesPlayed > 0);

  return (
    <div className="page records-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">PLAY HISTORY</div>
          <h1>游玩记录</h1>
          <p>每一局都只记录在本机。</p>
        </div>
        <div className="head-meta">
          <span className="meta-pill">
            <b aria-hidden="true" />
            {hasRecords ? `累计 ${totals.gamesPlayed} 局` : "本机暂无记录"}
          </span>
        </div>
      </header>

      {!hasRecords ? (
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
        </>
      )}
    </div>
  );
}
