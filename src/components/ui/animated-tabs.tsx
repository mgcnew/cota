import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedTabContentProps {
  value: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

// Constantes para animações bem visíveis
const TAB_TRANSITION_DURATION = 0.5; // 500ms - bem visível
const TAB_TRANSITION_EASING = "easeOut"; // Suave e perceptível

export function AnimatedTabContent({ value, activeTab, children, className = "" }: AnimatedTabContentProps) {
  const isActive = value === activeTab;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={value}
          initial={{ 
            opacity: 0, 
            x: 40,
            y: 20,
            scale: 0.95
          }}
          animate={{ 
            opacity: 1, 
            x: 0,
            y: 0,
            scale: 1
          }}
          exit={{ 
            opacity: 0, 
            x: -40,
            y: -20,
            scale: 0.95
          }}
          transition={{
            duration: TAB_TRANSITION_DURATION,
            ease: TAB_TRANSITION_EASING,
            type: "tween"
          }}
          className={className}
          style={{
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden'
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}