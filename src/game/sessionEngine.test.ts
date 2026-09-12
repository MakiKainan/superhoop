import { subscribeOnFrame } from './frameSubscription';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState, SensorEvent } from '../types';
import { SessionStore } from './sessionStore';
import { createSession, transition } from './sessionEngine';

function setup() {
  let now = 0;
  let id = 0;
  const store = new SessionStore(() => now);
  store.start();
  const at = (time: number) => { now = time; };
  const shot = (overrides: Partial<SensorEvent> = {}) => {
    const event: SensorEvent = { id: String(++id), timestamp: now, points: 2,
      source: 'SIMULATOR_UI', rawPayload: 'test', ...overrides };
    store.receive(event);
    return event;
  };
  return { store, at, shot, state: store.getSnapshot };
}

test('3-second preparation catches up without waiting for an interval', () => {
  const { store, at, shot, state } = setup();
  at(2999); shot(); assert.equal(state().score, 0);
  at(3000); shot(); assert.equal(state().phase, GameState.PLAYING); assert.equal(state().score, 2);
  at(6500); store.tick(); assert.equal(state().timeRemaining, 57);
});

test('1000 same-timestamp shots tally atomically with unique bounded feedback', () => {
  const { at, shot, state } = setup(); at(3000);
  for (let i = 0; i < 1000; i++) shot();
  assert.equal(state().score, 2998); assert.equal(state().streak, 1000);
  assert.equal(state().basketsMade, 1000); assert.equal(state().feedback.length, 12);
  assert.equal(new Set(state().feedback.map(item => item.id)).size, 12);
});

test('round deadline wins at the exact boundary even without a tick', () => {
  const { store, at, shot, state } = setup();
  at(62999); shot(); assert.equal(state().score, 2);
  at(63000); shot(); assert.equal(state().score, 2); assert.equal(state().phase, GameState.GAMEOVER);
  const final = state(); store.tick(); shot(); assert.equal(state(), final);
});

test('a delayed prep callback cannot extend the round', () => {
  const { at, shot, state } = setup(); at(70000); shot();
  assert.equal(state().phase, GameState.GAMEOVER); assert.equal(state().score, 0);
});

test('pause immediately excludes events; resume preserves fractional round time and the streak window', () => {
  const { store, at, shot, state } = setup();
  at(4000); shot(); at(5250); store.pause(); shot();
  assert.equal(state().score, 2); assert.equal(state().timeRemaining, 58);
  at(100000); store.resume(); shot(); assert.equal(state().score, 2);
  at(103000); shot(); assert.equal(state().streak, 2);
  at(103750); store.tick(); assert.equal(state().timeRemaining, 57);
});

test('pause at expiry ends the round and cannot resurrect it', () => {
  const { store, at, state } = setup(); at(63000); store.pause(); store.resume();
  assert.equal(state().phase, GameState.GAMEOVER);
});

test('repeated start/resume calls do not restart active countdowns', () => {
  const { store, at, state } = setup(); at(1000); store.start();
  at(3000); store.tick(); assert.equal(state().phase, GameState.PLAYING);
  store.pause(); store.resume(); at(4000); store.resume();
  at(6000); store.tick(); assert.equal(state().phase, GameState.PLAYING);
});

test('preparation can be paused and reset invalidates old session deliveries', () => {
  const { store, at, shot, state } = setup(); at(1000); store.pause();
  assert.equal(state().phase, GameState.PAUSED);
  const oldSession = state().sessionId;
  store.reset(); store.start(); at(4000);
  store.receive({ id: 'old', timestamp: 4000, points: 2, source: 'SIMULATOR_UI', rawPayload: '' }, oldSession);
  assert.equal(state().score, 0); shot(); assert.equal(state().streak, 1);
});

test('duplicate IDs count once and a paused event cannot replay on resume', () => {
  const { store, at, shot, state } = setup(); at(3000);
  const event = shot(); store.receive(event); assert.equal(state().score, 2);
  store.pause(); const paused = shot(); store.resume(); at(6000);
  store.receive({ ...paused, timestamp: 6000 }); assert.equal(state().score, 2);
});

test('malformed, future and out-of-order events are rejected', () => {
  const { at, shot, state } = setup(); at(4000); shot();
  shot({ timestamp: 3999 }); shot({ timestamp: 4001 });
  for (const points of [NaN, Infinity, -2, 2.5, 99]) shot({ points });
  shot({ id: '' });
  assert.equal(state().score, 2);
});

test('stale pre-pause packets cannot score in the resumed leg', () => {
  const { store, at, shot, state } = setup(); at(4000); store.pause(); store.resume();
  at(7000); shot({ timestamp: 3999 }); assert.equal(state().score, 0);
});

test('streak and bonus expire at exactly 3 seconds without another make', () => {
  const { store, at, shot, state } = setup(); at(3000); shot(); shot();
  at(5999); store.tick(); assert.equal(state().streak, 2);
  at(6000); store.tick(); assert.equal(state().streak, 0);
  shot(); assert.equal(state().score, 6);
});

test('a make at the deadline starts a fresh streak without a preceding tick', () => {
  const { at, shot, state } = setup(); at(3000); shot(); shot(); shot();
  assert.equal(state().score, 7);
  at(6000); shot();
  assert.equal(state().streak, 1); assert.equal(state().score, 9);
  assert.equal(state().maxStreak, 3);
});

test('each make before timeout refreshes the full 3-second deadline', () => {
  const { store, at, shot, state } = setup(); at(3000); shot();
  at(5999); shot(); at(8998); shot();
  assert.equal(state().streak, 3); assert.equal(state().score, 7);
  at(11997); store.tick(); assert.equal(state().streak, 3);
  at(11998); store.tick(); assert.equal(state().streak, 0);
});

test('duplicate and invalid events cannot extend a streak deadline', () => {
  const { store, at, shot, state } = setup(); at(3000); const first = shot();
  at(5500); store.receive({ ...first, timestamp: 5500 }); shot({ points: NaN });
  at(6000); store.tick(); assert.equal(state().streak, 0);
  assert.equal(state().basketsMade, 1);
});

test('pause and preparation preserve exactly the remaining streak time', () => {
  const { store, at, shot, state } = setup(); at(4000); shot(); shot(); shot();
  at(5250); store.pause(); at(100000); store.resume();
  at(104749); store.tick(); assert.equal(state().streak, 3);
  at(104750); store.tick(); assert.equal(state().streak, 0);
  shot(); assert.equal(state().score, 9);
});

test('subsecond ticks reuse the cached React snapshot', () => {
  const { store, at, state } = setup(); at(3001); store.tick();
  const before = state(); let notifications = 0;
  const stop = store.subscribe(() => notifications++);
  for (let time = 3050; time < 4000; time += 50) { at(time); store.tick(); }
  assert.equal(state(), before); assert.equal(notifications, 0); stop();
});

test('reentrant observers enqueue commands without losing a shot', () => {
  const { store, at, shot, state } = setup(); at(3000);
  const stop = store.subscribe(() => { if (state().basketsMade === 1) shot(); });
  shot(); stop(); assert.equal(state().basketsMade, 2); assert.equal(state().score, 4);
});

test('UI notifications coalesce bursts per frame without delaying engine state', () => {
  const { store, at, shot, state } = setup(); at(3000);
  const frames = new Map<number, () => void>(); let id = 0; let notifications = 0;
  const stop = subscribeOnFrame(store.subscribe, () => notifications++, callback => { frames.set(++id, callback); return id; }, key => { frames.delete(key); });
  for (let i = 0; i < 1000; i++) shot();
  assert.equal(state().score, 2998); assert.equal(notifications, 0); assert.equal(frames.size, 1);
  const callback = frames.get(1)!; frames.delete(1); callback(); assert.equal(notifications, 1);
  shot(); assert.equal(frames.size, 1); stop(); assert.equal(frames.size, 0);
  shot(); assert.equal(frames.size, 0);
});

test('invalid runtime payloads cannot crash the store', () => {
  const { store, at, shot, state } = setup(); at(3000);
  for (const event of [null, undefined, {}, { id: 'bad' }]) store.receive(event as SensorEvent);
  shot(); assert.equal(state().score, 2);
});


test('pure transitions leave the previous session unchanged', () => {
  const initial = createSession(); const copy = structuredClone(initial);
  transition(initial, { type: 'start' }, 0); assert.deepEqual(initial, copy);
});
