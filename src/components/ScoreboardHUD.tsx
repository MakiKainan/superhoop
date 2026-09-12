import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, HighScoreRecord } from '../types';
import {
  Flame,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Sliders,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

interface ScoreboardHUDProps {
  score: number;
  timeRemaining: number;
  roundDuration: number;
  streak: number;
  gameState: GameState;
  countdownValue: number;
  highScore: HighScoreRecord | null;
  isMuted: boolean;
  isFullscreen: boolean;
  isCalibrating: boolean;
  onStartGame: () => void;
  onResetGame: () => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePause: () => void;
  onToggleCalibration: () => void;
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
  isMuted,
  isFullscreen,
  isCalibrating,
  onStartGame,
  onResetGame,
  onToggleMute,
  onToggleFullscreen,
  onTogglePause,
  onToggleCalibration,
  onSimulateScore,
}) => {
  const isPaused = gameState === GameState.PAUSED;
  const isRoundActive = gameState === GameState.PLAYING || isPaused;
  const isFinalSeconds = timeRemaining <= 10 && gameState === GameState.PLAYING;
  const isOnFire = streak >= 3;

  return (
    <header className="relative w-full z-20 flex flex-col items-center select-none pt-3 px-4 md:px-8 pointer-events-none [&_button]:pointer-events-auto">
      {/* 1. TOP UTILITY BAR (Projector setup, Audio) */}
      <div className="w-full max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Quick Simulation trigger pill for easy testing */}
        <div className="flex items-center gap-2">
          <button
            id="quick-simulate-btn"
            onClick={onSimulateScore}
            className="hidden sm:flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2.5 py-1.5 rounded-full font-mono text-[11px] font-semibold cursor-pointer transition"
            title="Press Space or Click to simulate basket"
          >
            <span>+2 SIMULATE (SPACE)</span>
          </button>
        </div>

        {/* Right: Quick Tools (Calibration, Sound, Fullscreen) */}
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
        <div className="flex flex-col items-center bg-neutral-950/90 backdrop-blur-md ink-box rounded-xl px-4 py-2 md:px-8 md:py-3 -rotate-1">
          <span className="text-sm md:text-base font-street tracking-widest text-amber-300 uppercase">
            TIME
          </span>
          <div
            className={`text-4xl md:text-6xl font-score tracking-tighter transition-colors ${
              isPaused
                ? 'text-neutral-500'
                : isFinalSeconds
                  ? 'text-red-500 text-glow-red animate-pulse'
                  : 'text-emerald-400 text-glow-emerald'
            }`}
          >
            {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
          </div>
          {/* Round progress bar */}
          <div className="w-full max-w-[120px] h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full origin-left transition-transform duration-300 ${
                isPaused ? 'bg-neutral-500' : isFinalSeconds ? 'bg-red-500' : 'bg-emerald-400'
              }`}
              style={{ transform: `scaleX(${timeRemaining / roundDuration})` }}
            />
          </div>
        </div>

        {/* SCORE — RIGHT */}
        <div className="flex flex-col items-center bg-neutral-950/90 backdrop-blur-md ink-box rounded-xl px-4 py-2 md:px-8 md:py-3 rotate-1">
          <span className="text-sm md:text-base font-street tracking-widest text-amber-300 uppercase">
            SCORE
          </span>
          <motion.div
            key={score}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
            className="text-4xl md:text-6xl font-score text-amber-400 text-glow-amber tracking-tighter"
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
                className="flex items-center gap-1 text-[11px] font-street tracking-wider text-red-400 bg-red-950/80 border border-red-500/60 px-2 py-0.5 rounded-full"
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
        <div className="mt-3 flex items-center gap-2 bg-neutral-950/85 backdrop-blur-md ink-box rounded-lg px-4 py-1.5 -rotate-1">
          <span className="text-sm font-street tracking-widest text-neutral-300 uppercase">
            RECORD TO BEAT
          </span>
          <span className="text-2xl font-score text-cyan-400 text-glow-cyan">
            {highScore ? String(highScore.score).padStart(2, '0') : '00'}
          </span>
          <span className="text-base font-street text-purple-400 tracking-wider">
            {highScore ? highScore.initials : 'SET A RECORD'}
          </span>
        </div>
      )}

      {/* 3. IN-PLAY UTILITY BAR — during PLAYING and PAUSED, kept small so it doesn't block the court */}
      {isRoundActive && (
        <div className="w-full max-w-4xl mt-3 flex items-center justify-start gap-2">
          <button
            id="pause-game-btn"
            onClick={onTogglePause}
            className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-lg border backdrop-blur-md transition cursor-pointer ${
              isPaused
                ? 'bg-emerald-500 hover:bg-emerald-400 text-neutral-950 border-emerald-300 font-bold'
                : 'bg-neutral-950/70 hover:bg-neutral-900 text-neutral-300 border-neutral-700'
            }`}
            title={isPaused ? 'Resume the clock [P]' : 'Pause the clock [P]'}
          >
            {isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-neutral-950" />
                RESUME [P]
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                PAUSE [P]
              </>
            )}
          </button>

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
        <div className="w-full max-w-4xl mt-3 bg-neutral-950/90 backdrop-blur-md ink-box rounded-xl p-3 md:p-4 flex flex-wrap items-center justify-between gap-2">
          <span className="text-lg md:text-xl font-street tracking-wide text-red-400">
            THAT'S GAME!
          </span>
          <button
            id="play-again-btn"
            onClick={onStartGame}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-street tracking-wider px-5 py-2 rounded-lg text-lg md:text-xl ink-box transition transform hover:scale-105 active:shadow-none cursor-pointer"
          >
            <Play className="w-4 h-4 fill-neutral-950" />
            RUN IT BACK
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
              className="pointer-events-auto flex flex-col items-center gap-5 bg-neutral-950/90 backdrop-blur-md ink-box rounded-2xl px-10 py-8 md:px-16 md:py-12 -rotate-2"
            >
              <span className="text-cyan-300 flex items-center gap-2 font-street tracking-wide text-lg md:text-2xl text-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                CHECK BALL — 60 SECONDS ON THE CLOCK
              </span>
              <button
                id="start-game-btn"
                onClick={onStartGame}
                className="flex items-center gap-3 bg-[#f97316] hover:bg-[#fb923c] text-neutral-950 font-street tracking-widest px-10 py-4 md:px-16 md:py-6 rounded-xl text-3xl md:text-5xl ink-box transition transform hover:scale-105 active:scale-95 active:shadow-none cursor-pointer"
              >
                <Play className="w-7 h-7 md:w-9 md:h-9 fill-neutral-950" />
                BALL UP
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4b. PAUSED OVERLAY — clock frozen, baskets ignored until resumed */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-4 bg-neutral-950/90 ink-box rounded-2xl px-10 py-8 md:px-14 md:py-10 -rotate-2"
            >
              <span className="text-6xl md:text-8xl leading-none font-street text-cyan-300 tag-shadow-lg">
                TIME OUT
              </span>
              <span className="font-street tracking-widest text-amber-300 text-lg md:text-2xl">
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')} LEFT ON THE CLOCK
              </span>
              <button
                id="resume-game-btn"
                onClick={onTogglePause}
                className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-street tracking-widest px-8 py-3 md:px-12 md:py-4 rounded-xl text-2xl md:text-4xl ink-box transition transform hover:scale-105 active:scale-95 active:shadow-none cursor-pointer"
              >
                <Play className="w-6 h-6 md:w-8 md:h-8 fill-neutral-950" />
                RESUME
              </button>
              <span className="text-[11px] font-mono text-neutral-400">
                Press [P] to resume — baskets don't count while paused
              </span>
              <button onClick={onResetGame} className="text-sm font-mono text-neutral-300 underline">End round</button>
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
              className="text-[10rem] md:text-[14rem] leading-none font-street text-amber-400 ink-thick tag-shadow-lg -rotate-3"
            >
              {countdownValue > 0 ? countdownValue : 'BALL!'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
