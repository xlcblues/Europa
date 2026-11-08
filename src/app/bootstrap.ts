import { loadBootstrap, type BootstrapData } from "../services/ipc";

let bootstrapPromise: Promise<BootstrapData> | null = null;

export function loadAppBootstrap(): Promise<BootstrapData> {
  if (!bootstrapPromise) {
    bootstrapPromise = loadBootstrap().catch((error: unknown) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
}

export function resetAppBootstrapForTests(): void {
  bootstrapPromise = null;
}
