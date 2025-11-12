import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

/**
 * Hook para gerenciar itens do menu mobile
 * 
 * Funcionalidades:
 * - Filtragem de itens baseado na plataforma
 * - Ordenação de itens principais
 * - Separação entre itens principais e secundários
 * 
 * Mobile Menu Structure:
 * - Hamburger Menu: Todos os itens visíveis (Dashboard, Produtos, Fornecedores, Cotações, Pedidos, Lista de Compras, Contagem de Estoque)
 * - Hidden: Relatórios, Extra, Anotações (Desktop only)
 */
export function useMobileMenuItems(
  allItems: MenuItem[],
  isMobile: boolean
) {
  // Ordem dos itens principais no mobile
  const mobilePrimaryOrder = useMemo(() => [
    "/dashboard/pedidos",
    "/dashboard/cotacoes",
    "/dashboard",
    "/dashboard/produtos"
  ], []);

  // Itens ocultos no mobile (foco nas funções principais)
  // Mantém: Dashboard, Produtos, Fornecedores, Cotações, Pedidos, Lista de Compras, Contagem de Estoque
  const hiddenOnMobile = useMemo(() => [
    "/dashboard/relatorios",        // Relatórios - Desktop only
    "/dashboard/extra",             // Extra - Desktop only
    "/dashboard/anotacoes"          // Anotações - Desktop only
  ], []);

  // Filtrar itens visíveis baseado na plataforma
  const visibleMenuItems = useMemo(() => {
    if (!isMobile) return allItems;
    return allItems.filter(item => !hiddenOnMobile.includes(item.url));
  }, [allItems, isMobile, hiddenOnMobile]);

  // Itens principais no mobile (primeiros 4)
  const primaryMobileItems = useMemo(() => {
    return mobilePrimaryOrder
      .map(path => visibleMenuItems.find(item => item.url === path))
      .filter((item): item is MenuItem => Boolean(item));
  }, [visibleMenuItems, mobilePrimaryOrder]);

  // Itens restantes (vão para o botão "Mais")
  const remainingMobileItems = useMemo(() => {
    return visibleMenuItems.filter(
      item => !mobilePrimaryOrder.includes(item.url)
    );
  }, [visibleMenuItems, mobilePrimaryOrder]);

  return {
    visibleMenuItems,
    primaryMobileItems,
    remainingMobileItems,
  };
}

