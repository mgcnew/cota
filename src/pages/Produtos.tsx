import { useState, useEffect, useMemo, useCallback, startTransition, memo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProducts } from "@/hooks/useProducts";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { TableActionGroup } from "@/components/ui/table-action-group";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useExportCSV } from "@/hooks/useExportCSV";
import { Package, Plus, Filter, MoreVertical, TrendingUp, TrendingDown, Minus, Scale, FileUp, FileText, Building2, History, ClipboardList, Tags, DollarSign, CircleDot, Barcode, Download, Loader2 } from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { CategorySelect } from "@/components/ui/category-select";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import type { Product } from "@/hooks/useProducts";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { LazyImage } from "@/components/responsive/LazyImage";
import { ProductsHeroCard } from "@/components/products/ProductsHeroCard";
import { ProductsStatusSummary } from "@/components/products/ProductsStatusSummary";
import { MobileProductCard } from "@/components/products/MobileProductCard";

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

// Shared utility functions to avoid duplication
const getProductStatus = (product: Product) => {
  if (product.quotesCount === 0) return "sem_cotacao";
  if (product.lastQuotePrice === "R$ 0,00") return "pendente";
  if (product.quotesCount >= 3) return "ativo";
  return "cotado";
};

const getTrendIcon = (trend: "up" | "down" | "stable") => {
  if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
  if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
  return <Minus className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />;
};

function Produtos() {
  const navigate = useNavigate();
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
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
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

  const stats = useMemo(() => {
    if (!Array.isArray(safeProducts) || !Array.isArray(safeCategories)) {
      return {
        totalProducts: 0,
        totalCategories: 0,
        activeQuotes: 0,
        produtosPorStatus: { ativos: 0, cotados: 0, pendentes: 0, semCotacao: 0 },
        percentualComCotacao: 0,
        topCategoria: null,
        mediaCotacoesPorProduto: "0.0",
        averageValue: "R$ 0,00",
        averageValueNumeric: 0,
        economiaMediaPorProduto: "0",
        economiaPotencial: 0,
        percentualEconomiaMedia: 0,
        productsWithPrices: 0,
      };
    }

    const totalCategories = Math.max(0, safeCategories.length - 1);
    const activeQuotes = safeProducts.reduce((sum, p) => sum + (p.quotesCount || 0), 0);

    const produtosPorStatus = {
      ativos: safeProducts.filter((p) => (p.quotesCount || 0) >= 3).length,
      cotados: safeProducts.filter((p) => (p.quotesCount || 0) > 0 && (p.quotesCount || 0) < 3).length,
      pendentes: safeProducts.filter((p) => (p.quotesCount || 0) === 0 && p.lastQuotePrice !== "R$ 0,00").length,
      semCotacao: safeProducts.filter((p) => (p.quotesCount || 0) === 0 && p.lastQuotePrice === "R$ 0,00").length
    };

    const produtosComCotacao = produtosPorStatus.ativos + produtosPorStatus.cotados;
    const percentualComCotacao = safeProducts.length > 0
      ? Math.round((produtosComCotacao / safeProducts.length) * 100)
      : 0;

    const categoriaCount = new Map<string, number>();
    safeProducts.forEach(p => {
      const cat = p.category || 'Sem Categoria';
      categoriaCount.set(cat, (categoriaCount.get(cat) || 0) + 1);
    });
    const topCategoriaEntry = Array.from(categoriaCount.entries()).sort((a, b) => b[1] - a[1])[0];

    const produtosComCotacaoParaMedia = safeProducts.filter((p) => (p.quotesCount || 0) > 0);
    const mediaCotacoesPorProduto = produtosComCotacaoParaMedia.length > 0
      ? (activeQuotes / produtosComCotacaoParaMedia.length).toFixed(1)
      : "0.0";

    const productsWithPrices = safeProducts.filter((p) => p.lastQuotePrice !== "R$ 0,00");
    let averageValue = "R$ 0,00";
    let averageValueNumeric = 0;
    let economiaMediaPorProduto = "0";
    let economiaPotencial = 0;
    let percentualEconomiaMedia = 0;

    if (productsWithPrices.length > 0) {
      const total = productsWithPrices.reduce((sum, p) => {
        const price = parseFloat(p.lastQuotePrice.replace(/[^\d,]/g, '').replace(',', '.'));
        return sum + (isNaN(price) ? 0 : price);
      }, 0);
      averageValueNumeric = total / productsWithPrices.length;
      averageValue = `R$ ${averageValueNumeric.toFixed(2)}`;

      const produtosComMultiplasCotacoes = safeProducts.filter((p) => (p.quotesCount || 0) >= 2);
      if (produtosComMultiplasCotacoes.length > 0) {
        percentualEconomiaMedia = Math.round((produtosComMultiplasCotacoes.length / productsWithPrices.length) * 12);
        economiaMediaPorProduto = (averageValueNumeric * (percentualEconomiaMedia / 100)).toFixed(2);
        economiaPotencial = total * 0.08; // 8% de economia potencial estimada
      }
    }

    return {
      totalProducts: safeProducts.length,
      totalCategories,
      activeQuotes,
      produtosPorStatus,
      percentualComCotacao,
      topCategoria: topCategoriaEntry ? { nome: topCategoriaEntry[0], count: topCategoriaEntry[1] } : null,
      mediaCotacoesPorProduto,
      averageValue,
      averageValueNumeric,
      economiaMediaPorProduto,
      economiaPotencial,
      percentualEconomiaMedia,
      productsWithPrices: productsWithPrices.length,
    };
  }, [safeProducts, safeCategories]);





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
      price: product.lastQuotePrice || 'R$ 0,00',
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
  }, [safeFilteredProducts, toast, getProductStatus, exportToCSV]);

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

  if (loading || productsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className="page-container">
          {/* Hero Section - Destaque Executivo */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
            <ProductsHeroCard
              totalProducts={stats.totalProducts}
              productsWithPrice={stats.productsWithPrices}
              averagePrice={stats.averageValueNumeric}
              economyPotential={stats.economiaPotencial}
              percentWithQuotes={stats.percentualComCotacao}
            />
            <ProductsStatusSummary
              ativos={stats.produtosPorStatus.ativos}
              cotados={stats.produtosPorStatus.cotados}
              pendentes={stats.produtosPorStatus.pendentes}
              semCotacao={stats.produtosPorStatus.semCotacao}
              topCategoria={stats.topCategoria}
            />
          </section>

          {/* Cards de Métricas Secundárias */}
          <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 4 }} className="mb-4 sm:mb-6">
            <MetricCard
              title="Categorias"
              value={stats.totalCategories}
              icon={Filter}
              variant="warning"
              trend={{
                value: stats.topCategoria ? stats.topCategoria.count.toString() : "0",
                label: stats.topCategoria ? `em ${capitalize(stats.topCategoria.nome)}` : "produtos",
                type: "neutral"
              }}
            />
            <MetricCard
              title="Cotações Ativas"
              value={typeof stats.activeQuotes === 'number' ? stats.activeQuotes.toLocaleString('pt-BR') : 0}
              icon={FileText}
              variant="info"
              trend={{
                value: stats.mediaCotacoesPorProduto,
                label: "por produto",
                type: "positive"
              }}
            />
            <MetricCard
              title="Valor Médio"
              value={stats.averageValue}
              icon={Scale}
              variant="success"
              trend={{
                value: stats.productsWithPrices.toString(),
                label: "com preço",
                type: "neutral"
              }}
            />
            <MetricCard
              title="Economia Potencial"
              value={`${stats.percentualEconomiaMedia}%`}
              icon={TrendingUp}
              variant="success"
              trend={{
                value: `R$ ${stats.economiaMediaPorProduto}`,
                label: "por produto",
                type: "positive"
              }}
            />
          </ResponsiveGrid>

          {/* Page Header */}
          <PageHeader
            title="Produtos"
            icon={Package}
            actions={
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="h-11 sm:h-10 min-w-[44px] px-3 sm:px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 text-sm touch-target">
                      <Plus className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Adicionar</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleAddProduct(); }} className="min-h-[44px]">
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleImportProducts(); }} className="min-h-[44px]">
                      <FileUp className="h-4 w-4 mr-2" /> Importar Produtos
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleExportProducts(); }} className="min-h-[44px]">
                      <Download className="h-4 w-4 mr-2" /> Exportar Produtos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard/contagem-estoque")} className="min-h-[44px]">
                      <ClipboardList className="h-4 w-4 mr-2" /> Contagem de Estoque
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/relatorios?tab=produtos")} className="min-h-[44px]">
                      <FileText className="h-4 w-4 mr-2" /> Relatórios
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/analytics")} className="min-h-[44px]">
                      <TrendingUp className="h-4 w-4 mr-2" /> Analytics
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            }
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
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
            </div>
          </PageHeader>

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
                  <div className="md:hidden px-3 py-4 space-y-3">
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
                  <div className="hidden md:block overflow-x-auto w-full">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableCell colSpan={8} className="px-1 pb-3 pt-0 border-none">
                            <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-orange-200/60 dark:border-orange-900/40 rounded-lg shadow-sm px-4 py-3">
                              <div className="w-[30%] flex items-center gap-3 pr-4 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                  <Package className="h-4 w-4" />
                                </div>
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Produto</span>
                              </div>
                              <div className="w-[15%] px-2 flex justify-center items-center gap-1.5">
                                <Tags className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Categoria</span>
                              </div>
                              <div className="hidden lg:flex w-[12%] px-2 justify-center items-center gap-1.5">
                                <Barcode className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Código</span>
                              </div>
                              <div className="w-[13%] px-2 flex justify-center items-center gap-1.5">
                                <CircleDot className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Status</span>
                              </div>
                              <div className="w-[12%] px-2 flex justify-center items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Preço</span>
                              </div>
                              <div className="hidden lg:flex w-[15%] px-2 justify-center items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Fornecedor</span>
                              </div>
                              <div className="w-[8%] px-2 flex justify-center items-center gap-1.5">
                                <ClipboardList className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Cotações</span>
                              </div>
                              <div className="w-[10%] flex justify-end items-center gap-1.5 px-2">
                                <MoreVertical className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Ações</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.items.map((product) => (
                          <TableRow key={product.id} className="group border-none">
                            <TableCell colSpan={8} className="px-1 py-2">
                              <div className="flex items-center p-3 bg-white/90 dark:bg-gray-800/50 rounded-lg border border-gray-300/70 dark:border-gray-700/30 hover:border-orange-300/60 dark:hover:border-orange-700/50">
                                <div className="w-[30%] flex items-center gap-3 pr-4 min-w-0">
                                  <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-sm overflow-hidden">
                                    {product.image_url ? (
                                      <LazyImage 
                                        src={product.image_url} 
                                        alt={product.name} 
                                        className="w-8 h-8 rounded-lg object-cover"
                                        showSkeleton={true}
                                        fallback={<Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                                      />
                                    ) : (
                                      <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{capitalize(product.name)}</div>
                                  </div>
                                </div>

                                <div className="w-[15%] px-2 flex justify-center items-center">
                                  <Badge variant="secondary" className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                                    {capitalize(product.category)}
                                  </Badge>
                                </div>

                                <div className="hidden lg:flex w-[12%] px-2 justify-center items-center">
                                  <Badge variant="outline" className="text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600">
                                    {product.barcode || "N/A"}
                                  </Badge>
                                </div>

                                <div className="w-[13%] px-2 flex justify-center items-center">
                                  <StatusBadge status={getProductStatus(product)} />
                                </div>

                                <div className="w-[12%] px-2 flex justify-center items-center gap-1">
                                  <span className="font-semibold text-green-700 dark:text-green-400 text-sm">{product.lastQuotePrice}</span>
                                  {getTrendIcon(product.trend)}
                                </div>

                                <div className="hidden lg:flex w-[15%] px-2 justify-center items-center">
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{capitalize(product.bestSupplier || "N/A")}</span>
                                </div>

                                <div className="w-[8%] px-2 flex justify-center items-center gap-1">
                                  <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                    <ClipboardList className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <span className="font-semibold text-blue-700 dark:text-blue-400 text-sm">{product.quotesCount || 0}</span>
                                </div>

                                <div className="w-[10%] flex justify-end items-center px-2">
                                  <TableActionGroup
                                    showView={false}
                                    onEdit={() => handleEditProduct(product)}
                                    onDelete={() => handleDeleteProduct(product)}
                                    additionalActions={[
                                      {
                                        icon: <History className="h-3.5 w-3.5" />,
                                        label: "Histórico",
                                        onClick: () => {},
                                        variant: "default" as const,
                                      }
                                    ]}
                                    dropdownItems={[
                                      {
                                        icon: <History className="h-4 w-4" />,
                                        label: "Ver Histórico de Preços",
                                        onClick: () => {},
                                      }
                                    ]}
                                    dropdownLabel="Mais Opções"
                                  />
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

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
                    updateProduct({ productId: updatedProduct.id, data: { name: updatedProduct.name, category: updatedProduct.category, unit: updatedProduct.unit, barcode: updatedProduct.barcode } });
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


        </div>
      </PageWrapper>
    </>
  );
}

export default memo(Produtos);
