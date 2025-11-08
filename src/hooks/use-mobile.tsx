import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 768;

// Função para detectar mobile de forma síncrona (para valor inicial)
function getIsMobileInitial(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  // Inicializar com valor síncrono para evitar renderização dupla
  const [isMobile, setIsMobile] = useState<boolean>(getIsMobileInitial);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    // Atualizar apenas se mudou (evitar re-render desnecessário)
    const currentIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (currentIsMobile !== isMobile) {
      setIsMobile(currentIsMobile);
    }
    return () => mql.removeEventListener("change", onChange);
  }, [isMobile]);

  return isMobile;
}
