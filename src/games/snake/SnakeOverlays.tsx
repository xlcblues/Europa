import type { ReactNode } from "react";

import {
  ArrowLeftIcon,
  CheckIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  RestartIcon,
  SnakeIcon,
  TrophyIcon,
} from "../../components/Icons";
import { formatScore } from "../../app/formatters";
import type { SnakePhase, SnakeRoundResult, SnakeSubmissionStatus } from "./snakeTypes";

interface SnakeOverlaysProps {
  phase: SnakePhase;
  countdownValue: number;
  currentScore: number;
  bestScore: number;
  result: SnakeRoundResult | null;
  submissionStatus: SnakeSubmissionStatus;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
  onBack: () => void;
  onRetrySubmit: () => void;
}

export function SnakeOverlays({
  phase,
  countdownValue,
  currentScore,
  bestScore,
  result,
  submissionStatus,
  onStart,
  onResume,
  onRestart,
  onBack,
  onRetrySubmit,
}: SnakeOverlaysProps) {
  if (phase === "playing") {
    return null;
  }

  return (
    <div className={`snake-overlay snake-overlay-${phase}`}>
      <div className="snake-overlay-panel">
        {phase === "ready" ? (
          <ReadyOverlay onStart={onStart} />
        ) : phase === "countdown" ? (
          <CountdownOverlay countdownValue={countdownValue} />
        ) : phase === "paused" ? (
          <PausedOverlay
            currentScore={currentScore}
            bestScore={bestScore}
            onResume={onResume}
            onRestart={onRestart}
          />
        ) : result ? (
          <ResultOverlay
            result={result}
            bestScore={bestScore}
            submissionStatus={submissionStatus}
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
    <span className="snake-overlay-eyebrow">
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

function ReadyOverlay({ onStart }: { onStart: () => void }) {
  return (
    <>
      <div className="snake-overlay-emblem" aria-hidden="true">
        <div className="snake-emblem-orbit" />
        <SnakeIcon size={28} />
      </div>
      <OverlayEyebrow>EUROPA ARCADE · M2</OverlayEyebrow>
      <h2>环带待启</h2>
      <p>收集暖金星点，让冰脊蛇身穿过环带。每五次进食，速度提升一级。</p>
      <div className="snake-ready-hints">
        <span><b>WASD</b> / 方向键转向</span>
        <span><b>Space</b> 暂停</span>
      </div>
      <button className="button button-primary snake-overlay-primary" type="button" onClick={onStart}>
        <PlayIcon size={14} />
        开始游戏
      </button>
      <span className="snake-keyboard-note">按 <kbd>Enter</kbd> 开始</span>
    </>
  );
}

function CountdownOverlay({ countdownValue }: { countdownValue: number }) {
  return (
    <>
      <OverlayEyebrow>ORBIT CALIBRATION</OverlayEyebrow>
      <h2>准备进入环带</h2>
      <p>确认方向。倒计时结束后，蛇身将沿当前航向移动。</p>
      <div className="snake-countdown" aria-label={`倒计时 ${countdownValue} 秒`}>
        <span>{countdownValue}</span>
        <small>SEC</small>
      </div>
      <span className="snake-keyboard-note">现在可按方向键预设航向</span>
    </>
  );
}

function PausedOverlay({
  currentScore,
  bestScore,
  onResume,
  onRestart,
}: {
  currentScore: number;
  bestScore: number;
  onResume: () => void;
  onRestart: () => void;
}) {
  return (
    <>
      <div className="snake-overlay-emblem is-paused" aria-hidden="true">
        <PauseIcon size={26} />
      </div>
      <OverlayEyebrow>PAUSED</OverlayEyebrow>
      <h2>环带已暂停</h2>
      <p>移动与游戏计时均已停止。继续后会从当前蛇身与航向恢复。</p>
      <div className="snake-pause-score">
        <span>当前分数 <strong>{formatScore(currentScore)}</strong></span>
        <span>本机最高 <strong>{bestScore > 0 ? formatScore(bestScore) : "—"}</strong></span>
      </div>
      <div className="snake-overlay-actions">
        <button className="button button-primary" type="button" onClick={onResume}>
          <PlayIcon size={14} />
          继续游戏
        </button>
        <button className="button" type="button" onClick={onRestart}>
          <RestartIcon size={15} />
          重新开始
        </button>
      </div>
      <span className="snake-keyboard-note">按 <kbd>Space</kbd> 或 <kbd>Esc</kbd> 继续</span>
    </>
  );
}

function ResultOverlay({
  result,
  bestScore,
  submissionStatus,
  onRestart,
  onBack,
  onRetrySubmit,
}: {
  result: SnakeRoundResult;
  bestScore: number;
  submissionStatus: SnakeSubmissionStatus;
  onRestart: () => void;
  onBack: () => void;
  onRetrySubmit: () => void;
}) {
  const victory = result.outcome === "victory";
  const reason = victory
    ? "你填满了整条环带。"
    : result.collision === "self"
      ? "蛇身与自身轨迹相缠。"
      : "蛇首越过了环带边界。";

  return (
    <>
      <div className={`snake-overlay-emblem${victory ? " is-victory" : " is-ended"}`} aria-hidden="true">
        {victory ? <TrophyIcon size={27} /> : <SnakeIcon size={27} />}
      </div>
      <OverlayEyebrow>{victory ? "ORBIT COMPLETE" : "RUN COMPLETE"}</OverlayEyebrow>
      <h2>{victory ? "环带已点亮" : "本局结束"}</h2>
      <p>{reason}</p>
      <div className="snake-result-score">
        <span>本局分数</span>
        <strong>{formatScore(result.score)}</strong>
        <small>{result.foodEaten} 个星点</small>
      </div>
      <div className="snake-result-grid">
        <div>
          <span>蛇身长度</span>
          <strong>{result.finalLength}</strong>
        </div>
        <div>
          <span>本机最高</span>
          <strong className={bestScore > 0 ? "gold" : ""}>{bestScore > 0 ? formatScore(bestScore) : "—"}</strong>
        </div>
        <div>
          <span>速度级别</span>
          <strong>L{result.speedLevel}</strong>
        </div>
        <div>
          <span>本局用时</span>
          <strong>{formatClock(result.durationMs)}</strong>
        </div>
      </div>
      <div className={`snake-save-state is-${submissionStatus}`} aria-live="polite">
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
      <div className="snake-overlay-actions snake-result-actions">
        <button className="button button-primary" type="button" onClick={onRestart}>
          <RestartIcon size={15} />
          再来一局
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
