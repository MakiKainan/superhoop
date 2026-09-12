import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ScoreStorageService } from './scoreStorage';

function storage() {
  const values = new Map<string, string>();
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  return { values, restore() {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  } };
}

test('loading filters invalid records and saving does not mutate caller order', () => {
  const fixture = storage();
  try {
    fixture.values.set('ARCADE_HOOP_HIGHSCORES_V1', JSON.stringify([null, { score: -1 },
      { id: 'ok', initials: 'AAA', score: 10, date: '2026-09-12', durationSeconds: 60 }]));
    const scores = ScoreStorageService.loadHighScores(); assert.equal(scores.length, 1);
    const input = [scores[0], { ...scores[0], id: 'higher', score: 20 }];
    ScoreStorageService.saveHighScores(input);
    assert.equal(input[0].score, 10); assert.equal(ScoreStorageService.loadHighScores()[0].score, 20);
  } finally { fixture.restore(); }
});
