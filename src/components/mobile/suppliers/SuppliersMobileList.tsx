import { memo, useEffect, useRef, useCallback } from 'react';
import { SupplierMobileCard } from './SupplierMobileCard';
import type { SupplierMobile } from '@/hooks/mobile/useSuppliersMobileInfinite';
import { Loader2 } from 'lucide-react';

interface SuppliersMobileListProps {
  suppliers: SupplierMobile[];
  isLoading: boolean;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  onEdit: (supplier: SupplierMobile) => void;
  onDelete: (supplier: SupplierMobile) => void;
}

/**
 * Lista de fornecedores mobile otimizada
 * 
 * Features:
 * - Infinite scroll com IntersectionObserver
 * - Loading states claros
 * - Empty state elegante
 * - Memoizado para performance
 */
export const SuppliersMobileList = memo<SuppliersMobileListProps>(
  function SuppliersMobileList({ 
    suppliers, 
    isLoading, 
    isFetchingNextPage = false,
    hasNextPage = false,
    fetchNextPage,
    onEdit, 
    onDelete 
  }) {
    // Ref para observar último item
    const observerTarget = useRef<HTMLDivElement>(null);

    // Callback para carregar mais itens
    const handleLoadMore = useCallback(() => {
      if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
        fetchNextPage();
      }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Intersection Observer para infinite scroll
    useEffect(() => {
      const target = observerTarget.current;
      if (!target || !hasNextPage || isFetchingNextPage) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            handleLoadMore();
          }
        },
        { threshold: 0.1, rootMargin: '100px' }
      );

      observer.observe(target);

      return () => {
        observer.disconnect();
      };
    }, [hasNextPage, isFetchingNextPage, handleLoadMore]);
    // Loading inicial
    if (isLoading && suppliers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-orange-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando fornecedores...</p>
        </div>
      );
    }

    // Lista vazia
    if (!isLoading && suppliers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nenhum fornecedor encontrado</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Tente ajustar os filtros ou criar um novo fornecedor</p>
        </div>
      );
    }

    return (
      <div 
        className="space-y-3 pb-4"
        style={{
          contain: 'layout style paint',
          willChange: 'transform',
          transform: 'translateZ(0)', // GPU acceleration
        }}
      >
        {suppliers.map((supplier) => (
          <SupplierMobileCard
            key={supplier.id}
            supplier={supplier}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}

        {/* Trigger para infinite scroll */}
        {hasNextPage && (
          <div ref={observerTarget} className="flex items-center justify-center py-4">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            )}
          </div>
        )}

        {/* Loading durante paginação */}
        {isLoading && suppliers.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    );
  }
);
