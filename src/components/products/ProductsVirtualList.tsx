import { memo, useCallback, useMemo, useRef, useEffect, useState } from "react";
import { ProductCardMemoized } from "./ProductCardMemoized";
import type { Product } from "@/hooks/useProducts";

interface ProductsVirtualListProps {
  products: Product[];
  isMobile: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onImageClick?: (url: string) => void;
  getTrendIcon: (trend: string) => JSX.Element;
  getStatusBadge: (quotesCount: number) => JSX.Element;
}

/**
 * Lista otimizada de produtos com lazy rendering
 * - Renderiza itens em lotes para melhor performance
 * - Otimizada para scroll suave em mobile
 * - Intersection Observer para carregamento progressivo
 */
export const ProductsVirtualList = memo<ProductsVirtualListProps>(({
  products,
  isMobile,
  onEdit,
  onDelete,
  onImageClick,
  getTrendIcon,
  getStatusBadge,
}) => {
  const [visibleCount, setVisibleCount] = useState(isMobile ? 10 : 20);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Aumentar itens visíveis quando chegar ao fim
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + (isMobile ? 10 : 20), products.length));
  }, [products.length, isMobile]);

  useEffect(() => {
    if (!loadMoreRef.current) return;

    // Criar observer para detectar quando usuário chega ao fim
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < products.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, visibleCount, products.length]);

  // Resetar contador quando produtos mudarem
  useEffect(() => {
    setVisibleCount(isMobile ? 10 : 20);
  }, [products.length, isMobile]);

  const visibleProducts = useMemo(() => {
    return products.slice(0, visibleCount);
  }, [products, visibleCount]);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {visibleProducts.map((product) => (
          <ProductCardMemoized
            key={product.id}
            product={product}
            isMobile={isMobile}
            onEdit={onEdit}
            onDelete={onDelete}
            onImageClick={onImageClick}
            getTrendIcon={getTrendIcon}
            getStatusBadge={getStatusBadge}
          />
        ))}
      </div>

      {/* Load more trigger */}
      {visibleCount < products.length && (
        <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
          <div className="animate-pulse text-sm text-gray-500 dark:text-gray-400">
            Carregando mais produtos...
          </div>
        </div>
      )}
    </div>
  );
});

ProductsVirtualList.displayName = "ProductsVirtualList";
