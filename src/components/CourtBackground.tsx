import React from 'react';

/**
 * NBA Street styled blacktop court.
 *
 * Cel-shaded, not photoreal: flat colour bands with hard stops, heavy black
 * keylines on every edge, halftone dot screen over the top. One fixed scene —
 * no theme switching.
 */
export const CourtBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#1a1024]">
      {/* 1. DUSK SKY — hard-stop bands rather than a smooth gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, #2b1055 0%, #2b1055 12%, #7b2d8e 12%, #7b2d8e 22%, #d94f1e 22%, #d94f1e 30%, #f97316 30%, #f97316 36%, #fbbf24 36%, #fbbf24 41%)',
        }}
      />

      {/* Sun disc — flat circle, black keyline */}
      <div className="absolute top-[26%] left-[68%] w-40 h-40 rounded-full bg-[#fde047] border-[5px] border-[#0a0a0a]" />

      {/* 2. CITY SKYLINE — flat silhouettes */}
      <svg
        className="absolute top-[28%] left-0 w-full h-[16%]"
        viewBox="0 0 1200 160"
        preserveAspectRatio="none"
      >
        <path
          d="M0,160 L0,90 L60,90 L60,50 L110,50 L110,80 L170,80 L170,30 L230,30 L230,70 L300,70
             L300,45 L360,45 L360,95 L430,95 L430,25 L500,25 L500,75 L570,75 L570,55 L640,55
             L640,100 L710,100 L710,40 L780,40 L780,85 L850,85 L850,60 L920,60 L920,95 L990,95
             L990,35 L1060,35 L1060,80 L1130,80 L1130,65 L1200,65 L1200,160 Z"
          fill="#2a1533"
          stroke="#0a0a0a"
          strokeWidth="5"
        />
        {/* Lit windows */}
        <g fill="#fbbf24" opacity="0.85">
          {[
            [78, 62], [92, 62], [186, 44], [200, 44], [186, 58], [246, 84],
            [318, 58], [332, 58], [446, 40], [460, 40], [446, 54], [518, 88],
            [586, 68], [726, 54], [740, 54], [726, 68], [796, 98], [866, 74],
            [1006, 50], [1020, 50], [1006, 64], [1076, 94],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="8" height="10" />
          ))}
        </g>
      </svg>

      {/* 3. BRICK WALL + GRAFFITI MURAL */}
      <div className="absolute top-[41%] left-0 right-0 h-[22%] bg-[#7f3b2e] border-y-[5px] border-[#0a0a0a] overflow-hidden">
        {/* Brick courses */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, #4a1f18 0px, #4a1f18 2px, transparent 2px, transparent 30px), repeating-linear-gradient(90deg, #4a1f18 0px, #4a1f18 2px, transparent 2px, transparent 62px)',
          }}
        />

        {/* Spray-paint blooms. Colour only — no lettering, so nothing on the
            wall competes with the HUD for the player's attention. */}
        <div className="absolute top-[8%] left-[2%] w-80 h-44 rounded-full bg-[#22d3ee]/25 blur-2xl" />
        <div className="absolute top-[22%] left-[14%] w-64 h-36 rounded-full bg-[#a855f7]/30 blur-2xl" />
        <div className="absolute top-[10%] right-[4%] w-72 h-40 rounded-full bg-[#f97316]/25 blur-2xl" />
      </div>

      {/* 4. CHAIN-LINK FENCE */}
      <svg className="absolute top-[41%] left-0 w-full h-[22%] opacity-45" preserveAspectRatio="none">
        <defs>
          <pattern id="chainlink" width="26" height="26" patternUnits="userSpaceOnUse">
            <path
              d="M0,0 L13,13 M13,13 L26,26 M26,0 L13,13 M13,13 L0,26"
              stroke="#cbd5e1"
              strokeWidth="2"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chainlink)" />
      </svg>

      {/* Fence rail */}
      <div className="absolute top-[62%] left-0 right-0 h-2 bg-[#94a3b8] border-y-[3px] border-[#0a0a0a]" />

      {/* 5. BLACKTOP COURT */}
      <div className="absolute top-[63%] left-0 right-0 bottom-0 bg-[#3f3f46] border-t-[5px] border-[#0a0a0a] overflow-hidden">
        {/* Flat asphalt shading band */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, #52525b 0%, #52525b 30%, #3f3f46 30%, #3f3f46 65%, #27272a 65%)',
          }}
        />

        {/* Cracks */}
        <svg className="absolute inset-0 w-full h-full opacity-50" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <path d="M120,400 L160,300 L130,240 L175,170" stroke="#18181b" strokeWidth="3" fill="none" />
          <path d="M880,400 L845,320 L890,260 L860,190" stroke="#18181b" strokeWidth="3" fill="none" />
          <path d="M420,400 L440,350 L410,320" stroke="#18181b" strokeWidth="2.5" fill="none" />
        </svg>

        {/* Painted court markings — white fill with fat black keyline */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <g stroke="#0a0a0a" strokeWidth="11" fill="none" strokeLinecap="round">
            <line x1="60" y1="24" x2="940" y2="24" />
            <path d="M 200,400 L 320,24" />
            <path d="M 800,400 L 680,24" />
            <path d="M 390,24 L 390,196 L 610,196 L 610,24" />
            <ellipse cx="500" cy="196" rx="104" ry="40" />
          </g>
          <g stroke="#f8fafc" strokeWidth="5" fill="none" strokeLinecap="round">
            <line x1="60" y1="24" x2="940" y2="24" />
            <path d="M 200,400 L 320,24" />
            <path d="M 800,400 L 680,24" />
            <path d="M 390,24 L 390,196 L 610,196 L 610,24" />
            <ellipse cx="500" cy="196" rx="104" ry="40" />
          </g>
          {/* Painted key fill */}
          <path d="M 390,24 L 390,196 L 610,196 L 610,24 Z" fill="#ea580c" opacity="0.35" />
        </svg>
      </div>

      {/* 6. HOOP GOAL POST — a real goal stands OUT OF BOUNDS, behind the
          baseline, not inside the key. The painted baseline is at y=24 of the
          court svg's 400-unit box, i.e. 63% + 6%*37% = ~65.2% from the top of
          the viewport, so anchoring the base at 36% from the bottom puts it on
          the asphalt strip just behind that line. Built from centred flex
          children rather than a hand-drawn path so the post is dead vertical
          and cannot drift off the centre line. */}
      <div className="absolute bottom-[36%] left-1/2 -translate-x-1/2 h-[30vh] flex flex-col items-center">
        {/* Vertical post — rises behind the backboard (this layer is z-0, the
            hoop placeholder is z-10, so the board occludes the top of it). */}
        <div className="relative flex-1 w-[16px] bg-[#94a3b8] border-x-[4px] border-t-[4px] border-[#0a0a0a] rounded-t-xs">
          {/* Centre highlight — a single hairline down the middle */}
          <div className="absolute inset-y-1 left-1/2 -translate-x-1/2 w-[2px] bg-[#cbd5e1]/70" />
        </div>

        {/* Bolted foot plate */}
        <div className="w-[52px] h-[12px] bg-[#64748b] border-[4px] border-[#0a0a0a] rounded-xs" />
      </div>

      {/* Contact shadow so the post reads as planted on the blacktop */}
      <div className="absolute bottom-[35.2%] left-1/2 -translate-x-1/2 w-[86px] h-[10px] rounded-[50%] bg-black/45 blur-[2px]" />

      {/* 7. COMIC HALFTONE SCREEN over everything */}
      <div className="absolute inset-0 halftone opacity-[0.18] mix-blend-multiply" />

      {/* 8. Vignette so the HUD stays readable on a projector */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_35%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
};
