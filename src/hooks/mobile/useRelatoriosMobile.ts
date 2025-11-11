import { useMemo } from 'react';
import { useMobile } from '@/contexts/MobileProvider';

/**
 * Hook para otimizar relatórios em mobile
 * - Desabilita gráficos complexos
 * - Reduz quantidade de dados
 * - Simplifica visualizações
 */
export function useRelatoriosMobile() {
  const isMobile = useMobile();

  const config = useMemo(() => ({
    // Desabilitar gráficos pesados em mobile
    enableCharts: !isMobile,
    
    // Limitar dados em mobile
    maxDataPoints: isMobile ? 10 : 50,
    
    // Simplificar tabelas
    showSimplifiedTable: isMobile,
    
    // Lazy load de componentes
    lazyLoadCharts: isMobile,
    
    // Reduzir animações
    enableAnimations: !isMobile,
    
    // Paginação menor em mobile
    itemsPerPage: isMobile ? 5 : 10,
  }), [isMobile]);

  return config;
}
