import { useState, useCallback, useRef } from 'react';
import { CONFIG } from '../config';
import { useTimer } from '../hooks/useTimer';
import { useAudio } from '../hooks/useAudio';
import KnotGame from './KnotGame';
import WireDefusalScreen from './WireDefusalScreen';
import CodeEntryScreen from './CodeEntryScreen';

interface WireDefusalGameProps {
  active: boolean;
  onWin: () => void;
  onLose: () => void;
  flashScreen: (color: 'red' | 'white') => void;
  shakeScreen: (heavy?: boolean) => void;
}

export default function WireDefusalGame({
  active,
  onWin,
  onLose,
  flashScreen,
  shakeScreen,
}: WireDefusalGameProps) {
  const [phase, setPhase] = useState<'knot' | 'wires' | 'code'>('knot');
  const [cutWires, setCutWires] = useState<Set<number>>(new Set());
  const [statusMessage, setStatusMessage] = useState('SELECT WIRE TO CUT');
  const audio = useAudio();
  const alarmStartedRef = useRef(false);

  const { timeRemaining, applyPenalty, reset: resetTimer } = useTimer({
    initialSeconds: CONFIG.timerSeconds,
    running: active,
    onExpire: () => {
      audio.stopAlarm();
      audio.playExplosion();
      flashScreen('white');
      shakeScreen(true);
      setTimeout(() => onLose(), 1500);
    },
  });

  // Start alarm when entering wires phase
  if (active && phase === 'wires' && !alarmStartedRef.current) {
    alarmStartedRef.current = true;
    audio.startAlarm();
  }
  if (!active && alarmStartedRef.current) {
    alarmStartedRef.current = false;
    audio.stopAll();
    setCutWires(new Set());
    setPhase('knot');
    setStatusMessage('SELECT WIRE TO CUT');
    resetTimer();
  }

  const handleKnotComplete = useCallback(() => {
    setPhase('wires');
  }, []);

  const handleWireCut = useCallback((wireIndex: number) => {
    if (cutWires.has(wireIndex)) return;

    const newCutWires = new Set(cutWires);
    newCutWires.add(wireIndex);
    setCutWires(newCutWires);
    audio.playSnip();

    if (wireIndex === CONFIG.correctWire - 1) {
      audio.stopAlarm();
      setTimeout(() => {
        setPhase('code');
      }, 1500);
    } else {
      applyPenalty(CONFIG.penaltySeconds);
      flashScreen('red');
      shakeScreen();
      audio.playZap();
      setStatusMessage(`WRONG WIRE — PENALTY ${CONFIG.penaltySeconds}s`);
      setTimeout(() => {
        setStatusMessage('SELECT WIRE TO CUT');
      }, 2000);
    }
  }, [cutWires, audio, applyPenalty, flashScreen, shakeScreen]);

  const handleCodeCorrect = useCallback(() => {
    audio.playSuccess();
    setTimeout(() => onWin(), 1000);
  }, [audio, onWin]);

  const handleCodePenalty = useCallback(() => {
    applyPenalty(CONFIG.codePenaltySeconds);
    flashScreen('red');
    shakeScreen();
    audio.playZap();
  }, [applyPenalty, flashScreen, shakeScreen, audio]);

  return (
    <>
      <KnotGame
        active={active && phase === 'knot'}
        timeRemaining={timeRemaining}
        applyPenalty={applyPenalty}
        onComplete={handleKnotComplete}
      />
      <WireDefusalScreen
        active={active && phase === 'wires'}
        timeRemaining={timeRemaining}
        cutWires={cutWires}
        statusMessage={statusMessage}
        onWireCut={handleWireCut}
      />
      <CodeEntryScreen
        active={active && phase === 'code'}
        timeRemaining={timeRemaining}
        onCorrect={handleCodeCorrect}
        onPenalty={handleCodePenalty}
      />
    </>
  );
}
