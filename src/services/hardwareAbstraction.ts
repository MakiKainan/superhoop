/**
 * Hardware Abstraction Layer (HAL) for Mini Basketball Sensor Input
 * 
 * Supports two interchangeable drivers:
 * 1. MockSensorInput: Keyboard triggers & UI buttons (for simulation/testing)
 * 2. WebSerialSensorInput: Direct USB Serial connection to Arduino via navigator.serial
 */

import { SensorEvent, SerialStatus } from '../types';

export type ScoreListener = (event: SensorEvent) => void;
export type StatusListener = (status: SerialStatus) => void;

export interface ISensorDriver {
  name: string;
  init(): void;
  cleanup(): void;
  connect?(): Promise<boolean>;
  disconnect?(): Promise<void>;
  simulateScore?(points?: number): void;
  onScore(listener: ScoreListener): () => void;
  onStatusChange?(listener: StatusListener): () => void;
  getStatus(): SerialStatus;
}

const DEFAULT_DEBOUNCE_MS = 400; // Software lockout to prevent ball bouncing re-trigger

/**
 * 1. Mock Sensor Driver (Used during Phase 1 development & demo mode)
 */
export class MockSensorDriver implements ISensorDriver {
  public name = 'Simulated Input Driver';
  private scoreListeners: Set<ScoreListener> = new Set();
  private lastScoreTimestamp = 0;
  private debounceMs = DEFAULT_DEBOUNCE_MS;

  public init() {
    window.addEventListener('keydown', this.handleKeyDown);
  }

  public cleanup() {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.scoreListeners.clear();
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    // Space or 's' triggers a made basket
    // Only if target is not an input or textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (e.code === 'Space' || e.key === 's' || e.key === 'S') {
      e.preventDefault();
      this.simulateScore(2);
    }
  };

  public simulateScore(points: number = 2) {
    const now = Date.now();
    if (now - this.lastScoreTimestamp < this.debounceMs) {
      // Ignored due to debounce lockout
      return;
    }
    this.lastScoreTimestamp = now;

    const event: SensorEvent = {
      timestamp: now,
      rawPayload: `MOCK_SCORE:${points}`,
      points,
      source: 'SIMULATOR_KEYBOARD',
    };

    this.scoreListeners.forEach(listener => listener(event));
  }

  public onScore(listener: ScoreListener): () => void {
    this.scoreListeners.add(listener);
    return () => this.scoreListeners.delete(listener);
  }

  public getStatus(): SerialStatus {
    return {
      supported: true,
      connected: true,
      portName: 'Simulated (Spacebar / Click)',
      baudRate: 0,
      lastTimestamp: this.lastScoreTimestamp,
    };
  }
}

/**
 * 2. Web Serial API Driver (Direct USB serial link with Arduino Uno / Nano / ESP32)
 */
export class WebSerialDriver implements ISensorDriver {
  public name = 'Arduino Web Serial Driver';
  private scoreListeners: Set<ScoreListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private port: any = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private readableStreamClosed: Promise<void> | null = null;
  private keepReading = false;
  private lastScoreTimestamp = 0;
  private debounceMs = DEFAULT_DEBOUNCE_MS;

  private status: SerialStatus = {
    supported: typeof navigator !== 'undefined' && 'serial' in navigator,
    connected: false,
    baudRate: 115200,
  };

  public init() {
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).serial.addEventListener('disconnect', this.handleDisconnect);
    }
  }

  public cleanup() {
    this.disconnect();
    if (typeof navigator !== 'undefined' && 'serial' in navigator) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigator as any).serial.removeEventListener('disconnect', this.handleDisconnect);
    }
    this.scoreListeners.clear();
    this.statusListeners.clear();
  }

  private handleDisconnect = () => {
    this.updateStatus({
      connected: false,
      error: 'Arduino was physically unplugged.',
    });
  };

  public async connect(): Promise<boolean> {
    if (!this.status.supported) {
      this.updateStatus({ error: 'Web Serial API is not supported in this browser. Use Chrome or Edge.' });
      return false;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const serial = (navigator as any).serial;
      this.port = await serial.requestPort();
      await this.port.open({ baudRate: this.status.baudRate });

      this.keepReading = true;
      this.updateStatus({
        connected: true,
        portName: 'Arduino (USB Serial)',
        error: undefined,
      });

      this.startReading();
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.updateStatus({
        connected: false,
        error: errorMsg.includes('No port selected') ? 'No USB device selected.' : errorMsg,
      });
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    this.keepReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader = null;
      }
      if (this.readableStreamClosed) {
        await this.readableStreamClosed.catch(() => {});
        this.readableStreamClosed = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (err) {
      console.warn('Error closing serial port:', err);
    } finally {
      this.updateStatus({
        connected: false,
      });
    }
  }

  private async startReading() {
    if (!this.port) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textDecoder = new (window as any).TextDecoderStream();
    this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
      while (this.keepReading && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          buffer += value;
          const lines = buffer.split(/\r?\n/);
          // Keep whatever incomplete line remains at the end
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine) {
              this.parseIncomingLine(cleanLine);
            }
          }
        }
      }
    } catch (err) {
      if (this.keepReading) {
        console.error('Serial read error:', err);
        this.updateStatus({ connected: false, error: 'Serial read error occurred.' });
      }
    }
  }

  /**
   * Parse incoming string packet from Arduino:
   * Protocol formats supported:
   * 1. "SCORE" or "SCORE:2" or "SCORE:3" (Recommended packet protocol)
   * 2. "BASKET"
   * 3. "1" or "HIGH" (raw pin state stream)
   */
  public parseIncomingLine(line: string) {
    this.updateStatus({
      lastMessage: line,
      lastTimestamp: Date.now(),
    });

    const upper = line.toUpperCase();
    let points = 2;
    let isScore = false;

    if (upper.startsWith('SCORE')) {
      isScore = true;
      const parts = upper.split(':');
      if (parts.length > 1) {
        const parsedPoints = parseInt(parts[1], 10);
        if (!isNaN(parsedPoints) && parsedPoints > 0) {
          points = parsedPoints;
        }
      }
    } else if (upper === 'BASKET' || upper === 'GOAL') {
      isScore = true;
    } else if (upper === '1' || upper === 'HIGH') {
      isScore = true;
    }

    if (isScore) {
      const now = Date.now();
      // Laptop-side defense-in-depth debounce
      if (now - this.lastScoreTimestamp < this.debounceMs) {
        return;
      }
      this.lastScoreTimestamp = now;

      const event: SensorEvent = {
        timestamp: now,
        rawPayload: line,
        points,
        source: 'SERIAL_ARDUINO',
      };

      this.scoreListeners.forEach(listener => listener(event));
    }
  }

  public setBaudRate(rate: number) {
    this.status.baudRate = rate;
    this.updateStatus({ baudRate: rate });
  }

  private updateStatus(partial: Partial<SerialStatus>) {
    this.status = { ...this.status, ...partial };
    this.statusListeners.forEach(l => l(this.status));
  }

  public onScore(listener: ScoreListener): () => void {
    this.scoreListeners.add(listener);
    return () => this.scoreListeners.delete(listener);
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public getStatus(): SerialStatus {
    return this.status;
  }
}
