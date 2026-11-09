import type { ReactNode } from "react";
import { InfoIcon, MonitorIcon, MoonIcon, StorageIcon, SunIcon } from "../components/Icons";
import { formatRelativeTime } from "../app/formatters";
import type { ThemeMode } from "../app/theme";
import { useAppStore } from "../state/appStore";

interface SettingsPageProps {
  onThemeChange: (mode: ThemeMode) => void;
  onSoundChange: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
  onReducedMotionChange: (enabled: boolean) => void;
}

const themeOptions: readonly { mode: ThemeMode; label: string; detail: string }[] = [
  { mode: "system", label: "跟随系统", detail: "自动" },
  { mode: "light", label: "浅色", detail: "Ice Paper" },
  { mode: "dark", label: "深色", detail: "Midnight" },
];

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === "system") {
    return <MonitorIcon size={17} />;
  }
  return mode === "light" ? <SunIcon size={17} /> : <MoonIcon size={17} />;
}

function ToggleSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      className={`toggle-switch${checked ? " is-on" : ""}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span aria-hidden="true" />
    </button>
  );
}

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <div className="setting-row">
      <div className="setting-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </div>
      <div className="setting-control">{control}</div>
    </div>
  );
}

function StorageDetails() {
  const schema = useAppStore((state) => state.schema);
  const bootstrapStatus = useAppStore((state) => state.bootstrapStatus);
  const latestSave = useAppStore((state) => state.latestPlatformerSave);
  const isBrowser = schema?.storageMode === "browser";

  if (bootstrapStatus === "loading") {
    return (
      <section className="settings-card storage-card">
        <div className="section-heading compact">
          <div>
            <div className="eyebrow">LOCAL DATA</div>
            <h2>本地存储</h2>
          </div>
          <span className="status-dot status-dot-loading" aria-label="正在读取" />
        </div>
        <div className="storage-loading">正在读取本地数据库状态…</div>
      </section>
    );
  }

  if (bootstrapStatus === "error" || !schema) {
    return (
      <section className="settings-card storage-card">
        <div className="section-heading compact">
          <div>
            <div className="eyebrow">LOCAL DATA</div>
            <h2>本地存储</h2>
          </div>
          <span className="status-dot status-dot-error" aria-label="不可用" />
        </div>
        <div className="storage-problem">
          <InfoIcon size={18} />
          <span>
            <strong>本地数据库暂时不可用</strong>
            <small>应用壳层仍可浏览，设置修改可能无法持久化。</small>
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="settings-card storage-card">
      <div className="section-heading compact">
        <div>
          <div className="eyebrow">LOCAL DATA</div>
          <h2>本地存储</h2>
        </div>
        <span className="status-dot" aria-label={isBrowser ? "浏览器预览" : "存储正常"} />
      </div>

      <div className="storage-mode-row">
        <div className="storage-icon">
          <StorageIcon size={22} />
        </div>
        <div>
          <strong>{isBrowser ? "浏览器预览模式" : "SQLite 本地数据库"}</strong>
          <small>
            {isBrowser ? "仅用于界面预览，不写入桌面数据库" : "WAL 模式 · 参数化写入 · 迁移已启用"}
          </small>
        </div>
        <span className={`status-badge${isBrowser ? " is-muted" : ""}`}>
          {isBrowser ? "Preview" : "Ready"}
        </span>
      </div>

      <div className="storage-data">
        <div>
          <span>Schema</span>
          <strong>{isBrowser ? "—" : `v${schema.version}`}</strong>
        </div>
        <div>
          <span>最近检查点</span>
          <strong>{latestSave ? `第 ${latestSave.levelId} 关` : "暂无"}</strong>
        </div>
        <div>
          <span>检查点更新</span>
          <strong>{latestSave ? formatRelativeTime(latestSave.updatedAt) : "暂无"}</strong>
        </div>
      </div>

      <label className="storage-path-label" htmlFor="storage-path">
        存储位置
      </label>
      <code className="storage-path" id="storage-path">
        {schema.path}
      </code>
      <p className="storage-footnote">
        {isBrowser
          ? "此页面运行在浏览器预览环境。桌面版启动后会自动创建 SQLite 数据库。"
          : "数据库仅保存在当前 Windows 设备。Europa 不上传账号、存档或游玩记录。"}
      </p>
    </section>
  );
}

export function SettingsPage({
  onThemeChange,
  onSoundChange,
  onVolumeChange,
  onReducedMotionChange,
}: SettingsPageProps) {
  const themeMode = useAppStore((state) => state.themeMode);
  const resolvedTheme = useAppStore((state) => state.resolvedTheme);
  const soundEnabled = useAppStore((state) => state.soundEnabled);
  const masterVolume = useAppStore((state) => state.masterVolume);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const persistenceError = useAppStore((state) => state.persistenceError);

  return (
    <div className="page settings-page">
      <header className="page-head">
        <div>
          <div className="eyebrow">PREFERENCES</div>
          <h1>设置</h1>
          <p>让 Europa 适应你的桌面与游玩习惯。</p>
        </div>
        <div className="head-meta">
          <span className="meta-pill">
            <b aria-hidden="true" />
            当前 · {resolvedTheme === "dark" ? "深色" : "浅色"}
          </span>
        </div>
      </header>

      {persistenceError ? (
        <div className="inline-notice" role="alert">
          <InfoIcon size={17} />
          <span>{persistenceError}</span>
        </div>
      ) : null}

      <div className="settings-layout">
        <section className="settings-card appearance-card">
          <div className="section-heading compact">
            <div>
              <div className="eyebrow">APPEARANCE</div>
              <h2>外观</h2>
            </div>
            <span className="section-note">即时生效</span>
          </div>

          <div className="theme-field">
            <div className="theme-field-copy">
              <strong>主题模式</strong>
              <small>跟随系统会在 Windows 主题变化时自动切换。</small>
            </div>
            <div className="segmented-control" role="radiogroup" aria-label="主题模式">
              {themeOptions.map((option) => {
                const selected = themeMode === option.mode;
                return (
                  <button
                    key={option.mode}
                    className={`segment${selected ? " is-selected" : ""}`}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onThemeChange(option.mode)}
                  >
                    <ThemeIcon mode={option.mode} />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.detail}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <SettingRow
            title="额外减少动态效果"
            description="关闭卡片位移、缩放与装饰动画；Windows 系统减少动态效果偏好始终生效。"
            control={
              <ToggleSwitch
                checked={reducedMotion}
                label="额外减少动态效果"
                onChange={onReducedMotionChange}
              />
            }
          />
        </section>

        <div className="settings-stack">
          <section className="settings-card sound-card">
            <div className="section-heading compact">
              <div>
                <div className="eyebrow">AUDIO</div>
                <h2>声音</h2>
              </div>
              <span className={`status-badge${soundEnabled ? "" : " is-muted"}`}>
                {soundEnabled ? "On" : "Off"}
              </span>
            </div>
            <SettingRow
              title="游戏音效"
              description="三款游戏统一读取此开关。关闭后立即静音。"
              control={
                <ToggleSwitch checked={soundEnabled} label="游戏音效" onChange={onSoundChange} />
              }
            />
            <SettingRow
              title="主音量"
              description="三款游戏共享同一音量；窗口失焦或游戏暂停时自动静音。"
              control={
                <div className="volume-control">
                  <input
                    className="volume-slider"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round(masterVolume * 100)}
                    aria-label="主音量"
                    onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
                  />
                  <span className="volume-value">{Math.round(masterVolume * 100)}%</span>
                </div>
              }
            />
          </section>

          <StorageDetails />
        </div>
      </div>

      <footer className="settings-footer">
        <span>EUROPA · com.europa.desktop</span>
        <span>离线优先 · 不上传本地数据</span>
      </footer>
    </div>
  );
}
