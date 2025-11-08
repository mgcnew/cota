import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook para gerenciar scroll e animações do menu mobile
 * 
 * Funcionalidades:
 * - Detecção de scroll para aplicar efeitos visuais
 * - Reset de transformações ao mudar de página
 * - Otimizado para performance
 */
export function useMobileNavScroll() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  // Detectar scroll e aplicar animações
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    // Usar passive listener para melhor performance
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Reset de transformações ao mudar de página
  useEffect(() => {
    // Usar requestAnimationFrame para evitar layout thrashing
    const resetTransforms = () => {
      const mobileButtons = document.querySelectorAll('.mobile-nav-button');
      mobileButtons.forEach(button => {
        const element = button as HTMLElement;
        element.style.transform = '';
        element.style.scale = '';
      });
    };

    // Delay mínimo para garantir que a navegação foi processada
    const timeoutId = setTimeout(resetTransforms, 50);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [location.pathname]);

  return {
    isScrolled,
  };
}

