import { useState, useRef, useCallback } from 'react';

type CountdownState = 'waiting' | 'running' | 'stopped' | 'finished';

interface UseCountdownOptions {
  totalMs: number;
  onFinish: () => void;
}

export function useCountdown({ totalMs, onFinish }: UseCountdownOptions) {
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const [state, setState] = useState<CountdownState>('waiting');
  const lastFrameRef = useRef<number | null>(null);
  const animIdRef = useRef<number | null>(null);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const remainingRef = useRef(totalMs);

  const tick = useCallback(() => {
    const now = performance.now();
    const delta = now - (lastFrameRef.current ?? now);
    lastFrameRef.current = now;

    remainingRef.current = Math.max(0, remainingRef.current - delta);
    setRemainingMs(remainingRef.current);

    if (remainingRef.current <= 0) {
      setState('finished');
      animIdRef.current = null;
      onFinishRef.current();
      return;
    }

    animIdRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(() => {
    setState('running');
    lastFrameRef.current = performance.now();
    animIdRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stop = useCallback(() => {
    setState('stopped');
    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    if (animIdRef.current) {
      cancelAnimationFrame(animIdRef.current);
      animIdRef.current = null;
    }
    setState('waiting');
    remainingRef.current = totalMs;
    setRemainingMs(totalMs);
    lastFrameRef.current = null;
  }, [totalMs]);

  return { remainingMs, state, start, stop, reset };
}

export function formatCountdown(ms: number): string {
  const totalSecs = Math.ceil(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return mins + ':' + String(secs).padStart(2, '0');
}
