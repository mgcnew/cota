import { ReactNode, memo, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  // No mobile a animação de entrada está desativada; o `key={pathname}` só
  // forçaria o remonte da subárvore inteira a cada navegação, recriando as
  // camadas compostas de uma vez — o que no Mali/MediaTek pisca com o buffer
  // antigo (rastro). Sem key e sem animação, o container persiste e o React
  // apenas troca o conteúdo.
  if (isMobile) {
    return (
      <div className="w-full">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </div>
    );
  }

  return (
    <div
      key={location.pathname}
      className="animate-page-enter w-full"
    >
      <Suspense fallback={<PageLoader />}>
        {children}
      </Suspense>
    </div>
  );
});
