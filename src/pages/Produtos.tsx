import { lazy, Suspense, useMemo } from "react";
import { useMobile } from "@/contexts/MobileProvider";
import ProdutosDesktop from "./ProdutosDesktop";

// Lazy load mobile version para reduzir bundle inicial
const ProdutosMobile = lazy(() => import("./ProdutosMobile"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Carregando produtos...</p>
    </div>
  </div>
);

/**
 * Router para página de Produtos
 * 
 * Separação completa:
 * - Mobile: ProdutosMobile (lazy loaded para performance)
 * - Desktop: ProdutosDesktop (versão completa do desktop)
 * 
 * Estabilizado para evitar mudanças durante interações (modais, etc)
 */
export default function Produtos() {
  const isMobile = useMobile();
  
  // Memorizar a escolha de layout para evitar mudanças durante interações
  // Uma vez determinado mobile ou desktop, mantém até o próximo mount completo
  const layoutKey = useMemo(() => {
    return isMobile ? 'mobile' : 'desktop';
  }, [isMobile]);

  // Mobile: lazy load com Suspense
  if (isMobile) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ProdutosMobile key={layoutKey} />
      </Suspense>
    );
  }

  // Desktop: import direto
  return <ProdutosDesktop key={layoutKey} />;
}
