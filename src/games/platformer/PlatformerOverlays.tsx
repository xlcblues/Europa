import type { CSSProperties, ReactNode } from "react";

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
import { getPlatformerLevelById, PLATFORMER_LEVELS } from "./platformerLevels";
import { PLATFORMER_TOTAL_LEVELS } from "./platformerTypes";
import type {
  PlatformerLevel,
  PlatformerMode,
  PlatformerPhase,
  PlatformerRunResult,
  PlatformerSubmissionStatus,
} from "./platformerTypes";

interface PlatformerOverlaysProps {
  phase: PlatformerPhase;
  mode: PlatformerMode;
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
  onSwitchMode: (mode: PlatformerMode) => void;
  onStartSelectLevel: (levelIndex: number) => void;
  onBackToSelect: () => void;
}

export function PlatformerOverlays({
  phase,
  mode,
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
  onSwitchMode,
  onStartSelectLevel,
  onBackToSelect,
}: PlatformerOverlaysProps) {
  if (phase === "playing") {
    return null;
  }

  const isSelectGrid = phase === "ready" && mode === "select";

  return (
    <div className={`platformer-overlay platformer-overlay-${phase}`}>
      <div className={`platformer-overlay-panel${isSelectGrid ? " is-wide" : ""}`}>
        {phase === "ready" ? (
          <ReadyOverlay
            mode={mode}
            hasSave={hasSave}
            saveLevel={saveLevel}
            onStart={onStart}
            onSwitchMode={onSwitchMode}
            onStartSelectLevel={onStartSelectLevel}
          />
        ) : phase === "level_intro" && currentLevel ? (
          <IntroOverlay level={currentLevel} levelIndex={levelIndex} mode={mode} />
        ) : phase === "paused" ? (
          <PausedOverlay
            mode={mode}
            score={score}
            lives={lives}
            onResume={onResume}
            onRestartCheckpoint={onRestartCheckpoint}
            onBackToSelect={onBackToSelect}
          />
        ) : phase === "level_complete" && currentLevel ? (
          <LevelCompleteOverlay
            level={currentLevel}
            mode={mode}
            nextLevelName={nextLevelName}
            score={score}
            onNextLevel={onNextLevel}
            onRetry={onStartSelectLevel}
            onBackToSelect={onBackToSelect}
          />
        ) : phase === "game_over" ? (
          <EndOverlay
            kind="game_over"
            mode={mode}
            currentLevel={currentLevel}
            onConfirmEnd={onConfirmEnd}
            onRetry={onStartSelectLevel}
            onBackToSelect={onBackToSelect}
          />
        ) : phase === "victory" ? (
          <EndOverlay
            kind="victory"
            mode={mode}
            currentLevel={currentLevel}
            onConfirmEnd={onConfirmEnd}
            onRetry={onStartSelectLevel}
            onBackToSelect={onBackToSelect}
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
  mode,
  hasSave,
  saveLevel,
  onStart,
  onSwitchMode,
  onStartSelectLevel,
}: {
  mode: PlatformerMode;
  hasSave: boolean;
  saveLevel: number | null;
  onStart: (mode: "continue" | "new") => void;
  onSwitchMode: (mode: PlatformerMode) => void;
  onStartSelectLevel: (levelIndex: number) => void;
}) {
  return (
    <>
      <div className="platformer-mode-tabs" role="tablist" aria-label="选择游戏模式">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "expedition"}
          className={mode === "expedition" ? "is-active" : ""}
          onClick={() => onSwitchMode("expedition")}
        >
          远征模式
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "select"}
          className={mode === "select" ? "is-active" : ""}
          onClick={() => onSwitchMode("select")}
        >
          选关模式
        </button>
      </div>
      {mode === "expedition" ? (
        <ExpeditionReadyContent hasSave={hasSave} saveLevel={saveLevel} onStart={onStart} />
      ) : (
        <SelectReadyContent onStartSelectLevel={onStartSelectLevel} />
      )}
    </>
  );
}

function ExpeditionReadyContent({
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
        <p>本地检查点位于第 {saveLevel} 关。将从最近的中继信标继续收集冰晶与信标进度。</p>
        <div className="platformer-overlay-actions">
          <button
            className="button button-primary"
            type="button"
            onClick={() => onStart("continue")}
          >
            <PlayIcon size={14} />
            继续 · 第 {saveLevel} 关
          </button>
          <button className="button" type="button" onClick={() => onStart("new")}>
            <RestartIcon size={15} />
            新的远征
          </button>
        </div>
        <span className="platformer-keyboard-note">
          按 <kbd>Enter</kbd> 继续远征
        </span>
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
      <p>穿过八道冰壳关卡，点亮全部轨道信标。收集冰晶、击退敌人，并在中继检查点存档。</p>
      <div className="platformer-ready-hints">
        <span>
          <b>A / D</b> 或 <b>← →</b> 移动
        </span>
        <span>
          <b>Space / W</b> 跳跃
        </span>
        <span>
          <b>J / X</b> 射击（等离子炮）
        </span>
        <span>
          <b>Esc</b> 暂停
        </span>
      </div>
      <button
        className="button button-primary platformer-overlay-primary"
        type="button"
        onClick={() => onStart("new")}
      >
        <PlayIcon size={14} />
        开始远征
      </button>
      <span className="platformer-keyboard-note">
        按 <kbd>Enter</kbd> 开始
      </span>
    </>
  );
}

function SelectReadyContent({
  onStartSelectLevel,
}: {
  onStartSelectLevel: (levelIndex: number) => void;
}) {
  return (
    <>
      <OverlayEyebrow>LEVEL SELECT</OverlayEyebrow>
      <h2>选关模式</h2>
      <p>自由挑战任意关卡：独立开局与结算，不影响远征存档与远征最高分。</p>
      <div className="platformer-level-grid">
        {PLATFORMER_LEVELS.map((level, index) => (
          <button
            key={level.id}
            type="button"
            className="platformer-level-card"
            style={{ "--card-accent": level.palette.accent } as CSSProperties}
            onClick={() => onStartSelectLevel(index)}
          >
            <span className="platformer-level-card-top">
              <span className="platformer-level-card-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="platformer-level-card-theme">
                {PLATFORMER_THEME_NAMES[level.theme] ?? level.theme}
              </span>
            </span>
            <span className="platformer-level-card-name">{level.name}</span>
            <span className="platformer-level-card-meta">
              {level.crystals.length} 冰晶 · {level.sentinels.length} 威胁
            </span>
          </button>
        ))}
      </div>
      <span className="platformer-keyboard-note">选择关卡后立即开始独立挑战</span>
    </>
  );
}

function IntroOverlay({
  level,
  levelIndex,
  mode,
}: {
  level: PlatformerLevel;
  levelIndex: number;
  mode: PlatformerMode;
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
      <div className="platformer-intro-roster">
        <span>本关威胁</span>
        <ul>
          {level.sentinels
            .map((sentinel) => SENTINEL_KIND_NAMES[sentinel.kind ?? "sentinel"])
            .filter((name, index, list) => list.indexOf(name) === index)
            .map((name) => (
              <li key={name}>{name}</li>
            ))}
        </ul>
      </div>
      <p className="platformer-intro-weapon">
        等离子炮已就绪：{level.weaponPickups.length} 处弹药补给，射击可击退枪手等远程威胁。
      </p>
      <div className="platformer-intro-progress">
        {mode === "select" ? "选关模式 · " : ""}第 {levelIndex + 1} 关 / 共{" "}
        {PLATFORMER_TOTAL_LEVELS} 关
      </div>
    </>
  );
}

function PausedOverlay({
  mode,
  score,
  lives,
  onResume,
  onRestartCheckpoint,
  onBackToSelect,
}: {
  mode: PlatformerMode;
  score: number;
  lives: number;
  onResume: () => void;
  onRestartCheckpoint: () => void;
  onBackToSelect: () => void;
}) {
  return (
    <>
      <div className="platformer-overlay-emblem is-paused" aria-hidden="true">
        <PauseIcon size={26} />
      </div>
      <OverlayEyebrow>PAUSED</OverlayEyebrow>
      <h2>{mode === "select" ? "挑战已暂停" : "远征已暂停"}</h2>
      <p>移动、平台与计时均已停止。继续后会从当前信标状态恢复。</p>
      <div className="platformer-pause-score">
        <span>
          当前分数 <strong>{formatScore(score)}</strong>
        </span>
        <span>
          剩余生命 <strong>{lives}</strong>
        </span>
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
        {mode === "select" ? (
          <button className="button" type="button" onClick={onBackToSelect}>
            <ArrowLeftIcon size={15} />
            返回选关
          </button>
        ) : null}
      </div>
      <span className="platformer-keyboard-note">
        按 <kbd>Esc</kbd> 继续
      </span>
    </>
  );
}

function LevelCompleteOverlay({
  level,
  mode,
  nextLevelName,
  score,
  onNextLevel,
  onRetry,
  onBackToSelect,
}: {
  level: PlatformerLevel;
  mode: PlatformerMode;
  nextLevelName: string | null;
  score: number;
  onNextLevel: () => void;
  onRetry: (levelIndex: number) => void;
  onBackToSelect: () => void;
}) {
  if (mode === "select") {
    return (
      <>
        <div className="platformer-overlay-emblem is-complete" aria-hidden="true">
          <CheckIcon size={26} />
        </div>
        <OverlayEyebrow>LEVEL CLEARED · SELECT</OverlayEyebrow>
        <h2>本关完成</h2>
        <p>「{level.name}」独立挑战完成。可重新挑战本关，或返回选关模式。</p>
        <div className="platformer-pause-score">
          <span>
            本关得分 <strong>{formatScore(score)}</strong>
          </span>
        </div>
        <div className="platformer-overlay-actions">
          <button
            className="button button-primary"
            type="button"
            onClick={() => onRetry(levelIndexOf(level))}
          >
            <RestartIcon size={15} />
            重新挑战
          </button>
          <button className="button" type="button" onClick={onBackToSelect}>
            <ArrowLeftIcon size={15} />
            返回选关
          </button>
        </div>
        <span className="platformer-keyboard-note">
          按 <kbd>Enter</kbd> 重新挑战 · <kbd>Esc</kbd> 返回选关
        </span>
      </>
    );
  }

  return (
    <>
      <div className="platformer-overlay-emblem is-complete" aria-hidden="true">
        <CheckIcon size={26} />
      </div>
      <OverlayEyebrow>LEVEL COMPLETE</OverlayEyebrow>
      <h2>本关完成</h2>
      <p>
        「{level.name}」的轨道信标已点亮。下一站：{nextLevelName ?? "未知区域"}。
      </p>
      <div className="platformer-pause-score">
        <span>
          当前总分 <strong>{formatScore(score)}</strong>
        </span>
      </div>
      <div className="platformer-overlay-actions">
        <button className="button button-primary" type="button" onClick={onNextLevel}>
          <PlayIcon size={14} />
          进入下一关
        </button>
      </div>
      <span className="platformer-keyboard-note">
        按 <kbd>Enter</kbd> 或 <kbd>Space</kbd> 继续
      </span>
    </>
  );
}

function EndOverlay({
  kind,
  mode,
  currentLevel,
  onConfirmEnd,
  onRetry,
  onBackToSelect,
}: {
  kind: "game_over" | "victory";
  mode: PlatformerMode;
  currentLevel: PlatformerLevel | null;
  onConfirmEnd: () => void;
  onRetry: (levelIndex: number) => void;
  onBackToSelect: () => void;
}) {
  const victory = kind === "victory";

  if (mode === "select" && !victory) {
    const level = currentLevel;
    return (
      <>
        <div className="platformer-overlay-emblem is-ended" aria-hidden="true">
          <PlatformIcon size={27} />
        </div>
        <OverlayEyebrow>LEVEL LOST · SELECT</OverlayEyebrow>
        <h2>本关结束</h2>
        <p>生命耗尽，独立挑战止步于此。可重新挑战本关，或返回选关模式。</p>
        {level ? (
          <div className="platformer-pause-score">
            <span>
              本关 <strong>{level.name}</strong>
            </span>
          </div>
        ) : null}
        <div className="platformer-overlay-actions">
          <button
            className="button button-primary"
            type="button"
            onClick={() => level && onRetry(levelIndexOf(level))}
          >
            <RestartIcon size={15} />
            重新挑战
          </button>
          <button className="button" type="button" onClick={onBackToSelect}>
            <ArrowLeftIcon size={15} />
            返回选关
          </button>
        </div>
        <span className="platformer-keyboard-note">
          按 <kbd>Enter</kbd> 重新挑战 · <kbd>Esc</kbd> 返回选关
        </span>
      </>
    );
  }

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
          ? "八道冰壳信标全部点亮，冰原跃迁完成。"
          : "生命耗尽，远征止步于此。查看结算后可开启新的远征。"}
      </p>
      <div className="platformer-overlay-actions">
        <button className="button button-primary" type="button" onClick={onConfirmEnd}>
          <TrophyIcon size={14} />
          查看结算
        </button>
      </div>
      <span className="platformer-keyboard-note">
        按 <kbd>Enter</kbd> 查看本局结算
      </span>
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
      <div
        className={`platformer-overlay-emblem${victory ? " is-victory" : " is-ended"}`}
        aria-hidden="true"
      >
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
            <button type="button" onClick={onRetrySubmit}>
              重试
            </button>
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

const PLATFORMER_THEME_NAMES: Record<string, string> = {
  icefield: "冰原",
  gorge: "裂隙",
  tide: "潮汐",
  night: "星云",
  cavern: "冰洞",
  core: "冰核",
  storm: "风暴",
  crystal: "晶蚀",
};

const SENTINEL_KIND_NAMES: Record<string, string> = {
  sentinel: "经典哨兵",
  crawler: "冰甲爬虫",
  drifter: "裂隙浮游体",
  hopper: "弹跳兽",
  gunner: "冰晶枪手",
  charger: "冲锋兽",
  spiker: "尖刺傀儡",
  wisp: "闪电灵体",
  brute: "重装尖甲兽",
};

function levelIndexOf(level: PlatformerLevel): number {
  return PLATFORMER_LEVELS.findIndex((item) => item.id === level.id);
}

function formatClock(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
