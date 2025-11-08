import { lazy, Suspense, useMemo } from "react";
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
 * Estabilizado para evitar mudanças durante interações (modais, etc)
 */
export default function Produtos() {
  const isMobile = useMobile();
  
  // Memorizar a escolha de layout para evitar mudanças durante interações
  // Uma vez determinado mobile ou desktop, mantém até o próximo mount completo
  const layoutKey = useMemo(() => {
    return isMobile ? 'mobile' : 'desktop';
  }, [isMobile]);

  // Mobile: lazy load para reduzir bundle
  if (isMobile) {
    return (
      <Suspense fallback={<LoadingFallback />} key={layoutKey}>
        <ProdutosMobile />
      </Suspense>
    );
  }

  // Desktop: import direto (sem lazy load necessário)
  return <ProdutosDesktop key={layoutKey} />;
}
