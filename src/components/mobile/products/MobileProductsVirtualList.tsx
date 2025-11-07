import { useRef, useState, useEffect, useMemo, useCallback, memo } from "react";
import { MobileProductItem } from "./MobileProductItem";
import { DataPagination } from "@/components/ui/data-pagination";
import type { ProductMobile } from "@/hooks/mobile/useProductsMobile";

interface MobileProductsVirtualListProps {
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
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (page: number) => void;
  };
}

const ITEM_HEIGHT = 100;
const OVERSCAN = 2;

/**
 * Lista virtualizada ultra-leve para mobile
 * Renderiza apenas itens visíveis
 */
export const MobileProductsVirtualList = memo(function MobileProductsVirtualList({
  products,
  isLoading,
  error,
  onEdit,
  onDelete,
  onRefresh,
  pagination,
}: MobileProductsVirtualListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(window.innerHeight - rect.top - 60);
      }
    };
    updateHeight();
    
    let timeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(updateHeight, 100);
    };
    
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, []);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const end = Math.min(products.length - 1, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN);
    return { start, end };
  }, [scrollTop, containerHeight, products.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop);
    });
  }, []);

  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (products[i]) {
        items.push(
          <div
            key={products[i].id}
            style={{
              position: "absolute",
              top: i * ITEM_HEIGHT,
              left: 0,
              right: 0,
              height: ITEM_HEIGHT,
            }}
          >
            <MobileProductItem
              product={products[i]}
              onEdit={() => onEdit(products[i])}
              onDelete={() => onDelete(products[i])}
            />
          </div>
        );
      }
    }
    return items;
  }, [products, visibleRange, onEdit, onDelete]);

  if (isLoading && products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-sm text-red-600 mb-4">Erro ao carregar</div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-gray-500">Nenhum produto encontrado</div>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: "auto",
          height: containerHeight,
          WebkitOverflowScrolling: "touch",
          willChange: "scroll-position",
          transform: "translateZ(0)",
        }}
      >
        <div
          style={{
            position: "relative",
            height: products.length * ITEM_HEIGHT,
            width: "100%",
          }}
        >
          {visibleItems}
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-800 p-3">
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
});

