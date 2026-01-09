import { ReactNode, memo, Suspense } from "react";
import { Loader2 } from "lucide-react";

interface SmoothPageTransitionProps {
  children: ReactNode;
}

// Fallback inline leve
const InlineLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
  </div>
);

// Transição simplificada - apenas Suspense com CSS class para fade
export const SmoothPageTransition = memo(function SmoothPageTransition({ children }: SmoothPageTransitionProps) {
  return (
    <div className="w-full min-h-0 animate-in fade-in duration-150">
      <Suspense fallback={<InlineLoader />}>
        {children}
      </Suspense>
    </div>
  );
});
