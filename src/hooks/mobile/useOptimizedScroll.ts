import { useEffect } from 'react';

/**
 * Hook para otimizar scroll no mobile
 * 
 * Aplica:
 * - overscrollBehavior: contain (evita rubber band effect)
 * - Otimizações de performance para scroll suave
 */
export function useOptimizedScroll() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Aplicar overscrollBehavior para evitar "rubber band" effect
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'contain';

    // Otimizar scroll para mobile
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.touchAction = 'pan-y';

    return () => {
      // Restaurar valores anteriores ao desmontar
      document.body.style.overscrollBehavior = previousOverscroll;
      document.body.style.touchAction = previousTouchAction;
    };
  }, []);
}
