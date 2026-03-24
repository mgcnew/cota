import { useState, useEffect, useMemo, useCallback, startTransition, memo, lazy, Suspense } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProducts } from "@/hooks/useProducts";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { useExportCSV } from "@/hooks/useExportCSV";
import { Package, Plus, Tags, DollarSign, ClipboardList, Download, Loader2, Award, FileUp, MoreHorizontal, Eye, EyeOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CategorySelect } from "@/components/ui/category-select";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import type { Product } from "@/hooks/useProducts";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useToast } from "@/hooks/use-toast";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { MobileProductCard } from "@/components/products/MobileProductCard";
import ProductsSkeleton from "@/components/products/ProductsSkeleton";
import { BrandManagementDialog } from "@/components/products/BrandManagementDialog";
import { ProductPriceHistoryDialog } from "@/components/forms/ProductPriceHistoryDialog";
import { ProductListDesktop } from "@/components/products/ProductListDesktop";
import { useProductStats } from "@/hooks/useProductStats";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Lazy load dialogs for better initial load performance
const AddProductDialog = lazy(() => import("@/components/forms/AddProductDialog").then(m => ({ default: m.AddProductDialog })));
const EditProductDialog = lazy(() => import("@/components/forms/EditProductDialog").then(m => ({ default: m.EditProductDialog })));
const DeleteProductDialog = lazy(() => import("@/components/forms/DeleteProductDialog").then(m => ({ default: m.DeleteProductDialog })));
const ImportProductsDialog = lazy(() => import("@/components/forms/ImportProductsDialog").then(m => ({ default: m.ImportProductsDialog })));

// Dialog loading fallback
const DialogLoader = () => (
  <div className={cn(designSystem.components.modal.overlay, "flex items-center justify-center")}>
    <Loader2 className={cn("h-8 w-8 animate-spin", designSystem.colors.text.primary)} />
  </div>
);

const getProductStatus = (product: Product) => {
  if (product.quotesCount === 0) return "sem_cotacao";
  if (product.lastOrderPrice === "R$ 0,00") return "pendente";
  if (product.quotesCount >= 3) return "ativo";
  return "cotado";
};

function Produtos() {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  // Use smaller page size on mobile for faster rendering
  const { paginate } = usePagination<Product>({ initialItemsPerPage: isMobile ? 8 : 10 });
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const { toast } = useToast();

  const { products, categories, isLoading: productsLoading, deleteProduct, updateProduct, invalidateCache } = useProducts();

  const safeProducts = useMemo(() => products || [], [products]);
  const safeCategories = useMemo(() => categories || [], [categories]);

  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!loading && !user) {
      setAuthDialogOpen(true);
    }
  }, [loading, user]);

  useEffect(() => {
    if (!loading && !user) {
      setAuthDialogOpen(true);
    }
  }, [loading, user]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(safeProducts) || safeProducts.length === 0) {
      return [];
    }

    const searchLower = debouncedSearchQuery.toLowerCase();
    const categoryNormalized = (selectedCategory || '').trim().toLowerCase();

    return safeProducts.filter(product => {
      const matchesSearch = !searchLower || 
                            product.name.toLowerCase().includes(searchLower) || 
                            (product.category || '').toLowerCase().includes(searchLower) ||
                            (product.brand_name || '').toLowerCase().includes(searchLower);
      
      const productCategory = (product.category || '').trim().toLowerCase();
      const matchesCategory = categoryNormalized === "all" || productCategory === categoryNormalized;
      
      return matchesSearch && matchesCategory;
    }).sort((a, b) => {
      // Sort by most recently modified
      const aDate = new Date(a.updated_at || 0).getTime();
      const bDate = new Date(b.updated_at || 0).getTime();
      return bDate - aDate;
    });
  }, [safeProducts, debouncedSearchQuery, selectedCategory]);

  // Counts for tabs
  const counts = useMemo(() => {
    return { total: safeProducts.length };
  }, [safeProducts]);

  const safeFilteredProducts = filteredProducts;
  const paginatedData = paginate(safeFilteredProducts);

  const stats = useProductStats(safeProducts, safeCategories);

  const { exportToCSV } = useExportCSV();

  const handleExportProducts = useCallback(() => {
    if (safeFilteredProducts.length === 0) {
      toast({
        title: "Nenhum produto para exportar",
        description: "Não há produtos filtrados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const exportData = safeFilteredProducts.map((product) => ({
      name: product.name,
      category: product.category || 'Sem Categoria',
      barcode: product.barcode || 'N/A',
      unit: product.unit || 'un',
      status: getProductStatus(product),
      price: product.lastOrderPrice || 'R$ 0,00',
      bestSupplier: product.bestSupplier || 'N/A',
      quotesCount: product.quotesCount || 0
    }));

    exportToCSV({
      filename: 'produtos',
      data: exportData,
      columns: {
        name: 'Nome',
        category: 'Categoria',
        barcode: 'Código de Barras',
        unit: 'Unidade',
        status: 'Status',
        price: 'Preço',
        bestSupplier: 'Melhor Fornecedor',
        quotesCount: 'Cotações'
      }
    });

    toast({
      title: "Exportação realizada",
      description: `${exportData.length} produtos exportados com sucesso.`,
    });
  }, [safeFilteredProducts, toast, exportToCSV]);

  const handleAddProduct = useCallback(() => {
    if (isMobile) {
      toast({
        title: "Função disponível no desktop",
        description: "Adicionar produto só pode ser feito no desktop.",
        variant: "destructive",
      });
      return;
    }
    startTransition(() => {
      setAddDialogOpen(true);
    });
  }, [isMobile, toast]);

  const handleImportProducts = useCallback(() => {
    startTransition(() => {
      setImportDialogOpen(true);
    });
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    if (isMobile) {
      toast({
        title: "Função disponível no desktop",
        description: "Editar produto só pode ser feito no desktop.",
        variant: "destructive",
      });
      return;
    }
    startTransition(() => {
      setEditingProduct(product);
    });
  }, [isMobile, toast]);

  const handleDeleteProduct = useCallback((product: Product) => {
    startTransition(() => {
      setDeletingProduct(product);
    });
  }, []);

  const handleHistoryProduct = useCallback((product: Product) => {
    setHistoryProduct(product);
  }, []);

  if (loading || productsLoading) {
    return (
      <PageWrapper>
        <div className={designSystem.layout.container.page}>
          <ProductsSkeleton />
        </div>
      </PageWrapper>
    );
  }

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className={cn(designSystem.layout.container.page, "animate-in fade-in zoom-in-95 duration-500")}>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20">
                <Package className="h-6 w-6 text-brand" />
              </div>
              <div>
                <h1 className={cn(designSystem.typography.size["2xl"], "font-bold text-foreground")}>
                  Produtos
                </h1>
                <p className={cn(designSystem.colors.text.secondary, "text-sm mt-0.5")}>
                  Gerencie seu catálogo de itens e categorias
                </p>
              </div>
            </div>

            <div />
          </div>

          {/* Métricas essenciais */}
          <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 4, desktop: 4 }} className="mb-4">
            <MetricCard
              title="Produtos"
              value={stats.totalProducts}
              icon={Package}
              variant="warning"
              className="hover:scale-[1.02] transition-transform"
            />
            <MetricCard
              title="Categorias"
              value={stats.totalCategories}
              icon={Tags}
              variant="info"
              className="hover:scale-[1.02] transition-transform"
            />
            <MetricCard
              title="Cotações"
              value={stats.activeQuotes}
              icon={ClipboardList}
              variant="success"
              className="hover:scale-[1.02] transition-transform"
            />
            <MetricCard
              title="Valor Médio"
              value={stats.averageValue}
              icon={DollarSign}
              variant="default"
              className="hover:scale-[1.02] transition-transform"
            />
          </ResponsiveGrid>

          <div className="mt-2 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 max-w-xl">
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Pesquisar por nome, categoria ou marca..."
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
                <div className="w-full sm:w-[240px]">
                  <CategorySelect
                    categories={safeCategories}
                    products={safeProducts}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(designSystem.components.button.secondary, "h-11 px-4 flex items-center justify-center")}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleExportProducts(); }} className="min-h-[44px]">
                        <Download className="h-4 w-4 mr-2" /> Exportar
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleImportProducts(); }} className="min-h-[44px]">
                        <FileUp className="h-4 w-4 mr-2" /> Importar CSV
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    onClick={handleAddProduct}
                    className={cn(designSystem.components.button.primary, "h-11 px-6")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Novo Produto</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="md:hidden mt-4" />

          <div className="w-full">
            <div>
              {paginatedData.items.length === 0 && !productsLoading ? (
                <EmptyState
                  icon={Package}
                  title="Nenhum produto encontrado"
                  description="Tente ajustar sua busca ou filtros."
                  actionLabel="Adicionar Produto"
                  actionIcon={Plus}
                  onAction={handleAddProduct}
                  variant="inline"
                />
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="md:hidden space-y-2">
                    {paginatedData.items.map((product) => (
                      <MobileProductCard
                        key={product.id}
                        product={product}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                        onHistory={handleHistoryProduct}
                      />
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <ProductListDesktop
                      products={paginatedData.items}
                      onEdit={handleEditProduct}
                      onDelete={handleDeleteProduct}
                      onHistory={handleHistoryProduct}
                    />
                  </div>

                  {/* Pagination */}
                  <div className={cn("mt-2", designSystem.colors.border.subtle)}>
                    <DataPagination
                      currentPage={paginatedData.pagination.currentPage}
                      totalPages={paginatedData.pagination.totalPages}
                      itemsPerPage={paginatedData.pagination.itemsPerPage}
                      totalItems={safeFilteredProducts.length}
                      onPageChange={paginatedData.pagination.goToPage}
                      onItemsPerPageChange={paginatedData.pagination.setItemsPerPage}
                      startIndex={(paginatedData.pagination.currentPage - 1) * paginatedData.pagination.itemsPerPage}
                      endIndex={Math.min(paginatedData.pagination.currentPage * paginatedData.pagination.itemsPerPage, safeFilteredProducts.length)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lazy loaded dialogs desktop-only */}
          {!isMobile && (
            <Suspense fallback={null}>
              <AddProductDialog
                onProductAdded={() => { invalidateCache(); setAddDialogOpen(false); }}
                onCategoryAdded={invalidateCache}
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
              />
            </Suspense>
          )}

          <Suspense fallback={null}>
            <ImportProductsDialog
              onProductsImported={() => { invalidateCache(); setImportDialogOpen(false); }}
              onCategoryAdded={invalidateCache}
              open={importDialogOpen}
              onOpenChange={setImportDialogOpen}
            />
          </Suspense>

          {!isMobile && (
            <Suspense fallback={null}>
              <EditProductDialog
                product={editingProduct}
                open={!!editingProduct}
                onOpenChange={(open) => { if (!open) setEditingProduct(null); }}
                onProductUpdated={(updatedProduct) => {
                  if (typeof updateProduct === 'function') {
                    updateProduct({
                      productId: updatedProduct.id,
                      data: {
                        name: updatedProduct.name,
                        category: updatedProduct.category,
                        unit: updatedProduct.unit,
                        barcode: updatedProduct.barcode,
                        brand_id: updatedProduct.brand_id
                      }
                    });
                  }
                  setEditingProduct(null);
                }}
                onCategoryAdded={invalidateCache}
                categories={safeCategories}
              />
            </Suspense>
          )}

          <Suspense fallback={null}>
            <DeleteProductDialog
              product={deletingProduct}
              open={!!deletingProduct}
              onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}
              onProductDeleted={(id) => {
                if (typeof deleteProduct === 'function') { deleteProduct(id); }
                setDeletingProduct(null);
              }}
            />
          </Suspense>

          {/* Product Price History Dialog - controlled by state */}
          <ProductPriceHistoryDialog
            productId={historyProduct?.id || ''}
            productName={historyProduct?.name || ''}
            open={!!historyProduct}
            onOpenChange={(open) => { if (!open) setHistoryProduct(null); }}
          />

        </div>
      </PageWrapper>

      <BrandManagementDialog
        open={brandDialogOpen}
        onOpenChange={setBrandDialogOpen}
      />
    </>
  );
}

export default memo(Produtos);
