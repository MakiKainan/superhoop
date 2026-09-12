import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { GameState } from '../types';
import { SessionStore } from '../game/sessionStore';
import { audioEngine } from '../services/audioEngine';
import { subscribeOnFrame } from '../game/frameSubscription';

export function useSession(store: SessionStore) {
  const subscribeToFrames = useCallback((listener: () => void) => subscribeOnFrame(store.subscribe, listener), [store]);
  const snapshot = useSyncExternalStore(subscribeToFrames, store.getSnapshot);
  useEffect(() => {
    let previous = store.getSnapshot();
    let lastFeedbackAt = -Infinity;
    const unsubscribe = store.subscribe(() => {
      const next = store.getSnapshot();
      const now = performance.now();
      if (next.phase === GameState.GAMEOVER && previous.phase !== GameState.GAMEOVER) audioEngine.playBuzzer();
      else if (next.phase === GameState.COUNTDOWN && (next.phase !== previous.phase || next.countdownValue !== previous.countdownValue)) audioEngine.playCountdownBeep(false);
      else if (next.phase === GameState.PLAYING && previous.phase === GameState.COUNTDOWN) audioEngine.playCountdownBeep(true);
      else if (next.phase === GameState.PLAYING && next.timeRemaining <= 3 && next.timeRemaining > 0 && next.timeRemaining !== previous.timeRemaining) audioEngine.playCountdownBeep(false);
      if (next.basketsMade > previous.basketsMade && now - lastFeedbackAt >= 60) {
        lastFeedbackAt = now;
        if (next.streak === 3) audioEngine.playOnFire();
        else audioEngine.playScorePing(next.streak);
      }
      previous = next;
    });
    const timer = setInterval(() => {
      const phase = store.getSnapshot().phase;
      if (phase === GameState.PLAYING || phase === GameState.COUNTDOWN) store.tick();
    }, 50);
    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [store]);
  return snapshot;
}
