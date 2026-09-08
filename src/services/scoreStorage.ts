/**
 * Local High Scores & Calibration Storage Service
 * Handles client-side persistent storage, JSON export/import, and ranking logic.
 */

import { HighScoreRecord, HoopCalibration } from '../types';

const STORAGE_KEY_SCORES = 'ARCADE_HOOP_HIGHSCORES_V1';
const STORAGE_KEY_CALIB = 'ARCADE_HOOP_CALIBRATION_V1';

const DEFAULT_HIGH_SCORES: HighScoreRecord[] = [
  { id: '1', initials: 'KOB', score: 62, date: '2026-09-01', durationSeconds: 60, accuracyStreak: 9 },
  { id: '2', initials: 'MJ2', score: 54, date: '2026-09-02', durationSeconds: 60, accuracyStreak: 7 },
  { id: '3', initials: 'STE', score: 48, date: '2026-09-03', durationSeconds: 60, accuracyStreak: 8 },
  { id: '4', initials: 'LEB', score: 42, date: '2026-09-04', durationSeconds: 60, accuracyStreak: 5 },
  { id: '5', initials: 'SHA', score: 36, date: '2026-09-05', durationSeconds: 60, accuracyStreak: 4 },
];

export const DEFAULT_CALIBRATION: HoopCalibration = {
  xPercent: 50,
  yPercent: 36,
  widthPx: 380,
  heightPx: 250,
  rimDiameterPx: 120,
  guideVisible: true,
  renderVirtualBoard: true,
  rotationDeg: 0,
};

export class ScoreStorageService {
  /**
   * Load top high scores from localStorage, or return default seeded leaderboard
   */
  public static loadHighScores(): HighScoreRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SCORES);
      if (!raw) {
        this.saveHighScores(DEFAULT_HIGH_SCORES);
        return DEFAULT_HIGH_SCORES;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => b.score - a.score).slice(0, 5);
      }
    } catch (e) {
      console.warn('Failed to parse high scores from localStorage, resetting:', e);
    }
    return DEFAULT_HIGH_SCORES;
  }

  /**
   * Save array of high scores
   */
  public static saveHighScores(scores: HighScoreRecord[]): void {
    try {
      const top5 = scores.sort((a, b) => b.score - a.score).slice(0, 5);
      localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(top5));
    } catch (e) {
      console.error('Failed to save high scores to localStorage:', e);
    }
  }

  /**
   * Check if a score is eligible for the top 5
   */
  public static isHighScore(score: number): boolean {
    if (score <= 0) return false;
    const scores = this.loadHighScores();
    if (scores.length < 5) return true;
    return score > scores[scores.length - 1].score;
  }

  /**
   * Record a new high score entry
   */
  public static addHighScore(initials: string, score: number, durationSeconds: number, streak: number = 0): HighScoreRecord[] {
    const scores = this.loadHighScores();
    const newRecord: HighScoreRecord = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      initials: (initials || 'AAA').toUpperCase().slice(0, 3),
      score,
      date: new Date().toISOString().split('T')[0],
      durationSeconds,
      accuracyStreak: streak,
    };

    scores.push(newRecord);
    const updated = scores.sort((a, b) => b.score - a.score).slice(0, 5);
    this.saveHighScores(updated);
    return updated;
  }

  /**
   * Export high scores as a JSON file for student assignment submission or backups
   */
  public static exportScoresAsJSON(): void {
    const scores = this.loadHighScores();
    const blob = new Blob([JSON.stringify(scores, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `basketball_arcade_highscores_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Import high scores from a JSON string
   */
  public static importScoresFromJSON(jsonString: string): HighScoreRecord[] {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        const validated: HighScoreRecord[] = parsed.map((item, idx) => ({
          id: item.id || String(idx),
          initials: String(item.initials || 'AAA').toUpperCase().slice(0, 3),
          score: Number(item.score) || 0,
          date: item.date || new Date().toISOString().split('T')[0],
          durationSeconds: Number(item.durationSeconds) || 60,
          accuracyStreak: Number(item.accuracyStreak) || 0,
        }));
        this.saveHighScores(validated);
        return validated;
      }
    } catch (err) {
      console.error('Invalid JSON provided for high scores:', err);
    }
    return this.loadHighScores();
  }

  /**
   * Reset high scores to defaults
   */
  public static resetHighScores(): HighScoreRecord[] {
    this.saveHighScores(DEFAULT_HIGH_SCORES);
    return DEFAULT_HIGH_SCORES;
  }

  /**
   * Load projector calibration settings
   */
  public static loadCalibration(): HoopCalibration {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CALIB);
      if (raw) {
        return { ...DEFAULT_CALIBRATION, ...JSON.parse(raw) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CALIBRATION;
  }

  /**
   * Save projector calibration settings
   */
  public static saveCalibration(calib: HoopCalibration): void {
    try {
      localStorage.setItem(STORAGE_KEY_CALIB, JSON.stringify(calib));
    } catch (e) {
      console.error('Failed to save calibration:', e);
    }
  }
}
