import { sharedAudio, type ToneStep } from "../../services/audio";
import type { GomokuSound } from "./gomokuTypes";

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
  constructor(enabled: boolean) {
    sharedAudio.setEnabled(enabled);
  }

  setEnabled(enabled: boolean): void {
    sharedAudio.setEnabled(enabled);
  }

  play(sound: GomokuSound): void {
    sharedAudio.play(SOUND_PATTERNS[sound]);
  }

  close(): void {
    // The shared context belongs to the app-level audio service; a single
    // game must not close it for the rest of the app.
  }
}
