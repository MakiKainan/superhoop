import type { HoopCalibration } from '../types';

/** Position the whole bubble outside the rotated board, with room for its pop/float.
 * Narrow screens use the space below the net, then above the board if necessary. */
export function feedbackPlacement(board: HoopCalibration, viewport: { width: number; height: number }) {
  const radians = board.rotationDeg * Math.PI / 180;
  const halfWidth = (Math.abs(Math.cos(radians)) * board.widthPx + Math.abs(Math.sin(radians)) * board.heightPx) / 2;
  const halfHeight = (Math.abs(Math.sin(radians)) * board.widthPx + Math.abs(Math.cos(radians)) * board.heightPx) / 2;
  const centerX = viewport.width * board.xPercent / 100;
  const centerY = viewport.height * board.yPercent / 100;
  const width = Math.min(156, Math.max(80, viewport.width - 40));
  const height = 232; // Three 72px bubbles with 8px spacing, including a rapid burst.
  const gap = 24;
  const clampX = (x: number) => Math.max(20, Math.min(viewport.width - width - 20, x));
  const clampY = (y: number) => Math.max(20, Math.min(viewport.height - height - 20, y));
  const besideY = clampY(centerY - height / 2);
  const right = centerX + halfWidth + gap;
  const left = centerX - halfWidth - gap - width;
  if (right + width <= viewport.width - 20) return { x: right, y: besideY, width, direction: -1 };
  if (left >= 20) return { x: left, y: besideY, width, direction: -1 };
  // Allow for the net extending below the board's rectangle.
  const below = centerY + halfHeight + board.rimDiameterPx * .85 + gap;
  if (below + height <= viewport.height - 20) {
    return { x: clampX(centerX - width / 2), y: below, width, direction: 1 };
  }
  const above = centerY - halfHeight - gap - height;
  if (above >= 20) return { x: clampX(centerX - width / 2), y: above, width, direction: -1 };
  // An oversized custom calibration can leave no safe space. Don't cover its rim.
  return null;
}
