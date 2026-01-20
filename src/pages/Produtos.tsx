import { useState, useEffect, useMemo, useCallback, startTransition, memo, lazy, Suspense } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProducts } from "@/hooks/useProducts";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { EmptyState } from "@/components/ui/empty-state";
import { useExportCSV } from "@/hooks/useExportCSV";
import { Package, Plus, Tags, DollarSign, ClipboardList, Download, Loader2, Award, FileUp } from "lucide-react";
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

// Lazy load dialogs for better initial load performance
const AddProductDialog = lazy(() => import("@/components/forms/AddProductDialog").then(m => ({ default: m.AddProductDialog })));
const EditProductDialog = lazy(() => import("@/components/forms/EditProductDialog").then(m => ({ default: m.EditProductDialog })));
const DeleteProductDialog = lazy(() => import("@/components/forms/DeleteProductDialog").then(m => ({ default: m.DeleteProductDialog })));
const ImportProductsDialog = lazy(() => import("@/components/forms/ImportProductsDialog").then(m => ({ default: m.ImportProductsDialog })));

// Dialog loading fallback
const DialogLoader = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <Loader2 className="h-8 w-8 animate-spin text-white" />
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

  const safeProducts = products || [];
  const safeCategories = categories || [];

  useEffect(() => {
    if (!loading && !user) {
      setAuthDialogOpen(true);
    }
  }, [loading, user]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(safeProducts) || safeProducts.length === 0) {
      return [];
    }

    if (!debouncedSearchQuery.trim() && selectedCategory === 'all') {
      return safeProducts;
    }

    const searchLower = debouncedSearchQuery.toLowerCase();
    const categoryNormalized = (selectedCategory || '').trim().toLowerCase();

    return safeProducts.filter(product => {
      const matchesSearch = !searchLower || product.name.toLowerCase().includes(searchLower);
      const productCategory = (product.category || '').trim().toLowerCase();
      const matchesCategory = categoryNormalized === "all" || productCategory === categoryNormalized;
      return matchesSearch && matchesCategory;
    });
  }, [safeProducts, debouncedSearchQuery, selectedCategory]);

  const safeFilteredProducts = Array.isArray(filteredProducts) ? filteredProducts : [];
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
      quotesCount: product.quotesCount || 0,
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
        quotesCount: 'Cotações',
      }
    });

    toast({
      title: "Exportação realizada",
      description: `${exportData.length} produtos exportados com sucesso.`,
    });
  }, [safeFilteredProducts, toast, exportToCSV]);

  const handleAddProduct = useCallback(() => {
    startTransition(() => {
      setAddDialogOpen(true);
    });
  }, []);

  const handleImportProducts = useCallback(() => {
    startTransition(() => {
      setImportDialogOpen(true);
    });
  }, []);

  const handleEditProduct = useCallback((product: Product) => {
    startTransition(() => {
      setEditingProduct(product);
    });
  }, []);

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
        <div className="page-container">
          <ProductsSkeleton />
        </div>
      </PageWrapper>
    );
  }

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className="page-container">
          {/* Page Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg transition-smooth hover:shadow-xl hover:scale-105">
              <Package className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Produtos</h1>
          </div>

          {/* Métricas essenciais */}
          <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 4, desktop: 4 }} className="mb-4">
            <MetricCard
              title="Produtos"
              value={stats.totalProducts}
              icon={Package}
              variant="warning"
              className="transition-smooth hover:scale-[1.02]"
            />
            <MetricCard
              title="Categorias"
              value={stats.totalCategories}
              icon={Tags}
              variant="info"
              className="transition-smooth hover:scale-[1.02]"
            />
            <MetricCard
              title="Cotações"
              value={stats.activeQuotes}
              icon={ClipboardList}
              variant="success"
              className="transition-smooth hover:scale-[1.02]"
            />
            <MetricCard
              title="Valor Médio"
              value={stats.averageValue}
              icon={DollarSign}
              variant="default"
              className="transition-smooth hover:scale-[1.02]"
            />
          </ResponsiveGrid>

          {/* Filters & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mb-4">
            <div className="flex-1 sm:flex-shrink-0">
              <ExpandableSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar produtos..."
                accentColor="orange"
                expandedWidth="w-full sm:w-64"
              />
            </div>
            <div className="flex-1 sm:flex-initial sm:w-[180px]">
              <CategorySelect
                categories={safeCategories}
                products={safeProducts}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setBrandDialogOpen(true)}
                className="h-10 hidden sm:flex border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-smooth"
              >
                <Award className="h-4 w-4 mr-2 text-orange-500" /> Marcas
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportProducts}
                className="h-10 hidden sm:flex transition-smooth"
              >
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="h-11 sm:h-10 min-w-[44px] px-3 sm:px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 text-sm touch-target">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Adicionar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleAddProduct(); }} className="min-h-[44px]">
                    <Plus className="h-4 w-4 mr-2" /> Novo Produto
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleImportProducts(); }} className="min-h-[44px]">
                    <FileUp className="h-4 w-4 mr-2" /> Importar CSV
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setBrandDialogOpen(true); }} className="min-h-[44px] sm:hidden">
                    <Award className="h-4 w-4 mr-2 text-orange-500" /> Marcas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Card className="border-0 bg-transparent">
            <CardContent className="p-0">
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
                  {/* Mobile Cards View - Paginated for better UX */}
                  <div className="md:hidden px-2 py-3 space-y-2">
                    {paginatedData.items.map((product) => (
                      <MobileProductCard
                        key={product.id}
                        product={product}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                      />
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <ProductListDesktop 
                    products={paginatedData.items} 
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                    onHistory={handleHistoryProduct}
                  />

                  {/* Pagination */}
                  <div className="border-t border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <span className="text-xs order-2 sm:order-1">
                        {paginatedData.items.length > 0
                          ? `${((paginatedData.pagination.currentPage - 1) * paginatedData.pagination.itemsPerPage) + 1}-${Math.min(paginatedData.pagination.currentPage * paginatedData.pagination.itemsPerPage, safeFilteredProducts.length)}`
                          : '0'
                        } de {safeFilteredProducts.length}
                      </span>
                      <div className="order-1 sm:order-2">
                        <DataPagination
                          currentPage={paginatedData.pagination.currentPage}
                          totalPages={paginatedData.pagination.totalPages}
                          itemsPerPage={paginatedData.pagination.itemsPerPage}
                          totalItems={safeFilteredProducts.length}
                          onPageChange={paginatedData.pagination.goToPage}
                          onItemsPerPageChange={paginatedData.pagination.setItemsPerPage}
                          startIndex={((paginatedData.pagination.currentPage - 1) * paginatedData.pagination.itemsPerPage) + 1}
                          endIndex={Math.min(paginatedData.pagination.currentPage * paginatedData.pagination.itemsPerPage, safeFilteredProducts.length)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Lazy loaded dialogs with Suspense */}
          <Suspense fallback={addDialogOpen ? <DialogLoader /> : null}>
            {addDialogOpen && (
              <AddProductDialog
                onProductAdded={() => { invalidateCache(); setAddDialogOpen(false); }}
                onCategoryAdded={invalidateCache}
                open={addDialogOpen}
                onOpenChange={setAddDialogOpen}
              />
            )}
          </Suspense>

          <Suspense fallback={importDialogOpen ? <DialogLoader /> : null}>
            {importDialogOpen && (
              <ImportProductsDialog
                onProductsImported={() => { invalidateCache(); setImportDialogOpen(false); }}
                onCategoryAdded={invalidateCache}
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
              />
            )}
          </Suspense>

          <Suspense fallback={editingProduct ? <DialogLoader /> : null}>
            {editingProduct && (
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
            )}
          </Suspense>

          <Suspense fallback={deletingProduct ? <DialogLoader /> : null}>
            {deletingProduct && (
              <DeleteProductDialog
                product={deletingProduct}
                open={!!deletingProduct}
                onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}
                onProductDeleted={(id) => {
                  if (typeof deleteProduct === 'function') { deleteProduct(id); }
                  setDeletingProduct(null);
                }}
              />
            )}
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
