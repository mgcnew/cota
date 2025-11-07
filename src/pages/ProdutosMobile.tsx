import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProductsMobile } from "@/hooks/mobile/useProductsMobile";
import { useDebounce } from "@/hooks/useDebounce";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MobileProductsHeader } from "@/components/mobile/products/MobileProductsHeader";
import { MobileProductsList } from "@/components/mobile/products/MobileProductsList";
import { MobileFiltersSheet } from "@/components/mobile/products/MobileFiltersSheet";
import { MobileFAB } from "@/components/mobile/MobileFAB";
import type { ProductMobile } from "@/hooks/mobile/useProductsMobile";

// ✅ Lazy load dos dialogs para reduzir bundle inicial
const AddProductDialog = lazy(() => import("@/components/forms/AddProductDialog").then(m => ({ default: m.AddProductDialog })));
const EditProductDialog = lazy(() => import("@/components/forms/EditProductDialog").then(m => ({ default: m.EditProductDialog })));
const DeleteProductDialog = lazy(() => import("@/components/forms/DeleteProductDialog").then(m => ({ default: m.DeleteProductDialog })));

/**
 * Página de Produtos Mobile - Refatorada do Zero
 * 
 * Princípios:
 * - Performance first: Virtualização, lazy loading, code splitting
 * - UX mobile-first: Gestos, bottom sheets, swipe actions
 * - Separação total: Zero dependências do desktop
 * - Bundle size: < 150KB gzip
 */
export default function ProdutosMobile() {
  // ✅ TODOS OS HOOKS DEVEM SER CHAMADOS SEMPRE, NA MESMA ORDEM
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMobile | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductMobile | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // ✅ Debounce aumentado para reduzir requisições (500ms em vez de 300ms)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Hook mobile otimizado com paginação server-side
  // ✅ IMPORTANTE: Sempre chamado, mesmo se user não estiver autenticado
  const {
    products,
    isLoading,
    error,
    pagination,
    deleteProduct,
    updateProduct,
    refetch,
  } = useProductsMobile(debouncedSearchQuery);

  // ✅ Extrair categorias apenas quando necessário (lazy evaluation)
  const categories = useMemo(() => {
    if (!products || products.length === 0) return ["all"];
    const cats = new Set<string>(["all"]);
    for (let i = 0; i < products.length; i++) {
      const cat = products[i]?.category;
      if (cat) cats.add(cat);
    }
    return Array.from(cats);
  }, [products]);

  // Filtrar produtos por categoria (client-side, já que busca é server-side)
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  // Handlers
  const handleAddProduct = useCallback(() => {
    setAddDialogOpen(true);
  }, []);

  const handleEditProduct = useCallback((product: ProductMobile) => {
    setEditingProduct(product);
  }, []);

  const handleDeleteProduct = useCallback((product: ProductMobile) => {
    setDeletingProduct(product);
  }, []);

  // ✅ Callbacks memoizados para evitar re-renders
  const handleFiltersOpen = useCallback(() => setFiltersOpen(true), []);
  const handleCategoryRemove = useCallback(() => setSelectedCategory("all"), []);

  const handleProductUpdated = useCallback(
    (updatedProduct: any) => {
      if (updateProduct && typeof (updateProduct as any).mutate === "function") {
        (updateProduct as any).mutate({
          productId: updatedProduct.id,
          data: {
            name: updatedProduct.name,
            category: updatedProduct.category,
            unit: updatedProduct.unit,
            barcode: updatedProduct.barcode,
          },
        });
      }
      setEditingProduct(null);
    },
    [updateProduct]
  );

  const handleProductDeleted = useCallback(
    (id: string) => {
      if (deleteProduct && typeof (deleteProduct as any).mutate === "function") {
        (deleteProduct as any).mutate(id);
      }
      setDeletingProduct(null);
    },
    [deleteProduct]
  );

  // ✅ IMPORTANTE: Auth check DEPOIS de todos os hooks
  // React exige que todos os hooks sejam chamados na mesma ordem sempre
  if (!loading && !user) {
    return <AuthDialog open={true} onOpenChange={setAuthDialogOpen} />;
  }

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      
      <PageWrapper>
        <div className="flex flex-col h-full" style={{ overflow: 'hidden' }}>
          {/* Header com busca */}
          <MobileProductsHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFiltersOpen={handleFiltersOpen}
            selectedCategory={selectedCategory}
            onCategoryRemove={handleCategoryRemove}
          />

          {/* Lista virtualizada de produtos */}
          <MobileProductsList
            products={filteredProducts}
            isLoading={isLoading}
            error={error}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onRefresh={refetch}
            pagination={pagination}
          />

          {/* Bottom Sheet de Filtros */}
          <MobileFiltersSheet
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />

          {/* FAB para adicionar produto */}
          <MobileFAB onClick={handleAddProduct} label="Novo Produto" />
        </div>
      </PageWrapper>

      {/* Dialogs - Lazy loaded apenas quando necessário */}
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

