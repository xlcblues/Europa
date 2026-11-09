import { sharedAudio, type ToneStep } from "../../services/audio";
export type SnakeSound = "start" | "eat" | "pause" | "resume" | "game-over" | "victory";

const SOUND_PATTERNS: Record<SnakeSound, readonly ToneStep[]> = {
  start: [
    { frequency: 392, durationMs: 90, gain: 0.035 },
    { frequency: 587, durationMs: 120, delayMs: 95, gain: 0.04 },
  ],
  eat: [
    { frequency: 740, durationMs: 70, gain: 0.045 },
    { frequency: 988, durationMs: 85, delayMs: 48, gain: 0.035 },
  ],
  pause: [{ frequency: 330, durationMs: 130, gain: 0.025 }],
  resume: [{ frequency: 520, durationMs: 110, gain: 0.03 }],
  "game-over": [
    { frequency: 220, durationMs: 180, gain: 0.035, type: "triangle" },
    { frequency: 146, durationMs: 260, delayMs: 150, gain: 0.025, type: "triangle" },
  ],
  victory: [
    { frequency: 523, durationMs: 120, gain: 0.035 },
    { frequency: 659, durationMs: 120, delayMs: 100, gain: 0.04 },
    { frequency: 784, durationMs: 220, delayMs: 200, gain: 0.045 },
  ],
};

export class SnakeAudio {
  constructor(enabled: boolean) {
    sharedAudio.setEnabled(enabled);
  }

  setEnabled(enabled: boolean): void {
    sharedAudio.setEnabled(enabled);
  }

  play(sound: SnakeSound): void {
    sharedAudio.play(SOUND_PATTERNS[sound]);
  }

  close(): void {
    // The shared context belongs to the app-level audio service; a single
    // game must not close it for the rest of the app.
  }
}
