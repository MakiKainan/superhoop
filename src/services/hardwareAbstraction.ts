import { SensorEvent, SensorSource, SerialStatus } from '../types';

export type SensorListener = (event: SensorEvent) => void;
export type StatusListener = (status: SerialStatus) => void;
export interface ISensorDriver {
  name: string;
  init(): void;
  cleanup(): void;
  onEvent(listener: SensorListener): () => void;
  getStatus(): SerialStatus;
  connect?(): Promise<boolean>;
  disconnect?(): Promise<void>;
  onStatusChange?(listener: StatusListener): () => void;
}

export function isInteractiveTarget(target: EventTarget | null, includeButtons = true): boolean {
  return typeof Element !== 'undefined' && target instanceof Element &&
    !!target.closest(`input, textarea, select, [contenteditable]:not([contenteditable="false"])${includeButtons ? ', button, a, [role="button"]' : ''}`);
}

let driverSequence = 0;

/** Development input: one key press or click produces one made-basket event. */
export class MockSensorDriver implements ISensorDriver {
  name = 'Mock sensor';
  private listeners = new Set<SensorListener>();
  private sequence = 0;
  private readonly prefix = `mock-${++driverSequence}`;
  constructor(private readonly clock: () => number = () => performance.now()) {}
  init() { if (typeof window !== 'undefined') window.addEventListener('keydown', this.handleKeyDown); }
  cleanup() {
    if (typeof window !== 'undefined') window.removeEventListener('keydown', this.handleKeyDown);
    this.listeners.clear();
  }
  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || isInteractiveTarget(event.target, event.code === 'Space')) return;
    if (event.code === 'Space' || event.code === 'KeyS') {
      event.preventDefault();
      this.simulateScore(2, 'SIMULATOR_KEYBOARD');
    }
  };
  simulateScore(points = 2, source: SensorSource = 'SIMULATOR_UI'): SensorEvent {
    const event: SensorEvent = {
      id: `${this.prefix}-${++this.sequence}`, points,
      timestamp: this.clock(), source, rawPayload: `MOCK_SCORE:${points}`,
    };
    for (const listener of [...this.listeners]) listener(event);
    return event;
  }
  onEvent(listener: SensorListener) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  getStatus(): SerialStatus { return { supported: true, connected: true, portName: 'Mock', baudRate: 0 }; }
}

// Existing serial adapter is kept for the later hardware step; App does not start it.
interface SerialPortLike extends EventTarget {
  readable: ReadableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}
interface SerialApi extends EventTarget { requestPort(): Promise<SerialPortLike> }
function serialApi(): SerialApi | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { serial?: SerialApi }).serial;
}

/** Byte framing is separate from packet parsing and discards oversized lines until the next newline. */
export class LineFramer {
  private buffer = '';
  private dropping = false;
  push(chunk: string): string[] {
    const lines: string[] = [];
    for (const char of chunk) {
      if (char === '\n') {
        if (!this.dropping && this.buffer.trim()) lines.push(this.buffer.trim());
        this.buffer = ''; this.dropping = false;
      } else if (!this.dropping) {
        if (this.buffer.length >= 512) { this.buffer = ''; this.dropping = true; }
        else this.buffer += char;
      }
    }
    return lines;
  }
}

export class WebSerialDriver implements ISensorDriver {
  name = 'Arduino serial';
  private listeners = new Set<SensorListener>();
  private statusListeners = new Set<StatusListener>();
  private port: SerialPortLike | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private reading: Promise<void> | null = null;
  private connecting: Promise<boolean> | null = null;
  private closing: Promise<void> | null = null;
  private generation = 0;
  private lastMadeAt = -Infinity;
  private pinHigh = false;
  private sequence = 0;
  private readonly prefix = `serial-${++driverSequence}`;
  private status: SerialStatus = { supported: !!serialApi(), connected: false, baudRate: 115200 };
  constructor(private readonly clock: () => number = () => performance.now()) {}
  init() { serialApi()?.addEventListener('disconnect', this.handleDisconnect); }
  cleanup() {
    serialApi()?.removeEventListener('disconnect', this.handleDisconnect);
    this.listeners.clear(); this.statusListeners.clear();
    void this.disconnect();
  }
  private handleDisconnect = (event: Event) => {
    if (event.target !== this.port && (event as Event & { port?: SerialPortLike }).port !== this.port) return;
    this.updateStatus({ error: 'Arduino was unplugged.' });
    void this.disconnect();
  };
  connect(): Promise<boolean> {
    if (this.connecting) return this.connecting;
    if (this.status.connected) return Promise.resolve(true);
    const generation = ++this.generation;
    this.connecting = this.open(generation).finally(() => { this.connecting = null; });
    return this.connecting;
  }
  private async open(generation: number): Promise<boolean> {
    let selected: SerialPortLike | null = null;
    let opened = false;
    try {
      const api = serialApi();
      if (!api) throw new Error('Use Chrome or Edge for USB serial.');
      // Invoke the chooser within the user gesture, before awaiting closing work.
      const selection = api.requestPort();
      selected = await selection;
      await this.closing;
      if (generation !== this.generation) return false;
      await selected.open({ baudRate: this.status.baudRate });
      opened = true;
      if (generation !== this.generation) { await selected.close(); return false; }
      this.port = selected;
      this.pinHigh = false; this.lastMadeAt = -Infinity;
      this.updateStatus({ connected: true, portName: 'Arduino (USB Serial)', error: undefined });
      this.reading = this.read(selected, generation);
      return true;
    } catch (error) {
      if (opened && selected) await selected.close().catch(() => {});
      if (generation === this.generation) {
        this.port = null;
        this.updateStatus({ connected: false, error: error instanceof Error ? error.message : String(error) });
      }
      return false;
    }
  }
  disconnect(): Promise<void> {
    ++this.generation; // invalidates a pending chooser/open/read before any await
    this.updateStatus({ connected: false });
    if (this.closing) return this.closing;
    const port = this.port, reader = this.reader, reading = this.reading;
    this.port = null;
    this.closing = (async () => {
      await reader?.cancel().catch(() => {});
      await reading;
      if (port) await port.close().catch(() => {});
    })().finally(() => { this.closing = null; });
    return this.closing;
  }
  private async read(port: SerialPortLike, generation: number) {
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
    try {
      if (!port.readable) throw new Error('Serial input is unavailable.');
      reader = port.readable.getReader();
      this.reader = reader;
      const decoder = new TextDecoder();
      const framer = new LineFramer();
      while (generation === this.generation) {
        const { value, done } = await reader.read();
        if (done || generation !== this.generation) break;
        for (const line of framer.push(decoder.decode(value, { stream: true }))) {
          if (generation !== this.generation) break;
          this.parseIncomingLine(line);
        }
      }
    } catch (error) {
      if (generation === this.generation) this.updateStatus({ error: error instanceof Error ? error.message : 'Serial read failed.' });
    } finally {
      reader?.releaseLock();
      if (this.reader === reader) this.reader = null;
      if (generation === this.generation) {
        this.port = null;
        await port.close().catch(() => {});
        this.updateStatus({ connected: false });
      }
    }
  }
  parseIncomingLine(line: string) {
    if (line.length > 512) return;
    const packet = line.trim();
    this.updateStatus({ lastMessage: packet, lastTimestamp: Date.now() });
    const upper = packet.toUpperCase();
    if (upper === '0' || upper === 'LOW') { this.pinHigh = false; return; }
    const score = /^(?:SCORE(?::([123]))?|BASKET|GOAL)$/.exec(upper);
    let points = 2;
    if (score) points = Number(score[1] || 2);
    else if (upper === '1' || upper === 'HIGH') {
      if (this.pinHigh) return;
      this.pinHigh = true;
    } else return;
    const now = this.clock();
    // Legacy device packets have no event ID, so keep the original bounce lockout.
    if (now - this.lastMadeAt < 400) return;
    this.lastMadeAt = now;
    const event: SensorEvent = {
      id: `${this.prefix}-${++this.sequence}`, points,
      timestamp: now, rawPayload: packet, source: 'SERIAL_ARDUINO',
    };
    for (const listener of [...this.listeners]) listener(event);
  }
  setBaudRate(rate: number) {
    if (this.status.connected || this.connecting || ![9600, 19200, 38400, 57600, 115200].includes(rate)) return;
    this.updateStatus({ baudRate: rate });
  }
  private updateStatus(partial: Partial<SerialStatus>) {
    this.status = { ...this.status, ...partial };
    for (const listener of [...this.statusListeners]) listener(this.status);
  }
  onEvent(listener: SensorListener) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener); listener(this.status);
    return () => { this.statusListeners.delete(listener); };
  }
  getStatus() { return this.status; }
}
