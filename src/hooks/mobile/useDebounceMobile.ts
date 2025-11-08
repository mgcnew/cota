import { useEffect, useRef, useState } from 'react';

/**
 * Hook de debounce otimizado para mobile
 * Usa useRef para evitar re-renders desnecessários
 * Delay padrão menor no mobile (300ms vs 400ms)
 */
export function useDebounceMobile<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const previousValueRef = useRef<T>(value);

  useEffect(() => {
    // Na primeira renderização, retorna o valor imediatamente (sem debounce)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousValueRef.current = value;
      return;
    }

    // Se o valor não mudou, não fazer nada
    if (previousValueRef.current === value) {
      return;
    }

    previousValueRef.current = value;

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Criar novo timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timeoutRef.current = null;
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

