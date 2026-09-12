import { GameState, SensorEvent } from '../types';

// One game only. Keep its existing rules together so the team can explain them.
export const ROUND_DURATION_MS = 60_000;
export const PREPARATION_MS = 3_000;
// Every accepted make refreshes this active-play deadline. At the boundary the
// old streak expires BEFORE scoring, even if the periodic UI tick arrives late.
export const STREAK_WINDOW_MS = 3_000;

export interface ScoreFeedback { id: number; points: number; streak: number }
export interface Session {
  sessionId: number;
  phase: GameState;
  score: number;
  basketsMade: number;
  streak: number;
  maxStreak: number;
  activeMs: number;
  lastMadeActiveMs: number | null;
  lastNow: number;
  activeSince: number;
  preparationDeadline: number;
  feedback: readonly ScoreFeedback[];
  feedbackSequence: number;
}
export type Command =
  | { type: 'start' | 'reset' | 'tick' | 'pause' | 'resume' }
  | { type: 'sensor'; sessionId: number; event: SensorEvent };

export function createSession(sessionId = 0): Session {
  return {
    sessionId, phase: GameState.IDLE, score: 0, basketsMade: 0, streak: 0, maxStreak: 0,
    activeMs: 0, lastMadeActiveMs: null, lastNow: 0, activeSince: 0,
    preparationDeadline: 0, feedback: Object.freeze([]), feedbackSequence: 0,
  };
}

// Check elapsed time before every action, including a basket arriving between timer ticks.
function advance(session: Session, now: number): Session {
  let s = session;
  if (s.phase === GameState.COUNTDOWN && now >= s.preparationDeadline) {
    s = { ...s, phase: GameState.PLAYING, activeSince: s.preparationDeadline, lastNow: s.preparationDeadline };
  }
  if (s.phase !== GameState.PLAYING) return s;
  const activeMs = s.activeMs + Math.max(0, now - s.lastNow);
  s = { ...s, activeMs, lastNow: now };
  if (activeMs >= ROUND_DURATION_MS) {
    return { ...s, activeMs: ROUND_DURATION_MS, phase: GameState.GAMEOVER };
  }
  if (s.lastMadeActiveMs !== null && activeMs - s.lastMadeActiveMs >= STREAK_WINDOW_MS) {
    s = { ...s, streak: 0, lastMadeActiveMs: null };
  }
  return s;
}

export function validSensorEvent(event: SensorEvent): boolean {
  return !!event && typeof event.id === 'string' && event.id.length > 0 && event.id.length <= 160 &&
    ['SIMULATOR_UI', 'SIMULATOR_KEYBOARD', 'SERIAL_ARDUINO'].includes(event.source) &&
    typeof event.rawPayload === 'string' && event.rawPayload.length <= 512 &&
    Number.isFinite(event.timestamp) && event.timestamp >= 0 && [1, 2, 3].includes(event.points);
}

/** Input: previous session + one action + time. Output: next session. No UI or side effects. */
export function transition(session: Session, command: Command, timestamp: number): Session {
  if (!Number.isFinite(timestamp)) return session;
  const now = Math.max(session.lastNow, timestamp);
  const s = advance(session, now);
  switch (command.type) {
    case 'start':
      if (s.phase !== GameState.IDLE && s.phase !== GameState.GAMEOVER) return s;
      return { ...createSession(s.sessionId + 1), phase: GameState.COUNTDOWN,
        lastNow: now, preparationDeadline: now + PREPARATION_MS };
    case 'reset': return { ...createSession(s.sessionId + 1), lastNow: now };
    case 'pause':
      return s.phase === GameState.PLAYING || s.phase === GameState.COUNTDOWN ? { ...s, phase: GameState.PAUSED } : s;
    case 'resume':
      // activeMs is frozen during pause/preparation, preserving fractional time and the streak window.
      return s.phase === GameState.PAUSED
        ? { ...s, phase: GameState.COUNTDOWN, lastNow: now, preparationDeadline: now + PREPARATION_MS } : s;
    case 'tick': return s;
    case 'sensor': {
      const event = command.event;
      if (s.phase !== GameState.PLAYING || command.sessionId !== s.sessionId || !validSensorEvent(event) ||
        event.timestamp < s.activeSince || event.timestamp > now) return s;
      const streak = s.streak + 1;
      const points = event.points + (streak >= 3 ? 1 : 0);
      const feedbackSequence = s.feedbackSequence + 1;
      return { ...s, score: s.score + points, basketsMade: s.basketsMade + 1,
        streak, maxStreak: Math.max(s.maxStreak, streak), lastMadeActiveMs: s.activeMs, feedbackSequence,
        // Limit screen effects, never the score. IDs remain unique for same-millisecond baskets.
        feedback: Object.freeze([...s.feedback.slice(-11), Object.freeze({ id: feedbackSequence, points, streak })]),
      };
    }
  }
}
