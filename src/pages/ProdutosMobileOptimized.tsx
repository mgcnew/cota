import React, { useState, useCallback, lazy, Suspense } from 'react';
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProductsMobile, type ProductMobile } from '@/hooks/mobile/useProductsMobile';
import { useDebounce } from '@/hooks/useDebounce';
import { useProducts } from '@/hooks/useProducts';
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MobileProductsSearch } from "@/components/mobile/products/MobileProductsSearch";
import { MobileProductsVirtualList } from '@/components/mobile/products/MobileProductsVirtualList';
import { MobileProductsFilters } from "@/components/mobile/products/MobileProductsFilters";
import { MobileProductsFAB } from "@/components/mobile/products/MobileProductsFAB";

// Lazy load dialogs
const AddProductDialog = lazy(() => 
  import("@/components/forms/AddProductDialog").then(m => ({ default: m.AddProductDialog }))
);
const EditProductDialog = lazy(() => 
  import("@/components/forms/EditProductDialog").then(m => ({ default: m.EditProductDialog }))
);
const DeleteProductDialog = lazy(() => 
  import("@/components/forms/DeleteProductDialog").then(m => ({ default: m.DeleteProductDialog }))
);

export default function ProdutosMobileOptimized() {
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMobile | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductMobile | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery);
  const { categories } = useProducts();

  const {
    products,
    isLoading,
    refetch,
  } = useProductsMobile(debouncedSearchQuery);

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

  const handleProductAdded = useCallback(() => {
    setAddDialogOpen(false);
    refetch();
  }, [refetch]);

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
          
          <MobileProductsVirtualList
            products={products}
            isLoading={isLoading}
            error={null}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={refetch}
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
            onProductAdded={handleProductAdded}
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
            onProductUpdated={() => {
              setEditingProduct(null);
              refetch();
            }}
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
            onProductDeleted={() => {
              setDeletingProduct(null);
              refetch();
            }}
          />
        </Suspense>
      )}
    </>
  );
}
