export interface ToneStep {
  frequency: number;
  durationMs: number;
  delayMs?: number;
  gain?: number;
  type?: OscillatorType;
}

type AudioContextConstructor = new () => AudioContext;

export function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) {
    return 1;
  }
  return Math.min(1, Math.max(0, volume));
}

/**
 * App-wide shared audio service. All games schedule short procedural tones
 * through this single AudioContext so volume, mute and pause stay consistent
 * and no duplicate audio contexts are created.
 */
class SharedAudioService {
  private context: AudioContext | null = null;
  private enabled = true;
  private masterVolume = 0.8;
  private suspended = false;

  isEnabled(): boolean {
    return this.enabled;
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.suspend();
    } else if (!this.suspended) {
      this.resume();
    }
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = clampVolume(volume);
  }

  suspend(): void {
    this.suspended = true;
    if (this.context && this.context.state === "running") {
      void this.context.suspend().catch(() => undefined);
    }
  }

  resume(): void {
    this.suspended = false;
    if (this.context && this.context.state === "suspended") {
      void this.context.resume().catch(() => undefined);
    }
  }

  play(tones: readonly ToneStep[]): void {
    if (!this.enabled || this.suspended) {
      return;
    }

    const context = this.ensureContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume().catch(() => undefined);
    }

    for (const step of tones) {
      const startAt = context.currentTime + (step.delayMs ?? 0) / 1000;
      const endAt = startAt + step.durationMs / 1000;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = step.type ?? "sine";
      oscillator.frequency.setValueAtTime(step.frequency, startAt);
      const peak = Math.max(0.0001, (step.gain ?? 0.03) * this.masterVolume);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(startAt);
      oscillator.stop(endAt + 0.01);
    }
  }

  close(): void {
    if (this.context && this.context.state !== "closed") {
      void this.context.close().catch(() => undefined);
    }
    this.context = null;
  }

  resetForTests(): void {
    this.close();
    this.enabled = true;
    this.masterVolume = 0.8;
    this.suspended = false;
  }

  private ensureContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass =
      window.AudioContext
      ?? (window as Window & { webkitAudioContext?: AudioContextConstructor })
        .webkitAudioContext;
    if (!AudioContextClass) {
      return null;
    }

    try {
      this.context = new AudioContextClass();
      return this.context;
    } catch {
      return null;
    }
  }
}

export const sharedAudio = new SharedAudioService();

/**
 * Pause strategy: suspend the shared context on window blur or page hide so
 * game sounds never leak into the background; resume on focus or show.
 * Returns an unsubscribe function for tests and teardown.
 */
export function installAudioPauseStrategy(): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onVisibilityChange = (): void => {
    if (document.hidden) {
      sharedAudio.suspend();
    } else {
      sharedAudio.resume();
    }
  };
  const onBlur = (): void => sharedAudio.suspend();
  const onFocus = (): void => sharedAudio.resume();

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("blur", onBlur);
  window.addEventListener("focus", onFocus);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("blur", onBlur);
    window.removeEventListener("focus", onFocus);
  };
}
