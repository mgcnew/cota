import { useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SmoothPageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -8,
  },
};

const pageTransition: any = {
  duration: 0.15,
  ease: "easeOut",
};

export function SmoothPageTransition({ children }: SmoothPageTransitionProps) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsTransitioning(true);
    // Garantir que scrollbar nunca apareça durante transição
    document.body.style.overflowY = 'auto';
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.overflowX = 'hidden';
    
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname]);

  return (
    <div 
      className="relative w-full min-h-0 overflow-x-hidden scrollbar-hide" 
      data-transitioning={isTransitioning}
      style={{ 
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          className="w-full scrollbar-hide"
          style={{ 
            position: 'relative',
            willChange: 'opacity, transform',
            overflowX: 'hidden',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
