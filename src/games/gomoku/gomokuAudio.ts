import type { GomokuSound } from "./gomokuTypes";

type AudioContextConstructor = new () => AudioContext;

interface ToneStep {
  frequency: number;
  durationMs: number;
  delayMs?: number;
  gain?: number;
  type?: OscillatorType;
}

const SOUND_PATTERNS: Record<GomokuSound, readonly ToneStep[]> = {
  start: [
    { frequency: 392, durationMs: 90, gain: 0.035 },
    { frequency: 587, durationMs: 120, delayMs: 95, gain: 0.04 },
  ],
  place: [
    { frequency: 660, durationMs: 70, gain: 0.032 },
    { frequency: 880, durationMs: 90, delayMs: 42, gain: 0.024 },
  ],
  undo: [
    { frequency: 494, durationMs: 90, gain: 0.03 },
    { frequency: 330, durationMs: 110, delayMs: 55, gain: 0.026 },
  ],
  win: [
    { frequency: 523, durationMs: 120, gain: 0.035 },
    { frequency: 659, durationMs: 120, delayMs: 100, gain: 0.04 },
    { frequency: 784, durationMs: 220, delayMs: 200, gain: 0.045 },
  ],
  lose: [
    { frequency: 220, durationMs: 180, gain: 0.035, type: "triangle" },
    { frequency: 146, durationMs: 260, delayMs: 150, gain: 0.025, type: "triangle" },
  ],
  draw: [
    { frequency: 330, durationMs: 120, gain: 0.03 },
    { frequency: 392, durationMs: 120, delayMs: 110, gain: 0.03 },
    { frequency: 330, durationMs: 180, delayMs: 220, gain: 0.026 },
  ],
  pause: [{ frequency: 330, durationMs: 130, gain: 0.025 }],
  resume: [{ frequency: 520, durationMs: 110, gain: 0.03 }],
  think: [
    { frequency: 494, durationMs: 55, gain: 0.02 },
    { frequency: 587, durationMs: 55, delayMs: 65, gain: 0.02 },
  ],
};

export class GomokuAudio {
  private context: AudioContext | null = null;
  private enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  play(sound: GomokuSound): void {
    if (!this.enabled) {
      return;
    }

    const context = this.ensureContext();
    if (!context) {
      return;
    }

    if (context.state === "suspended") {
      void context.resume().catch(() => undefined);
    }

    for (const step of SOUND_PATTERNS[sound]) {
      const startAt = context.currentTime + (step.delayMs ?? 0) / 1000;
      const endAt = startAt + step.durationMs / 1000;
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = step.type ?? "sine";
      oscillator.frequency.setValueAtTime(step.frequency, startAt);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, step.gain ?? 0.03), startAt + 0.012);
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

  private ensureContext(): AudioContext | null {
    if (this.context) {
      return this.context;
    }
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextClass = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
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
