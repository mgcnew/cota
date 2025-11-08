import { lazy, Suspense } from "react";
import { useMobile } from "@/contexts/MobileProvider";
import ProdutosDesktop from "./ProdutosDesktop";

// Lazy load mobile version
const ProdutosMobile = lazy(() => import("./ProdutosMobile"));

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-sm text-gray-500">Carregando...</div>
  </div>
);

/**
 * Router para página de Produtos
 * 
 * Separação completa:
 * - Mobile: ProdutosMobile (componentes leves e específicos para mobile)
 * - Desktop: ProdutosDesktop (versão completa do desktop)
 * 
 * ⚠️ NOTA: ProdutosDesktop.tsx precisa ser restaurado com o código desktop completo.
 * A estrutura do router já está correta e não precisa ser alterada.
 */
export default function Produtos() {
  const isMobile = useMobile();

  // Mobile: lazy load para reduzir bundle
  if (isMobile) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ProdutosMobile />
      </Suspense>
    );
  }

  // Desktop: import direto (sem lazy load necessário)
  return <ProdutosDesktop />;
}
