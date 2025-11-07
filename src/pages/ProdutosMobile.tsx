import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProductsMobile } from "@/hooks/mobile/useProductsMobile";
import { useDebounce } from "@/hooks/useDebounce";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { MobileProductsHeader } from "@/components/mobile/products/MobileProductsHeader";
import { MobileProductsList } from "@/components/mobile/products/MobileProductsList";
import { MobileFiltersSheet } from "@/components/mobile/products/MobileFiltersSheet";
import { MobileFAB } from "@/components/mobile/MobileFAB";
import { AddProductDialog } from "@/components/forms/AddProductDialog";
import { EditProductDialog } from "@/components/forms/EditProductDialog";
import { DeleteProductDialog } from "@/components/forms/DeleteProductDialog";
import type { ProductMobile } from "@/hooks/mobile/useProductsMobile";

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

  // Debounce de busca para reduzir requisições
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

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

  // Extrair categorias dos produtos
  const categories = useMemo(() => {
    const cats = new Set<string>(["all"]);
    products.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
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
        <div className="flex flex-col h-full">
          {/* Header com busca */}
          <MobileProductsHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFiltersOpen={() => setFiltersOpen(true)}
            selectedCategory={selectedCategory}
            onCategoryRemove={() => setSelectedCategory("all")}
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

      {/* Dialogs */}
      <AddProductDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onProductAdded={() => {
          setAddDialogOpen(false);
          refetch();
        }}
        onCategoryAdded={() => {}}
      />

      <EditProductDialog
        product={editingProduct as any}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onProductUpdated={handleProductUpdated}
        onCategoryAdded={() => {}}
        categories={categories}
      />

      <DeleteProductDialog
        product={deletingProduct as any}
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onProductDeleted={handleProductDeleted}
      />
    </>
  );
}

