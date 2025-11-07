import { useMobile } from "@/contexts/MobileProvider";
import { UseQueryOptions } from "@tanstack/react-query";

/**
 * Hook para obter configurações de query otimizadas para mobile ou desktop
 * 
 * Mobile:
 * - Cache mais agressivo (5 minutos)
 * - Não refetch automático
 * - Foco em performance
 * 
 * Desktop:
 * - Cache menor (30 segundos)
 * - Refetch automático
 * - Dados sempre atualizados
 */
export function useMobileQueryConfig<TData = unknown, TError = Error>() {
  const isMobile = useMobile();

  const config: Partial<UseQueryOptions<TData, TError>> = isMobile
    ? {
        // ✅ Mobile: Cache mais agressivo, menos requisições
        staleTime: 10 * 60 * 1000, // 10 minutos (aumentado)
        gcTime: 15 * 60 * 1000, // 15 minutos (aumentado)
        refetchOnWindowFocus: false,
        refetchOnMount: false, // Usa cache se disponível
        refetchOnReconnect: false,
        retry: 1, // Menos tentativas no mobile
        placeholderData: (previousData) => previousData, // ✅ Mantém dados anteriores durante loading
      }
    : {
        // Desktop: Cache menor, dados mais atualizados
        staleTime: 30 * 1000, // 30 segundos
        gcTime: 5 * 60 * 1000, // 5 minutos
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
        retry: 3,
      };

  return config;
}

