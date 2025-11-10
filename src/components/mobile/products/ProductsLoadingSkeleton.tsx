import { memo } from 'react';

interface ProductsLoadingSkeletonProps {
  count?: number;
}

/**
 * Skeleton loading para lista de produtos
 * - Animação shimmer suave
 * - Layout idêntico ao card real
 * - Performance otimizada
 */
export const ProductsLoadingSkeleton = memo<ProductsLoadingSkeletonProps>(
  function ProductsLoadingSkeleton({ count = 5 }) {
    return (
      <div className="space-y-3 px-3 py-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm animate-pulse"
          >
            <div className="flex items-start gap-3">
              {/* Skeleton imagem */}
              <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-gray-200 dark:bg-gray-800" />

              {/* Skeleton informações */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="space-y-1">
                  {/* Skeleton nome */}
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  {/* Skeleton badge categoria */}
                  <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-20" />
                </div>

                {/* Skeleton detalhes */}
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-16" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-24" />
                </div>
              </div>

              {/* Skeleton botões */}
              <div className="flex-shrink-0 flex flex-col gap-2">
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

/**
 * Skeleton para indicador de loading no final da lista (infinite scroll)
 */
export const ProductsLoadingMore = memo(function ProductsLoadingMore() {
  return (
    <div className="py-4 flex justify-center">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
        <span>Carregando mais produtos...</span>
      </div>
    </div>
  );
});
