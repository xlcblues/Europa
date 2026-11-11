import type { ReactNode } from "react";

import { formatScore } from "../../app/formatters";
import {
  ArrowLeftIcon,
  CheckIcon,
  InfoIcon,
  PauseIcon,
  PlayIcon,
  PlatformIcon,
  RestartIcon,
  TrophyIcon,
} from "../../components/Icons";
import { getPlatformerLevelById } from "./platformerLevels";
import { PLATFORMER_TOTAL_LEVELS } from "./platformerTypes";
import type {
  PlatformerLevel,
  PlatformerPhase,
  PlatformerRunResult,
  PlatformerSubmissionStatus,
} from "./platformerTypes";

interface PlatformerOverlaysProps {
  phase: PlatformerPhase;
  currentLevel: PlatformerLevel | null;
  nextLevelName: string | null;
  hasSave: boolean;
  saveLevel: number | null;
  score: number;
  lives: number;
  levelIndex: number;
  result: PlatformerRunResult | null;
  submissionStatus: PlatformerSubmissionStatus;
  onStart: (mode: "continue" | "new") => void;
  onResume: () => void;
  onRestartCheckpoint: () => void;
  onNextLevel: () => void;
  onConfirmEnd: () => void;
  onNewRun: () => void;
  onBack: () => void;
  onRetrySubmit: () => void;
}

export function PlatformerOverlays({
  phase,
  currentLevel,
  nextLevelName,
  hasSave,
  saveLevel,
  score,
  lives,
  levelIndex,
  result,
  submissionStatus,
  onStart,
  onResume,
  onRestartCheckpoint,
  onNextLevel,
  onConfirmEnd,
  onNewRun,
  onBack,
  onRetrySubmit,
}: PlatformerOverlaysProps) {
  if (phase === "playing") {
    return null;
  }

  return (
    <div className={`platformer-overlay platformer-overlay-${phase}`}>
      <div className="platformer-overlay-panel">
        {phase === "ready" ? (
          <ReadyOverlay
            hasSave={hasSave}
            saveLevel={saveLevel}
            onStart={onStart}
          />
        ) : phase === "level_intro" && currentLevel ? (
          <IntroOverlay level={currentLevel} levelIndex={levelIndex} />
        ) : phase === "paused" ? (
          <PausedOverlay
            score={score}
            lives={lives}
            onResume={onResume}
            onRestartCheckpoint={onRestartCheckpoint}
          />
        ) : phase === "level_complete" && currentLevel ? (
          <LevelCompleteOverlay
            level={currentLevel}
            nextLevelName={nextLevelName}
            score={score}
            onNextLevel={onNextLevel}
          />
        ) : phase === "game_over" ? (
          <EndOverlay
            kind="game_over"
            onConfirmEnd={onConfirmEnd}
          />
        ) : phase === "victory" ? (
          <EndOverlay
            kind="victory"
            onConfirmEnd={onConfirmEnd}
          />
        ) : result ? (
          <ResultOverlay
            result={result}
            submissionStatus={submissionStatus}
            onNewRun={onNewRun}
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
    <span className="platformer-overlay-eyebrow">
      <i aria-hidden="true" />
      {children}
    </span>
  );
}

function ReadyOverlay({
  hasSave,
  saveLevel,
  onStart,
}: {
  hasSave: boolean;
  saveLevel: number | null;
  onStart: (mode: "continue" | "new") => void;
}) {
  if (hasSave) {
    return (
      <>
        <div className="platformer-overlay-emblem" aria-hidden="true">
          <PlatformIcon size={28} />
        </div>
        <OverlayEyebrow>CONTINUE EXPEDITION</OverlayEyebrow>
        <h2>继续远征</h2>
        <p>
          本地检查点位于第 {saveLevel} 关。将从最近的中继信标继续收集冰晶与信标进度。
        </p>
        <div className="platformer-overlay-actions">
          <button
            className="button button-primary"
            type="button"
            onClick={() => onStart("continue")}
          >
            <PlayIcon size={14} />
            继续 · 第 {saveLevel} 关
          </button>
          <button
            className="button"
            type="button"
            onClick={() => onStart("new")}
          >
            <RestartIcon size={15} />
            新的远征
          </button>
        </div>
        <span className="platformer-keyboard-note">按 <kbd>Enter</kbd> 继续远征</span>
      </>
    );
  }

  return (
    <>
      <div className="platformer-overlay-emblem" aria-hidden="true">
        <PlatformIcon size={28} />
      </div>
      <OverlayEyebrow>EXPEDITION READY</OverlayEyebrow>
      <h2>远征待启</h2>
      <p>穿过六道冰壳关卡，点亮全部轨道信标。收集冰晶、击退敌人，并在中继检查点存档。</p>
      <div className="platformer-ready-hints">
        <span><b>A / D</b> 或 <b>← →</b> 移动</span>
        <span><b>Space / W</b> 跳跃</span>
        <span><b>Esc</b> 暂停</span>
      </div>
      <button
        className="button button-primary platformer-overlay-primary"
        type="button"
        onClick={() => onStart("new")}
      >
        <PlayIcon size={14} />
        开始远征
      </button>
      <span className="platformer-keyboard-note">按 <kbd>Enter</kbd> 开始</span>
    </>
  );
}

function IntroOverlay({
  level,
  levelIndex,
}: {
  level: PlatformerLevel;
  levelIndex: number;
}) {
  return (
    <>
      <div className="platformer-overlay-emblem is-intro" aria-hidden="true">
        <span>{levelIndex + 1}</span>
      </div>
      <OverlayEyebrow>{level.code}</OverlayEyebrow>
      <h2>{level.name}</h2>
      <p>{level.subtitle}</p>
      <div className="platformer-intro-objective">
        <span>本关目标</span>
        <strong>{level.objective}</strong>
      </div>
      <div className="platformer-intro-progress">
        第 {levelIndex + 1} 关 / 共 {PLATFORMER_TOTAL_LEVELS} 关
      </div>
    </>
  );
}

function PausedOverlay({
  score,
  lives,
  onResume,
  onRestartCheckpoint,
}: {
  score: number;
  lives: number;
  onResume: () => void;
  onRestartCheckpoint: () => void;
}) {
  return (
    <>
      <div className="platformer-overlay-emblem is-paused" aria-hidden="true">
        <PauseIcon size={26} />
      </div>
      <OverlayEyebrow>PAUSED</OverlayEyebrow>
      <h2>远征已暂停</h2>
      <p>移动、平台与计时均已停止。继续后会从当前信标状态恢复。</p>
      <div className="platformer-pause-score">
        <span>当前分数 <strong>{formatScore(score)}</strong></span>
        <span>剩余生命 <strong>{lives}</strong></span>
      </div>
      <div className="platformer-overlay-actions">
        <button className="button button-primary" type="button" onClick={onResume}>
          <PlayIcon size={14} />
          继续游戏
        </button>
        <button className="button" type="button" onClick={onRestartCheckpoint}>
          <RestartIcon size={15} />
          返回检查点
        </button>
      </div>
      <span className="platformer-keyboard-note">按 <kbd>Esc</kbd> 继续</span>
    </>
  );
}

function LevelCompleteOverlay({
  level,
  nextLevelName,
  score,
  onNextLevel,
}: {
  level: PlatformerLevel;
  nextLevelName: string | null;
  score: number;
  onNextLevel: () => void;
}) {
  return (
    <>
      <div className="platformer-overlay-emblem is-complete" aria-hidden="true">
        <CheckIcon size={26} />
      </div>
      <OverlayEyebrow>LEVEL COMPLETE</OverlayEyebrow>
      <h2>本关完成</h2>
      <p>「{level.name}」的轨道信标已点亮。下一站：{nextLevelName ?? "未知区域"}。</p>
      <div className="platformer-pause-score">
        <span>当前总分 <strong>{formatScore(score)}</strong></span>
      </div>
      <div className="platformer-overlay-actions">
        <button className="button button-primary" type="button" onClick={onNextLevel}>
          <PlayIcon size={14} />
          进入下一关
        </button>
      </div>
      <span className="platformer-keyboard-note">按 <kbd>Enter</kbd> 或 <kbd>Space</kbd> 继续</span>
    </>
  );
}

function EndOverlay({
  kind,
  onConfirmEnd,
}: {
  kind: "game_over" | "victory";
  onConfirmEnd: () => void;
}) {
  const victory = kind === "victory";
  return (
    <>
      <div
        className={`platformer-overlay-emblem${victory ? " is-victory" : " is-ended"}`}
        aria-hidden="true"
      >
        {victory ? <TrophyIcon size={27} /> : <PlatformIcon size={27} />}
      </div>
      <OverlayEyebrow>{victory ? "EXPEDITION COMPLETE" : "EXPEDITION LOST"}</OverlayEyebrow>
      <h2>{victory ? "远征胜利" : "远征结束"}</h2>
      <p>
        {victory
          ? "六道冰壳信标全部点亮，冰原跃迁完成。"
          : "生命耗尽，远征止步于此。查看结算后可开启新的远征。"}
      </p>
      <div className="platformer-overlay-actions">
        <button className="button button-primary" type="button" onClick={onConfirmEnd}>
          <TrophyIcon size={14} />
          查看结算
        </button>
      </div>
      <span className="platformer-keyboard-note">按 <kbd>Enter</kbd> 查看本局结算</span>
    </>
  );
}

function ResultOverlay({
  result,
  submissionStatus,
  onNewRun,
  onBack,
  onRetrySubmit,
}: {
  result: PlatformerRunResult;
  submissionStatus: PlatformerSubmissionStatus;
  onNewRun: () => void;
  onBack: () => void;
  onRetrySubmit: () => void;
}) {
  const victory = result.outcome === "victory";
  return (
    <>
      <div className={`platformer-overlay-emblem${victory ? " is-victory" : " is-ended"}`} aria-hidden="true">
        {victory ? <TrophyIcon size={27} /> : <PlatformIcon size={27} />}
      </div>
      <OverlayEyebrow>{victory ? "RUN COMPLETE · VICTORY" : "RUN COMPLETE"}</OverlayEyebrow>
      <h2>{victory ? "远征胜利" : "本局结束"}</h2>
      <div className="platformer-result-score">
        <span>本局分数</span>
        <strong>{formatScore(result.score)}</strong>
        <small>
          {result.levelsCompleted}/{PLATFORMER_TOTAL_LEVELS} 关 · {formatClock(result.durationMs)}
        </small>
      </div>
      <div className="platformer-result-grid">
        <div>
          <span>通关关卡</span>
          <strong>{result.levelsCompleted}</strong>
        </div>
        <div>
          <span>收集冰晶</span>
          <strong>{result.crystalsCollected}</strong>
        </div>
        <div>
          <span>击退敌人</span>
          <strong>{result.sentinelsDefeated}</strong>
        </div>
        <div>
          <span>阵亡次数</span>
          <strong>{result.deaths}</strong>
        </div>
      </div>
      <div className="platformer-level-results">
        {result.levelResults.map((item) => {
          const name = getPlatformerLevelById(item.levelId).name;
          return (
            <div key={item.levelId} className={item.completed ? "is-completed" : ""}>
              <span className="platformer-level-result-name">
                <b>第 {item.levelId} 关</b>
                {name}
                {item.completed ? <CheckIcon size={11} /> : null}
              </span>
              <span>{formatScore(item.score)}</span>
              <span>
                冰晶 {item.crystalsCollected}/{item.crystalsTotal}
              </span>
              <span>{item.deaths} 次阵亡</span>
            </div>
          );
        })}
      </div>
      <div className={`platformer-save-state is-${submissionStatus}`} aria-live="polite">
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
      <div className="platformer-overlay-actions platformer-result-actions">
        <button className="button button-primary" type="button" onClick={onNewRun}>
          <RestartIcon size={15} />
          新的远征
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