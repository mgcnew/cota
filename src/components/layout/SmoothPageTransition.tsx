import { useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState, useMemo } from "react";

interface SmoothPageTransitionProps {
  children: ReactNode;
}

// Constantes otimizadas para transições mais rápidas
const TRANSITION_DURATION = 150; // ms - Reduzido de 300ms para 150ms (50% mais rápido)
const TRANSITION_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1)'; // Easing mais rápido e responsivo

export function SmoothPageTransition({ children }: SmoothPageTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setIsTransitioning(true);
      
      // Timeout otimizado - apenas o tempo necessário para fade out
      const timeoutId = setTimeout(() => {
        setDisplayLocation(location);
        // Usar requestAnimationFrame para garantir que o DOM foi atualizado
        requestAnimationFrame(() => {
          setIsTransitioning(false);
        });
      }, TRANSITION_DURATION / 2);

      return () => clearTimeout(timeoutId);
    }
  }, [location, displayLocation]);

  // Memoizar estilos para evitar recriação
  const transitionStyles = useMemo(() => ({
    transitionDuration: `${TRANSITION_DURATION}ms`,
    transitionTimingFunction: TRANSITION_EASING,
    transitionProperty: 'opacity',
    willChange: isTransitioning ? 'opacity' : 'auto',
    backfaceVisibility: 'hidden' as const,
    WebkitBackfaceVisibility: 'hidden' as const,
    transform: 'translateZ(0)', // Forçar aceleração de hardware
  }), [isTransitioning]);

  return (
    <div
      className={`w-full ${isTransitioning ? "opacity-0" : "opacity-100"}`}
      style={transitionStyles}
    >
      {children}
    </div>
  );
}