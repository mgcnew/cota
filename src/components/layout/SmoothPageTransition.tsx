import { ReactNode, memo, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface SmoothPageTransitionProps {
  children: ReactNode;
}

// Fallback leve para lazy loading
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[40vh]">
    <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
  </div>
);

// Transição com Suspense obrigatório para lazy-loaded pages e animação CSS
export const SmoothPageTransition = memo(function SmoothPageTransition({ children }: SmoothPageTransitionProps) {
  const location = useLocation();

  return (
    <div 
      key={location.pathname} 
      className="animate-fade-in w-full"
      style={{ animationDuration: '400ms', animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </div>
  );
});
