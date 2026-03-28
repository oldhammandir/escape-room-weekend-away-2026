import { useRef } from 'react';
import { AudioManager } from '../lib/AudioManager';

export function useAudio(): AudioManager {
  const ref = useRef<AudioManager | null>(null);
  if (!ref.current) {
    ref.current = new AudioManager();
  }
  return ref.current;
}
