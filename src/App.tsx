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
import { SerialMonitorModal } from './components/SerialMonitorModal';
import { ArchitectureDocModal } from './components/ArchitectureDocModal';
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
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);

  // References for non-stale callbacks inside intervals
  const mockDriverRef = useRef<MockSensorDriver | null>(null);
  const webSerialDriverRef = useRef<WebSerialDriver | null>(null);
  const roundTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);
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

  // Global Keyboard shortcuts: C (Calibrate), M (Mute), F (Fullscreen), D (Docs), Escape
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
      } else if (e.key === 'd' || e.key === 'D') {
        setShowDocsModal(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsCalibrating(false);
        setShowSerialModal(false);
        setShowDocsModal(false);
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

  // START GAME: 3-2-1 COUNTDOWN THEN PLAY
  const startGame = () => {
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setBasketsMade(0);
    setTimeRemaining(roundDuration);
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
        // Begin Active Play
        setGameState(GameState.PLAYING);
        startRoundTimer();
      }
    }, 1000);
  };

  // ACTIVE ROUND TIMER (Wall-clock accurate with delta time)
  const startRoundTimer = () => {
    roundStartTimeRef.current = Date.now();
    const duration = roundDuration;

    roundTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartTimeRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(remaining);

      // Warning beeps in final 3 seconds
      if (remaining <= 3 && remaining > 0) {
        audioEngine.playCountdownBeep(false);
      }

      if (remaining <= 0) {
        if (roundTimerRef.current) clearInterval(roundTimerRef.current);
        handleGameOver();
      }
    }, 250);
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

  // Connect Web Serial port
  const handleConnectSerial = async () => {
    if (!webSerialDriverRef.current) return;
    const ok = await webSerialDriverRef.current.connect();
    if (ok) {
      addPacketLog('Arduino connected via Web Serial at ' + serialStatus.baudRate + ' baud', 'SYS');
    }
  };

  const handleDisconnectSerial = async () => {
    if (!webSerialDriverRef.current) return;
    await webSerialDriverRef.current.disconnect();
    addPacketLog('Arduino disconnected.', 'SYS');
  };

  const handleSendTestPacket = (packet: string) => {
    if (webSerialDriverRef.current) {
      webSerialDriverRef.current.parseIncomingLine(packet);
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
        serialStatus={serialStatus}
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
        onToggleCalibration={() => setIsCalibrating(prev => !prev)}
        onOpenSerialMonitor={() => setShowSerialModal(true)}
        onOpenDocs={() => setShowDocsModal(true)}
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
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDocsModal(true)}
            className="text-cyan-400 hover:text-cyan-300 transition underline cursor-pointer"
          >
            Course Architecture Guide
          </button>
          <span>•</span>
          <button
            onClick={() => setShowSerialModal(true)}
            className="text-amber-400 hover:text-amber-300 transition underline cursor-pointer"
          >
            Arduino USB Monitor
          </button>
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

      {/* 6. SERIAL HARDWARE MONITOR & ARDUINO CODE MODAL */}
      {showSerialModal && (
        <SerialMonitorModal
          status={serialStatus}
          packetLogs={packetLogs}
          onConnect={handleConnectSerial}
          onDisconnect={handleDisconnectSerial}
          onBaudRateChange={baud => webSerialDriverRef.current?.setBaudRate(baud)}
          onSendTestPacket={handleSendTestPacket}
          onClearLogs={() => setPacketLogs([])}
          onClose={() => setShowSerialModal(false)}
        />
      )}

      {/* 7. ARCHITECTURAL COURSE SPECIFICATION MODAL */}
      {showDocsModal && (
        <ArchitectureDocModal onClose={() => setShowDocsModal(false)} />
      )}

      {/* 8. GAME OVER & HIGH SCORE MODAL */}
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
