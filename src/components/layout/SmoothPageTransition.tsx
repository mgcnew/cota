import { useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";

interface SmoothPageTransitionProps {
  children: ReactNode;
}

// Constantes padronizadas para todas as páginas
const TRANSITION_DURATION = 250; // ms - Material Design Standard
const TRANSITION_EASING = 'cubic-bezier(0.4, 0.0, 0.2, 1)'; // Material Design Standard Easing

export function SmoothPageTransition({ children }: SmoothPageTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true);
      
      // Timing padronizado para todas as páginas
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
      }, TRANSITION_DURATION);

      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`w-full h-full transition-all ${
        isTransitioning 
          ? "opacity-0 translate-x-4" 
          : "opacity-100 translate-x-0"
      }`}
      style={{ 
        transitionDuration: `${TRANSITION_DURATION}ms`,
        transitionTimingFunction: TRANSITION_EASING,
        willChange: isTransitioning ? 'transform, opacity' : 'auto',
        backfaceVisibility: 'hidden'
      }}
    >
      {children}
    </div>
  );
}