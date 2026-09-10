import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  HoopCalibration,
  HighScoreRecord,
  SerialStatus,
  SensorEvent,
} from './types';
import { CourtBackground } from './components/CourtBackground';
import { HoopPlaceholder } from './components/HoopPlaceholder';
import { ScoreboardHUD } from './components/ScoreboardHUD';
import { CalibrationControls } from './components/CalibrationControls';
import { GameOverModal } from './components/GameOverModal';
import { audioEngine } from './services/audioEngine';
import {
  MockSensorDriver,
  WebSerialDriver,
  ISensorDriver,
} from './services/hardwareAbstraction';
import { ScoreStorageService, DEFAULT_CALIBRATION } from './services/scoreStorage';

export default function App() {
  // 1. GAMEPLAY STATE
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [score, setScore] = useState(0);
  const [roundDuration] = useState(60); // 60-second round standard
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [basketsMade, setBasketsMade] = useState(0);
  const [countdownValue, setCountdownValue] = useState(3);
  const [scoreTrigger, setScoreTrigger] = useState<{ id: number; points: number; streak: number } | null>(null);

  // 2. PROJECTOR STATE
  const [calibration, setCalibration] = useState<HoopCalibration>(() => ScoreStorageService.loadCalibration());
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // 3. PERSISTENCE & LEADERBOARD
  const [highScores, setHighScores] = useState<HighScoreRecord[]>(() => ScoreStorageService.loadHighScores());
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  // 4. HARDWARE & SERIAL DRIVERS
  const [serialStatus, setSerialStatus] = useState<SerialStatus>({
    supported: typeof navigator !== 'undefined' && 'serial' in navigator,
    connected: false,
    baudRate: 115200,
  });
  const [packetLogs, setPacketLogs] = useState<Array<{ id: string; time: string; message: string; type: 'IN' | 'SIM' | 'SYS' }>>([]);

  // References for non-stale callbacks inside intervals
  const mockDriverRef = useRef<MockSensorDriver | null>(null);
  const webSerialDriverRef = useRef<WebSerialDriver | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);
  // Seconds the current timer leg started from — equals roundDuration for a
  // fresh round, or whatever was left on the clock when the player resumed.
  const roundSecondsRef = useRef<number>(60);
  const pausedRemainingRef = useRef<number>(0);
  const pauseStartedAtRef = useRef<number>(0);
  const lastScoreTimeRef = useRef<number>(0);
  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  // Packet logger helper
  const addPacketLog = useCallback((message: string, type: 'IN' | 'SIM' | 'SYS' = 'IN') => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    setPacketLogs(prev => [
      { id: `${Date.now()}-${Math.random()}`, time: timeStr, message, type },
      ...prev.slice(0, 49),
    ]);
  }, []);

  // Basket scoring handler (fired by either Mock or WebSerial driver)
  const handleScoreEvent = useCallback((event: SensorEvent) => {
    addPacketLog(
      `Score detected! +${event.points} pts (${event.rawPayload})`,
      event.source === 'SERIAL_ARDUINO' ? 'IN' : 'SIM'
    );

    if (gameStateRef.current !== GameState.PLAYING) {
      // Player shot the ball outside active play (during IDLE or GAMEOVER)
      audioEngine.playRimClank();
      return;
    }

    const now = Date.now();
    // Streak tracking: shot within 6 seconds continues streak
    let newStreak = 1;
    if (now - lastScoreTimeRef.current < 6500) {
      newStreak = (streak || 0) + 1;
    }
    lastScoreTimeRef.current = now;

    setStreak(newStreak);
    setMaxStreak(prev => Math.max(prev, newStreak));
    setBasketsMade(prev => prev + 1);

    // Multiplier logic: streak >= 3 gets 1 bonus point per basket (Pop-A-Shot style!)
    const streakBonus = newStreak >= 3 ? 1 : 0;
    const earnedPoints = event.points + streakBonus;

    setScore(prev => prev + earnedPoints);

    // Audio & visual feedback
    if (newStreak === 3) {
      audioEngine.playOnFire();
    } else {
      audioEngine.playScorePing(newStreak);
    }

    setScoreTrigger({
      id: Date.now(),
      points: earnedPoints,
      streak: newStreak,
    });
  }, [addPacketLog, streak]);

  // Initialize Hardware Drivers once on mount
  useEffect(() => {
    // 1. Initialize Mock Driver
    const mock = new MockSensorDriver();
    mock.init();
    mockDriverRef.current = mock;
    const unsubMock = mock.onScore(handleScoreEvent);

    // 2. Initialize Web Serial Driver
    const serial = new WebSerialDriver();
    serial.init();
    webSerialDriverRef.current = serial;
    const unsubSerial = serial.onScore(handleScoreEvent);
    const unsubStatus = serial.onStatusChange?.(status => {
      setSerialStatus(status);
    });

    addPacketLog('Arcade Projector System initialized. Press Space to test sensor.', 'SYS');

    return () => {
      unsubMock();
      unsubSerial();
      unsubStatus?.();
      mock.cleanup();
      serial.cleanup();
    };
  }, [handleScoreEvent, addPacketLog]);

  // Global Keyboard shortcuts: C (Calibrate), M (Mute), F (Fullscreen), P (Pause), Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'c' || e.key === 'C') {
        setIsCalibrating(prev => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = audioEngine.toggleMute();
        setIsMuted(muted);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        handleTogglePause();
      } else if (e.key === 'Escape') {
        setIsCalibrating(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save calibration changes to localStorage
  const handleCalibrationChange = (updated: HoopCalibration) => {
    setCalibration(updated);
    ScoreStorageService.saveCalibration(updated);
  };

  const handleResetCalibration = () => {
    setCalibration(DEFAULT_CALIBRATION);
    ScoreStorageService.saveCalibration(DEFAULT_CALIBRATION);
  };

  // 3-2-1 PREP COUNTDOWN — shared by a fresh round and by a resume after pause,
  // so the shooter always gets the same three seconds to get set before the
  // clock runs. onComplete is what actually puts the game back into play.
  const runCountdown = (onComplete: () => void) => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    setGameState(GameState.COUNTDOWN);
    setCountdownValue(3);
    audioEngine.playCountdownBeep(false);

    let count = 3;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      setCountdownValue(count);

      if (count > 0) {
        audioEngine.playCountdownBeep(false);
      } else if (count === 0) {
        audioEngine.playCountdownBeep(true);
      } else {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        onComplete();
      }
    }, 1000);
  };

  // START GAME: 3-2-1 COUNTDOWN THEN PLAY
  const startGame = () => {
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setBasketsMade(0);
    setTimeRemaining(roundDuration);

    runCountdown(() => {
      setGameState(GameState.PLAYING);
      startRoundTimer();
    });
  };

  // ACTIVE ROUND TIMER (Wall-clock accurate with delta time).
  // secondsLeft lets a resume pick the clock back up exactly where the pause
  // froze it instead of always restarting from the full round duration.
  const startRoundTimer = (secondsLeft: number = roundDuration) => {
    roundStartTimeRef.current = Date.now();
    roundSecondsRef.current = secondsLeft;
    setTimeRemaining(Math.ceil(secondsLeft));

    roundTimerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        roundSecondsRef.current - (Date.now() - roundStartTimeRef.current) / 1000
      );
      const displayed = Math.ceil(remaining);
      setTimeRemaining(displayed);

      // Warning beeps in final 3 seconds
      if (displayed <= 3 && displayed > 0) {
        audioEngine.playCountdownBeep(false);
      }

      if (remaining <= 0) {
        if (roundTimerRef.current) clearInterval(roundTimerRef.current);
        roundTimerRef.current = null;
        handleGameOver();
      }
    }, 250);
  };

  // PAUSE / RESUME — stops the clock mid-round. While paused the game state is
  // no longer PLAYING, so handleScoreEvent already rejects incoming baskets.
  const pauseGame = () => {
    if (gameStateRef.current !== GameState.PLAYING) return;
    if (roundTimerRef.current) {
      clearInterval(roundTimerRef.current);
      roundTimerRef.current = null;
    }
    const remaining = Math.max(
      0,
      roundSecondsRef.current - (Date.now() - roundStartTimeRef.current) / 1000
    );
    pausedRemainingRef.current = remaining;
    pauseStartedAtRef.current = Date.now();
    setTimeRemaining(Math.ceil(remaining));
    setGameState(GameState.PAUSED);
    addPacketLog(`Round paused at 0:${String(Math.ceil(remaining)).padStart(2, '0')}`, 'SYS');
  };

  const resumeGame = () => {
    if (gameStateRef.current !== GameState.PAUSED) return;
    addPacketLog('Resuming — 3 second prep countdown.', 'SYS');

    // Give the shooter the same 3-2-1 prep they get at tip-off. The clock only
    // restarts once the countdown lands on BALL!
    runCountdown(() => {
      // Push the streak window forward by the whole paused span (prep included)
      // so a long pause never silently kills a hot streak.
      if (lastScoreTimeRef.current > 0) {
        lastScoreTimeRef.current += Date.now() - pauseStartedAtRef.current;
      }
      setGameState(GameState.PLAYING);
      startRoundTimer(pausedRemainingRef.current);
      addPacketLog('Round resumed.', 'SYS');
    });
  };

  const handleTogglePause = () => {
    if (gameStateRef.current === GameState.PLAYING) pauseGame();
    else if (gameStateRef.current === GameState.PAUSED) resumeGame();
  };

  // GAME OVER HANDLER
  const handleGameOver = () => {
    setGameState(GameState.GAMEOVER);
    audioEngine.playBuzzer();
    setTimeout(() => {
      audioEngine.playCrowdCheer();
    }, 600);

    setScore(currentScore => {
      const eligible = ScoreStorageService.isHighScore(currentScore);
      setIsNewHighScore(eligible);
      return currentScore;
    });
  };

  const handleResetGame = () => {
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setGameState(GameState.IDLE);
    setTimeRemaining(roundDuration);
    setScore(0);
    setStreak(0);
  };

  // Save new high score with initials
  const handleSaveScore = (initials: string) => {
    const updated = ScoreStorageService.addHighScore(initials, score, roundDuration, maxStreak);
    setHighScores(updated);
    setIsNewHighScore(false);
  };

  // Fullscreen toggle for projector immersion
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none flex flex-col justify-between font-court">
      {/* 1. NBA STREET BLACKTOP COURT BACKGROUND */}
      <CourtBackground />

      {/* 2. PROJECTOR SCOREBOARD HUD */}
      <ScoreboardHUD
        score={score}
        timeRemaining={timeRemaining}
        roundDuration={roundDuration}
        streak={streak}
        gameState={gameState}
        countdownValue={countdownValue}
        highScore={highScores[0] || null}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        isCalibrating={isCalibrating}
        onStartGame={startGame}
        onResetGame={handleResetGame}
        onToggleMute={() => {
          const muted = audioEngine.toggleMute();
          setIsMuted(muted);
        }}
        onToggleFullscreen={toggleFullscreen}
        onTogglePause={handleTogglePause}
        onToggleCalibration={() => setIsCalibrating(prev => !prev)}
        onSimulateScore={() => mockDriverRef.current?.simulateScore(2)}
      />

      {/* 3. PHYSICAL HOOP DESIGNATED PLACEHOLDER & CALIBRATION TARGET */}
      <HoopPlaceholder
        calibration={calibration}
        gameState={gameState}
        scoreTrigger={scoreTrigger}
        onCalibrationChange={handleCalibrationChange}
        isCalibrating={isCalibrating}
        onManualScoreClick={() => mockDriverRef.current?.simulateScore(2)}
      />

      {/* 4. BOTTOM PROJECTOR HINT BAR */}
      <footer className="relative w-full z-20 px-6 py-2 bg-neutral-950/70 backdrop-blur-xs border-t border-neutral-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-neutral-400">
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline">Space / Click: <strong>Simulate Basket</strong></span>
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline">Key [C]: <strong>Align Hoop</strong></span>
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline">Key [P]: <strong>Pause Clock</strong></span>
        </div>
      </footer>

      {/* 5. FLOATING CALIBRATION CONTROLS (Active when calibration mode toggled) */}
      {isCalibrating && (
        <CalibrationControls
          calibration={calibration}
          onChange={handleCalibrationChange}
          onClose={() => setIsCalibrating(false)}
          onReset={handleResetCalibration}
        />
      )}

      {/* 6. GAME OVER & HIGH SCORE MODAL */}
      {gameState === GameState.GAMEOVER && (
        <GameOverModal
          score={score}
          streak={maxStreak}
          basketsMade={basketsMade}
          roundDuration={roundDuration}
          highScores={highScores}
          isNewHighScore={isNewHighScore}
          onSaveScore={handleSaveScore}
          onPlayAgain={startGame}
          onExportScores={ScoreStorageService.exportScoresAsJSON}
        />
      )}
    </main>
  );
}
