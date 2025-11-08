import { useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook para gerenciar estado do menu mobile
 * 
 * Funcionalidades:
 * - Estado do dialog "Mais"
 * - Estado do dialog de perfil
 * - Detecção de item ativo
 * - Handlers para navegação
 */
export function useMobileMenu() {
  const location = useLocation();
  const [moreDialogOpen, setMoreDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // Verificar se um path está ativo
  const isActive = useCallback((path: string) => {
    return location.pathname === path || (path === "/dashboard" && location.pathname === "/dashboard");
  }, [location.pathname]);

  // Handlers memoizados
  const handleMoreDialogOpen = useCallback((open: boolean) => {
    setMoreDialogOpen(open);
  }, []);

  const handleProfileDialogOpen = useCallback((open: boolean) => {
    setProfileDialogOpen(open);
  }, []);

  const handleNavigateAndClose = useCallback((navigate: (path: string) => void, path: string) => {
    setMoreDialogOpen(false);
    navigate(path);
  }, []);

  return {
    isActive,
    moreDialogOpen,
    profileDialogOpen,
    handleMoreDialogOpen,
    handleProfileDialogOpen,
    handleNavigateAndClose,
    currentPath: location.pathname,
  };
}

