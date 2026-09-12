import { memo, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { GameState, type HoopCalibration } from '../types';
import type { ScoreFeedback } from '../game/sessionEngine';
import { feedbackPlacement } from './feedbackLayout';

interface BasketFeedbackProps {
  calibration: HoopCalibration;
  feedback: readonly ScoreFeedback[];
  phase: GameState;
}

/** A bounded presentation queue. Every make scores; only recent bubbles are drawn. */
export const BasketFeedback = memo(function BasketFeedback({ calibration, feedback, phase }: BasketFeedbackProps) {
  const lastId = useRef(0);
  const [bubbles, setBubbles] = useState<readonly ScoreFeedback[]>([]);
  const [viewport, setViewport] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    const resize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  useEffect(() => {
    const pending = feedback.filter(item => item.id > lastId.current);
    if (pending.length) lastId.current = pending[pending.length - 1].id;
    if (phase !== GameState.PLAYING) { setBubbles([]); return; }
    // Three stable slots prevent rapid makes from stacking text on the same spot.
    if (pending.length) setBubbles(previous => [...previous, ...pending].slice(-3));
  }, [feedback, phase]);

  const anchor = feedbackPlacement(calibration, viewport);
  if (!anchor) return null;
  return (
    <div className="basket-feedback fixed pointer-events-none select-none z-[35]" aria-hidden="true"
      style={{ left: anchor.x, top: anchor.y, width: anchor.width }}>
      {bubbles.map(bubble => {
        const callout = bubble.streak >= 3 ? 'On Fire!' : bubble.id % 2 ? 'Woww!' : 'Awesome!!';
        const slotY = (bubble.id % 3) * 80;
        // Float away from the board; stop before either viewport edge.
        const available = anchor.direction > 0 ? viewport.height - anchor.y - 252 : anchor.y - 20;
        const travel = Math.min(48, Math.max(0, available)) * anchor.direction;
        return (
          <motion.div key={bubble.id} className="basket-feedback-bubble absolute inset-x-0 flex flex-col items-center" style={{ top: slotY }}
            initial={{ opacity: 0, scale: reducedMotion ? 1 : .65, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: reducedMotion ? 1 : [.65, 1.06, 1, 1], y: reducedMotion ? 0 : [0, 0, travel * .6, travel] }}
            transition={{ duration: reducedMotion ? .8 : 1.25, times: [0, .16, .65, 1], ease: 'easeOut' }}
            onAnimationComplete={() => setBubbles(previous => previous.filter(item => item.id !== bubble.id))}>
            <span className="font-score text-xl px-3 py-0.5 rounded-full border-2 border-amber-200 bg-amber-400 text-neutral-950 shadow-md">+{bubble.points}</span>
            <span className={`font-street text-2xl leading-tight mt-1 px-2 rounded-lg border-2 border-neutral-950 shadow-md ${bubble.streak >= 3 ? 'bg-orange-600 text-amber-100' : 'bg-neutral-950 text-amber-300'}`}>{callout}</span>
          </motion.div>
        );
      })}
    </div>
  );
});
