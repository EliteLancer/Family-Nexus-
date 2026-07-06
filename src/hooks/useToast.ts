import { useState, useEffect, useCallback } from 'react';
import { playSuccess, playTick } from '../utils/audio';

export interface Toast {
  message: string;
  type: 'success' | 'error';
}

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    if (type === 'success') {
      playSuccess();
    } else {
      playTick();
    }
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return { toast, showToast, clearToast };
}
