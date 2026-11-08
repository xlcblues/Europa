import { useEffect, useRef, useState } from "react";

import { getGameStat } from "../../app/formatters";
import { GomokuIcon, PauseIcon, PlayIcon, RestartIcon } from "../../components/Icons";
import {
  submitGomokuMatch,
  type GomokuMatchOutcome,
  type GomokuMatchSubmissionResult,
} from "../../services/ipc";
import { useAppStore } from "../../state/appStore";
import { chooseAiMove, GOMOKU_DIFFICULTY_CONFIG } from "./gomokuAi";
import { GomokuAudio } from "./gomokuAudio";
import { GomokuBoard } from "./gomokuBoard";
import {
  applyUndo,
  canUndo,
  coordinateLabel,
  createGomokuState,
  GOMOKU_MAX_UNDO,
  isValidPlacement,
  moveCursor,
  otherStone,
  placeStone,
  stoneLabel,
  type GomokuEngineState,
} from "./gomokuEngine";
import { GomokuOverlays } from "./gomokuOverlays";
import type {
  GomokuDifficulty,
  GomokuMode,
  GomokuPhase,
  GomokuPoint,
  GomokuRoundResult,
  GomokuStone,
  GomokuSubmissionStatus,
} from "./gomokuTypes";
import "./gomoku.css";

interface GomokuGameProps {
  onBack: () => void;
}

const PHASE_LABELS: Record<GomokuPhase, string> = {
  ready: "待开始",
  playing: "对弈中",
  paused: "已暂停",
  result: "本局结束",
};

const DIFFICULTY_LABELS: Record<GomokuDifficulty, string> = {
  beginner: "入门",
  intermediate: "进阶",
  master: "大师",
};

export function GomokuGame({ onBack }: GomokuGameProps) {
  const [game, setGame] = useState<GomokuEngineState>(() => createGomokuState());
  const [phase, setPhaseState] = useState<GomokuPhase>("ready");
  const [mode, setModeState] = useState<GomokuMode>("ai");
  const [difficulty, setDifficultyState] = useState<GomokuDifficulty>("intermediate");
  const [firstStone, setFirstStoneState] = useState<GomokuStone>("black");
  const [cursor, setCursor] = useState<GomokuPoint>({ x: 7, y: 7 });
  const [hover, setHover] = useState<GomokuPoint | null>(null);
  const [result, setResult] = useState<GomokuRoundResult | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<GomokuSubmissionStatus>("idle");
  const [aiThinking, setAiThinking] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  const gameRef = useRef(game);
  const phaseRef = useRef<GomokuPhase>("ready");
  const modeRef = useRef<GomokuMode>("ai");
  const difficultyRef = useRef<GomokuDifficulty>("intermediate");
  const firstStoneRef = useRef<GomokuStone>("black");
  const cursorRef = useRef<GomokuPoint>({ x: 7, y: 7 });
  const resultRef = useRef<GomokuRoundResult | null>(null);
  const playStartedAtRef = useRef<number | null>(null);
  const accumulatedPlayMsRef = useRef(0);
  const submittedSessionRef = useRef<string | null>(null);
  const submittingSessionsRef = useRef(new Set<string>());
  const aiThinkingRef = useRef(false);
  const aiTokenRef = useRef(0);
  const aiTimerRef = useRef<number | null>(null);
  const aliveRef = useRef(true);
  const audioRef = useRef<GomokuAudio | null>(null);

  const soundEnabled = useAppStore((store) => store.soundEnabled);
  const gameStats = useAppStore((store) => store.gameStats);
  const gomokuStat = getGameStat(gameStats, "gomoku");
  const longestStreak = gomokuStat?.longestStreak ?? 0;
  const undoUsed = GOMOKU_MAX_UNDO - game.undoBudget;

  function setPhase(nextPhase: GomokuPhase): void {
    phaseRef.current = nextPhase;
    setPhaseState(nextPhase);
  }

  function updateGame(nextGame: GomokuEngineState): void {
    gameRef.current = nextGame;
    setGame(nextGame);
  }

  function updateAiThinking(nextValue: boolean): void {
    aiThinkingRef.current = nextValue;
    setAiThinking(nextValue);
  }

  function getAudio(): GomokuAudio {
    if (!audioRef.current) {
      audioRef.current = new GomokuAudio(soundEnabled);
    }
    audioRef.current.setEnabled(soundEnabled);
    return audioRef.current;
  }

  function clearAiTimer(): void {
    if (aiTimerRef.current !== null) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
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

  function scheduleAiMove(): void {
    clearAiTimer();
    const token = aiTokenRef.current;
    const difficultyValue = difficultyRef.current;
    const budgetMs = GOMOKU_DIFFICULTY_CONFIG[difficultyValue].budgetMs;
    aiTimerRef.current = window.setTimeout(() => {
      aiTimerRef.current = null;
      if (!aliveRef.current || token !== aiTokenRef.current) {
        return;
      }
      if (phaseRef.current !== "playing") {
        return;
      }
      const currentGame = gameRef.current;
      if (currentGame.winner !== null || currentGame.isDraw) {
        return;
      }
      if (currentGame.current !== "white") {
        return;
      }
      const nextPoint = chooseAiMove(currentGame.board, "white", difficultyValue);
      if (!nextPoint || !aliveRef.current || token !== aiTokenRef.current) {
        return;
      }
      if (phaseRef.current !== "playing") {
        return;
      }
      updateAiThinking(false);
      placeAiStoneAt(nextPoint);
    }, budgetMs);
  }

  function beginRound(nextFirstStone: GomokuStone): void {
    clearAiTimer();
    aiTokenRef.current += 1;
    updateAiThinking(false);
    accumulatedPlayMsRef.current = 0;
    playStartedAtRef.current = null;
    submittedSessionRef.current = null;
    resultRef.current = null;
    firstStoneRef.current = nextFirstStone;
    setFirstStoneState(nextFirstStone);
    updateGame(createGomokuState());
    setCursor({ x: 7, y: 7 });
    setHover(null);
    setResult(null);
    setSubmissionStatus("idle");
    setLiveMessage("");

    const sessionId = createSessionId("gomoku");
    submittedSessionRef.current = sessionId;
    setPhase("playing");
    playStartedAtRef.current = Date.now();
    getAudio().play("start");

    if (modeRef.current === "ai" && nextFirstStone === "white") {
      updateAiThinking(true);
      getAudio().play("think");
      scheduleAiMove();
    }
  }

  function handleRestart(): void {
    if (phaseRef.current === "result" && modeRef.current === "pvp") {
      beginRound(otherStone(firstStoneRef.current));
      return;
    }
    beginRound(firstStoneRef.current);
  }

  function announceMove(point: GomokuPoint, stone: GomokuStone, nextGame: GomokuEngineState): void {
    if (nextGame.winner) {
      setLiveMessage(`${stoneLabel(stone)}在 ${coordinateLabel(point)} 连成五子，本局结束。`);
    } else if (nextGame.isDraw) {
      setLiveMessage("星盘落满，本局平局。");
    } else {
      const nextStone = nextGame.current === "black" ? "黑棋" : "白棋";
      setLiveMessage(`${stoneLabel(stone)}落于 ${coordinateLabel(point)}，轮到 ${nextStone}。`);
    }
  }

  function placeStoneAt(point: GomokuPoint): void {
    if (phaseRef.current !== "playing") {
      return;
    }
    if (aiThinkingRef.current) {
      return;
    }
    const currentGame = gameRef.current;
    if (currentGame.winner !== null || currentGame.isDraw) {
      return;
    }
    if (modeRef.current === "ai" && currentGame.current !== "black") {
      return;
    }
    if (!isValidPlacement(currentGame, point)) {
      return;
    }

    const nextGame = placeStone(currentGame, point);
    updateGame(nextGame);
    getAudio().play("place");
    announceMove(point, currentGame.current, nextGame);

    if (nextGame.winner !== null || nextGame.isDraw) {
      closePlaySegment();
      finishRound(nextGame, getPlayedDuration());
      return;
    }

    if (modeRef.current === "ai" && nextGame.current === "white") {
      updateAiThinking(true);
      getAudio().play("think");
      scheduleAiMove();
    }
  }

  function placeAiStoneAt(point: GomokuPoint): void {
    const currentGame = gameRef.current;
    if (phaseRef.current !== "playing") {
      return;
    }
    if (currentGame.winner !== null || currentGame.isDraw) {
      return;
    }
    if (!isValidPlacement(currentGame, point)) {
      return;
    }

    const nextGame = placeStone(currentGame, point);
    updateGame(nextGame);
    getAudio().play("place");
    announceMove(point, currentGame.current, nextGame);

    if (nextGame.winner !== null || nextGame.isDraw) {
      closePlaySegment();
      finishRound(nextGame, getPlayedDuration());
    }
  }

  function finishRound(finalGame: GomokuEngineState, durationMs: number): void {
    clearAiTimer();
    aiTokenRef.current += 1;
    updateAiThinking(false);

    const sessionId = submittedSessionRef.current;
    if (!sessionId) {
      return;
    }

    const outcome: GomokuMatchOutcome = finalGame.winner === "black"
      ? "win"
      : finalGame.winner === "white"
        ? "loss"
        : "draw";

    const roundResult: GomokuRoundResult = {
      sessionId,
      mode: modeRef.current,
      difficulty: modeRef.current === "ai" ? difficultyRef.current : null,
      outcome,
      winner: finalGame.winner,
      moveCount: finalGame.moves.length,
      durationMs,
      usedUndo: finalGame.undoBudget < GOMOKU_MAX_UNDO,
      undoCount: GOMOKU_MAX_UNDO - finalGame.undoBudget,
      victoryLine: finalGame.victoryLine,
      moves: finalGame.moves,
    };
    resultRef.current = roundResult;
    setResult(roundResult);
    setSubmissionStatus("idle");
    setPhase("result");

    const sound = outcome === "win" ? "win" : outcome === "loss" ? "lose" : "draw";
    getAudio().play(sound);

    submittedSessionRef.current = null;
    void submitRound(roundResult);
  }

  async function submitRound(roundResult: GomokuRoundResult): Promise<void> {
    if (submittingSessionsRef.current.has(roundResult.sessionId)) {
      return;
    }

    submittingSessionsRef.current.add(roundResult.sessionId);
    if (aliveRef.current && resultRef.current?.sessionId === roundResult.sessionId) {
      setSubmissionStatus("saving");
    }

    try {
      const response: GomokuMatchSubmissionResult = await submitGomokuMatch({
        sessionId: roundResult.sessionId,
        mode: roundResult.mode,
        difficulty: roundResult.difficulty,
        outcome: roundResult.outcome,
        winner: roundResult.winner,
        moveCount: roundResult.moveCount,
        durationMs: roundResult.durationMs,
        usedUndo: roundResult.usedUndo,
        undoCount: roundResult.undoCount,
        moves: roundResult.moves,
        victoryLine: roundResult.victoryLine,
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

  function handleModeChange(nextMode: GomokuMode): void {
    modeRef.current = nextMode;
    setModeState(nextMode);
  }

  function handleDifficultyChange(nextDifficulty: GomokuDifficulty): void {
    difficultyRef.current = nextDifficulty;
    setDifficultyState(nextDifficulty);
  }

  function handleMoveCursor(dx: number, dy: number): void {
    if (phaseRef.current !== "playing") {
      return;
    }
    const nextCursor = moveCursor(cursorRef.current, dx, dy);
    cursorRef.current = nextCursor;
    setCursor(nextCursor);
  }

  function handlePlace(): void {
    if (phaseRef.current !== "playing") {
      return;
    }
    if (aiThinkingRef.current) {
      return;
    }
    const currentGame = gameRef.current;
    if (currentGame.winner !== null || currentGame.isDraw) {
      return;
    }
    if (modeRef.current === "ai" && currentGame.current !== "black") {
      return;
    }
    placeStoneAt(cursorRef.current);
  }

  function handleUndo(): void {
    if (phaseRef.current !== "playing") {
      return;
    }
    const currentGame = gameRef.current;
    if (!canUndo(currentGame)) {
      return;
    }
    const plies = modeRef.current === "pvp"
      ? 1
      : currentGame.moves.length % 2 === 1
        ? 1
        : 2;
    const nextGame = applyUndo(currentGame, plies);
    updateGame(nextGame);
    getAudio().play("undo");
    if (modeRef.current === "ai") {
      aiTokenRef.current += 1;
      clearAiTimer();
      updateAiThinking(false);
    }
    setLiveMessage("已悔棋，可重新落子。");
  }

  function pauseRound(): void {
    if (phaseRef.current !== "playing") {
      return;
    }
    clearAiTimer();
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
    if (modeRef.current === "ai" && gameRef.current.current === "white") {
      updateAiThinking(true);
      getAudio().play("think");
      scheduleAiMove();
    }
  }

  function handleHudAction(): void {
    const currentPhase = phaseRef.current;
    if (currentPhase === "ready" || currentPhase === "result") {
      handleRestart();
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
      aiTokenRef.current += 1;
      clearAiTimer();
      audioRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isInteractiveTarget(event.target)) {
        return;
      }

      const code = event.code;
      if (code === "ArrowUp") {
        event.preventDefault();
        if (!event.repeat) {
          handleMoveCursor(0, -1);
        }
        return;
      }
      if (code === "ArrowDown") {
        event.preventDefault();
        if (!event.repeat) {
          handleMoveCursor(0, 1);
        }
        return;
      }
      if (code === "ArrowLeft") {
        event.preventDefault();
        if (!event.repeat) {
          handleMoveCursor(-1, 0);
        }
        return;
      }
      if (code === "ArrowRight") {
        event.preventDefault();
        if (!event.repeat) {
          handleMoveCursor(1, 0);
        }
        return;
      }

      if (code === "Enter" || code === "Space") {
        event.preventDefault();
        if (event.repeat) {
          return;
        }
        const currentPhase = phaseRef.current;
        if (currentPhase === "ready" || currentPhase === "result") {
          handleRestart();
        } else if (currentPhase === "playing") {
          handlePlace();
        } else if (currentPhase === "paused") {
          resumeRound();
        }
        return;
      }

      if (code === "Escape") {
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
        return;
      }

      if (code === "KeyU") {
        event.preventDefault();
        if (!event.repeat) {
          handleUndo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    const handleAutoPause = () => {
      if (phaseRef.current === "playing") {
        pauseRound();
      }
    };
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
    ? "暂停对弈"
    : phase === "paused"
      ? "继续对弈"
      : phase === "result"
        ? "再来一局"
        : "开始对弈";
  const turnLabel = mode === "ai"
    ? game.current === "black"
      ? "你 · 黑棋"
      : "AI · 白棋"
    : game.current === "black"
      ? `玩家一 · 黑棋`
      : `玩家二 · 白棋`;
  const firstStoneLabel = mode === "pvp"
    ? `玩家一 · ${firstStone === "black" ? "黑棋" : "白棋"}`
    : "你 · 黑棋";

  return (
    <div className="game-page gomoku-page">
      <header className="game-page-head gomoku-page-head">
        <div>
          <div className="eyebrow">03 / STRATEGY · MILESTONE M4</div>
          <h1>星盘五子棋</h1>
          <p>在木卫二的冰封星盘上对弈。五子连珠，胜负既定。</p>
        </div>
        <div className="gomoku-head-meta">
          <span className={`gomoku-phase-pill is-${phase}`}>
            <i aria-hidden="true" />
            {PHASE_LABELS[phase]}
          </span>
          <span className="gomoku-mode-label">
            15×15 · {mode === "ai" ? `AI · ${DIFFICULTY_LABELS[difficulty]}` : "PVP"}
          </span>
        </div>
      </header>

      <div className="gomoku-layout">
        <section className="gomoku-stage-panel" aria-label="星盘五子棋游戏舞台">
          <div className="gomoku-stage-bar">
            <span className="gomoku-stage-code">EUROPA · SECTOR 03</span>
            <div>
              <span className="gomoku-signal" aria-hidden="true"><i /><i /><i /></span>
              <span>{soundEnabled ? "音效开启" : "静音模式"}</span>
            </div>
          </div>

          <div className="gomoku-board-shell">
            <GomokuBoard
              state={game}
              phase={phase}
              cursor={cursor}
              hover={hover}
              aiThinking={aiThinking}
              onPlace={(point) => placeStoneAt(point)}
              onHover={setHover}
            />
            <GomokuOverlays
              phase={phase}
              game={game}
              mode={mode}
              difficulty={difficulty}
              result={result}
              submissionStatus={submissionStatus}
              gameStat={gomokuStat}
              onModeChange={handleModeChange}
              onDifficultyChange={handleDifficultyChange}
              onStart={() => beginRound("black")}
              onResume={resumeRound}
              onRestart={handleRestart}
              onBack={onBack}
              onRetrySubmit={retrySubmit}
            />
          </div>

          <div className="gomoku-stage-footer">
            <span className="gomoku-controls-inline">
              <kbd>↑↓←→</kbd>移动游标
              <kbd>Enter</kbd>落子
              <kbd>U</kbd>悔棋
              <kbd>Esc</kbd>暂停
            </span>
            <span className="gomoku-stage-score" aria-live="polite">
              第 <strong>{game.moves.length}</strong> 手
              <i aria-hidden="true" />
              {elapsedClock}
            </span>
          </div>
        </section>

        <aside className="gomoku-hud" aria-label="对局状态与操作">
          <section className="gomoku-hud-card gomoku-turn-card">
            <div className="gomoku-hud-heading">
              <span>当前回合</span>
              <GomokuIcon size={18} />
            </div>
            <div className="gomoku-turn-line">
              <span className={`gomoku-stone-chip is-${game.current}`} aria-hidden="true" />
              <strong>{turnLabel}</strong>
              {aiThinking ? <em className="gomoku-thinking">AI 思考中</em> : null}
            </div>
            <div className="gomoku-best-line">
              <span>先手</span>
              <b>{firstStoneLabel}</b>
            </div>
          </section>

          <section className="gomoku-hud-card">
            <div className="gomoku-hud-heading">
              <span>本局读数</span>
              <span className="gomoku-hud-tag">LIVE DATA</span>
            </div>
            <div className="gomoku-metrics">
              <div>
                <span>已落子</span>
                <strong>{game.moves.length}</strong>
              </div>
              <div>
                <span>本局用时</span>
                <strong>{elapsedClock}</strong>
              </div>
              <div>
                <span>悔棋</span>
                <strong>{undoUsed}/{GOMOKU_MAX_UNDO}</strong>
              </div>
              <div>
                <span>{mode === "ai" ? "AI 难度" : "对弈模式"}</span>
                <strong>{mode === "ai" ? DIFFICULTY_LABELS[difficulty] : "双人"}</strong>
              </div>
            </div>
          </section>

          <section className="gomoku-hud-card gomoku-record-card">
            <div className="gomoku-hud-heading">
              <span>本地记录</span>
              <span className="gomoku-hud-tag">W · L · D</span>
            </div>
            <div className="gomoku-record-row">
              <span>胜 / 负 / 平</span>
              <strong>{gomokuStat?.wins ?? 0} / {gomokuStat?.losses ?? 0} / {gomokuStat?.draws ?? 0}</strong>
            </div>
            <div className="gomoku-record-row">
              <span>最长连胜</span>
              <strong className={longestStreak > 0 ? "gold" : ""}>
                {longestStreak > 0 ? longestStreak : "—"}
              </strong>
            </div>
          </section>

          <section className="gomoku-hud-card gomoku-control-card">
            <div className="gomoku-hud-heading">
              <span>操作</span>
              <span className="gomoku-hud-tag">KEYBOARD</span>
            </div>
            <div className="gomoku-control-row">
              <span><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd></span>
              <span>移动游标</span>
            </div>
            <div className="gomoku-control-row is-keys">
              <span><kbd>Enter</kbd><kbd>Space</kbd></span>
              <span>落子</span>
            </div>
            <div className="gomoku-control-row is-keys">
              <span><kbd>U</kbd></span>
              <span>悔棋 {undoUsed}/{GOMOKU_MAX_UNDO}</span>
            </div>
          </section>

          <div className="gomoku-hud-actions">
            <button
              className="button button-primary gomoku-hud-primary"
              type="button"
              onClick={handleHudAction}
            >
              {phase === "playing" ? <PauseIcon size={15} /> : <PlayIcon size={14} />}
              {actionLabel}
            </button>
            <button
              className="button gomoku-hud-restart"
              type="button"
              onClick={handleRestart}
              disabled={phase === "ready"}
            >
              <RestartIcon size={15} />
              重开
            </button>
          </div>
          <p className="gomoku-hud-note">
            失焦会自动暂停。中断或返回游戏库不会写入本局成绩。
          </p>
        </aside>
      </div>

      <span className="gomoku-live" aria-live="polite">{liveMessage}</span>
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

function createSessionId(prefix: string): string {
  let randomPart: string;
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const values = new Uint32Array(2);
    globalThis.crypto.getRandomValues(values);
    randomPart = Array.from(values, (value) => value.toString(36)).join("-");
  } else {
    randomPart = `${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`.slice(0, 64);
}
