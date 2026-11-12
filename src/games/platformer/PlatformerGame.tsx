import { useEffect, useRef, useState } from "react";

import { formatScore, getGameStat } from "../../app/formatters";
import { PauseIcon, PlayIcon, PlatformIcon, RestartIcon } from "../../components/Icons";
import {
  clearPlatformerCheckpoint,
  savePlatformerCheckpoint,
  submitPlatformerMatch,
  type PlatformerMatchSubmissionResult,
} from "../../services/ipc";
import { useAppStore } from "../../state/appStore";
import {
  createInitialPlatformerContext,
  createLevelContext,
  createPlatformerInput,
  createPlatformerRunResult,
  createPlatformerSave,
  createPlatformerSessionId,
  createPlatformerWorld,
  restartAtCheckpoint,
  restorePlatformerWorld,
  stepPlatformer,
} from "./platformerEngine";
import { getPlatformerLevel } from "./platformerLevels";
import { PLATFORMER_SAVE_SLOT, PLATFORMER_STEP_MS, PLATFORMER_TOTAL_LEVELS } from "./platformerTypes";
import type {
  PlatformerEvent,
  PlatformerInput,
  PlatformerPhase,
  PlatformerRunResult,
  PlatformerSubmissionStatus,
  PlatformerWorld,
} from "./platformerTypes";
import { PlatformerAudio } from "./platformerAudio";
import { PlatformerCanvas } from "./PlatformerCanvas";
import { PlatformerOverlays } from "./PlatformerOverlays";
import "./platformer.css";

interface PlatformerGameProps {
  onBack: () => void;
}

const INTRO_MS = 1_200;

const PHASE_LABELS: Record<PlatformerPhase, string> = {
  ready: "待开始",
  level_intro: "关卡简报",
  playing: "运行中",
  paused: "已暂停",
  level_complete: "本关完成",
  game_over: "远征结束",
  victory: "远征胜利",
  result: "本局结束",
};

export function PlatformerGame({ onBack }: PlatformerGameProps) {
  const [world, setWorld] = useState<PlatformerWorld | null>(null);
  const [phase, setPhaseState] = useState<PlatformerPhase>("ready");
  const [result, setResult] = useState<PlatformerRunResult | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<PlatformerSubmissionStatus>("idle");

  const worldRef = useRef<PlatformerWorld | null>(null);
  const phaseRef = useRef<PlatformerPhase>("ready");
  const resultRef = useRef<PlatformerRunResult | null>(null);
  const inputRef = useRef<PlatformerInput>(createPlatformerInput());
  const introTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const accumulatorRef = useRef(0);
  const submittingSessionsRef = useRef(new Set<string>());
  const aliveRef = useRef(true);
  const audioRef = useRef<PlatformerAudio | null>(null);

  const soundEnabled = useAppStore((store) => store.soundEnabled);
  const reducedMotion = useAppStore((store) => store.reducedMotion);
  const gameStats = useAppStore((store) => store.gameStats);
  const latestSave = useAppStore((store) => store.latestPlatformerSave);
  const platformerStat = getGameStat(gameStats, "platformer");
  const bestScore = Math.max(0, platformerStat?.bestScore ?? 0);

  const currentLevel = world ? getPlatformerLevel(world.levelIndex) : null;
  const nextLevelIndex = world ? world.levelIndex + 1 : 0;
  const nextLevelName =
    nextLevelIndex < PLATFORMER_TOTAL_LEVELS ? getPlatformerLevel(nextLevelIndex).name : null;
  const crystalsCollected = world && currentLevel
    ? currentLevel.crystals.filter((crystal) => world.collectedItemIds.includes(crystal.id)).length
    : 0;
  const hasSave = Boolean(latestSave);
  const saveLevel = latestSave?.levelId ?? null;
  const elapsedClock = formatClock(
    phase === "result" ? result?.durationMs ?? 0 : world?.totalDurationMs ?? 0,
  );
  const actionLabel = phase === "playing"
    ? "暂停游戏"
    : phase === "paused"
      ? "继续游戏"
      : phase === "result"
        ? "新的远征"
        : "开始远征";

  function setPhase(nextPhase: PlatformerPhase): void {
    phaseRef.current = nextPhase;
    setPhaseState(nextPhase);
  }

  function updateWorld(nextWorld: PlatformerWorld): void {
    worldRef.current = nextWorld;
    setWorld(nextWorld);
  }

  function getAudio(): PlatformerAudio {
    if (!audioRef.current) {
      audioRef.current = new PlatformerAudio(soundEnabled);
    }
    audioRef.current.setEnabled(soundEnabled);
    return audioRef.current;
  }

  function clearIntroTimer(): void {
    if (introTimerRef.current !== null) {
      window.clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    }
  }

  function stopLoop(): void {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function startLoop(): void {
    stopLoop();
    lastFrameTimeRef.current = performance.now();
    accumulatorRef.current = 0;
    rafRef.current = requestAnimationFrame(loopFrame);
  }

  function loopFrame(now: number): void {
    if (phaseRef.current !== "playing") {
      stopLoop();
      return;
    }
    const delta = Math.min(100, Math.max(0, now - lastFrameTimeRef.current));
    lastFrameTimeRef.current = now;
    accumulatorRef.current += delta;
    while (accumulatorRef.current >= PLATFORMER_STEP_MS) {
      accumulatorRef.current -= PLATFORMER_STEP_MS;
      stepOnce();
      if (phaseRef.current !== "playing") {
        accumulatorRef.current = 0;
        break;
      }
    }
    if (phaseRef.current === "playing") {
      rafRef.current = requestAnimationFrame(loopFrame);
    }
  }

  function stepOnce(): void {
    const currentWorld = worldRef.current;
    if (!currentWorld || currentWorld.status !== "playing") {
      return;
    }
    const stepResult = stepPlatformer(currentWorld, inputRef.current);
    updateWorld(stepResult.world);
    for (const event of stepResult.events) {
      handleEvent(event);
    }
    inputRef.current.jumpPressed = false;
    inputRef.current.downPressed = false;
    inputRef.current.firePressed = false;
  }

  function handleEvent(event: PlatformerEvent): void {
    switch (event.type) {
      case "jump":
        getAudio().play("jump");
        break;
      case "crystal":
        getAudio().play("crystal");
        break;
      case "sentinel_stomped":
        getAudio().play("sentinel");
        break;
      case "checkpoint":
        getAudio().play("checkpoint");
        saveCheckpoint();
        break;
      case "damage":
        getAudio().play("damage");
        saveCheckpoint();
        break;
      case "level_complete": {
        const currentWorld = worldRef.current;
        if (currentWorld?.status === "level_complete") {
          getAudio().play("level-complete");
          clearSave();
          setPhase("level_complete");
          stopLoop();
        }
        break;
      }
      case "victory":
        getAudio().play("victory");
        clearSave();
        setPhase("victory");
        stopLoop();
        break;
      case "game_over":
        getAudio().play("game-over");
        clearSave();
        setPhase("game_over");
        stopLoop();
        break;
      case "sentinel_shot":
        getAudio().play("sentinel");
        break;
      case "shot_fired":
        getAudio().play("shoot");
        break;
      case "weapon_pickup":
        getAudio().play("pickup");
        break;
      case "projectile_hit":
        if (event.source === "enemy") {
          getAudio().play("damage");
        }
        break;
      default:
        break;
    }
  }

  function saveCheckpoint(): void {
    const currentWorld = worldRef.current;
    if (!currentWorld || currentWorld.status !== "playing") {
      return;
    }
    try {
      const record = createPlatformerSave(currentWorld);
      void savePlatformerCheckpoint(record)
        .then((saved) => {
          if (aliveRef.current) {
            useAppStore.getState().setLatestPlatformerSave(saved);
          }
        })
        .catch(() => undefined);
    } catch {
      // 状态不在进行中时跳过存档
    }
  }

  function clearSave(): void {
    void clearPlatformerCheckpoint(PLATFORMER_SAVE_SLOT).catch(() => undefined);
    useAppStore.getState().clearLatestPlatformerSave();
  }

  function startRun(mode: "continue" | "new"): void {
    clearIntroTimer();
    stopLoop();
    resultRef.current = null;
    setResult(null);
    setSubmissionStatus("idle");

    const store = useAppStore.getState();
    let nextWorld: PlatformerWorld;
    if (mode === "continue" && store.latestPlatformerSave) {
      try {
        nextWorld = restorePlatformerWorld(store.latestPlatformerSave);
      } catch {
        nextWorld = createPlatformerWorld(
          createInitialPlatformerContext(createPlatformerSessionId()),
          0,
        );
      }
    } else {
      if (mode === "new") {
        void clearPlatformerCheckpoint(PLATFORMER_SAVE_SLOT).catch(() => undefined);
        store.clearLatestPlatformerSave();
      }
      nextWorld = createPlatformerWorld(
        createInitialPlatformerContext(createPlatformerSessionId()),
        0,
      );
    }

    inputRef.current = createPlatformerInput(nextWorld.assisted);
    updateWorld(nextWorld);
    getAudio().play("start");
    setPhase("level_intro");
    scheduleIntro();
  }

  function scheduleIntro(): void {
    clearIntroTimer();
    introTimerRef.current = window.setTimeout(() => {
      introTimerRef.current = null;
      if (phaseRef.current !== "level_intro") {
        return;
      }
      setPhase("playing");
      saveCheckpoint();
      startLoop();
    }, INTRO_MS);
  }

  function continueToNextLevel(): void {
    const currentWorld = worldRef.current;
    if (!currentWorld || currentWorld.status !== "level_complete") {
      return;
    }
    const nextLevelIndexValue = currentWorld.levelIndex + 1;
    if (nextLevelIndexValue >= PLATFORMER_TOTAL_LEVELS) {
      return;
    }
    const nextWorld = createPlatformerWorld(
      createLevelContext(currentWorld),
      nextLevelIndexValue,
    );
    inputRef.current = createPlatformerInput(nextWorld.assisted);
    updateWorld(nextWorld);
    setPhase("level_intro");
    scheduleIntro();
  }

  function restartAtCheckpointAction(): void {
    const currentWorld = worldRef.current;
    if (!currentWorld) {
      return;
    }
    const nextWorld = restartAtCheckpoint(currentWorld);
    updateWorld(nextWorld);
    saveCheckpoint();
    getAudio().play("resume");
  }

  function pauseGame(): void {
    if (phaseRef.current !== "playing") {
      return;
    }
    stopLoop();
    setPhase("paused");
    inputRef.current.jumpPressed = false;
    inputRef.current.downPressed = false;
    inputRef.current.firePressed = false;
    getAudio().play("pause");
    saveCheckpoint();
  }

  function resumeGame(): void {
    if (phaseRef.current !== "paused") {
      return;
    }
    setPhase("playing");
    getAudio().play("resume");
    startLoop();
  }

  function handleAutoPause(): void {
    inputRef.current = createPlatformerInput(worldRef.current?.assisted ?? false);
    if (phaseRef.current === "playing") {
      pauseGame();
    }
  }

  function confirmEnd(): void {
    const currentWorld = worldRef.current;
    if (!currentWorld) {
      return;
    }
    const runResult = createPlatformerRunResult(currentWorld);
    resultRef.current = runResult;
    setResult(runResult);
    setSubmissionStatus("idle");
    setPhase("result");
    void submitResult(runResult);
  }

  async function submitResult(runResult: PlatformerRunResult): Promise<void> {
    if (submittingSessionsRef.current.has(runResult.sessionId)) {
      return;
    }

    submittingSessionsRef.current.add(runResult.sessionId);
    if (aliveRef.current && resultRef.current?.sessionId === runResult.sessionId) {
      setSubmissionStatus("saving");
    }

    try {
      const response: PlatformerMatchSubmissionResult = await submitPlatformerMatch(
        runResult.submission,
      );
      useAppStore.getState().mergeGameStat(response.stat);
      if (aliveRef.current && resultRef.current?.sessionId === runResult.sessionId) {
        setSubmissionStatus("saved");
      }
    } catch {
      if (aliveRef.current && resultRef.current?.sessionId === runResult.sessionId) {
        setSubmissionStatus("failed");
      }
    } finally {
      submittingSessionsRef.current.delete(runResult.sessionId);
    }
  }

  function retrySubmit(): void {
    const currentResult = resultRef.current;
    if (currentResult && !submittingSessionsRef.current.has(currentResult.sessionId)) {
      void submitResult(currentResult);
    }
  }

  function handleHudAction(): void {
    const currentPhase = phaseRef.current;
    if (currentPhase === "playing") {
      pauseGame();
      return;
    }
    if (currentPhase === "paused") {
      resumeGame();
      return;
    }
    if (currentPhase === "ready") {
      startRun(latestSave ? "continue" : "new");
      return;
    }
    if (currentPhase === "result") {
      startRun("new");
    }
  }

  function handleMovementKeyDown(event: KeyboardEvent, input: PlatformerInput): void {
    switch (event.code) {
      case "KeyA":
      case "ArrowLeft":
        event.preventDefault();
        input.left = true;
        break;
      case "KeyD":
      case "ArrowRight":
        event.preventDefault();
        input.right = true;
        break;
      case "KeyW":
      case "ArrowUp":
      case "Space":
        event.preventDefault();
        input.jumpHeld = true;
        if (!event.repeat) {
          input.jumpPressed = true;
        }
        break;
      case "KeyS":
      case "ArrowDown":
        event.preventDefault();
        if (!event.repeat) {
          input.downPressed = true;
        }
        break;
      case "KeyJ":
      case "KeyX":
        event.preventDefault();
        if (!event.repeat) {
          input.firePressed = true;
        }
        break;
      default:
        break;
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
      clearIntroTimer();
      stopLoop();
      const currentPhase = phaseRef.current;
      if ((currentPhase === "playing" || currentPhase === "paused") && worldRef.current) {
        saveCheckpoint();
      }
      audioRef.current?.close();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isInteractiveTarget(event.target)) {
        return;
      }

      const currentPhase = phaseRef.current;
      const input = inputRef.current;

      if (currentPhase === "playing") {
        handleMovementKeyDown(event, input);
        if (event.code === "Escape") {
          event.preventDefault();
          if (!event.repeat) {
            pauseGame();
          }
        } else if (event.code === "KeyR") {
          event.preventDefault();
          if (!event.repeat) {
            restartAtCheckpointAction();
          }
        }
        return;
      }

      if (event.code === "Enter" || event.code === "Space") {
        event.preventDefault();
        if (event.repeat) {
          return;
        }
        if (currentPhase === "ready") {
          startRun(useAppStore.getState().latestPlatformerSave ? "continue" : "new");
        } else if (currentPhase === "level_complete") {
          continueToNextLevel();
        } else if (currentPhase === "game_over" || currentPhase === "victory") {
          confirmEnd();
        } else if (currentPhase === "result") {
          startRun("new");
        } else if (currentPhase === "paused") {
          resumeGame();
        }
        return;
      }

      if (currentPhase === "paused") {
        if (event.code === "Escape") {
          event.preventDefault();
          if (!event.repeat) {
            resumeGame();
          }
        } else if (event.code === "KeyR") {
          event.preventDefault();
          if (!event.repeat) {
            restartAtCheckpointAction();
          }
        }
        return;
      }

      if (event.code === "KeyR") {
        event.preventDefault();
        if (!event.repeat) {
          restartAtCheckpointAction();
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const input = inputRef.current;
      switch (event.code) {
        case "KeyA":
        case "ArrowLeft":
          input.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          input.right = false;
          break;
        case "KeyW":
        case "ArrowUp":
        case "Space":
          input.jumpHeld = false;
          input.jumpPressed = false;
          break;
        case "KeyS":
        case "ArrowDown":
          input.downPressed = false;
          break;
        case "KeyJ":
        case "KeyX":
          input.firePressed = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
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

  return (
    <div className="game-page platformer-page">
      <header className="game-page-head platformer-page-head">
        <div>
          <div className="eyebrow">01 / PLATFORMER · MILESTONE M3</div>
          <h1>冰原跃迁</h1>
          <p>沿 Europa 冰脊跃迁，收集轨道冰晶，点亮三座信标。</p>
        </div>
        <div className="platformer-head-meta">
          <span className={`platformer-phase-pill is-${phase}`}>
            <i aria-hidden="true" />
            {PHASE_LABELS[phase]}
          </span>
          <span className="platformer-mode-label">3 关 · 检查点存档</span>
        </div>
      </header>

      <div className="platformer-layout">
        <section className="platformer-stage-panel" aria-label="冰原跃迁游戏舞台">
          <div className="platformer-stage-bar">
            <span className="platformer-stage-code">EUROPA · SECTOR 01</span>
            <div>
              <span className="platformer-signal" aria-hidden="true"><i /><i /><i /></span>
              <span>{soundEnabled ? "音效开启" : "静音模式"}</span>
            </div>
          </div>

          <div className="platformer-board-shell">
            {world ? (
              <PlatformerCanvas
                world={world}
                reducedMotion={reducedMotion}
                ariaLabel={canvasLabel(phase)}
              />
            ) : null}
            <PlatformerOverlays
              phase={phase}
              currentLevel={currentLevel}
              nextLevelName={nextLevelName}
              hasSave={hasSave}
              saveLevel={saveLevel}
              score={world?.score ?? 0}
              lives={world?.lives ?? 0}
              levelIndex={world?.levelIndex ?? 0}
              result={result}
              submissionStatus={submissionStatus}
              onStart={startRun}
              onResume={resumeGame}
              onRestartCheckpoint={restartAtCheckpointAction}
              onNextLevel={continueToNextLevel}
              onConfirmEnd={confirmEnd}
              onNewRun={() => startRun("new")}
              onBack={onBack}
              onRetrySubmit={retrySubmit}
            />
          </div>

          <div className="platformer-stage-footer">
            <span className="platformer-controls-inline">
              <kbd>A / D</kbd><kbd>← →</kbd>移动
              <kbd>Space</kbd>跳跃
              <kbd>J / X</kbd>射击
              <kbd>Esc</kbd>暂停
            </span>
            <span className="platformer-stage-score" aria-live="polite">
              本局 <strong>{formatScore(world?.score ?? 0)}</strong>
              <i aria-hidden="true" />
              {elapsedClock}
            </span>
          </div>
        </section>

        <aside className="platformer-hud" aria-label="对局状态与操作">
          <section className="platformer-hud-card platformer-score-card">
            <div className="platformer-hud-heading">
              <span>当前分数</span>
              <PlatformIcon size={18} />
            </div>
            <strong className="platformer-current-score" aria-live="polite">
              {formatScore(world?.score ?? 0)}
            </strong>
            <div className="platformer-best-line">
              <span>本机最高</span>
              <b>{bestScore > 0 ? formatScore(bestScore) : "—"}</b>
            </div>
          </section>

          <section className="platformer-hud-card">
            <div className="platformer-hud-heading">
              <span>远征读数</span>
              <span className="platformer-hud-tag">LIVE DATA</span>
            </div>
            <div className="platformer-metrics">
              <div>
                <span>剩余生命</span>
                <strong>{world?.lives ?? 0}</strong>
              </div>
              <div>
                <span>关卡进度</span>
                <strong>{world ? `${world.levelIndex + 1}/${PLATFORMER_TOTAL_LEVELS}` : "—"}</strong>
              </div>
              <div>
                <span>本关冰晶</span>
                <strong>
                  {world && currentLevel
                    ? `${crystalsCollected}/${currentLevel.crystals.length}`
                    : "—"}
                </strong>
              </div>
              <div>
                <span>敌人击退</span>
                <strong>{world?.defeatedSentinelIds.length ?? 0}</strong>
              </div>
              <div>
                <span>等离子弹药</span>
                <strong>{world ? world.weapon.ammo + "/" + world.weapon.maxAmmo : "—"}</strong>
              </div>
            </div>
          </section>

          <section className="platformer-hud-card platformer-control-card">
            <div className="platformer-hud-heading">
              <span>操作</span>
              <span className="platformer-hud-tag">KEYBOARD</span>
            </div>
            <div className="platformer-control-row">
              <span className="platformer-key-cluster" aria-hidden="true">
                <kbd>A</kbd><kbd>D</kbd>
              </span>
              <span>移动 · 方向键同样可用</span>
            </div>
            <div className="platformer-control-row is-keys">
              <span><kbd>Space</kbd><kbd>W</kbd><kbd>↑</kbd></span>
              <span>跳跃</span>
            </div>
            <div className="platformer-control-row is-keys">
              <span><kbd>S</kbd><kbd>↓</kbd></span>
              <span>下穿冰台</span>
            </div>
            <div className="platformer-control-row is-keys">
              <span><kbd>J</kbd><kbd>X</kbd></span>
              <span>射击（等离子炮）</span>
            </div>
            <div className="platformer-control-row is-keys">
              <span><kbd>Esc</kbd><kbd>R</kbd></span>
              <span>暂停 / 返回检查点</span>
            </div>
          </section>

          <div className="platformer-hud-actions">
            <button
              className="button button-primary platformer-hud-primary"
              type="button"
              onClick={handleHudAction}
              disabled={phase === "level_intro"}
            >
              {phase === "playing" ? <PauseIcon size={15} /> : <PlayIcon size={14} />}
              {actionLabel}
            </button>
            <button
              className="button platformer-hud-restart"
              type="button"
              onClick={() => startRun("new")}
              disabled={phase === "ready" || phase === "level_intro"}
            >
              <RestartIcon size={15} />
              重开
            </button>
          </div>
          <p className="platformer-hud-note">
            失焦自动暂停；检查点与暂停状态会写入本地存档。中断或返回游戏库不会提交本局成绩。
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

function canvasLabel(phase: PlatformerPhase): string {
  switch (phase) {
    case "ready":
      return "冰原跃迁 · 等待开始";
    case "level_intro":
      return "冰原跃迁 · 关卡简报";
    case "playing":
      return "冰原跃迁 · 对局进行中";
    case "paused":
      return "冰原跃迁 · 对局已暂停";
    case "level_complete":
      return "冰原跃迁 · 本关完成";
    case "game_over":
      return "冰原跃迁 · 远征结束";
    case "victory":
      return "冰原跃迁 · 远征胜利";
    case "result":
      return "冰原跃迁 · 本局结束";
  }
}

function formatClock(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}