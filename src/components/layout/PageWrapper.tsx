import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

// Detectar se é mobile
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export function PageWrapper({ children, className = "" }: PageWrapperProps) {
  // No mobile, usar div simples sem animação
  if (isMobile) {
    return (
      <div className={`w-full overflow-hidden ${className}`}>
        {children}
      </div>
    );
  }

  // No desktop, usar animação
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.2, 
        ease: "easeOut",
        type: "tween"
      }}
      className={`w-full overflow-hidden ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function PageSection({ children, className = "" }: PageWrapperProps) {
  // No mobile, usar div simples sem animação
  if (isMobile) {
    return (
      <div className={className}>
        {children}
      </div>
    );
  }

  // No desktop, usar animação
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.2, 
        ease: [0.25, 0.46, 0.45, 0.94], 
        delay: 0.05,
        type: "tween"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}