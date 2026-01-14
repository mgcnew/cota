import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
      gcTime: 10 * 60 * 1000, // 10 minutos - tempo de cache
      refetchOnWindowFocus: false, // NÃO refazer fetch ao focar na janela (evita gargalo)
      refetchOnMount: false, // NÃO refazer fetch se dados estão frescos (evita re-render)
      refetchOnReconnect: false, // NÃO refazer fetch ao reconectar
      retry: 1, // Apenas 1 retry para falhas
    },
  },
});
