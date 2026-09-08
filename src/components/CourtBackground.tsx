import React from 'react';
import { CourtThemeId } from '../types';

interface CourtBackgroundProps {
  themeId: CourtThemeId;
}

export const CourtBackground: React.FC<CourtBackgroundProps> = ({ themeId }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {themeId === 'sunset_cliff' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#ff4520] via-[#c0392b] via-45% to-[#1a1423]">
          {/* Deep sunset sky atmosphere */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,165,0,0.55)_0%,rgba(220,38,38,0.3)_45%,transparent_75%)]" />

          {/* Sunset sun glow near horizon */}
          <div className="absolute top-[48%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-t from-[#ff7a00] via-[#ffaa40]/40 to-transparent blur-3xl opacity-70" />

          {/* Distant ocean water */}
          <div className="absolute top-[52%] left-0 right-0 h-[14%] bg-gradient-to-b from-[#2b2b3a] via-[#1f1b2e] to-[#120f1a] opacity-90 border-t border-amber-400/20">
            {/* Distant ship / island silhouette */}
            <div className="absolute top-2 right-[28%] w-16 h-1.5 bg-neutral-900/60 rounded-full blur-[0.5px]" />
          </div>

          {/* Sunset dusk clouds */}
          <svg className="absolute top-[35%] left-0 w-full h-32 opacity-40 mix-blend-screen" preserveAspectRatio="none" viewBox="0 0 1200 120">
            <path d="M0,60 C150,20 350,90 500,40 C650,80 850,20 1000,50 C1100,70 1180,30 1200,45 L1200,120 L0,120 Z" fill="#b91c1c" />
            <path d="M0,80 C200,50 400,100 650,60 C800,90 1050,40 1200,70 L1200,120 L0,120 Z" fill="#4c0519" />
          </svg>

          {/* Grassy cliff embankment */}
          <div className="absolute top-[64%] left-0 right-0 h-[8%] bg-gradient-to-r from-[#1b3022] via-[#243e2b] to-[#1a2e20] transform -skew-y-1 shadow-lg" />

          {/* Court pavement surface */}
          <div className="absolute top-[69%] left-0 right-0 bottom-0 bg-gradient-to-b from-[#333538] via-[#242528] to-[#141517]">
            {/* Perspective court lines */}
            <svg className="absolute inset-0 w-full h-full opacity-60" preserveAspectRatio="none" viewBox="0 0 1000 400">
              {/* Baseline */}
              <line x1="100" y1="20" x2="900" y2="20" stroke="#f1f5f9" strokeWidth="3" />
              {/* Three point arc / lane markers */}
              <path d="M 220,400 L 320,20" stroke="#cbd5e1" strokeWidth="2.5" />
              <path d="M 780,400 L 680,20" stroke="#cbd5e1" strokeWidth="2.5" />
              <path d="M 400,20 L 400,180 L 600,180 L 600,20" stroke="#ffffff" strokeWidth="3" fill="none" />
              {/* Free throw key circle */}
              <ellipse cx="500" cy="180" rx="90" ry="35" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeDasharray="6,6" />
            </svg>
          </div>

          {/* Iconic curved goal pole supporting the backboard */}
          <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 pointer-events-none opacity-85 flex flex-col items-center">
            <svg width="180" height="280" viewBox="0 0 180 280" fill="none" className="drop-shadow-2xl">
              {/* Realistic curved metal pole arch */}
              <path
                d="M 80,280 C 80,180 92,90 90,0 L 102,0 C 104,90 96,180 96,280 Z"
                fill="url(#sunsetPoleGradient)"
              />
              <defs>
                <linearGradient id="sunsetPoleGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="40%" stopColor="#cbd5e1" />
                  <stop offset="70%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}

      {themeId === 'day_pacific' && (
        <div className="relative w-full h-full bg-gradient-to-b from-[#1da1f2] via-[#5ac8fa] via-40% to-[#0b6375]">
          {/* Bright daytime sun */}
          <div className="absolute top-[8%] right-[15%] w-36 h-36 bg-amber-100 rounded-full blur-2xl opacity-60" />

          {/* Distant islands & turquoise Pacific ocean */}
          <div className="absolute top-[46%] left-0 right-0 h-[18%] bg-gradient-to-b from-[#0ea5e9] via-[#0284c7] to-[#0369a1] opacity-95 border-t border-sky-200/40">
            {/* Distant Santa Catalina island silhouette */}
            <svg className="absolute -top-3 left-[15%] w-[450px] h-6 opacity-30" viewBox="0 0 450 30" preserveAspectRatio="none">
              <path d="M0,30 Q80,5 180,12 T340,8 Q400,20 450,30 Z" fill="#1e3a8a" />
            </svg>
          </div>

          {/* Grassy ridge with twin coastal palm trees (like photo 2) */}
          <div className="absolute top-[59%] left-0 right-0 h-[9%] bg-gradient-to-r from-[#ca8a04] via-[#a16207] to-[#854d0e] transform -skew-y-1">
            {/* Two palm trees on the right cliff edge */}
            <div className="absolute right-[22%] -top-12 opacity-80">
              <svg width="40" height="50" viewBox="0 0 40 50" fill="#2d3748">
                <path d="M18,50 Q20,30 22,12" stroke="#4a5568" strokeWidth="2.5" fill="none" />
                <path d="M22,12 Q10,5 4,14 M22,12 Q30,4 36,15 M22,12 Q24,0 20,-2 M22,12 Q12,18 6,24 M22,12 Q32,18 38,24" stroke="#1c4532" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <div className="absolute right-[16%] -top-10 opacity-75">
              <svg width="34" height="44" viewBox="0 0 40 50" fill="#2d3748">
                <path d="M18,50 Q19,30 20,12" stroke="#4a5568" strokeWidth="2" fill="none" />
                <path d="M20,12 Q10,5 5,14 M20,12 Q28,4 34,15 M20,12 Q22,0 18,-2" stroke="#1c4532" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>

          {/* Asphalt Court Pavement */}
          <div className="absolute top-[67%] left-0 right-0 bottom-0 bg-gradient-to-b from-[#475569] via-[#334155] to-[#1e293b]">
            <svg className="absolute inset-0 w-full h-full opacity-80" preserveAspectRatio="none" viewBox="0 0 1000 400">
              <line x1="60" y1="20" x2="940" y2="20" stroke="#f8fafc" strokeWidth="4" />
              <path d="M 180,400 L 300,20" stroke="#f8fafc" strokeWidth="3" />
              <path d="M 820,400 L 700,20" stroke="#f8fafc" strokeWidth="3" />
              <path d="M 380,20 L 380,190 L 620,190 L 620,20" stroke="#f8fafc" strokeWidth="3.5" fill="none" />
              <ellipse cx="500" cy="190" rx="95" ry="36" stroke="#f8fafc" strokeWidth="3" fill="none" />
            </svg>
          </div>

          {/* Curved steel pole */}
          <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 pointer-events-none opacity-90 flex flex-col items-center">
            <svg width="180" height="280" viewBox="0 0 180 280" fill="none">
              <path
                d="M 80,280 C 80,180 92,90 90,0 L 102,0 C 104,90 96,180 96,280 Z"
                fill="url(#dayPoleGradient)"
              />
              <defs>
                <linearGradient id="dayPoleGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="45%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      )}

      {themeId === 'cyber_neon' && (
        <div className="relative w-full h-full bg-[#07090e]">
          {/* Neon grid horizon */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(6,182,212,0.15)_0%,rgba(168,85,247,0.08)_50%,transparent_85%)]" />

          {/* Cyber stadium lights */}
          <div className="absolute top-0 left-0 right-0 h-40 flex justify-between px-16 pointer-events-none opacity-40">
            <div className="w-96 h-96 bg-cyan-500/20 blur-3xl rounded-full -translate-y-1/2 -translate-x-1/4" />
            <div className="w-96 h-96 bg-fuchsia-500/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />
          </div>

          {/* Tron/Synthwave 3D Perspective Grid Court */}
          <div className="absolute top-[58%] left-0 right-0 bottom-0 bg-neutral-950 overflow-hidden border-t-2 border-cyan-400/40">
            <div
              className="w-full h-[300%] -translate-y-1/4 origin-top"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(6, 182, 212, 0.35) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(236, 72, 153, 0.35) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
                transform: 'perspective(500px) rotateX(60deg)',
              }}
            />
            {/* Glowing neon court lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 400">
              <ellipse cx="500" cy="180" rx="140" ry="50" stroke="#06b6d4" strokeWidth="2" fill="none" className="drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              <line x1="500" y1="0" x2="500" y2="400" stroke="#ec4899" strokeWidth="2" strokeDasharray="8,8" />
            </svg>
          </div>
        </div>
      )}

      {themeId === 'indoor_arena' && (
        <div className="relative w-full h-full bg-neutral-950">
          {/* Stadium rafter lights */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,0.18)_0%,rgba(0,0,0,0.85)_75%)]" />

          {/* Crowd silhouettes in dark arena stands */}
          <div className="absolute top-[35%] left-0 right-0 h-[22%] bg-neutral-900/90 flex flex-wrap items-center justify-around opacity-30 overflow-hidden px-4">
            <div className="w-full h-full bg-[radial-gradient(#52525b_1px,transparent_1px)] [background-size:8px_8px]" />
          </div>

          {/* Golden maple hardwood floor */}
          <div className="absolute top-[56%] left-0 right-0 bottom-0 bg-gradient-to-b from-[#d97706]/90 via-[#b45309] to-[#78350f] border-t-2 border-amber-300/40">
            {/* Hardwood floor planks pattern */}
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #451a03 0px, #451a03 2px, transparent 2px, transparent 40px)',
              }}
            />
            {/* Painted court markings */}
            <svg className="absolute inset-0 w-full h-full opacity-80" preserveAspectRatio="none" viewBox="0 0 1000 400">
              <path d="M 360,0 L 360,200 L 640,200 L 640,0" stroke="#ffffff" strokeWidth="4" fill="rgba(220,38,38,0.25)" />
              <ellipse cx="500" cy="200" rx="110" ry="40" stroke="#ffffff" strokeWidth="3" fill="none" />
              <path d="M 200,400 Q 500,100 800,400" stroke="#ffffff" strokeWidth="4" fill="none" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
