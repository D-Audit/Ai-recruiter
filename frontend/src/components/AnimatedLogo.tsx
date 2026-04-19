"use client";

/**
 * AnimatedLogo — used everywhere: landing page, login, register, sidebar, dashboard.
 *
 * Animation: two small dots orbit the Brain icon in a circle,
 * one clockwise, one counter-clockwise. The icon box itself
 * gently pulses its glow. Clean, professional, unique.
 *
 * Props:
 *   size   — "sm" | "md" | "lg"  (default "md")
 *   dark   — true = white text (for dark/blue bg), false = dark text (default false)
 *   noText — hide the name/tagline (useful in very tight spaces)
 */

interface AnimatedLogoProps {
  size?:   "sm" | "md" | "lg";
  dark?:   boolean;
  noText?: boolean;
}

const sizes = {
  sm: { box: 34, radius: 11, brain: 16, orbit: 38, dot: 5, gap: 10, name: 15, tag: 8.5 },
  md: { box: 44, radius: 13, brain: 20, orbit: 50, dot: 6, gap: 12, name: 17, tag: 9.5 },
  lg: { box: 56, radius: 16, brain: 26, orbit: 64, dot: 7, gap: 14, name: 21, tag: 10.5 },
};

export default function AnimatedLogo({
  size   = "md",
  dark   = true,
  noText = false,
}: AnimatedLogoProps) {
  const s = sizes[size];

  const nameColor    = dark ? "#ffffff"                  : "#0f172a";
  const tagColor     = dark ? "rgba(255,255,255,0.42)"   : "#94a3b8";
  const orbitColor   = dark ? "rgba(255,255,255,0.22)"   : "rgba(37,99,235,0.18)";
  const dot1Color    = dark ? "rgba(147,197,253,0.9)"    : "#2563eb";
  const dot2Color    = dark ? "rgba(167,139,250,0.9)"    : "#7c3aed";

  const uid = `logo-${size}`;

  return (
    <>
      <style>{`
        /* Orbit ring rotates, dots are fixed on the ring so they orbit */
        @keyframes ${uid}-cw  { from { transform: rotate(0deg);    } to { transform: rotate(360deg);  } }
        @keyframes ${uid}-ccw { from { transform: rotate(0deg);    } to { transform: rotate(-360deg); } }
        @keyframes ${uid}-glow {
          0%,100% { box-shadow: 0 4px 14px rgba(37,99,235,0.45), 0 0 0 0 rgba(99,102,241,0.5); }
          50%     { box-shadow: 0 4px 22px rgba(124,58,237,0.7),  0 0 0 7px rgba(99,102,241,0); }
        }

        .${uid}-wrap {
          display: flex; align-items: center;
          gap: ${s.gap}px;
          text-decoration: none;
        }

        /* Outer orbit container — same size as orbit ring */
        .${uid}-orbit-wrap {
          position: relative; flex-shrink: 0;
          width: ${s.orbit}px; height: ${s.orbit}px;
          display: flex; align-items: center; justify-content: center;
        }

        /* The orbit ring itself — invisible, just used for rotation */
        .${uid}-ring-cw {
          position: absolute; inset: 0; border-radius: 50%;
          border: 1.5px dashed ${orbitColor};
          animation: ${uid}-cw 6s linear infinite;
        }
        .${uid}-ring-ccw {
          position: absolute; inset: 3px; border-radius: 50%;
          border: 1px dashed ${orbitColor};
          animation: ${uid}-ccw 4s linear infinite;
          opacity: 0.6;
        }

        /* Dots on the ring — positioned at top (12 o'clock), counter-rotated so they don't spin */
        .${uid}-dot1-arm {
          position: absolute; inset: 0; border-radius: 50%;
          animation: ${uid}-cw 6s linear infinite;
          display: flex; align-items: flex-start; justify-content: center;
          pointer-events: none;
        }
        .${uid}-dot1 {
          width: ${s.dot}px; height: ${s.dot}px; border-radius: 50%;
          background: ${dot1Color};
          margin-top: -${Math.ceil(s.dot / 2)}px;
          box-shadow: 0 0 6px ${dot1Color};
          flex-shrink: 0;
        }

        .${uid}-dot2-arm {
          position: absolute; inset: 3px; border-radius: 50%;
          animation: ${uid}-ccw 4s linear infinite;
          display: flex; align-items: flex-end; justify-content: center;
          pointer-events: none;
        }
        .${uid}-dot2 {
          width: ${s.dot - 1}px; height: ${s.dot - 1}px; border-radius: 50%;
          background: ${dot2Color};
          margin-bottom: -${Math.ceil((s.dot - 1) / 2)}px;
          box-shadow: 0 0 5px ${dot2Color};
          flex-shrink: 0;
        }

        /* The icon box in the center */
        .${uid}-box {
          width: ${s.box}px; height: ${s.box}px;
          border-radius: ${s.radius}px;
          background: linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%);
          display: flex; align-items: center; justify-content: center;
          animation: ${uid}-glow 2.8s ease-in-out infinite;
          position: relative; overflow: hidden; z-index: 1;
        }
        .${uid}-box::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%);
          border-radius: inherit;
        }

        /* Text */
        .${uid}-name {
          font-size: ${s.name}px; font-weight: 800;
          color: ${nameColor}; line-height: 1.2;
          letter-spacing: -0.3px;
          font-family: var(--font-display, sans-serif);
        }
        .${uid}-tag {
          font-size: ${s.tag}px; font-weight: 600;
          color: ${tagColor}; text-transform: uppercase;
          letter-spacing: 1.4px; margin-top: 2px;
        }
      `}</style>

      <div className={`${uid}-wrap`}>
        {/* Orbit + icon */}
        <div className={`${uid}-orbit-wrap`}>
          {/* Outer ring */}
          <div className={`${uid}-ring-cw`} />
          {/* Inner ring */}
          <div className={`${uid}-ring-ccw`} />

          {/* Orbiting dot 1 — clockwise on outer ring */}
          <div className={`${uid}-dot1-arm`}>
            <div className={`${uid}-dot1`} />
          </div>

          {/* Orbiting dot 2 — counter-clockwise on inner ring */}
          <div className={`${uid}-dot2-arm`}>
            <div className={`${uid}-dot2`} />
          </div>

          {/* Center icon */}
          <div className={`${uid}-box`}>
            <svg width={s.brain} height={s.brain} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
              <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
              <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
              <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
              <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
              <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
              <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
              <path d="M6 18a4 4 0 0 1-1.967-.516"/>
              <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
            </svg>
          </div>
        </div>

        {/* Name + tagline */}
        {!noText && (
          <div>
            <p className={`${uid}-name`}>Umurava AI</p>
            <p className={`${uid}-tag`}>Talent Screening</p>
          </div>
        )}
      </div>
    </>
  );
}