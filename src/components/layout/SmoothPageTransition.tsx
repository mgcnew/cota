import { useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState, useRef, memo } from "react";

interface SmoothPageTransitionProps {
  children: ReactNode;
}

// Usar CSS transitions em vez de framer-motion para melhor performance mobile
export const SmoothPageTransition = memo(function SmoothPageTransition({ children }: SmoothPageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'idle'>('idle');
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      prevPathRef.current = location.pathname;
      setTransitionStage('enter');
      // Atualizar children imediatamente para nova página
      setDisplayChildren(children);
      
      // Resetar para idle após animação
      const timer = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionStage('idle');
        });
      });
      
      return () => cancelAnimationFrame(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [location.pathname, children]);

  return (
    <div 
      className="relative w-full min-h-0 overflow-x-hidden"
      style={{ 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <div
        className="w-full"
        style={{ 
          opacity: transitionStage === 'enter' ? 0.95 : 1,
          transform: transitionStage === 'enter' ? 'translateY(4px)' : 'translateY(0)',
          transition: 'opacity 100ms ease-out, transform 100ms ease-out',
          willChange: 'opacity, transform',
          overflowX: 'hidden',
        }}
      >
        {displayChildren}
      </div>
    </div>
  );
});
