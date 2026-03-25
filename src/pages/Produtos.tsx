import { memo, useState, useCallback, useMemo, useRef, Suspense, lazy } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreVertical, Edit, Trash2, History, Package, ClipboardList } from "lucide-react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { capitalize } from "@/lib/text-utils";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { useProducts, type Product } from "@/hooks/useProducts";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { VirtualList } from "@/components/responsive/VirtualList";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileProductCard } from "@/components/products/MobileProductCard";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { toast } from "sonner";
import { AuthDialog } from "@/components/auth/AuthDialog";

// Lazy loaded dialogs for performance
const AddProductDialog = lazy(() => import("@/components/forms/AddProductDialog"));
const ProductHistoryDialog = lazy(() => import("@/components/products/ProductHistoryDialog"));
const AlertDialog = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialog })));
const AlertDialogContent = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogContent })));
const AlertDialogHeader = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogHeader })));
const AlertDialogTitle = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogTitle })));
const AlertDialogDescription = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogDescription })));
const AlertDialogFooter = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogFooter })));
const AlertDialogAction = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogAction })));
const AlertDialogCancel = lazy(() => import("@/components/ui/alert-dialog").then(mod => ({ default: mod.AlertDialogCancel })));
const AddBrandDialog = lazy(() => import("@/components/forms/AddBrandDialog"));

const Produtos = () => {
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  
  const { products, isLoading, deleteProduct, invalidateCache } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const term = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.category.toLowerCase().includes(term) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(term))
    );
  }, [products, searchTerm]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsAddDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      toast.success("Produto excluído com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir produto");
    } finally {
      setProductToDelete(null);
    }
  };

  const handleHistoryClick = (product: Product) => {
    setHistoryProduct(product);
  };

  const handleProductSuccess = () => {
    setIsAddDialogOpen(false);
    setEditingProduct(null);
  };

  const openBrandDialog = () => {
    setBrandDialogOpen(true);
  };

  const handleBrandSuccess = () => {
    setBrandDialogOpen(false);
  };

  const renderProductItem = (product: Product, index: number, style: React.CSSProperties) => {
    if (isMobile) {
      return (
        <div style={style} className="px-4 py-2">
          <MobileProductCard 
            product={product}
            onEdit={handleEditProduct}
            onDelete={handleDeleteClick}
            onHistory={handleHistoryClick}
          />
        </div>
      );
    }

    return (
      <div 
        style={style}
        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-700/30"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">{capitalize(product.name)}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-[10px] px-2 py-0">
                {capitalize(product.category)}
              </Badge>
              {product.brand_name && (
                <span className="text-xs text-gray-500 truncate max-w-[150px]">
                  • {capitalize(product.brand_name)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 flex-shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{product.lastOrderPrice}</span>
            <span className="text-[10px] text-gray-500 uppercase">Último preço</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => handleHistoryClick(product)}>
              <History className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleEditProduct(product)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDeleteClick(product)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <PullToRefresh onRefresh={invalidateCache} className="h-full">
          <div className={cn(designSystem.layout.container.page, "animate-in fade-in zoom-in-95 duration-500")}>
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/20">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className={designSystem.typography.h1.desktop}>Produtos</h1>
                  <p className="text-sm text-muted-foreground">Gerencie seu catálogo de produtos e marcas</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={openBrandDialog}
                  className="rounded-xl active:scale-95 transition-transform"
                >
                  Nova Marca
                </Button>
                <Button 
                  onClick={handleAddProduct}
                  className="rounded-xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-95 transition-transform"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </div>
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-gray-900/50 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
              {/* Toolbar */}
              <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="w-full md:w-96">
                  <SearchInput 
                    placeholder="Buscar por nome, categoria ou marca..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
                  <ClipboardList className="h-4 w-4" />
                  <span>{filteredProducts.length} produtos encontrados</span>
                </div>
              </div>

              {/* List Area */}
              <div className="flex-1 min-h-0 relative">
                <ErrorBoundary>
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <EmptyState 
                        icon={<Package className="h-12 w-12 text-gray-300" />}
                        title="Nenhum produto encontrado"
                        description={searchTerm ? "Tente ajustar os termos da sua busca" : "Comece adicionando seu primeiro produto ao catálogo"}
                        action={!searchTerm ? {
                          label: "Adicionar Produto",
                          onClick: handleAddProduct
                        } : undefined}
                      />
                    </div>
                  ) : (
                    <VirtualList 
                      items={filteredProducts}
                      renderItem={renderProductItem}
                      itemHeight={isMobile ? 140 : 80}
                      overscan={5}
                    />
                  )}
                </ErrorBoundary>
              </div>
            </div>

            {/* Modal Components - Lazy Loaded */}
            <Suspense fallback={null}>
              {isAddDialogOpen && (
                <AddProductDialog 
                  open={isAddDialogOpen} 
                  onOpenChange={setIsAddDialogOpen}
                  onSuccess={handleProductSuccess}
                  product={editingProduct}
                />
              )}
            </Suspense>

            <Suspense fallback={null}>
              {historyProduct && (
                <ProductHistoryDialog 
                  open={!!historyProduct} 
                  onOpenChange={(open) => !open && setHistoryProduct(null)}
                  product={historyProduct}
                />
              )}
            </Suspense>

            <Suspense fallback={null}>
              {productToDelete && (
                <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o produto "{productToDelete?.name}"? Esta ação não poderá ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 rounded-xl">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </Suspense>

            <Suspense fallback={null}>
              <AddBrandDialog 
                open={brandDialogOpen}
                onOpenChange={setBrandDialogOpen}
                onSuccess={handleBrandSuccess}
              />
            </Suspense>
          </div>
        </PullToRefresh>
      </PageWrapper>
    </>
  );
};

export default memo(Produtos);
