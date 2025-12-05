import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode, memo } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Transição simplificada - apenas fade para melhor performance
const pageVariants = {
  initial: { opacity: 0 },
  in: { opacity: 1 },
  out: { opacity: 0 },
};

// Duração reduzida para transição mais rápida
const pageTransition = {
  duration: 0.15,
  ease: "easeOut" as const,
};

export const PageTransition = memo(function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
});