import { ReactNode, memo, Suspense } from "react";
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

// Transição com Suspense obrigatório para lazy-loaded pages
export const SmoothPageTransition = memo(function SmoothPageTransition({ children }: SmoothPageTransitionProps) {
  return (
    <Suspense fallback={<PageLoader />}>
      {children}
    </Suspense>
  );
});
