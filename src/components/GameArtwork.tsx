import type { GameArtKind } from "../services/gameCatalog";

interface GameArtworkProps {
  art: GameArtKind;
}

export function GameArtwork({ art }: GameArtworkProps) {
  if (art === "platformer") {
    return <PlatformerArtwork />;
  }
  if (art === "snake") {
    return <SnakeArtwork />;
  }
  return <GomokuArtwork />;
}

function PlatformerArtwork() {
  return (
    <svg viewBox="0 0 360 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="europa-platformer-bg" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#071a23" />
          <stop offset="1" stopColor="#041117" />
        </linearGradient>
        <radialGradient id="europa-platformer-glow" cx=".5" cy=".5" r=".5">
          <stop stopColor="#58d9ec" stopOpacity=".28" />
          <stop offset="1" stopColor="#58d9ec" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="320" fill="url(#europa-platformer-bg)" />
      <g stroke="#58d9ec" strokeOpacity=".09" fill="none">
        <path d="M-12 307C90 258 184 169 370 188" />
        <path d="M-20 338C107 276 213 183 386 210" />
      </g>
      <path d="M-20 247 38 215l38 19 31-15 44 24 29-16 41 12 53-39 84 22v98H-20Z" fill="#0b2733" />
      <path d="M-20 280 53 245l40 18 47-27 42 22 41-11 41 23 34-18 73 37v31H-20Z" fill="#0d3442" />
      <path
        d="M-12 215C74 191 118 120 242 116c58-2 93-23 133-41"
        fill="none"
        stroke="#58d9ec"
        strokeOpacity=".20"
      />
      <path
        d="M70 231C105 204 126 167 171 154c45-13 88-35 123-73"
        fill="none"
        stroke="#58d9ec"
        strokeOpacity=".19"
        strokeDasharray="2 7"
        strokeWidth="1.5"
      />
      <g fill="#58d9ec">
        <rect x="40" y="248" width="70" height="10" rx="4" />
        <rect x="142" y="204" width="73" height="10" rx="4" />
        <rect x="221" y="160" width="68" height="10" rx="4" />
        <rect x="291" y="121" width="40" height="10" rx="4" />
      </g>
      <g fill="#0b202b">
        <rect x="42" y="250" width="66" height="4" rx="2" />
        <rect x="144" y="206" width="69" height="4" rx="2" />
        <rect x="223" y="162" width="64" height="4" rx="2" />
      </g>
      <g fill="#e8b84f">
        <circle cx="130" cy="181" r="4" />
        <circle cx="173" cy="145" r="4" />
        <circle cx="258" cy="111" r="4" />
        <circle cx="103" cy="193" r="2.5" opacity=".5" />
      </g>
      <g>
        <circle cx="181" cy="132" r="24" fill="url(#europa-platformer-glow)" />
        <circle cx="181" cy="132" r="7.5" fill="#58d9ec" />
        <circle cx="178.8" cy="129.8" r="2" fill="#c9f8fc" opacity=".85" />
      </g>
      <g fill="#58d9ec" fillOpacity=".24">
        <circle cx="158" cy="147" r="2" />
        <circle cx="150" cy="154" r="1.5" />
        <circle cx="143" cy="160" r="1" />
      </g>
      <path d="M312 54a36 36 0 0 1-48 55" fill="none" stroke="#58d9ec" strokeOpacity=".23" />
      <circle cx="312" cy="54" r="2.4" fill="#e8b84f" />
      <g fill="#ffffff" opacity=".22">
        <circle cx="52" cy="70" r="1" />
        <circle cx="96" cy="46" r="1.3" />
        <circle cx="274" cy="82" r="1" />
        <circle cx="326" cy="29" r=".9" />
      </g>
    </svg>
  );
}

function SnakeArtwork() {
  return (
    <svg viewBox="0 0 360 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="europa-snake-bg" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#06181f" />
          <stop offset="1" stopColor="#07121a" />
        </linearGradient>
        <radialGradient id="europa-snake-glow" cx=".5" cy=".5" r=".5">
          <stop stopColor="#58d9ec" stopOpacity=".25" />
          <stop offset="1" stopColor="#58d9ec" stopOpacity="0" />
        </radialGradient>
        <pattern id="europa-snake-grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0V28" fill="none" stroke="#58d9ec" strokeOpacity=".055" />
        </pattern>
      </defs>
      <rect width="360" height="320" fill="url(#europa-snake-bg)" />
      <rect width="360" height="320" fill="url(#europa-snake-grid)" />
      <ellipse cx="188" cy="156" rx="145" ry="112" fill="none" stroke="#58d9ec" strokeOpacity=".08" />
      <circle cx="191" cy="131" r="130" fill="url(#europa-snake-glow)" />
      <path
        d="M48 281C67 247 105 247 125 225c18-21 10-44 32-59 20-14 49-6 66-23 15-16 35-33 62-30"
        fill="none"
        stroke="#58d9ec"
        strokeOpacity=".36"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <g fill="#58d9ec">
        <circle cx="45" cy="288" r="5" opacity=".4" />
        <circle cx="58" cy="269" r="7" opacity=".5" />
        <circle cx="76" cy="257" r="8.2" opacity=".58" />
        <circle cx="99" cy="248" r="9" opacity=".66" />
        <circle cx="123" cy="225" r="10" opacity=".74" />
        <circle cx="136" cy="207" r="10.5" opacity=".80" />
        <circle cx="146" cy="185" r="11" opacity=".86" />
        <circle cx="164" cy="166" r="11.5" opacity=".92" />
        <circle cx="184" cy="158" r="12" />
        <circle cx="208" cy="155" r="12" />
        <circle cx="229" cy="144" r="11.5" />
        <circle cx="244" cy="126" r="11" />
        <circle cx="263" cy="113" r="10.5" />
        <circle cx="285" cy="113" r="9.2" opacity=".8" />
      </g>
      <g transform="translate(296 95)">
        <circle r="18" fill="#e8b84f" fillOpacity=".08" />
        <circle r="8" fill="#e8b84f" />
        <circle cx="-2.2" cy="-2.5" r="2.4" fill="#fff6d8" fillOpacity=".8" />
      </g>
      <g fill="none" stroke="#58d9ec" strokeOpacity=".18">
        <path d="M22 40h42M22 48h25" />
      </g>
      <g fill="#fff" opacity=".18">
        <circle cx="58" cy="97" r="1" />
        <circle cx="313" cy="190" r=".9" />
        <circle cx="286" cy="42" r=".7" />
      </g>
    </svg>
  );
}

function GomokuArtwork() {
  return (
    <svg viewBox="0 0 360 320" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="europa-gomoku-bg" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#071a22" />
          <stop offset="1" stopColor="#051218" />
        </linearGradient>
        <radialGradient id="europa-gomoku-glow" cx=".5" cy=".5" r=".5">
          <stop stopColor="#e8b84f" stopOpacity=".10" />
          <stop offset="1" stopColor="#e8b84f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="360" height="320" fill="url(#europa-gomoku-bg)" />
      <circle cx="184" cy="155" r="126" fill="url(#europa-gomoku-glow)" />
      <path d="M40 250a143 143 0 0 1 268-90" fill="none" stroke="#58d9ec" strokeOpacity=".18" strokeWidth="2" />
      <circle cx="308" cy="160" r="3" fill="#e8b84f" />
      <g transform="rotate(-8 180 160)">
        <rect x="77" y="61" width="206" height="206" rx="4" fill="#0b202b" stroke="#58d9ec" strokeOpacity=".14" />
        <g stroke="#8aa7b1" strokeOpacity=".28" strokeWidth="1">
          <path d="M92 76v176M108 76v176M124 76v176M140 76v176M156 76v176M172 76v176M188 76v176M204 76v176M220 76v176M236 76v176M252 76v176M268 76v176" />
          <path d="M92 76h176M92 92h176M92 108h176M92 124h176M92 140h176M92 156h176M92 172h176M92 188h176M92 204h176M92 220h176M92 236h176M92 252h176" />
        </g>
        <g fill="#58d9ec" fillOpacity=".32">
          <circle cx="140" cy="124" r="2.4" />
          <circle cx="188" cy="172" r="2.4" />
          <circle cx="236" cy="220" r="2.4" />
        </g>
        <g>
          <circle cx="124" cy="124" r="8" fill="#eaf8fa" stroke="#ffffff" strokeOpacity=".18" />
          <circle cx="156" cy="140" r="8" fill="#eaf8fa" />
          <circle cx="172" cy="156" r="8" fill="#eaf8fa" />
          <circle cx="204" cy="188" r="8" fill="#eaf8fa" />
          <circle cx="220" cy="204" r="8" fill="#eaf8fa" />
          <circle cx="140" cy="188" r="8" fill="#07161e" stroke="#58d9ec" strokeOpacity=".25" />
          <circle cx="156" cy="172" r="8" fill="#07161e" stroke="#58d9ec" strokeOpacity=".25" />
          <circle cx="172" cy="140" r="8" fill="#07161e" stroke="#58d9ec" strokeOpacity=".25" />
          <circle cx="188" cy="124" r="8" fill="#07161e" stroke="#58d9ec" strokeOpacity=".25" />
          <circle cx="204" cy="140" r="8" fill="#07161e" stroke="#58d9ec" strokeOpacity=".25" />
        </g>
        <circle cx="220" cy="204" r="12.5" fill="none" stroke="#e8b84f" strokeWidth="1.6" />
      </g>
      <g opacity=".52">
        <path d="M35 44h43M35 52h20" fill="none" stroke="#58d9ec" />
        <circle cx="34" cy="44" r="1.5" fill="#e8b84f" />
      </g>
      <g fill="#fff" opacity=".18">
        <circle cx="56" cy="101" r="1" />
        <circle cx="302" cy="53" r=".9" />
        <circle cx="318" cy="248" r="1.2" />
      </g>
    </svg>
  );
}
