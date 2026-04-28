import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Versão do cache — incrementar sempre que houver mudança estrutural nos dados
// Isso força limpeza do cache antigo em todos os navegadores dos usuários
const CACHE_VERSION = 2;
const CACHE_KEY = 'COTA_OFFLINE_CACHE';
const VERSION_KEY = 'COTA_CACHE_VERSION';

// Limpar cache se versão mudou (dados antigos ficam incompatíveis)
if (typeof window !== 'undefined') {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  if (storedVersion !== String(CACHE_VERSION)) {
    console.log(`🔄 Cache version changed (${storedVersion} → ${CACHE_VERSION}), clearing stale data...`);
    localStorage.removeItem(CACHE_KEY);
    localStorage.setItem(VERSION_KEY, String(CACHE_VERSION));
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minuto - dados considerados frescos por apenas 1 min
      gcTime: 30 * 60 * 1000, // 30 minutos - tempo que os dados permanecem no cache
      refetchOnWindowFocus: true, // Atualiza quando o usuário volta à aba do navegador
      refetchOnMount: true, // Atualiza ao montar o componente (navegar entre páginas)
      refetchOnReconnect: true, // Atualiza quando a conexão internet volta
      retry: 1,
    },
  },
});

// Configura persistência no localStorage para carregamento instantâneo
// Os dados persistidos servem como "placeholder" enquanto o fetch real ocorre
if (typeof window !== 'undefined') {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: CACHE_KEY,
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 4, // 4 horas (reduzido de 24h)
    hydrateOptions: {},
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        // Só persiste queries que foram bem-sucedidas
        return query.state.status === 'success';
      },
    },
  });
}
