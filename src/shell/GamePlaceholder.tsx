import { ArrowLeftIcon, ChevronRightIcon, GameGlyph, SparkIcon } from "../components/Icons";
import { GameArtwork } from "../components/GameArtwork";
import { getGame, type GameId } from "../services/gameCatalog";

interface GamePlaceholderProps {
  gameId: GameId;
  onBack: () => void;
}

export function GamePlaceholder({ gameId, onBack }: GamePlaceholderProps) {
  const game = getGame(gameId);

  return (
    <div className="game-page">
      <header className="game-page-head">
        <div>
          <div className="eyebrow">
            {game.index} · MILESTONE {game.milestone}
          </div>
          <h1>{game.title}</h1>
          <p>{game.description}</p>
        </div>
        <span className="game-status-pill">
          <i aria-hidden="true" />
          界面已就绪 · 玩法开发中
        </span>
      </header>

      <div className="game-placeholder-layout">
        <section className="game-preview-panel" aria-labelledby="preview-title">
          <div className="game-preview-art">
            <GameArtwork art={game.art} />
            <div className="preview-orbit" aria-hidden="true" />
            <div className="preview-grid" aria-hidden="true" />
          </div>

          <div className="game-preview-copy">
            <span className="preview-badge">
              <SparkIcon size={14} />
              {game.milestone} · NEXT MILESTONE
            </span>
            <h2 id="preview-title">星盘对弈将在下一里程碑开放</h2>
            <p>
              应用壳层、主题系统、设置持久化与本地数据基础已经完成。M3 的冰原跃迁现已可玩；
              星盘五子棋的棋盘、对弈与胜负结算会按 M4 里程碑接入这个舞台。
            </p>
            <div className="preview-actions">
              <button className="button button-primary" type="button" onClick={onBack}>
                <ArrowLeftIcon size={15} />
                返回游戏库
              </button>
              <span className="preview-note">计划里程碑 · {game.milestone}</span>
            </div>
          </div>
        </section>

        <aside className="game-info-column" aria-label={`${game.title} 信息`}>
          <section className="game-info-card game-identity-card">
            <div className="game-identity-icon">
              <GameGlyph gameId={game.id} size={24} />
            </div>
            <div>
              <span className="eyebrow">GAME PROFILE</span>
              <h2>{game.title}</h2>
              <p>{game.genre}</p>
            </div>
            <span className="game-milestone">{game.milestone}</span>
          </section>

          <section className="game-info-card planned-card">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">PLANNED CORE</span>
                <h2>计划能力</h2>
              </div>
              <span className="section-note">设计已定稿</span>
            </div>
            <ul className="planned-list">
              {game.plannedFeatures.map((feature) => (
                <li key={feature}>
                  <ChevronRightIcon size={14} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="game-info-card milestone-card">
            <span>下一开发节点</span>
            <strong>{game.milestone} · 完整玩法</strong>
            <small>该游戏尚未接入可操作循环、计分或胜负结算；已完成玩法见游戏库中带有“可游玩”标记的作品。</small>
          </section>
        </aside>
      </div>
    </div>
  );
}
