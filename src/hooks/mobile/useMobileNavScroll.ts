import { useState, useEffect } from 'react';

/**
 * Hook simplificado para detecção de scroll no menu mobile
 * 
 * IMPORTANTE: Não manipula DOM diretamente para evitar conflitos
 * Apenas detecta estado de scroll para uso opcional
 */
export function useMobileNavScroll() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Passive listener para não bloquear scroll
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { isScrolled };
}

