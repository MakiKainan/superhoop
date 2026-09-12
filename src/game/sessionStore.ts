import { GameState, SensorEvent } from '../types';
import { Command, createSession, ROUND_DURATION_MS, Session, transition, validSensorEvent } from './sessionEngine';

export interface SessionSnapshot {
  sessionId: number;
  phase: GameState;
  score: number;
  streak: number;
  maxStreak: number;
  basketsMade: number;
  timeRemaining: number;
  countdownValue: number;
  feedback: Session['feedback'];
}

function project(s: Session, now: number): SessionSnapshot {
  return {
    sessionId: s.sessionId, phase: s.phase, score: s.score,
    streak: s.streak, maxStreak: s.maxStreak, basketsMade: s.basketsMade,
    feedback: s.feedback,
    timeRemaining: Math.ceil(Math.max(0, ROUND_DURATION_MS - s.activeMs) / 1000),
    countdownValue: s.phase === GameState.COUNTDOWN ? Math.ceil(Math.max(0, s.preparationDeadline - now) / 1000) : 0,
  };
}

/** Synchronous command serialization, cached React snapshots and session-wide retry protection. */
export class SessionStore {
  private session = createSession();
  private snapshot = project(this.session, 0);
  private listeners = new Set<() => void>();
  private seen = new Set<string>();
  private lastEventTime = -Infinity;
  private queue: Command[] = [];
  private dispatching = false;
  constructor(private readonly clock: () => number = () => performance.now()) {}

  getSnapshot = (): SessionSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  start = () => this.dispatch({ type: 'start' });
  reset = () => this.dispatch({ type: 'reset' });
  tick = () => this.dispatch({ type: 'tick' });
  pause = () => this.dispatch({ type: 'pause' });
  resume = () => this.dispatch({ type: 'resume' });
  togglePause = () => this.dispatch({ type: this.session.phase === GameState.PAUSED ? 'resume' : 'pause' });
  receive = (event: SensorEvent, sessionId = this.session.sessionId) => this.dispatch({ type: 'sensor', event, sessionId });

  dispatch = (command: Command) => {
    this.queue.push(command);
    if (this.dispatching) return;
    this.dispatching = true;
    try {
      while (this.queue.length) {
        let next = this.queue.shift()!;
        const now = Math.max(this.session.lastNow, this.clock());
        if (next.type === 'sensor') {
          const { event, sessionId } = next;
          const key = event && `${event.source}:${event.id}`;
          // Fail closed at the cap; never evict old IDs and permit replay in a long session.
          if (sessionId !== this.session.sessionId || !validSensorEvent(event) || event.timestamp > now ||
            event.timestamp < this.lastEventTime || this.seen.has(key) || this.seen.size >= 100_000) {
            next = { type: 'tick' };
          } else {
            this.seen.add(key);
            this.lastEventTime = event.timestamp;
          }
        }
        const previousId = this.session.sessionId;
        this.session = transition(this.session, next, now);
        if (previousId !== this.session.sessionId) {
          this.seen.clear();
          this.lastEventTime = -Infinity;
        }
        const snapshot = project(this.session, now);
        if (Object.keys(snapshot).some(key => !Object.is(snapshot[key as keyof SessionSnapshot], this.snapshot[key as keyof SessionSnapshot]))) {
          this.snapshot = Object.freeze(snapshot);
          for (const listener of [...this.listeners]) listener();
        }
      }
    } finally {
      this.dispatching = false;
    }
  };
}
