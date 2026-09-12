import { memo, type CSSProperties } from 'react';

interface StreakBorderProps {
  energy: 0 | 1 | 2;
  paused: boolean;
}

const EDGES = ['top', 'right', 'bottom', 'left'] as const;

/** Decorative only: fixed SVG shapes, animated by CSS, driven by the session's streak. */
export const StreakBorder = memo(function StreakBorder({ energy, paused }: StreakBorderProps) {
  return (
    <div className="streak-border" data-energy={energy} data-paused={paused} aria-hidden="true">
      <div className="streak-tint" />
      <div className="streak-intensity" />
      <div className="streak-glow streak-animated" />
      {EDGES.map((edge, edgeIndex) => {
        const vertical = edge === 'left' || edge === 'right';
        // Rotate the drawing coordinates so every flame points into the screen.
        const orientation = edge === 'left' ? 'translate(80 0) rotate(90)'
          : edge === 'right' ? 'translate(0 1200) rotate(-90)'
          : edge === 'top' ? 'translate(1200 80) rotate(180)' : undefined;
        return (
          <svg key={edge} className={`streak-edge streak-edge-${edge}`}
            viewBox={vertical ? '0 0 80 1200' : '0 0 1200 80'} preserveAspectRatio="none" focusable="false">
            <g transform={orientation}>
              {Array.from({ length: 12 }, (_, index) => (
                <g key={index} transform={`translate(${index * 100} 0)`}>
                  <g className="streak-tongue streak-animated" style={{
                    '--flame-duration': `${1.8 + (index % 4) * 0.27}s`,
                    '--flame-delay': `${-(index * 0.37 + edgeIndex * 0.61)}s`,
                  } as CSSProperties}>
                    <path className="streak-flame-outer" d="M-8 88 C-6 61 15 59 17 37 C32 45 31 55 38 57 C31 29 57 28 53 3 C82 22 61 39 76 50 C83 43 83 34 82 28 C107 47 94 61 108 88 Z" />
                    <path className="streak-flame-core" d="M17 88 C15 72 36 68 34 54 C46 59 49 68 48 72 C62 62 50 52 64 39 C62 64 89 68 87 88 Z" />
                  </g>
                </g>
              ))}
            </g>
          </svg>
        );
      })}
    </div>
  );
});
