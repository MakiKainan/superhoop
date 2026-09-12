import React from 'react';

interface CourtBackgroundProps {
  /** 0: watching; 1: on fire (3+); 2: larger crowd (6+). Visuals only. */
  energy: 0 | 1 | 2;
  paused: boolean;
}

const ART = '/art/court/';

/** Separate image layers let the crowd move without moving the court or hoop. */
export const CourtBackground = React.memo(function CourtBackground({ energy, paused }: CourtBackgroundProps) {
  return (
    <div className="court-scene absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#1a1024]"
      aria-hidden="true" data-energy={energy} data-paused={paused}>
      <img src={`${ART}court-dusk-v1.webp`} alt="" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" draggable={false} />
      <div className="court-sky-glow court-animated" />

      {/* This clipping zone follows the background's baseline even when object-cover crops it.
          Back rows render first; every sprite's feet stay inside this spectator-only area. */}
      <div className="court-crowd-zone">
      {[2, 1].map(tier => ['left', 'right'].map(side => (
        <div key={`${tier}-${side}`} className={`court-spectators court-arrivals court-tier-${tier} court-${side}`}
          data-visible={energy >= tier}>
          <img src={`${ART}spectators-cheering-v${(tier === 1) === (side === 'left') ? 1 : 2}.webp`} alt="" className="court-animated court-cheer" decoding="async" draggable={false} />
        </div>
      )))}

      {/* Distinct regulars on each side break up mirrored repetition. */}
      {['left', 'right'].map(side => (
        <div key={side} className={`court-spectators court-regulars court-${side}`}>
          <img src={`${ART}spectators-watching-v${side === 'left' ? 1 : 2}.webp`} alt="" className="court-animated court-watch" decoding="async" draggable={false} />
        </div>
      ))}
      </div>

      {/* Keep the existing centered goal post; the calibrated 64px rim is a separate component. */}
      <div className="absolute bottom-[36%] left-1/2 -translate-x-1/2 h-[30vh] flex flex-col items-center">
        <div className="relative flex-1 w-[16px] bg-[#94a3b8] border-x-[4px] border-t-[4px] border-[#0a0a0a] rounded-t-xs">
          <div className="absolute inset-y-1 left-1/2 -translate-x-1/2 w-[2px] bg-[#cbd5e1]/70" />
        </div>
        <div className="w-[52px] h-[12px] bg-[#64748b] border-[4px] border-[#0a0a0a] rounded-xs" />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_40%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
});

