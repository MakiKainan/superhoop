/**
 * Types & Enums for Arcade Basketball Projector System
 */

export enum GameState {
  IDLE = 'IDLE',               // Attract mode, waiting for player
  COUNTDOWN = 'COUNTDOWN',     // 3-2-1 get ready
  PLAYING = 'PLAYING',         // Active game round
  PAUSED = 'PAUSED',           // Clock stopped mid-round, baskets ignored
  GAMEOVER = 'GAMEOVER',       // Time expired, high score entry
}

export interface HoopCalibration {
  xPercent: number;        // Center X percentage (0-100%)
  yPercent: number;        // Center Y percentage (0-100%)
  widthPx: number;         // Projected backboard width
  heightPx: number;        // Projected backboard height
  rimDiameterPx: number;   // Diameter of rim ring
  guideVisible: boolean;   // Show alignment crosshairs & boundary box
  renderVirtualBoard: boolean; // Project virtual glass backboard or leave dark for physical hoop
  rotationDeg: number;     // Fine rotation alignment (-15 to +15 deg)
}

export interface HighScoreRecord {
  id: string;
  initials: string;
  score: number;
  date: string;
  durationSeconds: number;
  accuracyStreak?: number;
}

export type SensorSource = 'SERIAL_ARDUINO' | 'SIMULATOR_KEYBOARD' | 'SIMULATOR_UI';

export interface SensorEvent {
  /** Stable across retries. Use device boot ID + sequence for real transports. */
  id: string;
  /** Host monotonic time (performance.now), never device time or Date.now. */
  timestamp: number;
  rawPayload: string;
  points: number;
  source: SensorSource;
}


export interface SerialStatus {
  supported: boolean;
  connected: boolean;
  portName?: string;
  baudRate: number;
  lastMessage?: string;
  lastTimestamp?: number;
  error?: string;
}

export interface GameStats {
  score: number;
  timeRemaining: number;
  roundDuration: number;
  streak: number;
  maxStreak: number;
  basketsMade: number;
  comboMultiplier: number;
}
