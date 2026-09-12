import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CALIBRATION } from '../services/scoreStorage';
import { feedbackPlacement } from './feedbackLayout';

test('desktop feedback starts beyond the backboard perimeter', () => {
  const viewport = { width: 1280, height: 720 };
  const anchor = feedbackPlacement(DEFAULT_CALIBRATION, viewport)!;
  assert.ok(anchor.x > viewport.width / 2 + DEFAULT_CALIBRATION.widthPx / 2);
  assert.ok(anchor.x + anchor.width < viewport.width);
});

test('narrow screens put feedback below both the backboard and net', () => {
  const viewport = { width: 390, height: 844 };
  const anchor = feedbackPlacement(DEFAULT_CALIBRATION, viewport)!;
  assert.equal(anchor.direction, 1);
  assert.ok(anchor.y > viewport.height * DEFAULT_CALIBRATION.yPercent / 100 + DEFAULT_CALIBRATION.heightPx / 2 + DEFAULT_CALIBRATION.rimDiameterPx * .85);
  assert.ok(anchor.x >= 0 && anchor.x + anchor.width <= viewport.width);
});

test('rotated and off-center boards use the available side', () => {
  const board = { ...DEFAULT_CALIBRATION, xPercent: 85, rotationDeg: 30 };
  const anchor = feedbackPlacement(board, { width: 1280, height: 720 })!;
  const leftEdge = 1280 * .85 - (Math.cos(Math.PI / 6) * board.widthPx + Math.sin(Math.PI / 6) * board.heightPx) / 2;
  assert.ok(anchor.x + anchor.width < leftEdge);
});

test('a calibration covering the screen suppresses bubbles instead of covering the rim', () => {
  assert.equal(feedbackPlacement({ ...DEFAULT_CALIBRATION, widthPx: 1200, heightPx: 1200 }, { width: 390, height: 844 }), null);
});
