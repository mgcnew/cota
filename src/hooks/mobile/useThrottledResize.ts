import { useEffect, useRef, useState, useCallback } from 'react';

interface UseThrottledResizeOptions {
  throttleMs?: number;
  initialHeight?: number;
}

/**
 * Hook para detectar mudanças de tamanho com throttling
 * Otimizado para mobile - reduz recálculos durante scroll/resize
 */
export function useThrottledResize({
  throttleMs = 150,
  initialHeight = 600,
}: UseThrottledResizeOptions = {}) {
  const [height, setHeight] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight - 200;
    }
    return initialHeight;
  });
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);

  const updateHeight = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;

    if (timeSinceLastUpdate >= throttleMs) {
      const newHeight = window.innerHeight - 200;
      setHeight(newHeight);
      lastUpdateTime.current = now;
    } else {
      const remainingTime = throttleMs - timeSinceLastUpdate;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          if (typeof window !== 'undefined') {
            const newHeight = window.innerHeight - 200;
            setHeight(newHeight);
            lastUpdateTime.current = Date.now();
          }
        });
      }, remainingTime);
    }
  }, [throttleMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial update
    updateHeight();

    // Usar ResizeObserver se disponível (mais performático)
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          updateHeight();
        });
      });

      resizeObserver.observe(document.documentElement);

      return () => {
        resizeObserver.disconnect();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    // Fallback para resize listener
    const handleResize = () => updateHeight();
    const win = window as Window & typeof globalThis;
    win.addEventListener('resize', handleResize, { passive: true });

    return () => {
      win.removeEventListener('resize', handleResize);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [updateHeight]);

  return height;
}
