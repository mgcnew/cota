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
  direction?: "forward" | "backward";
}

export const AnimatedTabContent = memo(function AnimatedTabContent({ 
  value, 
  activeTab, 
  children, 
  className = "",
  direction = "forward"
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
        "transition-all duration-300 ease-out will-change-[opacity,transform]",
        isVisible 
          ? "opacity-100 translate-x-0" 
          : cn(
              "opacity-0",
              direction === "forward" ? "translate-x-4" : "-translate-x-4"
            ),
        className
      )}
    >
      {children}
    </div>
  );
});