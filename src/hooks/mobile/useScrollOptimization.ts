import { useEffect } from 'react';
import { useMobile } from '@/contexts/MobileProvider';

/**
 * Hook para otimizar scroll em mobile
 * Aplica otimizações globais de performance
 */
export function useScrollOptimization() {
  const isMobile = useMobile();

  useEffect(() => {
    if (!isMobile) return;

    // Aplicar otimizações no body
    const body = document.body;
    const html = document.documentElement;

    // Prevenir bounce scroll
    body.style.overscrollBehaviorY = 'contain';
    html.style.overscrollBehaviorY = 'contain';

    // Scroll suave em iOS
    (body.style as any).webkitOverflowScrolling = 'touch';

    // Otimizar touch events
    const preventDefaultTouch = (e: TouchEvent) => {
      // Permitir scroll vertical, prevenir horizontal
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Adicionar listener passivo
    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });

    // Detectar quando está scrollando para desabilitar seleção de texto
    let scrollTimeout: NodeJS.Timeout;
    const handleScrollStart = () => {
      body.classList.add('scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        body.classList.remove('scrolling');
      }, 150);
    };

    window.addEventListener('scroll', handleScrollStart, { passive: true });

    // Cleanup
    return () => {
      body.style.overscrollBehaviorY = '';
      html.style.overscrollBehaviorY = '';
      (body.style as any).webkitOverflowScrolling = '';
      body.classList.remove('scrolling');
      document.removeEventListener('touchmove', preventDefaultTouch);
      window.removeEventListener('scroll', handleScrollStart);
      clearTimeout(scrollTimeout);
    };
  }, [isMobile]);
}
