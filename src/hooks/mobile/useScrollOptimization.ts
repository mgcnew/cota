import { useEffect } from 'react';
import { useMobile } from '@/contexts/MobileProvider';

/**
 * Hook para otimizar scroll em mobile
 * Aplica otimizações globais de performance com cleanup adequado
 */
export function useScrollOptimization() {
  const isMobile = useMobile();

  useEffect(() => {
    if (!isMobile) return;

    // AbortController para gerenciar listeners
    const abortController = new AbortController();
    const { signal } = abortController;

    // Salvar estados originais
    const body = document.body;
    const html = document.documentElement;
    const originalBodyOverscroll = body.style.overscrollBehaviorY;
    const originalHtmlOverscroll = html.style.overscrollBehaviorY;
    const originalWebkitScroll = (body.style as any).webkitOverflowScrolling;

    // Aplicar otimizações
    body.style.overscrollBehaviorY = 'contain';
    html.style.overscrollBehaviorY = 'contain';
    (body.style as any).webkitOverflowScrolling = 'touch';

    // Otimizar touch events - apenas prevenir multi-touch
    const preventMultiTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Adicionar listener com AbortController
    document.addEventListener('touchmove', preventMultiTouch, { 
      passive: false, 
      signal 
    });

    // Detectar scroll para desabilitar seleção temporariamente
    let scrollTimeout: NodeJS.Timeout | null = null;
    const handleScrollStart = () => {
      body.classList.add('scrolling');
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        body.classList.remove('scrolling');
        scrollTimeout = null;
      }, 150);
    };

    window.addEventListener('scroll', handleScrollStart, { 
      passive: true, 
      signal 
    });

    // Cleanup completo
    return () => {
      // Abortar todos os event listeners
      abortController.abort();
      
      // Restaurar estilos originais
      body.style.overscrollBehaviorY = originalBodyOverscroll;
      html.style.overscrollBehaviorY = originalHtmlOverscroll;
      (body.style as any).webkitOverflowScrolling = originalWebkitScroll;
      
      // Limpar classes
      body.classList.remove('scrolling');
      
      // Limpar timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
        scrollTimeout = null;
      }
    };
  }, [isMobile]);
}
