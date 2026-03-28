import { useEffect, useRef } from 'react';
import { CONFIG } from '../config';
import { useCountdown, formatCountdown } from '../hooks/useCountdown';
import { useAudio } from '../hooks/useAudio';
import '../styles/countdown.css';

interface CountdownScreenProps {
  active: boolean;
}

export default function CountdownScreen({ active }: CountdownScreenProps) {
  const audio = useAudio();
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { remainingMs, state, start, stop, reset } = useCountdown({
    totalMs: CONFIG.countdownSeconds * 1000,
    onFinish: () => {
      stopTickSound();
      audio.playTimesUp();
    },
  });

  const stopTickSound = () => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (active) {
      reset();
    } else {
      stopTickSound();
      reset();
    }
    return () => stopTickSound();
  }, [active, reset]);

  useEffect(() => {
    if (state === 'running' && remainingMs <= 10000 && !tickIntervalRef.current) {
      audio.playTick();
      tickIntervalRef.current = setInterval(() => {
        audio.playTick();
      }, 1000);
    }
    if (state !== 'running') {
      stopTickSound();
    }
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
        {state === 'running' && (
          <div className="countdown-prompt">PRESS SPACEBAR TO STOP THE TIME</div>
        )}
        {state === 'finished' && (
          <div className="countdown-timesup">TIMES UP!</div>
        )}
      </div>
    </div>
  );
}
