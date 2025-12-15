/**
 * CSS-only animated tabs - replaces framer-motion
 * Saves ~367KB in bundle size
 */
import { ReactNode, memo, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AnimatedTabContentProps {
  value: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

export const AnimatedTabContent = memo(function AnimatedTabContent({ 
  value, 
  activeTab, 
  children, 
  className = "" 
}: AnimatedTabContentProps) {
  const isActive = value === activeTab;
  const [shouldRender, setShouldRender] = useState(isActive);
  const [isVisible, setIsVisible] = useState(isActive);

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      // Wait for fade out before unmounting
      const timer = setTimeout(() => setShouldRender(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!shouldRender) return null;

  return (
    <div
      className={cn(
        "transition-opacity duration-150 ease-out will-change-[opacity]",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  );
});