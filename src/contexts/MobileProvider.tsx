import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const MOBILE_BREAKPOINT = 768;

interface MobileContextType {
  isMobile: boolean;
}

const MobileContext = createContext<MobileContextType>({ isMobile: false });

let globalIsMobile = typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false;
let listeners: Set<() => void> = new Set();
let mediaQueryList: MediaQueryList | null = null;

function updateIsMobile(newValue: boolean) {
  if (globalIsMobile !== newValue) {
    globalIsMobile = newValue;
    listeners.forEach(listener => listener());
  }
}

function initMediaQuery() {
  if (typeof window === 'undefined') return;
  
  mediaQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  
  const handleChange = (e: MediaQueryListEvent) => {
    updateIsMobile(e.matches);
  };
  
  // Suporte para addEventListener (navegadores modernos)
  if (mediaQueryList.addEventListener) {
    mediaQueryList.addEventListener('change', handleChange);
  } else {
    // Fallback para navegadores antigos
    mediaQueryList.addListener(handleChange);
  }
  
  // Atualizar valor inicial
  updateIsMobile(mediaQueryList.matches);
  
  // Limpeza quando necessário
  return () => {
    if (mediaQueryList) {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        mediaQueryList.removeListener(handleChange);
      }
    }
  };
}

// Inicializar na primeira importação
if (typeof window !== 'undefined' && !mediaQueryList) {
  initMediaQuery();
}

export function MobileProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(globalIsMobile);

  useEffect(() => {
    // Inicializar se ainda não foi inicializado
    if (!mediaQueryList && typeof window !== 'undefined') {
      initMediaQuery();
    }

    // Adicionar listener
    const listener = () => {
      setIsMobile(globalIsMobile);
    };
    
    listeners.add(listener);
    
    // Atualizar valor inicial
    setIsMobile(globalIsMobile);

    // Cleanup
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile }}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context.isMobile;
}

// Hook de compatibilidade - mantém a mesma interface do useIsMobile antigo
export function useIsMobile() {
  return useMobile();
}

