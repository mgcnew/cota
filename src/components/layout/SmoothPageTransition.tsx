import { useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";

interface SmoothPageTransitionProps {
  children: ReactNode;
}

// Constantes otimizadas para transições mais suaves
const TRANSITION_DURATION = 300; // ms - Ligeiramente mais longo para suavidade
const FADE_IN_DELAY = 50; // ms - Pequeno delay para entrada mais natural
const TRANSITION_EASING = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'; // Easing mais suave

export function SmoothPageTransition({ children }: SmoothPageTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true);
      setIsEntering(false);
      
      // Timing otimizado para transição mais natural
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setIsTransitioning(false);
        
        // Pequeno delay para entrada mais suave
        setTimeout(() => {
          setIsEntering(true);
        }, FADE_IN_DELAY);
      }, TRANSITION_DURATION / 2);

      return () => clearTimeout(timer);
    } else {
      // Página inicial - entrada imediata mas suave
      setIsEntering(true);
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`w-full overflow-hidden transition-all ${
        isTransitioning 
          ? "opacity-0 translate-y-1" 
          : isEntering
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-1"
      }`}
      style={{ 
        transitionDuration: `${TRANSITION_DURATION}ms`,
        transitionTimingFunction: TRANSITION_EASING,
        willChange: isTransitioning || !isEntering ? 'transform, opacity' : 'auto',
        backfaceVisibility: 'hidden',
        transformOrigin: 'center top',
        transitionProperty: 'opacity, transform'
      }}
    >
      {children}
    </div>
  );
}