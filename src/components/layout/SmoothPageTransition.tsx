import { ReactNode, memo } from "react";

interface SmoothPageTransitionProps {
  children: ReactNode;
}

// Transição ultra-leve - apenas wrapper com CSS
// Suspense removido daqui pois já está no lazy() das páginas
export const SmoothPageTransition = memo(function SmoothPageTransition({ children }: SmoothPageTransitionProps) {
  return (
    <div className="w-full min-h-0">
      {children}
    </div>
  );
});
