import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HoopCalibration, GameState } from '../types';

interface HoopPlaceholderProps {
  calibration: HoopCalibration;
  gameState: GameState;
  scoreTrigger: { id: number; points: number; streak: number } | null;
  onCalibrationChange?: (updated: HoopCalibration) => void;
  isCalibrating: boolean;
  onManualScoreClick?: () => void;
}

export const HoopPlaceholder: React.FC<HoopPlaceholderProps> = ({
  calibration,
  gameState,
  scoreTrigger,
  onCalibrationChange,
  isCalibrating,
  onManualScoreClick,
}) => {
  const [swishActive, setSwishActive] = useState(false);
  const [floatingScores, setFloatingScores] = useState<
    Array<{ id: number; points: number; streak: number; dx: number; dy: number; rotate: number }>
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initX: 0, initY: 0 });

  // Trigger basket visual feedback on score event
  useEffect(() => {
    if (!scoreTrigger) return;

    setSwishActive(true);
    const swishTimeout = setTimeout(() => setSwishActive(false), 600);

    // Each badge drifts to its own random spot around the rim so bursts of
    // scores fan out instead of stacking in one column.
    setFloatingScores(prev => [
      ...prev,
      {
        ...scoreTrigger,
        dx: (Math.random() - 0.5) * 160,
        dy: -80 - Math.random() * 60,
        rotate: (Math.random() - 0.5) * 20,
      },
    ]);

    return () => clearTimeout(swishTimeout);
  }, [scoreTrigger]);

  // Removal is driven by each badge's own animation finishing (Framer's
  // onAnimationComplete), not a timer — so a new score can never cancel an
  // older badge's cleanup and leave it stuck on screen.
  const handleFloatingScoreDone = (id: number) => {
    setFloatingScores(prev => prev.filter(b => b.id !== id));
  };

  // Drag calibration handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCalibrating || !onCalibrationChange) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initX: calibration.xPercent,
      initY: calibration.yPercent,
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !onCalibrationChange) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      const newX = Math.max(10, Math.min(90, dragStart.initX + (dx / window.innerWidth) * 100));
      const newY = Math.max(10, Math.min(85, dragStart.initY + (dy / window.innerHeight) * 100));

      onCalibrationChange({
        ...calibration,
        xPercent: parseFloat(newX.toFixed(1)),
        yPercent: parseFloat(newY.toFixed(1)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, calibration, onCalibrationChange]);

  const {
    xPercent,
    yPercent,
    widthPx,
    heightPx,
    rimDiameterPx,
    guideVisible,
    renderVirtualBoard,
    rotationDeg,
  } = calibration;

  // Inner shooter target box dimensions (standard 24"x18" ratio)
  const targetBoxWidth = Math.round(widthPx * 0.42);
  const targetBoxHeight = Math.round(heightPx * 0.42);
  const rimRadius = rimDiameterPx / 2;

  return (
    <div
      id="hoop-placeholder-container"
      className={`absolute select-none transition-transform duration-75 ${
        isCalibrating ? 'cursor-grab active:cursor-grabbing ring-2 ring-amber-400 ring-offset-4 ring-offset-black/50 z-30' : 'pointer-events-none z-10'
      }`}
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        transform: `translate(-50%, -50%) rotate(${rotationDeg}deg)`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 1. PROJECTOR CALIBRATION GUIDE OVERLAY */}
      {(isCalibrating || guideVisible) && (
        <div className="absolute -inset-4 border-2 border-dashed border-cyan-400/70 rounded-lg pointer-events-none flex flex-col justify-between p-2">
          {/* Top alignment badge */}
          <div className="flex justify-between items-center text-[11px] font-mono font-bold tracking-widest text-cyan-300 bg-black/80 px-2 py-0.5 rounded shadow-sm">
            <span>[PROJECTOR HOOP TARGET]</span>
            <span>{Math.round(xPercent)}%, {Math.round(yPercent)}%</span>
          </div>

          {/* Crosshairs & Center Marker */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Horizontal axis */}
            <div className="w-full h-px bg-cyan-400/40" />
            {/* Vertical axis */}
            <div className="h-full w-px bg-cyan-400/40 absolute" />
            {/* Center target circle */}
            <div className="w-6 h-6 rounded-full border border-cyan-300 absolute flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>
          </div>

          {/* Physical Rim Alignment Guide Bracket */}
          <div
            className="absolute left-1/2 -translate-x-1/2 border-2 border-amber-400/90 rounded-full flex items-center justify-center"
            style={{
              bottom: `${Math.round(heightPx * 0.12)}px`,
              width: `${rimDiameterPx}px`,
              height: `${Math.round(rimDiameterPx * 0.45)}px`,
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
            }}
          >
            <span className="text-[9px] font-mono uppercase font-black text-amber-300 drop-shadow">
              RIM SENSOR TARGET
            </span>
          </div>

          {/* Corner brackets */}
          <div className="flex justify-between items-end text-[10px] font-mono text-neutral-400 bg-black/60 px-2 py-0.5 rounded">
            <span>{widthPx}×{heightPx}px</span>
            <span>ROT: {rotationDeg}°</span>
          </div>
        </div>
      )}

      {/* 2. VIRTUAL BACKBOARD GRAPHIC (Can be hidden if physical backboard is already on wall) */}
      {renderVirtualBoard && (
        <div className="relative w-full h-full rounded-md border-4 border-slate-100 bg-slate-900/40 backdrop-blur-xs shadow-[0_8px_30px_rgba(0,0,0,0.6)] flex flex-col items-center justify-between p-3 overflow-hidden">
          {/* Subtle tempered glass reflection sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-white/10 to-transparent pointer-events-none" />

          {/* Header Brand / School / Arcade text */}
          <div className="w-full flex justify-between items-center text-[10px] font-street tracking-wider text-slate-300/80 px-2">
            <span>REGULATION MINI</span>
            <span>ARCADE PRO</span>
          </div>

          {/* Inner Shooter's Target Box (The classic orange/white square on backboards) */}
          <div
            className="relative border-4 border-orange-500 rounded-xs flex items-end justify-center transition-colors"
            style={{
              width: `${targetBoxWidth}px`,
              height: `${targetBoxHeight}px`,
              marginBottom: `${Math.round(heightPx * 0.08)}px`,
              boxShadow: swishActive ? '0 0 24px rgba(249, 115, 22, 0.9)' : '0 0 10px rgba(249, 115, 22, 0.3)',
            }}
          >
            {/* Target box inner accent */}
            <div className="absolute inset-1 border border-white/20 pointer-events-none" />
          </div>

          {/* Bottom structural mount */}
          <div className="w-16 h-2 bg-slate-700 rounded-t-sm" />
        </div>
      )}

      {/* If virtual backboard is hidden, provide subtle LED backlight contour for the physical backboard */}
      {!renderVirtualBoard && (
        <div className="w-full h-full rounded-md border-2 border-dashed border-amber-500/40 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center">
          <span className="text-xs font-mono text-amber-300/70 bg-black/60 px-2 py-1 rounded">
            Physical Backboard Zone
          </span>
        </div>
      )}

      {/* 3. PHYSICAL RIM & NET (Interactive simulated or projected overlay) */}
      <div
        id="rim-interactive-area"
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer pointer-events-auto group"
        style={{
          bottom: `${Math.round(heightPx * 0.06)}px`,
          width: `${rimDiameterPx + 20}px`,
        }}
        onClick={() => onManualScoreClick && onManualScoreClick()}
        title="Click to simulate made basket"
      >
        {/* Metal Mounting Bracket */}
        <div className="w-10 h-3 bg-neutral-800 border-t border-neutral-600 rounded-t-xs" />

        {/* Rim Ring (Solid regulation orange oval) */}
        <div
          className={`relative border-[5px] border-orange-600 rounded-full flex items-center justify-center transition-all duration-150 ${
            swishActive
              ? 'scale-105 border-orange-400 shadow-[0_0_25px_rgba(249,115,22,1)]'
              : 'shadow-[0_4px_12px_rgba(0,0,0,0.7)] group-hover:border-orange-500'
          }`}
          style={{
            width: `${rimDiameterPx}px`,
            height: `${Math.round(rimDiameterPx * 0.42)}px`,
            backgroundColor: 'rgba(30, 20, 15, 0.45)',
          }}
        >
          {/* Net cords (SVG basket mesh) */}
          <svg
            className={`absolute top-full -mt-1 w-full transition-transform duration-300 origin-top pointer-events-none ${
              swishActive ? 'scale-y-125 scale-x-90 stroke-amber-200' : 'stroke-slate-200'
            }`}
            style={{ height: `${Math.round(rimDiameterPx * 0.85)}px` }}
            viewBox="0 0 100 85"
            fill="none"
          >
            {/* White net mesh cords */}
            <path d="M 10,0 L 25,35 L 45,75" strokeWidth="2" strokeOpacity="0.85" />
            <path d="M 28,0 L 40,35 L 50,75" strokeWidth="2" strokeOpacity="0.85" />
            <path d="M 50,0 L 50,35 L 50,75" strokeWidth="2" strokeOpacity="0.9" />
            <path d="M 72,0 L 60,35 L 50,75" strokeWidth="2" strokeOpacity="0.85" />
            <path d="M 90,0 L 75,35 L 55,75" strokeWidth="2" strokeOpacity="0.85" />

            {/* Cross loops */}
            <path d="M 10,0 L 30,35 L 55,75" strokeWidth="1.5" strokeOpacity="0.7" />
            <path d="M 90,0 L 70,35 L 45,75" strokeWidth="1.5" strokeOpacity="0.7" />
            <path d="M 18,22 Q 50,30 82,22" strokeWidth="1.5" strokeOpacity="0.8" />
            <path d="M 26,45 Q 50,52 74,45" strokeWidth="1.5" strokeOpacity="0.8" />
            <path d="M 38,70 Q 50,74 62,70" strokeWidth="2" strokeOpacity="0.9" />
          </svg>
        </div>

        {/* Hover hint for testing */}
        {gameState === GameState.PLAYING && (
          <span className="text-[10px] font-mono text-amber-300/80 mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 px-1.5 py-0.5 rounded pointer-events-none">
            Click to score
          </span>
        )}
      </div>

      {/* 4. MADE BASKET SHOCKWAVE / BURST RIPPLES */}
      <AnimatePresence>
        {swishActive && (
          <motion.div
            initial={{ scale: 0.6, opacity: 1 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 rounded-full border-4 border-amber-400/80 pointer-events-none"
            style={{
              bottom: `${Math.round(heightPx * 0.04)}px`,
              width: `${rimDiameterPx}px`,
              height: `${Math.round(rimDiameterPx * 0.5)}px`,
              boxShadow: '0 0 35px rgba(245, 158, 11, 0.8)',
            }}
          />
        )}
      </AnimatePresence>

      {/* 5. FLOATING SCORE POPUPS — burst outward from the rim (where the mini hoop sits) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
        style={{ bottom: `${Math.round(heightPx * 0.06) + Math.round(rimDiameterPx * 0.21)}px` }}
      >
        <AnimatePresence>
          {floatingScores.map(badge => (
            <motion.div
              key={badge.id}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0.6, rotate: 0 }}
              animate={{
                x: badge.dx,
                y: badge.dy,
                opacity: [0, 1, 1, 0],
                scale: 1.2,
                rotate: badge.rotate,
              }}
              transition={{ duration: 1.1, ease: 'easeOut', times: [0, 0.15, 0.75, 1] }}
              onAnimationComplete={() => handleFloatingScoreDone(badge.id)}
              className={`absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap font-score tracking-wider px-3 py-1 rounded-full shadow-2xl flex items-center gap-1.5 border ${
                badge.streak >= 3
                  ? 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400 text-white border-yellow-300 text-2xl drop-shadow-[0_0_20px_rgba(239,68,68,0.9)]'
                  : 'bg-amber-500 text-black border-amber-300 text-xl drop-shadow-[0_0_12px_rgba(245,158,11,0.8)]'
              }`}
            >
              <span>+{badge.points}</span>
              {badge.streak >= 3 && (
                <span className="text-xs bg-black/40 px-1.5 py-0.5 rounded text-amber-200">
                  🔥 STREAK x{badge.streak}!
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
