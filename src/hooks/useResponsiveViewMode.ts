import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      
      // Se mudou para mobile e está em table, muda para grid
      if (isMobile && viewMode === 'table') {
        setViewMode('grid');
      }
      // Se mudou para desktop e está em grid, pode manter ou mudar para table
      // Deixamos o usuário escolher no desktop
    };

    window.addEventListener('resize', handleResize);
    
    // Executa uma vez para garantir o estado correto
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  return { viewMode, setViewMode };
}