import { useEffect, useRef, useState } from "react";

import { formatScore, getGameStat } from "../../app/formatters";
import { PauseIcon, PlayIcon, RestartIcon, SnakeIcon } from "../../components/Icons";
import { submitSnakeMatch, type SnakeMatchSubmissionResult } from "../../services/ipc";
import { useAppStore } from "../../state/appStore";
import { SnakeAudio } from "./snakeAudio";
import { SnakeBoard } from "./SnakeBoard";
import {
  advanceSnake,
  createSnakeState,
  getSnakeSpeedLevel,
  queueDirection,
  type SnakeDirection,
  type SnakeState,
} from "./snakeEngine";
import { SnakeOverlays } from "./SnakeOverlays";
import type { SnakePhase, SnakeRoundResult, SnakeSubmissionStatus } from "./snakeTypes";
import "./snake.css";

interface SnakeGameProps {
  onBack: () => void;
}

const DIRECTION_KEYS: Partial<Record<string, SnakeDirection>> = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
};

const PHASE_LABELS: Record<SnakePhase, string> = {
  ready: "待开始",
  countdown: "倒计时",
  playing: "运行中",
  paused: "已暂停",
  result: "本局结束",
};

export function SnakeGame({ onBack }: SnakeGameProps) {
  const [game, setGame] = useState<SnakeState>(() => createSnakeState());
  const [phase, setPhaseState] = useState<SnakePhase>("ready");
  const [countdownValue, setCountdownValue] = useState(1);
  const [result, setResult] = useState<SnakeRoundResult | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<SnakeSubmissionStatus>("idle");

  const gameRef = useRef(game);
  const phaseRef = useRef<SnakePhase>("ready");
  const resultRef = useRef<SnakeRoundResult | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const tickTimerRef = useRef<number | null>(null);
  const playStartedAtRef = useRef<number | null>(null);
  const accumulatedPlayMsRef = useRef(0);
  const submittedSessionRef = useRef<string | null>(null);
  const submittingSessionsRef = useRef(new Set<string>());
  const aliveRef = useRef(true);
  const audioRef = useRef<SnakeAudio | null>(null);
  const soundEnabled = useAppStore((store) => store.soundEnabled);
  const gameStats = useAppStore((store) => store.gameStats);
  const snakeStat = getGameStat(gameStats, "snake");
  const bestScore = Math.max(0, snakeStat?.bestScore ?? 0);

  function setPhase(nextPhase: SnakePhase): void {
    phaseRef.current = nextPhase;
    setPhaseState(nextPhase);
  }

  function updateGame(nextGame: SnakeState): void {
    gameRef.current = nextGame;
    setGame(nextGame);
  }

  function getAudio(): SnakeAudio {
    if (!audioRef.current) {
      audioRef.current = new SnakeAudio(soundEnabled);
    }
    audioRef.current.setEnabled(soundEnabled);
    return audioRef.current;
  }

  function clearCountdownTimer(): void {
    if (countdownTimerRef.current !== null) {
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }

  function clearTickTimer(): void {
    if (tickTimerRef.current !== null) {
      window.clearTimeout(tickTimerRef.current);
      tickTimerRef.current = null;
    }
  }

  function closePlaySegment(): void {
    if (playStartedAtRef.current !== null) {
      accumulatedPlayMsRef.current += Math.max(0, Date.now() - playStartedAtRef.current);
      playStartedAtRef.current = null;
    }
  }

  function getPlayedDuration(): number {
    const runningSegment = playStartedAtRef.current === null
      ? 0
      : Math.max(0, Date.now() - playStartedAtRef.current);
    return Math.round(accumulatedPlayMsRef.current + runningSegment);
  }

  function beginRound(): void {
    clearCountdownTimer();
    clearTickTimer();
    accumulatedPlayMsRef.current = 0;
    playStartedAtRef.current = null;
    submittedSessionRef.current = null;
    resultRef.current = null;
    updateGame(createSnakeState());
    setResult(null);
    setSubmissionStatus("idle");
    setCountdownValue(1);

    const sessionId = createSessionId();
    submittedSessionRef.current = sessionId;
    setPhase("countdown");
    getAudio().play("start");

    countdownTimerRef.current = window.setTimeout(() => {
      countdownTimerRef.current = null;
      if (phaseRef.current !== "countdown") {
        return;
      }
      setPhase("playing");
      playStartedAtRef.current = Date.now();
      scheduleNextTick();
    }, 1000);
  }

  function scheduleNextTick(): void {
    clearTickTimer();
    if (phaseRef.current !== "playing") {
      return;
    }

    tickTimerRef.current = window.setTimeout(runTick, gameRef.current.tickMs);
  }

  function runTick(): void {
    tickTimerRef.current = null;
    if (phaseRef.current !== "playing") {
      return;
    }

    const before = gameRef.current;
    const next = advanceSnake(before);
    updateGame(next);

    if (next.foodEaten > before.foodEaten && next.status === "playing") {
      getAudio().play("eat");
    }

    if (next.status !== "playing") {
      closePlaySegment();
      finishRound(next, getPlayedDuration());
      return;
    }

    scheduleNextTick();
  }

  function finishRound(finalGame: SnakeState, durationMs: number): void {
    clearTickTimer();
    const sessionId = submittedSessionRef.current;
    if (!sessionId) {
      return;
    }

    const outcome = finalGame.status === "won" ? "victory" : "game_over";
    const roundResult: SnakeRoundResult = {
      sessionId,
      outcome,
      score: finalGame.score,
      durationMs,
      foodEaten: finalGame.foodEaten,
      finalLength: finalGame.snake.length,
      speedLevel: getSnakeSpeedLevel(finalGame.foodEaten),
      tickMs: finalGame.tickMs,
      collision: finalGame.collision,
    };
    resultRef.current = roundResult;
    setResult(roundResult);
    setSubmissionStatus("idle");
    setPhase("result");

    if (outcome === "victory") {
      getAudio().play("victory");
    } else {
      getAudio().play("game-over");
    }

    submittedSessionRef.current = null;
    void submitRound(roundResult);
  }

  async function submitRound(roundResult: SnakeRoundResult): Promise<void> {
    if (submittingSessionsRef.current.has(roundResult.sessionId)) {
      return;
    }

    submittingSessionsRef.current.add(roundResult.sessionId);
    if (aliveRef.current && resultRef.current?.sessionId === roundResult.sessionId) {
      setSubmissionStatus("saving");
    }

    try {
      const response: SnakeMatchSubmissionResult = await submitSnakeMatch({
        sessionId: roundResult.sessionId,
        outcome: roundResult.outcome,
        score: roundResult.score,
        durationMs: roundResult.durationMs,
        foodEaten: roundResult.foodEaten,
        finalLength: roundResult.finalLength,
        speedLevel: roundResult.speedLevel,
        tickMs: roundResult.tickMs,
      });
      useAppStore.getState().mergeGameStat(response.stat);
      if (aliveRef.current && resultRef.current?.sessionId === roundResult.sessionId) {
        setSubmissionStatus("saved");
      }
    } catch {
      if (aliveRef.current && resultRef.current?.sessionId === roundResult.sessionId) {
        setSubmissionStatus("failed");
      }
    } finally {
      submittingSessionsRef.current.delete(roundResult.sessionId);
    }
  }

  function retrySubmit(): void {
    const currentResult = resultRef.current;
    if (currentResult && !submittingSessionsRef.current.has(currentResult.sessionId)) {
      void submitRound(currentResult);
    }
  }

  function pauseRound(): void {
    if (phaseRef.current !== "playing") {
      return;
    }
    clearTickTimer();
    closePlaySegment();
    setPhase("paused");
    getAudio().play("pause");
  }

  function resumeRound(): void {
    if (phaseRef.current !== "paused") {
      return;
    }
    playStartedAtRef.current = Date.now();
    setPhase("playing");
    getAudio().play("resume");
    scheduleNextTick();
  }

  function handleAutoPause(): void {
    if (phaseRef.current === "playing") {
      pauseRound();
    } else if (phaseRef.current === "countdown") {
      clearCountdownTimer();
      setPhase("ready");
    }
  }

  function handleDirection(direction: SnakeDirection): void {
    const currentPhase = phaseRef.current;
    if (currentPhase !== "playing" && currentPhase !== "countdown") {
      return;
    }
    updateGame(queueDirection(gameRef.current, direction));
  }

  function handleHudAction(): void {
    const currentPhase = phaseRef.current;
    if (currentPhase === "ready" || currentPhase === "result") {
      beginRound();
      return;
    }
    if (currentPhase === "playing") {
      pauseRound();
      return;
    }
    if (currentPhase === "paused") {
      resumeRound();
    }
  }

  useEffect(() => {
    audioRef.current?.setEnabled(soundEnabled);
    if (!soundEnabled) {
      audioRef.current?.close();
    }
  }, [soundEnabled]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      clearCountdownTimer();
      clearTickTimer();
      audioRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isInteractiveTarget(event.target)) {
        return;
      }

      const direction = DIRECTION_KEYS[event.code];
      if (direction) {
        event.preventDefault();
        if (!event.repeat) {
          handleDirection(direction);
        }
        return;
      }

      if (event.code === "Enter") {
        const currentPhase = phaseRef.current;
        if (currentPhase === "ready" || currentPhase === "result") {
          event.preventDefault();
          beginRound();
        }
        return;
      }

      if (event.code === "Space" || event.code === "Escape") {
        event.preventDefault();
        if (event.repeat) {
          return;
        }
        const currentPhase = phaseRef.current;
        if (currentPhase === "playing") {
          pauseRound();
        } else if (currentPhase === "paused") {
          resumeRound();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    const handleBlur = () => handleAutoPause();
    const handleVisibility = () => {
      if (document.hidden) {
        handleAutoPause();
      }
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  });

  const elapsedClock = formatClock(phase === "result" ? result?.durationMs ?? 0 : getPlayedDuration());
  const actionLabel = phase === "playing"
    ? "暂停游戏"
    : phase === "paused"
      ? "继续游戏"
      : phase === "result"
        ? "再来一局"
        : "开始游戏";

  return (
    <div className="game-page snake-page">
      <header className="game-page-head snake-page-head">
        <div>
          <div className="eyebrow">02 / ARCADE · MILESTONE M2</div>
          <h1>环带贪吃蛇</h1>
          <p>沿木卫二冰环收集星点。方向、速度与长度，都会在同一局中持续生长。</p>
        </div>
        <div className="snake-head-meta">
          <span className={`snake-phase-pill is-${phase}`}>
            <i aria-hidden="true" />
            {PHASE_LABELS[phase]}
          </span>
          <span className="snake-mode-label">20×20 · ICE RING</span>
        </div>
      </header>

      <div className="snake-layout">
        <section className="snake-stage-panel" aria-label="环带贪吃蛇游戏舞台">
          <div className="snake-stage-bar">
            <span className="snake-stage-code">EUROPA · SECTOR 02</span>
            <div>
              <span className="snake-signal" aria-hidden="true"><i /><i /><i /></span>
              <span>{soundEnabled ? "音效开启" : "静音模式"}</span>
            </div>
          </div>

          <div className="snake-board-shell">
            <SnakeBoard state={game} phase={phase} />
            <SnakeOverlays
              phase={phase}
              countdownValue={countdownValue}
              currentScore={game.score}
              bestScore={bestScore}
              result={result}
              submissionStatus={submissionStatus}
              onStart={beginRound}
              onResume={resumeRound}
              onRestart={beginRound}
              onBack={onBack}
              onRetrySubmit={retrySubmit}
            />
          </div>

          <div className="snake-stage-footer">
            <span className="snake-controls-inline">
              <kbd>WASD</kbd><kbd>↑↓←→</kbd>转向
              <kbd>Space</kbd>暂停
            </span>
            <span className="snake-stage-score" aria-live="polite">
              本局 <strong>{formatScore(game.score)}</strong>
              <i aria-hidden="true" />
              {elapsedClock}
            </span>
          </div>
        </section>

        <aside className="snake-hud" aria-label="对局状态与操作">
          <section className="snake-hud-card snake-score-card">
            <div className="snake-hud-heading">
              <span>当前分数</span>
              <SnakeIcon size={18} />
            </div>
            <strong className="snake-current-score" aria-live="polite">{formatScore(game.score)}</strong>
            <div className="snake-best-line">
              <span>本机最高</span>
              <b>{bestScore > 0 ? formatScore(bestScore) : "—"}</b>
            </div>
          </section>

          <section className="snake-hud-card">
            <div className="snake-hud-heading">
              <span>本局读数</span>
              <span className="snake-hud-tag">LIVE DATA</span>
            </div>
            <div className="snake-metrics">
              <div>
                <span>蛇身长度</span>
                <strong>{game.snake.length}</strong>
              </div>
              <div>
                <span>已收集</span>
                <strong>{game.foodEaten}</strong>
              </div>
              <div>
                <span>速度级别</span>
                <strong>L{getSnakeSpeedLevel(game.foodEaten)}</strong>
              </div>
              <div>
                <span>Tick</span>
                <strong>{game.tickMs}ms</strong>
              </div>
            </div>
          </section>

          <section className="snake-hud-card snake-control-card">
            <div className="snake-hud-heading">
              <span>操作</span>
              <span className="snake-hud-tag">KEYBOARD</span>
            </div>
            <div className="snake-control-row">
              <span className="snake-key-cluster" aria-hidden="true">
                <kbd>W</kbd>
                <kbd>A</kbd><kbd>S</kbd><kbd>D</kbd>
              </span>
              <span>方向键同样可用</span>
            </div>
            <div className="snake-control-row is-keys">
              <span><kbd>Space</kbd><kbd>Esc</kbd></span>
              <span>暂停 / 继续</span>
            </div>
          </section>

          <div className="snake-hud-actions">
            <button
              className="button button-primary snake-hud-primary"
              type="button"
              onClick={handleHudAction}
              disabled={phase === "countdown"}
            >
              {phase === "playing" ? <PauseIcon size={15} /> : <PlayIcon size={14} />}
              {actionLabel}
            </button>
            <button
              className="button snake-hud-restart"
              type="button"
              onClick={beginRound}
              disabled={phase === "ready" || phase === "countdown"}
            >
              <RestartIcon size={15} />
              重开
            </button>
          </div>
          <p className="snake-hud-note">
            失焦会自动暂停。中断或返回游戏库不会写入本局成绩。
          </p>
        </aside>
      </div>
    </div>
  );
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement
    && Boolean(target.closest("button, input, textarea, select, a[href]"));
}

function formatClock(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function createSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  let randomPart: string;
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const values = new Uint32Array(2);
    globalThis.crypto.getRandomValues(values);
    randomPart = Array.from(values, (value) => value.toString(36)).join("-");
  } else {
    randomPart = `${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
  return `snake-${Date.now().toString(36)}-${randomPart}`.slice(0, 64);
}
