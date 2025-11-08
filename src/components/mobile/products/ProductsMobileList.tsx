import { memo, useEffect, useRef, useCallback } from 'react';
import { ProductMobileCard } from './ProductMobileCard';
import type { ProductMobile } from '@/hooks/mobile/useProductsMobile';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductsMobileListProps {
  products: ProductMobile[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  onEdit: (product: ProductMobile) => void;
  onDelete: (product: ProductMobile) => void;
}

/**
 * Lista de produtos mobile com infinite scroll estilo Facebook
 * 
 * Otimizações:
 * - IntersectionObserver com requestAnimationFrame
 * - Sentinel com rootMargin 200px (carrega antes de chegar ao fim)
 * - Threshold 0.1 (carrega quando 10% visível)
 * - CSS containment para isolamento de renderização
 * - GPU acceleration com transform translateZ(0)
 * - React.memo para evitar re-renders
 * - Loading states otimizados
 * - Zero travamentos durante scroll
 */
export const ProductsMobileList = memo<ProductsMobileListProps>(
  function ProductsMobileList({
    products,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    onEdit,
    onDelete,
  }) {
    const sentinelRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const rafRef = useRef<number | null>(null);

    // Configurar IntersectionObserver para detectar quando chegar ao fim
    useEffect(() => {
      if (!sentinelRef.current) return;

      // Encontrar o container de scroll (pai mais próximo com overflow)
      const findScrollContainer = (el: HTMLElement | null): HTMLElement | null => {
        if (!el) return null;
        const style = window.getComputedStyle(el);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' || 
            style.overflow === 'auto' || style.overflow === 'scroll') {
          return el;
        }
        return findScrollContainer(el.parentElement);
      };

      const scrollContainer = containerRef.current 
        ? findScrollContainer(containerRef.current.parentElement)
        : null;

      // Disconnect observer anterior se existir
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      // Criar novo observer com otimizações agressivas de performance
      observerRef.current = new IntersectionObserver(
        (entries) => {
          // Usar requestAnimationFrame para melhorar performance
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }
          
          rafRef.current = requestAnimationFrame(() => {
            const [entry] = entries;
            // Carregar próxima página quando sentinel entra no viewport
            // Verificações adicionais para evitar carregamentos desnecessários
            if (
              entry.isIntersecting && 
              hasNextPage && 
              !isFetchingNextPage && 
              !isLoading
            ) {
              fetchNextPage();
            }
          });
        },
        {
          // Threshold de 0.1 = carregar quando 10% do elemento estiver visível
          threshold: 0.1,
          // Root margin para começar a carregar um pouco antes (otimizado para mobile)
          // 200px = carrega 200px antes de chegar ao fim (scroll suave)
          rootMargin: '200px',
          // Usar o container de scroll como root se disponível
          root: scrollContainer || null,
        }
      );

      // Observar o elemento sentinel
      observerRef.current.observe(sentinelRef.current);

      // Cleanup
      return () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, [hasNextPage, isFetchingNextPage, isLoading, fetchNextPage]);

    // Handlers memoizados
    const handleEdit = useCallback((product: ProductMobile) => {
      onEdit(product);
    }, [onEdit]);

    const handleDelete = useCallback((product: ProductMobile) => {
      onDelete(product);
    }, [onDelete]);

    // Loading inicial
    if (isLoading && products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando produtos...</p>
        </div>
      );
    }

    // Lista vazia
    if (!isLoading && products.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nenhum produto encontrado</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tente ajustar os filtros ou criar um novo produto</p>
        </div>
      );
    }

    return (
      <div 
        ref={containerRef}
        className="space-y-3 pb-4"
        style={{
          contain: 'layout style paint',
          willChange: 'transform',
          transform: 'translateZ(0)', // GPU acceleration
        }}
      >
        {/* Lista de produtos */}
        {products.map((product) => (
          <ProductMobileCard
            key={product.id}
            product={product}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        {/* Sentinel para infinite scroll */}
        <div
          ref={sentinelRef}
          className={cn(
            "flex items-center justify-center py-4",
            !hasNextPage && "hidden"
          )}
          aria-hidden="true"
          style={{
            contain: 'layout style paint',
          }}
        >
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando mais produtos...</span>
            </div>
          )}
        </div>

        {/* Mensagem de fim da lista */}
        {!hasNextPage && products.length > 0 && (
          <div className="flex items-center justify-center py-6">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Você chegou ao fim da lista
            </p>
          </div>
        )}
      </div>
    );
  }
);

