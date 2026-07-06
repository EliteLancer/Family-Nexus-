import { useState, useEffect, useCallback } from 'react';
import { playTick, playSwoosh, playSuccess, setMuted } from '../utils/audio';

export function useAudioFeedback() {
  const [isMuted, setIsMutedState] = useState<boolean>(() => {
    const saved = localStorage.getItem('family_nexus_muted');
    return saved === 'true';
  });

  useEffect(() => {
    setMuted(isMuted);
    localStorage.setItem('family_nexus_muted', isMuted ? 'true' : 'false');
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMutedState(prev => {
      const next = !prev;
      if (!next) {
        setTimeout(() => playTick(), 50);
      }
      return next;
    });
  }, []);

  return { isMuted, toggleMute, playTick, playSwoosh, playSuccess };
}
