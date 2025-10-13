import { useEffect, useRef, useCallback } from 'react';

interface UseUpdateDetectorProps {
  onUpdateDetected: () => void;
  checkInterval?: number; // em milissegundos, padrão 30 segundos
  enabled?: boolean;
}

export function useUpdateDetector({ 
  onUpdateDetected, 
  checkInterval = 30000, // 30 segundos
  enabled = true 
}: UseUpdateDetectorProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastBuildTimeRef = useRef<string | null>(null);
  const isCheckingRef = useRef(false);



  // Função para verificar se há atualizações
  const checkForUpdates = useCallback(async () => {
    if (!enabled || isCheckingRef.current) return;
    
    isCheckingRef.current = true;
    
    try {
      // Verifica se há uma nova versão através do service worker ou manifest
      // Em desenvolvimento, vamos simular a detecção de atualizações
      if (process.env.NODE_ENV === 'development') {
        // Em desenvolvimento, não fazemos verificação real de atualizações
        return;
      }

      // Em produção, verifica o manifest ou service worker
      const response = await fetch('/manifest.json', {
        method: 'HEAD',
        cache: 'no-cache'
      });

      if (response.ok) {
        const lastModified = response.headers.get('Last-Modified');
        const etag = response.headers.get('ETag');
        
        // Cria uma chave única baseada nos headers
        const currentVersion = `${lastModified || ''}-${etag || ''}`;
        
        if (lastBuildTimeRef.current && lastBuildTimeRef.current !== currentVersion) {
          console.log('🆕 Atualização detectada!', { 
            anterior: lastBuildTimeRef.current, 
            atual: currentVersion 
          });
          onUpdateDetected();
        }
        
        lastBuildTimeRef.current = currentVersion;
      }
    } catch (error) {
      // Em caso de erro, não fazemos nada (silencioso)
      console.debug('Verificação de atualizações não disponível:', error.message);
    } finally {
      isCheckingRef.current = false;
    }
  }, [enabled, onUpdateDetected]);

  // Verificação adicional quando a página volta ao foco
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible' && enabled) {
      // Aguardar um pouco antes de verificar para evitar verificações desnecessárias
      setTimeout(checkForUpdates, 1000);
    }
  }, [checkForUpdates, enabled]);

  // Verificação quando há mudança de conectividade
  const handleOnline = useCallback(() => {
    if (enabled) {
      setTimeout(checkForUpdates, 2000);
    }
  }, [checkForUpdates, enabled]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Verificação inicial
    checkForUpdates();

    // Configurar verificação periódica
    intervalRef.current = setInterval(checkForUpdates, checkInterval);

    // Adicionar listeners para eventos que podem indicar necessidade de verificação
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [enabled, checkInterval, checkForUpdates, handleVisibilityChange, handleOnline]);

  // Função para forçar verificação manual
  const forceCheck = useCallback(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  // Função para resetar o estado (útil após login)
  const reset = useCallback(() => {
    lastBuildTimeRef.current = null;
    console.log('🔄 Estado do detector de atualizações resetado');
  }, []);

  return {
    forceCheck,
    reset
  };
}