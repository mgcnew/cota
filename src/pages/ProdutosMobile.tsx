import { useState, useMemo, useCallback, lazy, Suspense, startTransition } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProductsMobile } from "@/hooks/mobile/useProductsMobile";
import { useDebounce } from "@/hooks/useDebounce";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MobileProductsSearch } from "@/components/mobile/products/MobileProductsSearch";
import { ProductsMobileList } from "@/components/mobile/products/ProductsMobileList";
import { MobileProductsFilters } from "@/components/mobile/products/MobileProductsFilters";
import { MobileProductsFAB } from "@/components/mobile/products/MobileProductsFAB";
import type { ProductMobile } from "@/hooks/mobile/useProductsMobile";

// Lazy load dialogs
const AddProductDialog = lazy(() => import("@/components/forms/AddProductDialog").then(m => ({ default: m.AddProductDialog })));
const EditProductDialog = lazy(() => import("@/components/forms/EditProductDialog").then(m => ({ default: m.EditProductDialog })));
const DeleteProductDialog = lazy(() => import("@/components/forms/DeleteProductDialog").then(m => ({ default: m.DeleteProductDialog })));

/**
 * Página de Produtos Mobile - Ultra Otimizada
 * 
 * Performance:
 * - Infinite scroll estilo Facebook
 * - Hooks ultra-otimizados (useInfiniteQuery)
 * - Busca e filtros server-side
 * - Cache agressivo (5min)
 * - Lazy loading de imagens
 * - Zero carregamentos desnecessários
 * - Scroll fluido mesmo com 100+ itens
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

  // Handlers memoizados com startTransition para evitar erros de Suspense
  const handleAdd = useCallback(() => {
    startTransition(() => {
      setAddDialogOpen(true);
    });
  }, []);

  const handleEdit = useCallback((product: ProductMobile) => {
    startTransition(() => {
      // No mobile, usar apenas o ID para lazy loading
      // Limpar primeiro para evitar renderização dupla
      setEditingProduct(null);
      setEditingProductId(null);
      // Depois definir apenas o ID (lazy loading)
      setEditingProductId(product.id);
    });
  }, []);

  const handleDelete = useCallback((product: ProductMobile) => {
    startTransition(() => {
      setDeletingProduct(product);
    });
  }, []);

  const handleFiltersToggle = useCallback(() => setFiltersOpen(v => !v), []);
  
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
    startTransition(() => {
      setEditingProduct(null);
      setEditingProductId(null);
    });
  }, [updateProduct]);

  const handleProductDeleted = useCallback((id: string) => {
    if (deleteProduct?.mutate) {
      deleteProduct.mutate(id);
    }
    startTransition(() => {
      setDeletingProduct(null);
    });
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
          />
          
          {/* Lista com infinite scroll - container com scroll para IntersectionObserver */}
          <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <ProductsMobileList
              products={products}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage || false}
              fetchNextPage={fetchNextPage}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

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

      {/* Dialogs com lazy loading */}
      {addDialogOpen && (
        <Suspense fallback={null}>
          <AddProductDialog
            open={addDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                startTransition(() => {
                  setAddDialogOpen(false);
                });
              }
            }}
            onProductAdded={() => {
              startTransition(() => {
                setAddDialogOpen(false);
              });
              refetch();
            }}
            onCategoryAdded={() => {}}
          />
        </Suspense>
      )}

      {editingProductId && (
        <Suspense fallback={null}>
          <EditProductDialog
            product={editingProduct as any}
            productId={editingProductId}
            open={!!editingProductId}
            onOpenChange={(open) => {
              if (!open) {
                startTransition(() => {
                  setEditingProduct(null);
                  setEditingProductId(null);
                });
              }
            }}
            onProductUpdated={handleProductUpdated}
            onCategoryAdded={() => {}}
            categories={categories}
          />
        </Suspense>
      )}

      {deletingProduct && (
        <Suspense fallback={null}>
          <DeleteProductDialog
            product={deletingProduct as any}
            open={!!deletingProduct}
            onOpenChange={(open) => {
              if (!open) {
                startTransition(() => {
                  setDeletingProduct(null);
                });
              }
            }}
            onProductDeleted={handleProductDeleted}
          />
        </Suspense>
      )}
    </>
  );
}
