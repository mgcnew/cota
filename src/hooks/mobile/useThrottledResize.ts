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
      return window.innerHeight - 200; // Aproximação para header e outros elementos
    }
    return initialHeight;
  });
  
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);

  const updateHeight = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime.current;

    if (timeSinceLastUpdate >= throttleMs) {
      // Atualizar imediatamente se passou tempo suficiente
      const newHeight = window.innerHeight - 200;
      setHeight(newHeight);
      lastUpdateTime.current = now;
    } else {
      // Agendar atualização para depois
      const remainingTime = throttleMs - timeSinceLastUpdate;
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          const newHeight = window.innerHeight - 200;
          setHeight(newHeight);
          lastUpdateTime.current = Date.now();
        });
      }, remainingTime);
    }
  }, [throttleMs]);

  useEffect(() => {
    // Inicializar altura
    updateHeight();

    // Usar ResizeObserver se disponível (mais performático)
    if ('ResizeObserver' in window && typeof window !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        // Throttle usando requestAnimationFrame
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
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }

    // Fallback para addEventListener
    window.addEventListener('resize', updateHeight, { passive: true });

    return () => {
      window.removeEventListener('resize', updateHeight);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateHeight]);

  return height;
}

