import { lazy, Suspense } from "react";
import { useMobile } from "@/contexts/MobileProvider";

// ✅ CODE SPLITTING: Lazy load do componente mobile apenas quando necessário
// Desktop não carrega código mobile, reduzindo bundle size
const ProdutosMobile = lazy(() => import("./ProdutosMobile"));
const ProdutosDesktop = lazy(() => import("./ProdutosDesktop"));

// Loading fallback simples
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600 dark:text-gray-400">Carregando...</p>
    </div>
  </div>
);

/**
 * Router simples para página de Produtos
 * 
 * Separação completa:
 * - Mobile: ProdutosMobile.tsx (otimizado, do zero)
 * - Desktop: ProdutosDesktop.tsx (código atual, limpo)
 * 
 * Benefícios:
 * - Zero dependências cruzadas
 * - Code splitting automático
 * - Bundle size otimizado
 * - Manutenção independente
 */
export default function Produtos() {
  // ✅ Hook sempre chamado na mesma ordem
  const isMobile = useMobile();

  // ✅ Renderização condicional DEPOIS de todos os hooks
  if (isMobile) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ProdutosMobile />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProdutosDesktop />
    </Suspense>
  );
}
