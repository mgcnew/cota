import { useState, useEffect, useCallback } from 'react';
import { ViewMode } from '@/types/pagination';
import { useMobile } from '@/contexts/MobileProvider';

/**
 * Hook para gerenciar o modo de visualização responsivo
 * No mobile (< 768px), o padrão é "grid" (cards)
 * No desktop (>= 768px), o padrão é "table"
 * Otimizado para mobile usando MediaQueryList ao invés de window.resize
 */
export function useResponsiveViewMode() {
  const isMobile = useMobile();
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Verifica se estamos no mobile na inicialização
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'grid' : 'table';
    }
    return 'table';
  });

  useEffect(() => {
    // Se mudou para mobile e está em table, muda para grid
    if (isMobile && viewMode === 'table') {
      setViewMode('grid');
    }
  }, [isMobile, viewMode]);

  const setViewModeMemo = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  return { viewMode, setViewMode: setViewModeMemo };
}