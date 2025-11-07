import { useState, useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useProductsMobile } from '@/hooks/mobile/useProductsMobile';
import { MobileProductsList } from '@/components/mobile/MobileProductsList';
import { MobileProductsListVirtualized } from '@/components/mobile/MobileProductsListVirtualized';
import { MobileFiltersSheet } from '@/components/mobile/MobileFiltersSheet';
import { MobileFAB } from '@/components/mobile/MobileFAB';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { DataPagination } from '@/components/ui/data-pagination';
import { AddProductDialog } from '@/components/forms/AddProductDialog';
import { EditProductDialog } from '@/components/forms/EditProductDialog';
import { DeleteProductDialog } from '@/components/forms/DeleteProductDialog';
import { useToast } from '@/hooks/use-toast';
import type { ProductMobile } from '@/hooks/mobile/useProductsMobile';
import type { Product } from '@/hooks/useProducts';

/**
 * Página de Produtos otimizada para Mobile
 * 
 * Características:
 * - 100% server-side (busca e filtros)
 * - Zero processamento client-side
 * - UX mobile-first nativa
 * - Performance otimizada
 */
export default function ProdutosMobile() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const addDialogTriggerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const triggerAddDialog = useCallback(() => {
    const button = addDialogTriggerRef.current?.querySelector('button');
    button?.click();
  }, []);

  // Hook mobile com busca E categoria server-side
  const {
    products,
    categories,
    isLoading,
    pagination,
    refetch,
  } = useProductsMobile(debouncedSearchQuery, selectedCategory);

  const [editingProduct, setEditingProduct] = useState<ProductMobile | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductMobile | null>(null);

  // Callbacks para ações
  const handleProductEdit = useCallback((product: ProductMobile) => {
    setEditingProduct(product);
  }, []);

  const handleProductDelete = useCallback((product: ProductMobile) => {
    setDeletingProduct(product);
  }, []);

  const handleProductUpdated = useCallback(() => {
    setEditingProduct(null);
    refetch();
    toast({
      title: 'Produto atualizado',
      description: 'O produto foi atualizado com sucesso.',
    });
  }, [refetch, toast]);

  const handleProductDeleted = useCallback(() => {
    setDeletingProduct(null);
    refetch();
    toast({
      title: 'Produto excluído',
      description: 'O produto foi excluído com sucesso.',
      variant: 'destructive',
    });
  }, [refetch, toast]);

  const handleProductAdded = useCallback(() => {
    refetch();
    toast({
      title: 'Produto adicionado',
      description: 'O produto foi adicionado com sucesso.',
    });
  }, [refetch, toast]);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30 dark:from-[#0F1117] dark:via-[#1C1F26] dark:to-[#1C1F26] pb-20">
        {/* Header fixo com design moderno */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#1C1F26]/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
          <div className="p-4 space-y-4">
            {/* Título com gradiente */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400 bg-clip-text text-transparent">
                  Produtos
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {pagination?.totalItems || 0} {pagination?.totalItems === 1 ? 'produto' : 'produtos'}
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de busca melhorada */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500 dark:text-orange-400 h-5 w-5 z-10" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base bg-white/80 dark:bg-gray-800/80 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm focus:border-orange-500 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200"
              />
            </div>

            {/* Filtros com badge de categoria ativa */}
            <div className="flex items-center gap-2">
              <MobileFiltersSheet
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />
              {selectedCategory !== 'all' && (
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">
                      {selectedCategory}
                    </span>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de produtos com pull-to-refresh e virtualização */}
        <div className="px-4 py-2">
          <PullToRefresh onRefresh={refetch}>
            <div className="space-y-0">
              {products.length > 50 ? (
                // ✅ Virtualização para listas grandes (50+ produtos)
                <MobileProductsListVirtualized
                  products={products}
                  isLoading={isLoading}
                  onProductEdit={handleProductEdit}
                  onProductDelete={handleProductDelete}
                />
              ) : (
                // Lista normal para listas pequenas
                <MobileProductsList
                  products={products}
                  isLoading={isLoading}
                  onProductEdit={handleProductEdit}
                  onProductDelete={handleProductDelete}
                />
              )}
            </div>
          </PullToRefresh>

          {/* Paginação mobile-friendly */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <DataPagination
                pagination={pagination}
                className="justify-center"
              />
            </div>
          )}
        </div>

        {/* FAB para adicionar produto */}
        <MobileFAB onClick={triggerAddDialog} />

        {/* Dialog de adicionar produto (hidden trigger) */}
        <div ref={addDialogTriggerRef} className="hidden">
          <AddProductDialog
            onProductAdded={handleProductAdded}
          />
        </div>

        {/* Dialog de editar produto */}
        {editingProduct && (
          <EditProductDialog
            product={editingProduct as unknown as Product}
            open={!!editingProduct}
            onOpenChange={(open) => !open && setEditingProduct(null)}
            onProductUpdated={handleProductUpdated}
          />
        )}

        {/* Dialog de excluir produto */}
        {deletingProduct && (
          <DeleteProductDialog
            product={deletingProduct as unknown as Product}
            open={!!deletingProduct}
            onOpenChange={(open) => !open && setDeletingProduct(null)}
            onProductDeleted={(productId) => {
              handleProductDeleted();
            }}
          />
        )}
      </div>
    </PageWrapper>
  );
}

