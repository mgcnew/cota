import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, memo } from "react";

interface AnimatedTabContentProps {
  value: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

// Transição simplificada para melhor performance
const TAB_TRANSITION_DURATION = 0.15;

export const AnimatedTabContent = memo(function AnimatedTabContent({ 
  value, 
  activeTab, 
  children, 
  className = "" 
}: AnimatedTabContentProps) {
  const isActive = value === activeTab;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={value}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: TAB_TRANSITION_DURATION,
            ease: "easeOut"
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
});