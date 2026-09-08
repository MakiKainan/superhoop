import React, { useState, useEffect } from 'react';
import { HighScoreRecord } from '../types';
import { Trophy, Download, Play, Flame, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  score: number;
  streak: number;
  basketsMade: number;
  roundDuration: number;
  highScores: HighScoreRecord[];
  isNewHighScore: boolean;
  onSaveScore: (initials: string) => void;
  onPlayAgain: () => void;
  onExportScores: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  streak,
  basketsMade,
  roundDuration,
  highScores,
  isNewHighScore,
  onSaveScore,
  onPlayAgain,
  onExportScores,
}) => {
  const [initials, setInitials] = useState('AAA');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isNewHighScore || score > 0) {
      try {
        confetti({
          particleCount: 75,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ef4444', '#10b981', '#06b6d4'],
        });
      } catch {
        // Ignore
      }
    }
  }, [isNewHighScore, score]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saved) return;
    onSaveScore(initials);
    setSaved(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col items-center text-center">
        {/* Header Ribbon */}
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 font-chakra font-black text-sm tracking-widest uppercase mb-2">
          <span>TIME EXPIRED</span>
        </div>

        {/* Big Final Score */}
        <h2 className="text-xl font-mono text-neutral-400 font-semibold uppercase tracking-wider">
          FINAL SCORE
        </h2>
        <div className="text-6xl md:text-7xl font-orbitron font-black text-amber-400 text-glow-amber my-1 tracking-tighter">
          {score}
        </div>

        {/* Game stats pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 my-3 text-xs font-mono text-neutral-300">
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Baskets: <strong>{basketsMade}</strong></span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>Max Streak: <strong>{streak}</strong></span>
          </div>
          <div className="bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full">
            <span>Round: <strong>{roundDuration}s</strong></span>
          </div>
        </div>

        {/* High score name entry if applicable */}
        {isNewHighScore && !saved && (
          <form onSubmit={handleSubmit} className="w-full my-3 p-4 bg-amber-950/30 border border-amber-500/50 rounded-2xl flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-amber-300 font-chakra font-black text-sm tracking-wider uppercase mb-2">
              <Award className="w-4 h-4 text-amber-400" />
              NEW TOP 5 RECORD! ENTER INITIALS:
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={3}
                value={initials}
                onChange={e => setInitials(e.target.value.toUpperCase())}
                autoFocus
                className="w-28 text-center text-3xl font-orbitron font-black text-amber-400 bg-black border-2 border-amber-400 rounded-xl py-1 focus:outline-none tracking-widest uppercase shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              />
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-neutral-950 font-chakra font-black px-4 py-2.5 rounded-xl text-sm transition cursor-pointer"
              >
                SAVE RECORD
              </button>
            </div>
          </form>
        )}

        {/* Top 5 Leaderboard Table */}
        <div className="w-full my-3 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3 text-left">
          <div className="flex items-center justify-between font-chakra font-bold text-xs text-neutral-300 uppercase tracking-wider mb-2 px-2">
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              HALL OF FAME (TOP 5)
            </span>
            <button
              onClick={onExportScores}
              className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono transition"
              title="Download highscores.json"
            >
              <Download className="w-3 h-3" />
              EXPORT JSON
            </button>
          </div>

          <div className="space-y-1 text-xs font-mono">
            {highScores.slice(0, 5).map((rec, index) => {
              const isFirst = index === 0;
              return (
                <div
                  key={rec.id || index}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
                    isFirst ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold' : 'bg-neutral-950/60 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-4 font-bold text-neutral-500">#{index + 1}</span>
                    <span className="font-orbitron font-black tracking-wider text-sm">{rec.initials}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] text-neutral-500">{rec.date}</span>
                    <span className="font-orbitron font-black text-amber-400 text-sm w-10 text-right">
                      {rec.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Play Again Action */}
        <button
          onClick={onPlayAgain}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-neutral-950 font-chakra font-black tracking-wider text-base py-3 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.5)] transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Play className="w-5 h-5 fill-neutral-950" />
          PLAY ANOTHER ROUND
        </button>
      </div>
    </div>
  );
};
