/**
 * CSS-only page transition - replaces framer-motion
 * Saves ~367KB in bundle size
 */
import { useLocation } from "react-router-dom";
import { ReactNode, memo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = memo(function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
        prevPathRef.current = location.pathname;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <div
      className={cn(
        "w-full h-full transition-opacity duration-150 ease-out will-change-[opacity]",
        isVisible ? "opacity-100" : "opacity-0"
      )}
    >
      {children}
    </div>
  );
});