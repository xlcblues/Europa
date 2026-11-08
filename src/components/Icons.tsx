import type { ReactNode, SVGProps } from "react";

import type { GameId } from "../services/gameCatalog";

type IconProps = Omit<SVGProps<SVGSVGElement>, "viewBox"> & {
  size?: number;
};

function IconFrame({
  size = 18,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LibraryIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </IconFrame>
  );
}

export function RecordsIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="M4 18V9M9 18V5M14 18v-6M19 18V8" />
      <path d="M3 20h18" />
    </IconFrame>
  );
}

export function SettingsIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.38 1.1V21H9.6v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.38H3V9.6h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .38-1.1V3h3.24v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.28.31.75.5 1.1.5H21v3.24h-.09A1.7 1.7 0 0 0 19.4 15Z" />
    </IconFrame>
  );
}

export function PlatformIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="M4 18h6v-3H7v-3H4" />
      <path d="M10 12h5v-3h5" />
      <circle cx="8" cy="8" r="2" />
    </IconFrame>
  );
}

export function SnakeIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="M4 17c4-1 4-9 8-8 3 .7 4-3 8-4" />
      <circle cx="4" cy="17" r="1.5" />
      <circle cx="20" cy="5" r="1.5" />
    </IconFrame>
  );
}

export function GomokuIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16M7 4v16M12 4v16M17 4v16" />
      <circle cx="7" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="7" r="1.7" />
    </IconFrame>
  );
}

export function ArrowLeftIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="m14.5 5-7 7 7 7" />
      <path d="M8 12h11" />
    </IconFrame>
  );
}

export function PlayIcon({ size, ...props }: IconProps) {
  return (
    <svg
      width={size ?? 14}
      height={size ?? 14}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M5 3.4v9.2l7.7-4.6L5 3.4Z" />
    </svg>
  );
}

export function PauseIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="M8 6v12M16 6v12" strokeWidth="2.2" />
    </IconFrame>
  );
}

export function RestartIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="M5.2 9.4A7.2 7.2 0 1 1 5 14.6" />
      <path d="M4.5 5.2v4.6h4.4" />
    </IconFrame>
  );
}

export function TrophyIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="M8 4.5h8v5.2a4 4 0 0 1-8 0V4.5Z" />
      <path d="M8 6H5.3v1.4A3.2 3.2 0 0 0 8.5 10M16 6h2.7v1.4A3.2 3.2 0 0 1 15.5 10M12 13.7V17M8.5 20h7" />
    </IconFrame>
  );
}

export function SunIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.7v2.2M12 19.1v2.2M2.7 12h2.2M19.1 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
    </IconFrame>
  );
}

export function MoonIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="M20 15.3A8.5 8.5 0 0 1 8.7 4a8.5 8.5 0 1 0 11.3 11.3Z" />
    </IconFrame>
  );
}

export function SoundOnIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="M11 5 6.8 8.4H3.8v7.2h3L11 19V5Z" />
      <path d="M14.7 9.2a4 4 0 0 1 0 5.6M17.4 6.8a7.4 7.4 0 0 1 0 10.4" />
    </IconFrame>
  );
}

export function SoundOffIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="M11 5 6.8 8.4H3.8v7.2h3L11 19V5Z" />
      <path d="m15 9 5 5M20 9l-5 5" />
    </IconFrame>
  );
}

export function StorageIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <ellipse cx="12" cy="6.2" rx="7.5" ry="3.2" />
      <path d="M4.5 6.2v5.4c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2V6.2" />
      <path d="M4.5 11.6v5.2c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2v-5.2" />
    </IconFrame>
  );
}

export function SparkIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="m12 3 1.5 4.2L18 9l-4.5 1.8L12 15l-1.5-4.2L6 9l4.5-1.8L12 3Z" />
      <circle cx="19" cy="17" r="1.3" />
    </IconFrame>
  );
}

export function MonitorIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <rect x="3.5" y="4" width="17" height="12.5" rx="2" />
      <path d="M8 20h8M12 16.5V20" />
    </IconFrame>
  );
}

export function CheckIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="m4.5 12.2 4.8 4.8L19.5 6.8" />
    </IconFrame>
  );
}

export function ChevronRightIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <path d="m9 5 7 7-7 7" />
    </IconFrame>
  );
}

export function InfoIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 10.8v5.4M12 7.8h.01" />
    </IconFrame>
  );
}

export function MinimizeIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} strokeWidth="1" {...props}>
      <path d="M5 12h14" />
    </IconFrame>
  );
}

export function MaximizeIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} strokeWidth="1" {...props}>
      <rect x="5.4" y="5.4" width="13.2" height="13.2" />
    </IconFrame>
  );
}

export function RestoreIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} strokeWidth="1" {...props}>
      <path d="M8 8V5h11v11h-3" />
      <rect x="5" y="8" width="11" height="11" />
    </IconFrame>
  );
}

export function CloseIcon({ size, ...props }: IconProps) {
  return (
    <IconFrame size={size} strokeWidth="1" {...props}>
      <path d="m5.5 5.5 13 13M18.5 5.5l-13 13" />
    </IconFrame>
  );
}


export function GameGlyph({ gameId, size = 18 }: { gameId: GameId; size?: number }) {
  if (gameId === "platformer") {
    return <PlatformIcon size={size} />;
  }
  if (gameId === "snake") {
    return <SnakeIcon size={size} />;
  }
  return <GomokuIcon size={size} />;
}

