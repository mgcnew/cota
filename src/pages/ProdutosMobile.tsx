import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProductsMobile } from "@/hooks/mobile/useProductsMobile";
import { useDebounce } from "@/hooks/useDebounce";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MobileProductsSearch } from "@/components/mobile/products/MobileProductsSearch";
import { MobileProductsVirtualList } from "@/components/mobile/products/MobileProductsVirtualList";
import { MobileProductsFilters } from "@/components/mobile/products/MobileProductsFilters";
import { MobileProductsFAB } from "@/components/mobile/products/MobileProductsFAB";
import type { ProductMobile } from "@/hooks/mobile/useProductsMobile";

// Lazy load dialogs
const AddProductDialog = lazy(() => import("@/components/forms/AddProductDialog").then(m => ({ default: m.AddProductDialog })));
const EditProductDialog = lazy(() => import("@/components/forms/EditProductDialog").then(m => ({ default: m.EditProductDialog })));
const DeleteProductDialog = lazy(() => import("@/components/forms/DeleteProductDialog").then(m => ({ default: m.DeleteProductDialog })));

/**
 * Página de Produtos Mobile - Zero Dependências Desktop
 * 
 * Performance:
 * - Virtualização nativa
 * - Busca server-side
 * - Cache agressivo
 * - Componentes leves e específicos
 */
export default function ProdutosMobile() {
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMobile | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductMobile | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 400);
  
  const {
    products,
    isLoading,
    error,
    pagination,
    deleteProduct,
    updateProduct,
    refetch,
  } = useProductsMobile(debouncedSearchQuery);

  // Extrair categorias únicas
  const categories = useMemo(() => {
    const cats = new Set<string>(["all"]);
    for (let i = 0; i < products.length; i++) {
      const cat = products[i]?.category;
      if (cat) cats.add(cat);
    }
    return Array.from(cats);
  }, [products]);

  // Filtrar por categoria
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Handlers memoizados
  const handleAdd = useCallback(() => setAddDialogOpen(true), []);
  const handleEdit = useCallback((product: ProductMobile) => setEditingProduct(product), []);
  const handleDelete = useCallback((product: ProductMobile) => setDeletingProduct(product), []);
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
    setEditingProduct(null);
  }, [updateProduct]);

  const handleProductDeleted = useCallback((id: string) => {
    if (deleteProduct?.mutate) {
      deleteProduct.mutate(id);
    }
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
          />
          
          <MobileProductsVirtualList
            products={filteredProducts}
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

      {addDialogOpen && (
        <Suspense fallback={null}>
          <AddProductDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            onProductAdded={() => {
              setAddDialogOpen(false);
              refetch();
            }}
            onCategoryAdded={() => {}}
          />
        </Suspense>
      )}

      {editingProduct && (
        <Suspense fallback={null}>
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
        <Suspense fallback={null}>
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

