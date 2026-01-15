import { useEffect, useRef, useCallback } from 'react';

interface UseInactivityDetectorProps {
  timeout: number; // em milissegundos
  onInactive: () => void;
  enabled?: boolean;
}

export function useInactivityDetector({ 
  timeout, 
  onInactive, 
  enabled = true 
}: UseInactivityDetectorProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Função para resetar o timer de inatividade
  const resetTimer = useCallback(() => {
    if (!enabled) return;

    lastActivityRef.current = Date.now();
    
    // Limpar timer anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Criar novo timer
    timeoutRef.current = setTimeout(() => {
      console.log('🕐 Usuário inativo por', timeout / 1000 / 60, 'minutos');
      onInactive();
    }, timeout);
  }, [timeout, onInactive, enabled]);

  // Função para verificar se o usuário está ativo
  const isActive = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    return timeSinceLastActivity < timeout;
  }, [timeout]);

  // Eventos que indicam atividade do usuário
  const activityEvents = [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'focus'
  ];

  useEffect(() => {
    if (!enabled) {
      // Limpar timer se desabilitado
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Inicializar timer
    resetTimer();

    // Adicionar listeners de atividade com passive: true para não bloquear scroll
    const handleActivity = () => {
      resetTimer();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { capture: true, passive: true });
    });

    // Listener para mudança de visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Verificar se ainda está dentro do tempo limite
        if (!isActive()) {
          console.log('🕐 Página voltou ao foco, mas usuário estava inativo');
          onInactive();
        } else {
          resetTimer();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });

      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, resetTimer, onInactive, isActive]);

  // Função para forçar reset manual do timer
  const forceReset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Função para obter tempo restante
  const getTimeRemaining = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const remaining = Math.max(0, timeout - timeSinceLastActivity);
    return remaining;
  }, [timeout]);

  return {
    forceReset,
    getTimeRemaining,
    isActive
  };
}