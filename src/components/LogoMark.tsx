interface LogoMarkProps {
  size?: number;
  className?: string;
  labelled?: boolean;
}

export function LogoMark({ size = 22, className, labelled = false }: LogoMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role={labelled ? "img" : undefined}
      aria-label={labelled ? "Europa 冰脊 E 标志" : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      <path
        d="M 90 284 A 176 176 0 0 1 414 236"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="11"
        strokeLinecap="round"
        opacity="0.55"
      />
      <circle cx="414" cy="236" r="10" fill="var(--gold)" />
      <g fill="none" stroke="var(--accent)" strokeLinecap="round" strokeWidth="22">
        <path d="M 216 192 C 196 212 196 300 216 324" />
        <path d="M 214 194 L 342 194" />
        <path d="M 214 258 L 296 258" />
        <path d="M 214 322 L 342 322" />
      </g>
    </svg>
  );
}
