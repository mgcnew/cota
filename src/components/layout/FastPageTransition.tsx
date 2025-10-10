import { useLocation } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";

interface FastPageTransitionProps {
  children: ReactNode;
}

export function FastPageTransition({ children }: FastPageTransitionProps) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState("slideIn");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("slideOut");
    }
  }, [location, displayLocation]);

  return (
    <div
      className={`w-full h-full transition-all duration-200 ease-out ${
        transitionStage === "slideOut" 
          ? "opacity-0 -translate-x-6 scale-[0.98]" 
          : "opacity-100 translate-x-0 scale-100"
      }`}
      onTransitionEnd={() => {
        if (transitionStage === "slideOut") {
          setDisplayLocation(location);
          setTransitionStage("slideIn");
        }
      }}
      style={{ 
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        perspective: '1000px'
      }}
    >
      {children}
    </div>
  );
}