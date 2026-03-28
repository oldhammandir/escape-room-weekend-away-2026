import { useEffect, useRef, useState } from 'react';
import { CONFIG } from '../config';
import { useCountdown, formatCountdown } from '../hooks/useCountdown';
import { useAudio } from '../hooks/useAudio';
import '../styles/countdown.css';

interface CountdownScreenProps {
  active: boolean;
}

export default function CountdownScreen({ active }: CountdownScreenProps) {
  const audio = useAudio();
  const lastTickSlotRef = useRef<number | null>(null);

  const [hasBeenStopped, setHasBeenStopped] = useState(false);

  const { remainingMs, state, start, stop, reset } = useCountdown({
    totalMs: CONFIG.countdownSeconds * 1000,
    onFinish: () => {
      audio.playTimesUp();
    },
  });

  useEffect(() => {
    if (active) {
      reset();
      setHasBeenStopped(false);
      lastTickSlotRef.current = null;
    } else {
      reset();
      setHasBeenStopped(false);
      lastTickSlotRef.current = null;
    }
  }, [active, reset]);

  // Tick in sync with the displayed timer
  useEffect(() => {
    if (state !== 'running' || remainingMs <= 0) {
      lastTickSlotRef.current = null;
      return;
    }

    // Use half-second slots for final 10s, whole-second slots otherwise
    const slot = remainingMs <= 10000
      ? Math.ceil(remainingMs / 500)
      : Math.ceil(remainingMs / 1000);

    if (lastTickSlotRef.current !== null && slot !== lastTickSlotRef.current) {
      audio.playTick();
    }
    lastTickSlotRef.current = slot;
  }, [state, remainingMs, audio]);

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (state === 'waiting') {
        start();
      } else if (state === 'running') {
        stop();
        setHasBeenStopped(true);
      } else if (state === 'stopped') {
        start();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, state, start, stop]);

  const isWarning = remainingMs <= 30000;

  return (
    <div className={`screen${active ? ' active' : ''}`}>
      <div className="timer-activity-content">
        <div>
          <div className="timer-label">COUNTDOWN</div>
          <div className={`countdown-value${isWarning ? ' warning' : ''}`}>
            {formatCountdown(remainingMs)}
          </div>
        </div>
        {state === 'running' && !hasBeenStopped && (
          <div className="countdown-prompt">PRESS SPACEBAR TO STOP THE TIME</div>
        )}
        {state === 'finished' && (
          <div className="countdown-timesup">TIMES UP!</div>
        )}
      </div>
    </div>
  );
}
