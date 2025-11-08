import { lazy, Suspense } from "react";
import { useMobile } from "@/contexts/MobileProvider";
import ProdutosDesktop from "./ProdutosDesktop";

// Lazy load mobile version otimizada
const ProdutosMobileOptimized = lazy(() => import("./ProdutosMobileOptimized"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center gap-2">
      <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
      <div className="text-sm text-gray-500">Carregando produtos...</div>
    </div>
  </div>
);

/**
 * Router para página de Produtos
 * 
 * Separação completa:
 * - Mobile: ProdutosMobileOptimized (hooks otimizados, lazy loading, virtualização)
 * - Desktop: ProdutosDesktop (versão completa do desktop)
 * 
 * Mobile usa:
 * - Hooks específicos para mobile (useDebounceMobile, useProductsMobileOptimized)
 * - Lazy loading de imagens (IntersectionObserver)
 * - Filtros server-side
 * - Virtualização com throttling
 * - Zero efeitos pesados
 */
export default function Produtos() {
  const isMobile = useMobile();

  // Mobile: lazy load versão otimizada
  if (isMobile) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ProdutosMobileOptimized />
      </Suspense>
    );
  }

  // Desktop: import direto (sem lazy load necessário)
  return <ProdutosDesktop />;
}
