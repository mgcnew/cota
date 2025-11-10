import { useMemo } from 'react';
import { useDeviceType } from './useDeviceType';
import { useMobileQueryConfig } from './useMobileQueryConfig';

/**
 * Configurações inteligentes para queries Supabase baseadas no dispositivo
 * 
 * Mobile:
 * - Limit reduzido (10 registros)
 * - Campos essenciais apenas
 * - Cache agressivo (5min)
 * - Sem JOINs pesados
 * 
 * Desktop:
 * - Limit maior (50 registros)
 * - Campos completos
 * - Cache moderado (30s)
 * - JOINs permitidos
 */
export function useSupabaseSmart() {
  const { isMobile } = useDeviceType();
  const queryConfig = useMobileQueryConfig();

  return useMemo(() => ({
    // Configuração de paginação
    getLimit: () => (isMobile ? 10 : 50),
    
    // Se deve usar JOINs
    shouldUseJoins: () => !isMobile,
    
    // Se deve carregar relações
    shouldLoadRelations: () => !isMobile,
    
    // Configurações de query do React Query
    queryConfig,
    
    // Se é mobile
    isMobile,
    
    // Range para paginação
    getRange: (page: number, pageSize?: number) => {
      const limit = pageSize || (isMobile ? 10 : 50);
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      return { from, to, limit };
    },
    
    // Campos essenciais para mobile (exemplo)
    getEssentialFields: () => {
      if (isMobile) {
        return 'id, name, created_at, updated_at';
      }
      return '*';
    },
  }), [isMobile, queryConfig]);
}
