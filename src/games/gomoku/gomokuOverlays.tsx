import type { ReactNode } from "react";

import {
  ArrowLeftIcon,
  CheckIcon,
  GomokuIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  RestartIcon,
  TrophyIcon,
} from "../../components/Icons";
import type { GameStat } from "../../services/ipc";
import { stoneLabel, type GomokuEngineState } from "./gomokuEngine";
import type {
  GomokuDifficulty,
  GomokuMode,
  GomokuPhase,
  GomokuRoundResult,
  GomokuSubmissionStatus,
} from "./gomokuTypes";

interface GomokuOverlaysProps {
  phase: GomokuPhase;
  game: GomokuEngineState;
  mode: GomokuMode;
  difficulty: GomokuDifficulty;
  result: GomokuRoundResult | null;
  submissionStatus: GomokuSubmissionStatus;
  gameStat: GameStat | undefined;
  onModeChange: (mode: GomokuMode) => void;
  onDifficultyChange: (difficulty: GomokuDifficulty) => void;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
  onBack: () => void;
  onRetrySubmit: () => void;
}

const DIFFICULTY_LABELS: Record<GomokuDifficulty, string> = {
  beginner: "入门",
  intermediate: "进阶",
  master: "大师",
};

export function GomokuOverlays({
  phase,
  game,
  mode,
  difficulty,
  result,
  submissionStatus,
  gameStat,
  onModeChange,
  onDifficultyChange,
  onStart,
  onResume,
  onRestart,
  onBack,
  onRetrySubmit,
}: GomokuOverlaysProps) {
  if (phase === "playing") {
    return null;
  }

  return (
    <div className={`gomoku-overlay gomoku-overlay-${phase}`}>
      <div className="gomoku-overlay-panel">
        {phase === "ready" ? (
          <ReadyOverlay
            mode={mode}
            difficulty={difficulty}
            onModeChange={onModeChange}
            onDifficultyChange={onDifficultyChange}
            onStart={onStart}
            onBack={onBack}
          />
        ) : phase === "paused" ? (
          <PausedOverlay
            game={game}
            mode={mode}
            onResume={onResume}
            onRestart={onRestart}
          />
        ) : result ? (
          <ResultOverlay
            result={result}
            mode={mode}
            submissionStatus={submissionStatus}
            gameStat={gameStat}
            onRestart={onRestart}
            onBack={onBack}
            onRetrySubmit={onRetrySubmit}
          />
        ) : null}
      </div>
    </div>
  );
}

function OverlayEyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="gomoku-overlay-eyebrow">
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

function ReadyOverlay({
  mode,
  difficulty,
  onModeChange,
  onDifficultyChange,
  onStart,
  onBack,
}: {
  mode: GomokuMode;
  difficulty: GomokuDifficulty;
  onModeChange: (mode: GomokuMode) => void;
  onDifficultyChange: (difficulty: GomokuDifficulty) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <div className="gomoku-overlay-emblem" aria-hidden="true">
        <div className="gomoku-emblem-orbit" />
        <GomokuIcon size={28} />
      </div>
      <OverlayEyebrow>EUROPA ARCADE · M4</OverlayEyebrow>
      <h2>星盘待战</h2>
      <p>在十五路星盘上连成五子。先手执黑，自由规则，五连及以上均判胜。</p>

      <div className="gomoku-ready-options">
        <div className="gomoku-option-group">
          <span className="gomoku-option-label">对弈模式</span>
          <div className="gomoku-option-row" role="group" aria-label="对弈模式">
            <button
              className={`gomoku-option-button${mode === "ai" ? " is-active" : ""}`}
              type="button"
              onClick={() => onModeChange("ai")}
            >
              人机对战
            </button>
            <button
              className={`gomoku-option-button${mode === "pvp" ? " is-active" : ""}`}
              type="button"
              onClick={() => onModeChange("pvp")}
            >
              本地双人
            </button>
          </div>
        </div>

        {mode === "ai" ? (
          <div className="gomoku-option-group">
            <span className="gomoku-option-label">AI 难度</span>
            <div className="gomoku-option-row" role="group" aria-label="AI 难度">
              {(Object.keys(DIFFICULTY_LABELS) as GomokuDifficulty[]).map((level) => (
                <button
                  key={level}
                  className={`gomoku-option-button${difficulty === level ? " is-active" : ""}`}
                  type="button"
                  onClick={() => onDifficultyChange(level)}
                >
                  {DIFFICULTY_LABELS[level]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="gomoku-ready-hints">
        <span><b>方向键</b> 移动游标</span>
        <span><b>Enter / Space</b> 落子 · <b>U</b> 悔棋</span>
        <span><b>Esc</b> 暂停</span>
      </div>
      <button className="button button-primary gomoku-overlay-primary" type="button" onClick={onStart}>
        <PlayIcon size={14} />
        开始对弈
      </button>
      <button className="gomoku-back-link" type="button" onClick={onBack}>
        <ArrowLeftIcon size={13} />
        返回游戏库
      </button>
      <span className="gomoku-keyboard-note">按 <kbd>Enter</kbd> 开始</span>
    </>
  );
}

function PausedOverlay({
  game,
  mode,
  onResume,
  onRestart,
}: {
  game: GomokuEngineState;
  mode: GomokuMode;
  onResume: () => void;
  onRestart: () => void;
}) {
  const turnLabel = game.current === "black" ? "黑棋" : "白棋";
  return (
    <>
      <div className="gomoku-overlay-emblem is-paused" aria-hidden="true">
        <PauseIcon size={26} />
      </div>
      <OverlayEyebrow>PAUSED</OverlayEyebrow>
      <h2>对弈已暂停</h2>
      <p>落子与计时均已停止。继续后会从当前盘面恢复。</p>
      <div className="gomoku-pause-score">
        <span>已落子 <strong>{game.moves.length}</strong></span>
        <span>轮到 <strong>{turnLabel}</strong></span>
        <span>模式 <strong>{mode === "ai" ? "人机" : "双人"}</strong></span>
      </div>
      <div className="gomoku-overlay-actions">
        <button className="button button-primary" type="button" onClick={onResume}>
          <PlayIcon size={14} />
          继续对弈
        </button>
        <button className="button" type="button" onClick={onRestart}>
          <RestartIcon size={15} />
          重新开始
        </button>
      </div>
      <span className="gomoku-keyboard-note">按 <kbd>Space</kbd> 或 <kbd>Esc</kbd> 继续</span>
    </>
  );
}

function ResultOverlay({
  result,
  mode,
  submissionStatus,
  gameStat,
  onRestart,
  onBack,
  onRetrySubmit,
}: {
  result: GomokuRoundResult;
  mode: GomokuMode;
  submissionStatus: GomokuSubmissionStatus;
  gameStat: GameStat | undefined;
  onRestart: () => void;
  onBack: () => void;
  onRetrySubmit: () => void;
}) {
  const outcome = result.outcome;
  const winner = result.winner;
  const title = outcome === "draw"
    ? "星盘平局"
    : mode === "ai"
      ? outcome === "win"
        ? "你获胜了"
        : "AI 获胜"
      : winner
        ? `${stoneLabel(winner)}获胜`
        : "对局结束";
  const reason = outcome === "draw"
    ? "225 个交叉点全部落定，无人连成五子。"
    : winner
      ? `${stoneLabel(winner)}率先连成五子，星盘定格。`
      : "本局结束。";

  const wins = gameStat?.wins ?? 0;
  const losses = gameStat?.losses ?? 0;
  const draws = gameStat?.draws ?? 0;
  const longestStreak = gameStat?.longestStreak ?? 0;

  return (
    <>
      <div
        className={`gomoku-overlay-emblem${outcome === "win" ? " is-victory" : outcome === "draw" ? " is-draw" : " is-ended"}`}
        aria-hidden="true"
      >
        {outcome === "win" ? <TrophyIcon size={27} /> : <GomokuIcon size={27} />}
      </div>
      <OverlayEyebrow>{outcome === "draw" ? "STAR BOARD EVEN" : "MATCH COMPLETE"}</OverlayEyebrow>
      <h2>{title}</h2>
      <p>{reason}</p>
      <div className="gomoku-result-score">
        <span>本局手数</span>
        <strong>{result.moveCount}</strong>
        <small>{formatClock(result.durationMs)} 用时</small>
      </div>
      <div className="gomoku-result-grid">
        <div>
          <span>胜场</span>
          <strong className={wins > 0 ? "gold" : ""}>{wins}</strong>
        </div>
        <div>
          <span>负场</span>
          <strong>{losses}</strong>
        </div>
        <div>
          <span>平局</span>
          <strong>{draws}</strong>
        </div>
        <div>
          <span>最长连胜</span>
          <strong className={longestStreak > 0 ? "gold" : ""}>{longestStreak}</strong>
        </div>
      </div>
      <p className="gomoku-result-note">
        记录口径：胜场计黑方胜利，负场计白方胜利，平局单列。
        {result.usedUndo ? ` 本局使用悔棋 ${result.undoCount} 次。` : " 本局未使用悔棋。"}
      </p>
      <div className={`gomoku-save-state is-${submissionStatus}`} aria-live="polite">
        {submissionStatus === "saving" ? (
          <>
            <i aria-hidden="true" />
            正在写入本地记录…
          </>
        ) : submissionStatus === "saved" ? (
          <>
            <CheckIcon size={13} />
            成绩已保存到本地
          </>
        ) : submissionStatus === "failed" ? (
          <>
            <InfoIcon size={13} />
            <span role="alert">未能保存本局成绩，可重新尝试。</span>
            <button type="button" onClick={onRetrySubmit}>重试</button>
          </>
        ) : (
          "准备写入本地记录"
        )}
      </div>
      <div className="gomoku-overlay-actions gomoku-result-actions">
        <button className="button button-primary" type="button" onClick={onRestart}>
          <RestartIcon size={15} />
          {mode === "pvp" ? "再来一局 · 换先" : "再来一局"}
        </button>
        <button className="button" type="button" onClick={onBack}>
          <ArrowLeftIcon size={15} />
          返回游戏库
        </button>
      </div>
    </>
  );
}

function formatClock(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
