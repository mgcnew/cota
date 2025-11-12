import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProductsMobile } from "@/hooks/mobile/useProductsMobile";
import { useDebounce } from "@/hooks/useDebounce";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MobileProductsSearch } from "@/components/mobile/products/MobileProductsSearch";
import { ProductsMobileList } from "@/components/mobile/products/ProductsMobileList";
import { MobileProductsFilters } from "@/components/mobile/products/MobileProductsFilters";
import { MobileProductsFAB } from "@/components/mobile/products/MobileProductsFAB";
import { ProductsEmptyState } from "@/components/mobile/products/ProductsEmptyState";
import { ProductsLoadingSkeleton } from "@/components/mobile/products/ProductsLoadingSkeleton";
import { AddProductDialog } from "@/components/forms/AddProductDialog";
import { EditProductDialog } from "@/components/forms/EditProductDialog";
import { DeleteProductDialog } from "@/components/forms/DeleteProductDialog";
import type { ProductMobile } from "@/hooks/mobile/useProductsMobile";

/**
 * Página de Produtos Mobile v2 - Ultra Otimizada
 * 
 * Performance:
 * - Infinite scroll estilo Facebook
 * - Hooks ultra-otimizados (useInfiniteQuery)
 * - Busca e filtros server-side
 * - Cache agressivo (5min)
 * - Lazy loading de imagens e dialogs
 * - Zero carregamentos desnecessários
 * - Scroll fluido mesmo com 100+ itens
 * 
 * UX Melhorada:
 * - Empty states elegantes
 * - Skeleton loading
 * - Contador de resultados
 * - FAB com pulsação quando vazio
 * - Cards coloridos por categoria
 */
export default function ProdutosMobile() {
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMobile | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductMobile | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  
  // Usar novo hook com infinite query
  const {
    products,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    deleteProduct,
    updateProduct,
    refetch,
  } = useProductsMobile({
    searchQuery: debouncedSearchQuery,
    categoryFilter: selectedCategory,
  });

  // Extrair categorias únicas dos produtos carregados
  const categories = useMemo(() => {
    const cats = new Set<string>(["all"]);
    for (let i = 0; i < products.length; i++) {
      const cat = products[i]?.category;
      if (cat) cats.add(cat);
    }
    return Array.from(cats);
  }, [products]);

  // Handlers memoizados
  const handleAdd = useCallback(() => {
    setAddDialogOpen(true);
  }, []);

  const handleEdit = useCallback((product: ProductMobile) => {
    // Passar o produto diretamente para evitar estado de loading
    // O produto já está disponível na lista, não precisa de lazy loading
    setEditingProduct(product as any);
    setEditingProductId(product.id);
  }, []);

  const handleDelete = useCallback((product: ProductMobile) => {
    setDeletingProduct(product);
  }, []);

  const handleFiltersToggle = useCallback(() => setFiltersOpen(v => !v), []);
  
  const handleCategorySelect = useCallback((cat: string) => {
    setSelectedCategory(cat);
    setFiltersOpen(false);
  }, []);

  const handleProductUpdated = useCallback((updated: any) => {
    // Atualizar produto no cache
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
    // O modal será fechado pelo próprio EditProductDialog após salvar
    // Não fechar aqui para evitar conflitos
  }, [updateProduct]);

  const handleProductDeleted = useCallback((id: string) => {
    if (deleteProduct?.mutate) {
      deleteProduct.mutate(id);
    }
    // Modal será fechado pelo próprio DeleteProductDialog
    setDeletingProduct(null);
  }, [deleteProduct]);

  if (!loading && !user) {
    return <AuthDialog open={true} onOpenChange={setAuthDialogOpen} />;
  }

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className="flex flex-col h-full" style={{ overflow: 'hidden' }}>
          <MobileProductsSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onFiltersClick={handleFiltersToggle}
            activeCategory={selectedCategory !== "all" ? selectedCategory : null}
            onClearCategory={() => setSelectedCategory("all")}
            resultsCount={products.length}
            isSearching={isLoading}
          />
          
          {/* Lista de produtos com infinite scroll */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading inicial */}
            {isLoading && products.length === 0 && (
              <ProductsLoadingSkeleton count={3} />
            )}

            {/* Empty states */}
            {!isLoading && products.length === 0 && (
              <ProductsEmptyState
                type={searchQuery || selectedCategory !== "all" ? "no-results" : "no-products"}
                searchQuery={searchQuery}
                onAddProduct={handleAdd}
              />
            )}

            {/* Lista de produtos */}
            {products.length > 0 && (
              <ProductsMobileList
                products={products}
                isLoading={isLoading}
                isFetchingNextPage={isFetchingNextPage || false}
                hasNextPage={hasNextPage || false}
                fetchNextPage={fetchNextPage}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>

          <MobileProductsFilters
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            categories={categories}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
          />
        </div>
      </PageWrapper>

      {/* FAB fora do PageWrapper para ficar sempre visível */}
      <MobileProductsFAB 
        onClick={handleAdd} 
        isEmpty={products.length === 0 && !isLoading}
        tooltip="Adicionar primeiro produto"
      />

      {/* Dialogs */}
      {addDialogOpen && (
        <AddProductDialog
          open={addDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setAddDialogOpen(false);
            }
          }}
          onProductAdded={() => {
            setAddDialogOpen(false);
            refetch();
          }}
          onCategoryAdded={() => {}}
        />
      )}

      {(editingProductId || editingProduct) && (
        <EditProductDialog
          product={editingProduct as any}
          productId={editingProductId}
          open={!!(editingProductId || editingProduct)}
          onOpenChange={(open) => {
            if (!open) {
              // Fechar modal de forma síncrona (sem startTransition)
              setEditingProduct(null);
              setEditingProductId(null);
            }
          }}
          onProductUpdated={handleProductUpdated}
          onCategoryAdded={() => {}}
          categories={categories}
        />
      )}

      {deletingProduct && (
        <DeleteProductDialog
          product={deletingProduct as any}
          open={!!deletingProduct}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingProduct(null);
            }
          }}
          onProductDeleted={handleProductDeleted}
        />
      )}
    </>
  );
}
