import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

import { resetAppBootstrapForTests } from "../app/bootstrap";
import { resetAppStoreForTests } from "../state/appStore";
import { installCanvasContextMock } from "./canvas";
import { installMatchMedia } from "./media";

interface TauriTestWindow extends Window {
  __TAURI_INTERNALS__?: unknown;
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  installMatchMedia(false);
  installCanvasContextMock();
  resetAppBootstrapForTests();
  resetAppStoreForTests();
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.reducedMotion;
  delete (window as TauriTestWindow).__TAURI_INTERNALS__;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  resetAppBootstrapForTests();
  resetAppStoreForTests();
});

