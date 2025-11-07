import { useState, useEffect, useRef, useMemo } from 'react';
import { MobileProductCardSwipeable } from './MobileProductCardSwipeable';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';
import type { ProductMobile } from '@/hooks/mobile/useProductsMobile';

interface MobileProductsListVirtualizedProps {
  products: ProductMobile[];
  isLoading?: boolean;
  onProductEdit?: (product: ProductMobile) => void;
  onProductDelete?: (product: ProductMobile) => void;
}

/**
 * Lista virtualizada de produtos para mobile
 * - Renderiza apenas itens visíveis
 * - Performance otimizada para 1000+ produtos
 * - Scroll suave a 60fps
 * 
 * Nota: Usa implementação manual de virtualização (sem dependência externa)
 * para manter bundle size pequeno
 */
export function MobileProductsListVirtualized({
  products,
  isLoading = false,
  onProductEdit,
  onProductDelete,
}: MobileProductsListVirtualizedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  // Altura estimada de cada card (180px)
  const ITEM_HEIGHT = 180;
  const OVERSCAN = 3; // Renderizar 3 itens extras fora da viewport

  // Calcular itens visíveis baseado no scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container || products.length === 0) {
      setVisibleRange({ start: 0, end: Math.min(9, products.length - 1) });
      return;
    }

    const handleScroll = () => {
      if (!container) return;
      
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      // Calcular índices visíveis
      const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
      const end = Math.min(
        products.length - 1,
        Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
      );

      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Calcular inicialmente

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [products.length]);

  // Skeleton loaders
  const skeletons = useMemo(
    () => Array.from({ length: 5 }, (_, i) => (
      <Card key={`skeleton-${i}`} className="mb-3 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <Skeleton className="h-5 flex-1" />
          </div>
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </Card>
    )),
    []
  );

  if (isLoading) {
    return (
      <div className="space-y-0">
        {skeletons}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-3">
          <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Nenhum produto encontrado
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tente ajustar os filtros ou adicionar um novo produto
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Calcular altura total da lista
  const totalHeight = products.length * ITEM_HEIGHT;
  
  // Itens visíveis
  const visibleItems = products.slice(visibleRange.start, visibleRange.end + 1);
  const offsetY = visibleRange.start * ITEM_HEIGHT;

  return (
    <div
      ref={containerRef}
      className="h-[calc(100vh-200px)] overflow-auto"
      style={{ contain: 'strict' }} // Otimização CSS
    >
      {/* Container com altura total para scroll correto */}
      <div
        style={{
          height: `${totalHeight}px`,
          position: 'relative',
        }}
      >
        {/* Container dos itens visíveis */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${offsetY}px)`,
          }}
        >
          {visibleItems.map((product, index) => {
            const actualIndex = visibleRange.start + index;
            return (
              <div
                key={product.id}
                style={{
                  height: `${ITEM_HEIGHT}px`,
                  marginBottom: '12px',
                }}
              >
                <MobileProductCardSwipeable
                  product={product}
                  onEdit={onProductEdit}
                  onDelete={onProductDelete}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

