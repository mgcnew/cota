import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { MobileProductCard } from "./MobileProductCard";
import { DataPagination } from "@/components/ui/data-pagination";
import { Package } from "lucide-react";
import type { ProductMobile } from "@/hooks/mobile/useProductsMobile";

interface MobileProductsListProps {
  products: ProductMobile[];
  isLoading: boolean;
  error: Error | null;
  onEdit: (product: ProductMobile) => void;
  onDelete: (product: ProductMobile) => void;
  onRefresh: () => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    pageSize?: number;
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (page: number) => void;
    setItemsPerPage?: (size: number) => void;
  };
}

const ITEM_HEIGHT = 160; // Altura estimada de cada card (com padding)
const OVERSCAN = 3; // Itens extras para scroll suave

/**
 * Lista virtualizada de produtos mobile (implementação manual)
 * 
 * Performance:
 * - Virtualização manual: renderiza apenas itens visíveis
 * - Scroll otimizado com cálculo de viewport
 * - Suporta milhares de produtos sem lag
 */
export function MobileProductsList({
  products,
  isLoading,
  error,
  onEdit,
  onDelete,
  onRefresh,
  pagination,
}: MobileProductsListProps) {
  // ✅ TODOS OS HOOKS DEVEM SER CHAMADOS PRIMEIRO, ANTES DE QUALQUER RETURN
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Calcular altura dinâmica do container
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(window.innerHeight - rect.top - 100); // 100px para header e paginação
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Calcular itens visíveis (virtualização manual)
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const endIndex = Math.min(
      products.length - 1,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
    );
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, products.length]);

  // Handler de scroll otimizado com throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Usar requestAnimationFrame para suavizar atualizações
    requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop);
    });
  }, []);

  // ✅ Renderizar apenas itens visíveis - DEVE SER CHAMADO ANTES DE QUALQUER RETURN
  const visibleItems = useMemo(() => {
    // Se não houver produtos, retornar array vazio
    if (products.length === 0) return [];
    
    const items = [];
    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      if (products[i]) {
        items.push(
          <div
            key={products[i].id}
            style={{
              position: "absolute",
              top: i * ITEM_HEIGHT,
              left: 0,
              width: "100%",
              height: ITEM_HEIGHT,
              willChange: 'transform',
              transform: 'translateZ(0)'
            }}
          >
            <div className="px-4 py-2 h-full">
              <MobileProductCard
                product={products[i]}
                onEdit={() => onEdit(products[i])}
                onDelete={() => onDelete(products[i])}
              />
            </div>
          </div>
        );
      }
    }
    return items;
  }, [products, visibleRange, onEdit, onDelete]);

  // ✅ AGORA SIM: Verificações condicionais DEPOIS de todos os hooks
  // Loading state
  if (isLoading && products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="rounded-full h-12 w-12 border-b-2 border-gray-300 dark:border-gray-600 mx-auto"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Carregando produtos...</p>
      </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-red-600 dark:text-red-400">Erro ao carregar produtos</p>
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 text-gray-400 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum produto encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="flex-1 overflow-auto"
        ref={containerRef}
        onScroll={handleScroll}
        style={{ 
          height: containerHeight,
          WebkitOverflowScrolling: 'touch',
          willChange: 'scroll-position',
          transform: 'translateZ(0)',
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px'
        }}
      >
        <div
          style={{
            position: "relative",
            height: products.length * ITEM_HEIGHT,
            width: "100%",
            willChange: 'auto'
          }}
        >
          {visibleItems}
        </div>
      </div>

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <DataPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={pagination.goToPage}
            onNextPage={pagination.nextPage}
            onPrevPage={pagination.prevPage}
          />
        </div>
      )}
    </>
  );
}

