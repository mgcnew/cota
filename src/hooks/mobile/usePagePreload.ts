import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Mapa de páginas relacionadas para preload inteligente
const pageRelations: Record<string, string[]> = {
  "/dashboard": ["/dashboard/produtos", "/dashboard/pedidos"],
  "/dashboard/produtos": ["/dashboard/fornecedores", "/dashboard/cotacoes"],
  "/dashboard/fornecedores": ["/dashboard/produtos", "/dashboard/cotacoes"],
  "/dashboard/cotacoes": ["/dashboard/pedidos", "/dashboard/fornecedores"],
  "/dashboard/pedidos": ["/dashboard/lista-compras", "/dashboard/produtos"],
  "/dashboard/lista-compras": ["/dashboard/pedidos", "/dashboard/produtos"],
  "/dashboard/contagem-estoque": ["/dashboard/produtos"],
  "/dashboard/anotacoes": ["/dashboard"],
};

// Função para fazer preload de um módulo
const preloadPage = (path: string) => {
  const pageMap: Record<string, () => Promise<any>> = {
    "/dashboard": () => import("@/pages/Dashboard"),
    "/dashboard/produtos": () => import("@/pages/Produtos"),
    "/dashboard/fornecedores": () => import("@/pages/Fornecedores"),
    "/dashboard/cotacoes": () => import("@/pages/Cotacoes"),
    "/dashboard/pedidos": () => import("@/pages/Pedidos"),
    "/dashboard/lista-compras": () => import("@/pages/ListaCompras"),
    "/dashboard/contagem-estoque": () => import("@/pages/ContagemEstoque"),
    "/dashboard/anotacoes": () => import("@/pages/Anotacoes"),
    "/dashboard/relatorios": () => import("@/pages/Relatorios"),
    "/dashboard/configuracoes": () => import("@/pages/Configuracoes"),
  };

  const loader = pageMap[path];
  if (loader) {
    // Usar requestIdleCallback para não bloquear a thread principal
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        loader().catch(() => {
          // Silenciosamente falhar - não é crítico
        });
      });
    } else {
      // Fallback para navegadores sem suporte
      setTimeout(() => {
        loader().catch(() => {});
      }, 100);
    }
  }
};

/**
 * Hook para fazer preload inteligente de páginas relacionadas
 * Carrega páginas que o usuário provavelmente visitará em seguida
 */
export function usePagePreload() {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const relatedPages = pageRelations[currentPath] || [];

    // Aguardar um pouco antes de fazer preload para não interferir com a página atual
    const timeoutId = setTimeout(() => {
      relatedPages.forEach((page) => {
        preloadPage(page);
      });
    }, 1000); // 1 segundo após carregar a página atual

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
}
