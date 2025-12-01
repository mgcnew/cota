import { useState, useCallback } from 'react';
import { ViewMode } from '@/types/pagination';

/**
 * Hook para gerenciar o modo de visualização responsivo
 * No mobile (< 768px), o padrão é "grid" (cards)
 * No desktop (>= 768px), o padrão é "table"
 */
export function useResponsiveViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Verifica se estamos no mobile na inicialização
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'grid' : 'table';
    }
    return 'table';
  });

  const setViewModeMemo = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  return { viewMode, setViewMode: setViewModeMemo };
}
