import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, SerialStatus, HighScoreRecord } from '../types';
import {
  Flame,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sliders,
  Terminal,
  BookOpen,
  Play,
  RotateCcw,
  Usb,
  Cpu,
} from 'lucide-react';

interface ScoreboardHUDProps {
  score: number;
  timeRemaining: number;
  roundDuration: number;
  streak: number;
  gameState: GameState;
  countdownValue: number;
  highScore: HighScoreRecord | null;
  serialStatus: SerialStatus;
  isMuted: boolean;
  isFullscreen: boolean;
  isCalibrating: boolean;
  onStartGame: () => void;
  onResetGame: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onToggleCalibration: () => void;
  onOpenSerialMonitor: () => void;
  onOpenDocs: () => void;
  onSimulateScore: () => void;
}

export const ScoreboardHUD: React.FC<ScoreboardHUDProps> = ({
  score,
  timeRemaining,
  roundDuration,
  streak,
  gameState,
  countdownValue,
  highScore,
  serialStatus,
  isMuted,
  isFullscreen,
  isCalibrating,
  onStartGame,
  onResetGame,
  onToggleMute,
  onToggleFullscreen,
  onToggleCalibration,
  onOpenSerialMonitor,
  onOpenDocs,
  onSimulateScore,
}) => {
  const isFinalSeconds = timeRemaining <= 10 && gameState === GameState.PLAYING;
  const isOnFire = streak >= 3;

  return (
    <header className="relative w-full z-20 flex flex-col items-center select-none pt-3 px-4 md:px-8">
      {/* 1. TOP UTILITY BAR (Projector setup, Audio, Serial connection status) */}
      <div className="w-full max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Hardware / Serial Connection Badge */}
        <div className="flex items-center gap-2">
          <button
            id="serial-status-btn"
            onClick={onOpenSerialMonitor}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer font-mono font-bold ${
              serialStatus.connected
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/90 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'bg-neutral-900/80 border-neutral-700/60 text-neutral-300 hover:border-neutral-500'
            }`}
          >
            {serialStatus.connected ? (
              <>
                <Usb className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>ARDUINO: CONNECTED</span>
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
                <span>SENSOR: SIMULATOR (SPACEBAR)</span>
              </>
            )}
          </button>

          {/* Quick Simulation trigger pill for easy testing */}
          <button
            id="quick-simulate-btn"
            onClick={onSimulateScore}
            className="hidden sm:flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-full font-mono text-[11px] font-semibold cursor-pointer transition"
            title="Press Space or Click to simulate basket"
          >
            <span>+2 SIMULATE (SPACE)</span>
          </button>
        </div>

        {/* Right: Quick Tools (Calibration, Sound, Docs, Fullscreen) */}
        <div className="flex items-center gap-2">
          <button
            id="calibration-toggle-btn"
            onClick={onToggleCalibration}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono font-medium transition cursor-pointer ${
              isCalibrating
                ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
            }`}
            title="Calibrate physical mini hoop projector placeholder"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isCalibrating ? 'CALIBRATING...' : 'CALIBRATE HOOP'}</span>
          </button>

          <button
            id="docs-btn"
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 bg-neutral-900/80 hover:bg-neutral-800 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-full font-mono font-medium transition cursor-pointer"
            title="Embedded systems course architecture spec"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">ARCHITECTURE SPEC</span>
            <span className="md:hidden">SPEC</span>
          </button>

          <button
            id="serial-terminal-btn"
            onClick={onOpenSerialMonitor}
            className="p-1.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-full transition cursor-pointer"
            title="Open Serial Packet Console & Arduino C++ Code"
          >
            <Terminal className="w-4 h-4" />
          </button>

          <button
            id="mute-toggle-btn"
            onClick={onToggleMute}
            className="p-1.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-full transition cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            id="fullscreen-toggle-btn"
            onClick={onToggleFullscreen}
            className="p-1.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 rounded-full transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen for Projector'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. TIME (left) + SCORE (right) — standalone pills, no shared rectangle */}
      <div className="w-full max-w-4xl mt-3 flex items-start justify-between gap-3">
        {/* TIME — LEFT */}
        <div className="flex flex-col items-center bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 rounded-2xl px-4 py-2 md:px-8 md:py-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <span className="text-xs md:text-sm font-mono tracking-widest text-neutral-400 uppercase font-semibold">
            TIME
          </span>
          <div
            className={`text-4xl md:text-6xl font-orbitron font-black tracking-tighter transition-colors ${
              isFinalSeconds
                ? 'text-red-500 text-glow-red animate-pulse'
                : 'text-emerald-400 text-glow-emerald'
            }`}
          >
            0:{String(timeRemaining).padStart(2, '0')}
          </div>
          {/* Round progress bar */}
          <div className="w-full max-w-[120px] h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full transition-all duration-300 ${
                isFinalSeconds ? 'bg-red-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${(timeRemaining / roundDuration) * 100}%` }}
            />
          </div>
        </div>

        {/* SCORE — RIGHT */}
        <div className="flex flex-col items-center bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 rounded-2xl px-4 py-2 md:px-8 md:py-3 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          <span className="text-xs md:text-sm font-mono tracking-widest text-neutral-400 uppercase font-semibold">
            SCORE
          </span>
          <motion.div
            key={score}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
            className="text-4xl md:text-6xl font-orbitron font-black text-amber-400 text-glow-amber tracking-tighter"
          >
            {String(score).padStart(2, '0')}
          </motion.div>
          {/* Streak Multiplier */}
          <div className="h-5 flex items-center justify-center">
            {isOnFire && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="flex items-center gap-1 text-[11px] font-chakra font-black tracking-wider text-red-400 bg-red-950/80 border border-red-500/60 px-2 py-0.5 rounded-full"
              >
                <Flame className="w-3 h-3 fill-red-400 animate-bounce" />
                <span>ON FIRE x{streak}!</span>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* HIGH SCORE — only shown before a round starts, hidden during play/countdown/gameover */}
      {gameState === GameState.IDLE && (
        <div className="mt-3 flex items-center gap-2 bg-neutral-950/70 backdrop-blur-md border border-cyan-500/30 rounded-full px-4 py-1.5">
          <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase font-semibold">
            RECORD TO BEAT
          </span>
          <span className="text-lg font-orbitron font-black text-cyan-400 text-glow-cyan">
            {highScore ? String(highScore.score).padStart(2, '0') : '62'}
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            <strong className="text-cyan-300">{highScore ? highScore.initials : 'KOB'}</strong>
          </span>
        </div>
      )}

      {/* 3. IN-PLAY UTILITY BAR — only during PLAYING, kept small so it doesn't block the court */}
      {gameState === GameState.PLAYING && (
        <div className="mt-3">
          <button
            id="reset-game-btn"
            onClick={onResetGame}
            className="flex items-center gap-1.5 bg-neutral-950/70 hover:bg-neutral-900 text-neutral-300 font-mono text-xs px-3 py-1.5 rounded-lg border border-neutral-700 backdrop-blur-md transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            END ROUND
          </button>
        </div>
      )}

      {gameState === GameState.GAMEOVER && (
        <div className="w-full max-w-4xl mt-3 bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-3 md:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs md:text-sm font-chakra font-bold tracking-wide text-red-400 font-mono">
            FINAL SCORE RECORDED!
          </span>
          <button
            id="play-again-btn"
            onClick={onStartGame}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-chakra font-black tracking-wider px-5 py-2 rounded-xl text-sm md:text-base shadow-[0_0_20px_rgba(16,185,129,0.5)] transition transform hover:scale-105 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-neutral-950" />
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* 4. ARCADE "PRESS START" — big, centered, only while idle. Disappears the instant the round begins. */}
      <AnimatePresence>
        {gameState === GameState.IDLE && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="pointer-events-auto flex flex-col items-center gap-5 bg-neutral-950/85 backdrop-blur-md border border-neutral-800/80 rounded-3xl px-10 py-8 md:px-16 md:py-12 shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
            >
              <span className="text-amber-300 flex items-center gap-2 font-chakra font-bold tracking-wide text-sm md:text-lg text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                INSERT COIN / PRESS START TO BEGIN 60S ROUND
              </span>
              <button
                id="start-game-btn"
                onClick={onStartGame}
                className="flex items-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-chakra font-black tracking-widest px-10 py-4 md:px-16 md:py-6 rounded-2xl text-xl md:text-3xl shadow-[0_0_40px_rgba(245,158,11,0.6)] transition transform hover:scale-105 active:scale-95 cursor-pointer animate-pulse"
              >
                <Play className="w-6 h-6 md:w-8 md:h-8 fill-neutral-950" />
                START GAME
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. OVERLAY COUNTDOWN MODAL (3 - 2 - 1 - SHOOT!) */}
      <AnimatePresence>
        {gameState === GameState.COUNTDOWN && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm pointer-events-none"
          >
            <motion.div
              key={countdownValue}
              initial={{ scale: 2.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="text-8xl md:text-9xl font-orbitron font-black text-amber-400 text-glow-amber drop-shadow-[0_0_50px_rgba(245,158,11,1)]"
            >
              {countdownValue > 0 ? countdownValue : 'SHOOT!'}
            </motion.div>
            <p className="mt-4 text-xl font-chakra font-bold tracking-widest text-neutral-300 uppercase">
              GET READY!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
