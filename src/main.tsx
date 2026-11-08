import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import { loadAppBootstrap } from "./app/bootstrap";
import { applyResolvedTheme, cacheThemeMode, resolveTheme } from "./app/theme";
import { isTauriEnvironment } from "./services/ipc";
import { useAppStore } from "./state/appStore";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/shell.css";

const initialTheme = resolveTheme(useAppStore.getState().themeMode);
useAppStore.getState().setResolvedTheme(initialTheme);
applyResolvedTheme(initialTheme);

const runtime = isTauriEnvironment() ? "desktop" : "browser";
document.documentElement.dataset.runtime = runtime;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

void loadAppBootstrap()
  .then((data) => {
    const store = useAppStore.getState();
    store.hydrate(data);
    const hydratedTheme = resolveTheme(useAppStore.getState().themeMode);
    useAppStore.getState().setResolvedTheme(hydratedTheme);
    applyResolvedTheme(hydratedTheme);
    cacheThemeMode(useAppStore.getState().themeMode);
  })
  .catch(() => {
    useAppStore.getState().setBootstrapError("本地数据加载失败，应用已进入只读预览状态。");
  });
