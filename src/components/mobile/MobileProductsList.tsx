import { useMemo } from 'react';
import { MobileProductCardSwipeable } from './MobileProductCardSwipeable';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';
import type { ProductMobile } from '@/hooks/mobile/useProductsMobile';

interface MobileProductsListProps {
  products: ProductMobile[];
  isLoading?: boolean;
  onProductEdit?: (product: ProductMobile) => void;
  onProductDelete?: (product: ProductMobile) => void;
}

/**
 * Lista de produtos otimizada para mobile
 * - Renderização eficiente
 * - Loading states otimizados
 * - Empty states amigáveis
 */
export function MobileProductsList({
  products,
  isLoading = false,
  onProductEdit,
  onProductDelete,
}: MobileProductsListProps) {
  // Skeleton loaders otimizados
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

  return (
    <div className="space-y-0">
      {products.map((product) => (
        <MobileProductCardSwipeable
          key={product.id}
          product={product}
          onEdit={onProductEdit}
          onDelete={onProductDelete}
        />
      ))}
    </div>
  );
}

