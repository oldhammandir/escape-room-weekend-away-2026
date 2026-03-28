import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  initialSeconds: number;
  running: boolean;
  onExpire: () => void;
}

export function useTimer({ initialSeconds, running, onExpire }: UseTimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onExpireRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const applyPenalty = useCallback((seconds: number) => {
    setTimeRemaining(prev => {
      const next = Math.max(0, prev - seconds);
      if (next <= 0) {
        onExpireRef.current();
      }
      return next;
    });
  }, []);

  const stop = useCallback(() => {
    // Caller controls via `running` prop
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(initialSeconds);
  }, [initialSeconds]);

  return { timeRemaining, applyPenalty, stop, reset };
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}
