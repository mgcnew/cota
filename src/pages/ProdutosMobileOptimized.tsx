import { useState, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProductsMobileOptimized } from "@/hooks/mobile/useProductsMobileOptimized";
import { useDebounceMobile } from "@/hooks/mobile/useDebounceMobile";
import { useCategoriesMobile } from "@/hooks/mobile/useCategoriesMobile";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MobileProductsSearch } from "@/components/mobile/products/MobileProductsSearch";
import { MobileProductsVirtualListOptimized } from "@/components/mobile/products/MobileProductsVirtualListOptimized";
import { MobileProductsFilters } from "@/components/mobile/products/MobileProductsFilters";
import { MobileProductsFAB } from "@/components/mobile/products/MobileProductsFAB";
import type { ProductMobile } from "@/hooks/mobile/useProductsMobileOptimized";

// Lazy load dialogs - apenas carregados quando necessários
const AddProductDialog = lazy(() => 
  import("@/components/forms/AddProductDialog").then(m => ({ default: m.AddProductDialog }))
);
const EditProductDialog = lazy(() => 
  import("@/components/forms/EditProductDialog").then(m => ({ default: m.EditProductDialog }))
);
const DeleteProductDialog = lazy(() => 
  import("@/components/forms/DeleteProductDialog").then(m => ({ default: m.DeleteProductDialog }))
);

/**
 * Página de Produtos Mobile - Ultra Otimizada
 * 
 * Performance:
 * - Hooks específicos para mobile
 * - Lazy loading de todos os dialogs
 * - Debounce otimizado (300ms)
 * - Categorias do servidor (não calculadas no cliente)
 * - Filtro de categoria server-side
 * - Virtualização nativa com IntersectionObserver
 * - Zero efeitos pesados
 * - CSS containment para isolamento
 */
export default function ProdutosMobileOptimized() {
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMobile | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductMobile | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Debounce otimizado para mobile (300ms)
  const debouncedSearchQuery = useDebounceMobile(searchQuery, 300);
  
  // Buscar categorias do servidor (cache agressivo, sempre disponível)
  const { categories } = useCategoriesMobile(true);

  // Hook otimizado com filtro server-side
  const {
    products,
    isLoading,
    error,
    pagination,
    deleteProduct,
    updateProduct,
    refetch,
  } = useProductsMobileOptimized(debouncedSearchQuery, selectedCategory);

  // Handlers memoizados - zero dependências desnecessárias
  const handleAdd = useCallback(() => {
    setAddDialogOpen(true);
  }, []);

  const handleEdit = useCallback((product: ProductMobile) => {
    setEditingProduct(product);
  }, []);

  const handleDelete = useCallback((product: ProductMobile) => {
    setDeletingProduct(product);
  }, []);

  const handleFiltersToggle = useCallback(() => {
    setFiltersOpen(prev => !prev);
  }, []);

  const handleCategorySelect = useCallback((cat: string) => {
    setSelectedCategory(cat);
    setFiltersOpen(false);
  }, []);

  const handleProductUpdated = useCallback((updated: any) => {
    if (updateProduct?.mutate) {
      updateProduct.mutate({
        productId: updated.id,
        data: {
          name: updated.name,
          category: updated.category,
          unit: updated.unit,
          barcode: updated.barcode,
        },
      });
    }
    setEditingProduct(null);
  }, [updateProduct]);

  const handleProductDeleted = useCallback((id: string) => {
    if (deleteProduct?.mutate) {
      deleteProduct.mutate(id);
    }
    setDeletingProduct(null);
  }, [deleteProduct]);

  const handleProductAdded = useCallback(() => {
    setAddDialogOpen(false);
    refetch();
  }, [refetch]);

  // Verificação de autenticação
  if (!loading && !user) {
    return <AuthDialog open={true} onOpenChange={setAuthDialogOpen} />;
  }

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className="flex flex-col h-full" style={{ overflow: 'hidden', contain: 'layout style' }}>
          <MobileProductsSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onFiltersClick={handleFiltersToggle}
            activeCategory={selectedCategory !== "all" ? selectedCategory : null}
            onClearCategory={() => setSelectedCategory("all")}
          />
          
          <MobileProductsVirtualListOptimized
            products={products}
            isLoading={isLoading}
            error={error}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={refetch}
            pagination={pagination}
          />

          <MobileProductsFilters
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            categories={categories}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
          />

          <MobileProductsFAB onClick={handleAdd} />
        </div>
      </PageWrapper>

      {/* Dialogs lazy loaded - apenas renderizados quando abertos */}
      {addDialogOpen && (
        <Suspense 
          fallback={
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
              </div>
            </div>
          }
        >
          <AddProductDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            onProductAdded={handleProductAdded}
            onCategoryAdded={() => {}}
          />
        </Suspense>
      )}

      {editingProduct && (
        <Suspense 
          fallback={
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
              </div>
            </div>
          }
        >
          <EditProductDialog
            product={editingProduct as any}
            open={!!editingProduct}
            onOpenChange={(open) => !open && setEditingProduct(null)}
            onProductUpdated={handleProductUpdated}
            onCategoryAdded={() => {}}
            categories={categories}
          />
        </Suspense>
      )}

      {deletingProduct && (
        <Suspense 
          fallback={
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
              </div>
            </div>
          }
        >
          <DeleteProductDialog
            product={deletingProduct as any}
            open={!!deletingProduct}
            onOpenChange={(open) => !open && setDeletingProduct(null)}
            onProductDeleted={handleProductDeleted}
          />
        </Suspense>
      )}
    </>
  );
}

