import { sharedAudio, type ToneStep } from "../../services/audio";
export type PlatformerSound =
  | "start"
  | "jump"
  | "crystal"
  | "sentinel"
  | "shoot"
  | "pickup"
  | "checkpoint"
  | "damage"
  | "level-complete"
  | "game-over"
  | "victory"
  | "pause"
  | "resume";

const SOUND_PATTERNS: Record<PlatformerSound, readonly ToneStep[]> = {
  start: [
    { frequency: 392, durationMs: 90, gain: 0.035 },
    { frequency: 587, durationMs: 120, delayMs: 95, gain: 0.04 },
  ],
  jump: [{ frequency: 440, durationMs: 90, gain: 0.03 }],
  crystal: [
    { frequency: 880, durationMs: 60, gain: 0.04 },
    { frequency: 1320, durationMs: 80, delayMs: 45, gain: 0.035 },
  ],
  sentinel: [
    { frequency: 523, durationMs: 70, gain: 0.035 },
    { frequency: 311, durationMs: 90, delayMs: 55, gain: 0.03 },
  ],
  shoot: [{ frequency: 720, durationMs: 55, gain: 0.03, type: "square" }],
  pickup: [
    { frequency: 660, durationMs: 70, gain: 0.035 },
    { frequency: 990, durationMs: 90, delayMs: 60, gain: 0.03 },
  ],
  checkpoint: [
    { frequency: 622, durationMs: 90, gain: 0.04 },
    { frequency: 932, durationMs: 140, delayMs: 80, gain: 0.045 },
  ],
  damage: [
    { frequency: 196, durationMs: 150, gain: 0.04, type: "triangle" },
    { frequency: 110, durationMs: 200, delayMs: 110, gain: 0.03, type: "triangle" },
  ],
  "level-complete": [
    { frequency: 523, durationMs: 100, gain: 0.035 },
    { frequency: 659, durationMs: 100, delayMs: 90, gain: 0.04 },
    { frequency: 784, durationMs: 180, delayMs: 180, gain: 0.045 },
  ],
  "game-over": [
    { frequency: 220, durationMs: 180, gain: 0.035, type: "triangle" },
    { frequency: 146, durationMs: 260, delayMs: 150, gain: 0.025, type: "triangle" },
  ],
  victory: [
    { frequency: 523, durationMs: 120, gain: 0.035 },
    { frequency: 659, durationMs: 120, delayMs: 100, gain: 0.04 },
    { frequency: 784, durationMs: 220, delayMs: 200, gain: 0.045 },
  ],
  pause: [{ frequency: 330, durationMs: 130, gain: 0.025 }],
  resume: [{ frequency: 520, durationMs: 110, gain: 0.03 }],
};

export class PlatformerAudio {
  constructor(enabled: boolean) {
    sharedAudio.setEnabled(enabled);
  }

  setEnabled(enabled: boolean): void {
    sharedAudio.setEnabled(enabled);
  }

  play(sound: PlatformerSound): void {
    sharedAudio.play(SOUND_PATTERNS[sound]);
  }

  close(): void {
    // The shared context belongs to the app-level audio service; a single
    // game must not close it for the rest of the app.
  }
}
