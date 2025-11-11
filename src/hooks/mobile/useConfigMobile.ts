import { useMemo } from 'react';
import { useMobile } from '@/contexts/MobileProvider';

/**
 * Hook para otimizar Configurações em mobile
 * - Lazy load de seções
 * - Simplificar formulários
 */
export function useConfigMobile() {
  const isMobile = useMobile();

  const config = useMemo(() => ({
    // Lazy load de seções pesadas
    lazyLoadSections: isMobile,
    
    // Mostrar menu como drawer em mobile
    useDrawerMenu: isMobile,
    
    // Simplificar formulários
    showAdvancedOptions: !isMobile,
    
    // Reduzir validações em tempo real
    realtimeValidation: !isMobile,
    
    // Accordion para seções em mobile
    useAccordion: isMobile,
  }), [isMobile]);

  return config;
}
