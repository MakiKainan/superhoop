import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GameState, HoopCalibration } from './types';
import { CourtBackground } from './components/CourtBackground';
import { StreakBorder } from './components/StreakBorder';
import { BasketFeedback } from './components/BasketFeedback';
import { HoopPlaceholder } from './components/HoopPlaceholder';
import { ScoreboardHUD } from './components/ScoreboardHUD';
import { CalibrationControls } from './components/CalibrationControls';
import { GameOverModal } from './components/GameOverModal';
import { audioEngine } from './services/audioEngine';
import { MockSensorDriver, isInteractiveTarget } from './services/hardwareAbstraction';
import { ScoreStorageService, DEFAULT_CALIBRATION } from './services/scoreStorage';
import { ROUND_DURATION_MS } from './game/sessionEngine';
import { SessionStore } from './game/sessionStore';
import { useSession } from './hooks/useSession';

export default function App() {
  // One session and one mock input for this stage of the project.
  const [store] = useState(() => new SessionStore());
  const [mock] = useState(() => new MockSensorDriver());
  const session = useSession(store);
  // Reuse the existing streak; these thresholds change scenery only.
  const courtEnergy = session.phase === GameState.IDLE || session.phase === GameState.GAMEOVER
    ? 0 : session.streak >= 6 ? 2 : session.streak >= 3 ? 1 : 0;
  const [calibration, setCalibration] = useState<HoopCalibration>(() => ScoreStorageService.loadCalibration());
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [saveRevision, setSaveRevision] = useState(0);
  const savedSession = useRef<number | null>(null);
  const highScores = useMemo(() => ScoreStorageService.loadHighScores(), [saveRevision]);
  const isNewHighScore = session.score > 0 && savedSession.current !== session.sessionId &&
    (highScores.length < 5 || session.score > highScores[highScores.length - 1].score);

  useEffect(() => {
    mock.init();
    const unsubscribe = mock.onEvent(store.receive);
    return () => { unsubscribe(); mock.cleanup(); };
  }, [mock, store]);

  const startGame = store.start;
  const resetGame = store.reset;
  const simulateScore = useCallback(() => mock.simulateScore(), [mock]);
  const toggleCalibration = useCallback(() => setIsCalibrating(previous => !previous), []);
  const toggleMute = useCallback(() => setIsMuted(audioEngine.toggleMute()), []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen().catch(() => {});
  }, []);
  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || isInteractiveTarget(event.target, false)) return;
      switch (event.code) {
        case 'KeyC': toggleCalibration(); break;
        case 'KeyM': toggleMute(); break;
        case 'KeyF': toggleFullscreen(); break;
        case 'KeyP': event.preventDefault(); store.togglePause(); break;
        case 'Escape': setIsCalibrating(false); break;
      }
    };
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [store, toggleCalibration, toggleMute, toggleFullscreen]);

  const handleCalibrationChange = useCallback((updated: HoopCalibration) => {
    setCalibration(updated);
    ScoreStorageService.saveCalibration(updated);
  }, []);
  const handleSaveScore = (initials: string) => {
    const current = store.getSnapshot();
    if (current.phase !== GameState.GAMEOVER || savedSession.current === current.sessionId) return;
    ScoreStorageService.addHighScore(initials, current.score, ROUND_DURATION_MS / 1000,
      current.maxStreak);
    savedSession.current = current.sessionId;
    setSaveRevision(revision => revision + 1);
  };

  return <main className="relative w-screen h-screen overflow-hidden bg-black select-none flex flex-col justify-between font-court">
    <CourtBackground energy={courtEnergy} paused={session.phase !== GameState.PLAYING} />
    <StreakBorder energy={courtEnergy} paused={session.phase !== GameState.PLAYING} />
    <BasketFeedback key={session.sessionId} calibration={calibration} feedback={session.feedback} phase={session.phase} />
    <ScoreboardHUD
      score={session.score} timeRemaining={session.timeRemaining} roundDuration={ROUND_DURATION_MS / 1000}
      streak={session.streak} gameState={session.phase} countdownValue={session.countdownValue}
      highScore={highScores[0] || null} isMuted={isMuted} isFullscreen={isFullscreen} isCalibrating={isCalibrating}
      onStartGame={startGame} onResetGame={resetGame} onToggleMute={toggleMute}
      onToggleFullscreen={toggleFullscreen} onTogglePause={store.togglePause}
      onToggleCalibration={toggleCalibration} onSimulateScore={simulateScore}
    />
    <HoopPlaceholder key={session.sessionId} calibration={calibration} gameState={session.phase}
      scoreFeedback={session.feedback} onCalibrationChange={handleCalibrationChange}
      isCalibrating={isCalibrating} onManualScoreClick={simulateScore} />
    <footer className="relative w-full z-[45] px-4 py-2 bg-neutral-950/90 border-t border-neutral-800 text-neutral-300">
      <span className="text-xs font-mono">Space / click rim: basket · P: pause / resume · C: align hoop</span>
    </footer>
    {isCalibrating && <CalibrationControls calibration={calibration} onChange={handleCalibrationChange}
      onClose={() => setIsCalibrating(false)} onReset={() => handleCalibrationChange(DEFAULT_CALIBRATION)} />}
    {session.phase === GameState.GAMEOVER && <GameOverModal
      score={session.score} streak={session.maxStreak} basketsMade={session.basketsMade}
      roundDuration={ROUND_DURATION_MS / 1000} highScores={highScores}
      isNewHighScore={isNewHighScore}
      onSaveScore={handleSaveScore} onPlayAgain={startGame}
      onExportScores={ScoreStorageService.exportScoresAsJSON} />}
  </main>;
}
