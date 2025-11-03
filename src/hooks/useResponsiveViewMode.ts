import { useState, useEffect, useCallback } from 'react';
import { ViewMode } from '@/types/pagination';

/**
 * Hook para gerenciar o modo de visualização responsivo
 * No mobile (< 768px), o padrão é "grid" (cards)
 * No desktop (>= 768px), o padrão é "table"
 * Otimizado para mobile com debounce no resize
 */
export function useResponsiveViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Verifica se estamos no mobile na inicialização
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'grid' : 'table';
    }
    return 'table';
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      // Debounce para evitar muitos re-renders no mobile
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const isMobile = window.innerWidth < 768;
        
        // Se mudou para mobile e está em table, muda para grid
        if (isMobile && viewMode === 'table') {
          setViewMode('grid');
        }
      }, 150); // Debounce de 150ms
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [viewMode]);

  const setViewModeMemo = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  return { viewMode, setViewMode: setViewModeMemo };
}