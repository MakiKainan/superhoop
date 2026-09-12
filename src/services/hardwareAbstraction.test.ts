import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MockSensorDriver, WebSerialDriver, LineFramer, ISensorDriver } from './hardwareAbstraction';
import { SensorEvent } from '../types';

function collector(driver: ISensorDriver) {
  const events: SensorEvent[] = []; driver.onEvent(event => events.push(event)); return events;
}

test('legacy parser is strict; malformed SCORE prefixes never score', () => {
  let now = 0; const driver = new WebSerialDriver(() => now); const events = collector(driver);
  for (const line of ['SCOREBOARD', 'SCORE:NaN', 'SCORE:3x', 'SCORE:-2', 'SCORE:99', 'SCORE:2:3', 'SCORE:']) {
    driver.parseIncomingLine(line); now += 500;
  }
  assert.equal(events.length, 0);
  for (const line of ['SCORE', 'SCORE:3', 'BASKET', 'GOAL']) { driver.parseIncomingLine(line); now += 500; }
  assert.deepEqual(events.map(event => event.points), [2, 3, 2, 2]);
});

test('raw pin stream is rising-edge triggered, with debounce only on legacy made packets', () => {
  let now = 0; const driver = new WebSerialDriver(() => now); const events = collector(driver);
  driver.parseIncomingLine('HIGH'); now = 1000; driver.parseIncomingLine('HIGH');
  assert.equal(events.length, 1);
  driver.parseIncomingLine('LOW'); driver.parseIncomingLine('HIGH');
  now = 1100; driver.parseIncomingLine('SCORE'); assert.equal(events.length, 2);
  driver.parseIncomingLine('RIM'); driver.parseIncomingLine('MISS'); assert.equal(events.length, 2);
});

test('framer handles fragmented CRLF, many packets, and overlong packet recovery', () => {
  const framer = new LineFramer(); assert.deepEqual(framer.push('SCO'), []);
  assert.deepEqual(framer.push('RE\r\nMISS\nRI'), ['SCORE', 'MISS']);
  assert.deepEqual(framer.push('M\n' + 'x'.repeat(10000) + 'SCORE\nSCORE:3\n'), ['RIM', 'SCORE:3']);
});

test('serial disconnect releases reader lock before closing; repeated connections share a chooser', async () => {
  let requested = 0; let closes = 0;
  class Port extends EventTarget {
    readable = new ReadableStream<Uint8Array>();
    async open() {}
    async close() { assert.equal(this.readable.locked, false); closes++; }
  }
  const port = new Port(); const api = Object.assign(new EventTarget(), { requestPort: async () => { requested++; return port; } });
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serial: api } });
  try {
    const driver = new WebSerialDriver();
    const first = driver.connect(), second = driver.connect();
    assert.equal(first, second); assert.equal(await first, true); assert.equal(requested, 1);
    await driver.disconnect(); assert.equal(closes, 1); assert.equal(driver.getStatus().connected, false);
  } finally { if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor); }
});

test('cleanup invalidates a pending port chooser', async () => {
  let choose!: (port: Port) => void; let opens = 0;
  class Port extends EventTarget {
    readable = new ReadableStream<Uint8Array>();
    async open() { opens++; } async close() {}
  }
  const api = Object.assign(new EventTarget(), { requestPort: () => new Promise<Port>(resolve => { choose = resolve; }) });
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { serial: api } });
  try {
    const driver = new WebSerialDriver(); const pending = driver.connect(); driver.cleanup(); choose(new Port());
    assert.equal(await pending, false); assert.equal(opens, 0); assert.equal(driver.getStatus().connected, false);
  } finally { if (descriptor) Object.defineProperty(globalThis, 'navigator', descriptor); }
});

test('mock delivers rapid baskets once and cleanup removes listeners', () => {
  const driver = new MockSensorDriver(() => 0); const events = collector(driver);
  for (let i = 0; i < 100; i++) driver.simulateScore();
  assert.equal(events.length, 100); assert.equal(new Set(events.map(e => e.id)).size, 100);
  assert.equal(events[0].source, 'SIMULATOR_UI');
  driver.cleanup(); driver.simulateScore(); assert.equal(events.length, 100);
});
