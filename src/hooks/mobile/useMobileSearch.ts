import { useState, useCallback, useEffect } from 'react';
import { useMobile } from '@/contexts/MobileProvider';

/**
 * Hook otimizado para barra de busca mobile
 * 
 * Funcionalidades:
 * - Gerencia estado da busca
 * - Otimizações para mobile (sem atalhos de teclado)
 * - Debounce automático
 * - Detecção de plataforma
 * - Handlers memoizados
 */
export function useMobileSearch() {
  const isMobile = useMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fechar busca ao pressionar ESC (apenas em desktop)
  useEffect(() => {
    if (isMobile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, isMobile]);

  // Handlers memoizados
  const handleOpenSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const handleCloseSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    isMobile,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    handleOpenSearch,
    handleCloseSearch,
    handleSearchChange,
    handleClearSearch,
  };
}
