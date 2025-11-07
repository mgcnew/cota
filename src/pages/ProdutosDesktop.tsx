import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProducts } from "@/hooks/useProducts";
import { useDebounce } from "@/hooks/useDebounce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Search, Plus, Filter, MoreVertical, Edit, Trash2, TrendingUp, TrendingDown, Minus, Scale, FileUp, FileText, Building2, History, Clock, ClipboardList, Tags, DollarSign, CircleDot, Barcode } from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { CategorySelect } from "@/components/ui/category-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddProductDialog } from "@/components/forms/AddProductDialog";
import { EditProductDialog } from "@/components/forms/EditProductDialog";
import { DeleteProductDialog } from "@/components/forms/DeleteProductDialog";
import { ImportProductsDialog } from "@/components/forms/ImportProductsDialog";
import { ProductPriceHistoryDialog } from "@/components/forms/ProductPriceHistoryDialog";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import type { Product } from "@/hooks/useProducts";
import { PageWrapper } from "@/components/layout/PageWrapper";

/**
 * ProdutosDesktop - Versão Desktop Completa
 * 
 * Funcionalidades:
 * - Cards de estatísticas (4 cards)
 * - Tabela completa com todas as colunas
 * - Filtros e busca client-side
 * - Paginação client-side
 * - Dialogs para CRUD
 */
export default function ProdutosDesktop() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { paginate } = usePagination<Product>({ initialItemsPerPage: 10 });
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const addDialogTriggerRef = useRef<HTMLDivElement>(null);
  const importDialogTriggerRef = useRef<HTMLDivElement>(null);

  const triggerAddDialog = () => {
    const button = addDialogTriggerRef.current?.querySelector('button');
    button?.click();
  };
  const triggerImportDialog = () => {
    const button = importDialogTriggerRef.current?.querySelector('button');
    button?.click();
  };

  const { products, categories, isLoading: productsLoading, deleteProduct, updateProduct, invalidateCache } = useProducts();

  // Valores padrão para evitar erros de undefined
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
        produtosPorStatus: {
          ativos: 0,
          cotados: 0,
          pendentes: 0,
          semCotacao: 0
        },
        percentualComCotacao: 0,
        topCategoria: null,
        mediaCotacoesPorProduto: "0.0",
        averageValue: "R$ 0,00",
        economiaMediaPorProduto: "0",
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
    const topCategoria = Array.from(categoriaCount.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    const produtosComCotacaoParaMedia = safeProducts.filter((p) => (p.quotesCount || 0) > 0);
    const mediaCotacoesPorProduto = produtosComCotacaoParaMedia.length > 0
      ? (activeQuotes / produtosComCotacaoParaMedia.length).toFixed(1)
      : "0.0";
    
    const productsWithPrices = safeProducts.filter((p) => p.lastQuotePrice !== "R$ 0,00");
    let averageValue = "R$ 0,00";
    let economiaMediaPorProduto = "0";
    let percentualEconomiaMedia = 0;
    
    if (productsWithPrices.length > 0) {
      const total = productsWithPrices.reduce((sum, p) => {
        const price = parseFloat(p.lastQuotePrice.replace(/[^\d,]/g, '').replace(',', '.'));
        return sum + (isNaN(price) ? 0 : price);
      }, 0);
      averageValue = `R$ ${(total / productsWithPrices.length).toFixed(2)}`;
      
      const produtosComMultiplasCotacoes = safeProducts.filter((p) => (p.quotesCount || 0) >= 2);
      if (produtosComMultiplasCotacoes.length > 0) {
        percentualEconomiaMedia = Math.round((produtosComMultiplasCotacoes.length / productsWithPrices.length) * 12);
        const valorMedio = total / productsWithPrices.length;
        economiaMediaPorProduto = (valorMedio * (percentualEconomiaMedia / 100)).toFixed(2);
      }
    }

    return {
      totalProducts: safeProducts.length,
      totalCategories,
      activeQuotes,
      produtosPorStatus,
      percentualComCotacao,
      topCategoria: topCategoria ? { nome: topCategoria[0], count: topCategoria[1] } : null,
      mediaCotacoesPorProduto,
      averageValue,
      economiaMediaPorProduto,
      percentualEconomiaMedia,
      productsWithPrices: productsWithPrices.length,
    };
  }, [safeProducts, safeCategories]);

  const getTrendIcon = useCallback((trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
    if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
    return <Minus className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />;
  }, []);

  const getProductStatus = useCallback((product: Product) => {
    if (product.quotesCount === 0) return "sem_cotacao";
    if (product.lastQuotePrice === "R$ 0,00") return "pendente";
    if (product.quotesCount >= 3) return "ativo";
    return "cotado";
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const statusConfig = {
      ativo: { label: "Ativo", className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
      cotado: { label: "Cotado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
      pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" },
      sem_cotacao: { label: "Sem Cotação", className: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sem_cotacao;
    return <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
        {config.label}
    </Badge>;
  }, []);

  const renderCard1 = useMemo(() => (
    <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg overflow-hidden relative">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-white/20 rounded-md">
            <Package className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Total de Produtos
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="text-3xl font-bold text-white dark:text-gray-50">
          {stats.totalProducts}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Com cotação:</span>
            <span className="font-medium">{stats.percentualComCotacao}%</span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>{stats.produtosPorStatus.ativos} ativos</span>
            <span>•</span>
            <span>{stats.produtosPorStatus.cotados} cotados</span>
            <span>•</span>
            <span>{stats.produtosPorStatus.semCotacao} sem cotação</span>
          </div>
        </div>
    </CardContent>
    </Card>
  ), [stats]);

  const renderCard2 = useMemo(() => (
    <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg overflow-hidden relative">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-white/20 rounded-md">
            <Filter className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Categorias Ativas
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="text-3xl font-bold text-white dark:text-gray-50">
          {stats.totalCategories}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Total de categorias:</span>
            <span className="font-medium">{stats.totalCategories}</span>
          </div>
          {stats.topCategoria && (
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Top categoria:</span>
              <span className="font-medium">
                {stats.topCategoria?.nome || 'N/A'} • {stats.topCategoria?.count || 0} produtos
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  const renderCard3 = useMemo(() => (
    <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg overflow-hidden relative">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-white/20 rounded-md">
            <FileText className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Cotações Ativas
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="text-3xl font-bold text-white dark:text-gray-50">
          {typeof stats.activeQuotes === 'number' ? stats.activeQuotes : 0}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Média por produto:</span>
            <span className="font-medium">{stats.mediaCotacoesPorProduto}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  const renderCard4 = useMemo(() => (
    <Card className="bg-gradient-to-br from-green-500 to-teal-600 text-white shadow-lg overflow-hidden relative">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-white/20 rounded-md">
            <Scale className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Valor Médio
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="text-3xl font-bold text-white dark:text-gray-50">
          {stats.averageValue}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Produtos com preço:</span>
            <span className="font-medium">{stats.productsWithPrices}</span>
          </div>
          {stats.percentualEconomiaMedia > 0 ? (
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Economia média:</span>
              <span className="font-medium">R$ {stats.economiaMediaPorProduto}/produto</span>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Sem economia estimada</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ), [stats]);

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
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
            {renderCard1}
            {renderCard2}
            {renderCard3}
            {renderCard4}
          </div>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                Produtos
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs h-9"
                />
                <CategorySelect
                  categories={safeCategories}
                  products={safeProducts}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-3">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[180px]">
                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={triggerAddDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Produto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={triggerImportDialog}>
                      <FileUp className="h-4 w-4 mr-2" />
                      Importar Produtos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/contagem-estoque")}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Contagem de Estoque
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/relatorios?tab=produtos")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Relatórios de Produtos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/analytics")}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Análise de Produtos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setAuthDialogOpen(true)}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Gerenciar Empresas
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              {paginatedData.items.length === 0 && !productsLoading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Package className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg font-semibold">Nenhum produto encontrado.</p>
                  <p className="text-sm">Tente ajustar sua busca ou filtros.</p>
                  <Button onClick={triggerAddDialog} className="mt-4 bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                          <TableHead className="w-[35%] min-w-[200px] py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider rounded-tl-lg">
                            <div className="flex items-center gap-1.5">
                              <Package className="h-4 w-4" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Produto</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[15%] min-w-[100px] py-3 px-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                            <div className="flex w-full justify-center items-center gap-1.5">
                              <Tags className="h-4 w-4" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-220">Categoria</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[12%] min-w-[80px] py-3 px-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden md:table-cell">
                            <div className="flex w-full justify-center items-center gap-1.5">
                              <Barcode className="h-4 w-4" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Código</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[13%] min-w-[90px] py-3 px-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                            <div className="flex w-full justify-center items-center gap-1.5">
                              <CircleDot className="h-4 w-4" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Status</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[12%] min-w-[90px] py-3 px-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                            <div className="flex w-full justify-center items-center gap-1.5">
                              <DollarSign className="h-4 w-4" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Melhor Preço</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[15%] min-w-[120px] py-3 px-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden lg:table-cell">
                            <div className="flex w-full justify-center items-center gap-1.5">
                              <Building2 className="h-4 w-4" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Fornecedor</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[8%] min-w-[60px] py-3 px-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider hidden sm:table-cell">
                            <div className="flex w-full justify-center items-center gap-1.5">
                              <ClipboardList className="h-4 w-4" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Cotações</span>
                            </div>
                          </TableHead>
                          <TableHead className="w-[10%] min-w-[80px] py-3 px-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider rounded-tr-lg">
                            <div className="flex w-full justify-end items-center gap-1.5">
                              <MoreVertical className="h-4 w-4" />
                              <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Ações</span>
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.items.map((product) => (
                          <TableRow key={product.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150">
                            <TableCell className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 p-1.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-md shadow-sm">
                                  {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="h-8 w-8 object-cover rounded-sm" />
                                  ) : (
                                    <Package className="h-8 w-8 text-white" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 max-w-[200px]">
                                  <div className="table-cell-primary truncate" title={product.name}>{capitalize(product.name)}</div>
                                  <div className="table-cell-secondary md:hidden mt-1 truncate">{capitalize(product.category)}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 hidden md:table-cell text-center">
                              <div className="flex items-center justify-center">
                                <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                                  {capitalize(product.category)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 hidden md:table-cell text-center">
                              <div className="flex items-center justify-center">
                                <Badge variant="outline" className="text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600">
                                  {product.barcode || "N/A"}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 hidden sm:table-cell text-center">
                              <div className="flex items-center justify-center">
                                {getStatusBadge(getProductStatus(product))}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 hidden sm:table-cell text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-semibold text-green-700 dark:text-green-400 text-sm">{product.lastQuotePrice}</span>
                                {getTrendIcon(product.trend)}
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 hidden lg:table-cell text-center">
                              <div className="flex items-center justify-center">
                                <span className="table-cell-primary truncate block">{capitalize(product.bestSupplier || "N/A")}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 hidden sm:table-cell text-center">
                              <div className="flex items-center justify-center gap-1">
                                <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                  <ClipboardList className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="font-semibold text-blue-700 dark:text-blue-400 text-sm">{product.quotesCount || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <ProductPriceHistoryDialog productName={product.name} productId={product.id} trigger={<Button variant="ghost" size="sm" className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 p-0 h-8 w-8 rounded-lg border border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 flex items-center justify-center shadow-sm hover:shadow-md !transition-all">
                                  <History className="h-4 w-4" />
                                </Button>} />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-[160px]">
                                    <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setDeletingProduct(product)}>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4">
                    <DataPagination
                      currentPage={paginatedData.pagination.currentPage}
                      totalPages={paginatedData.pagination.totalPages}
                      itemsPerPage={paginatedData.pagination.itemsPerPage}
                      onPageChange={paginatedData.pagination.goToPage}
                      onNextPage={paginatedData.pagination.nextPage}
                      onPrevPage={paginatedData.pagination.prevPage}
                      onItemsPerPageChange={paginatedData.pagination.setItemsPerPage}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Dialogs - Hidden triggers for dropdown actions */}
          <div className="sr-only">
            <div ref={addDialogTriggerRef}>
              <AddProductDialog onProductAdded={invalidateCache} onCategoryAdded={invalidateCache} />
            </div>
            <div ref={importDialogTriggerRef}>
              <ImportProductsDialog onProductsImported={invalidateCache} onCategoryAdded={invalidateCache} />
            </div>
          </div>

          <EditProductDialog product={editingProduct} open={!!editingProduct} onOpenChange={open => !open && setEditingProduct(null)} onProductUpdated={updatedProduct => {
              if (typeof updateProduct === 'function') {
                updateProduct({
                  productId: updatedProduct.id,
                  data: {
                    name: updatedProduct.name,
                    category: updatedProduct.category,
                    unit: updatedProduct.unit,
                    barcode: updatedProduct.barcode
                  }
                });
              }
            }} onCategoryAdded={invalidateCache} categories={safeCategories} />

          <DeleteProductDialog product={deletingProduct} open={!!deletingProduct} onOpenChange={open => !open && setDeletingProduct(null)} onProductDeleted={id => {
              if (typeof deleteProduct === 'function') {
                deleteProduct(id);
              }
            }} />

          {/* Image Preview Dialog */}
          <Dialog open={!!imagePreviewUrl} onOpenChange={() => setImagePreviewUrl(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">Imagem do Produto</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-center p-2">
                {imagePreviewUrl ? (
                  <div className="w-full aspect-square rounded-xl overflow-hidden border-2 border-orange-200 dark:border-orange-800 shadow-lg">
                    <img 
                      src={imagePreviewUrl} 
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20 rounded-xl flex items-center justify-center border-2 border-orange-200 dark:border-orange-800">
                    <Package className="h-24 w-24 text-orange-600 dark:text-orange-400" />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageWrapper>
    </>
  );
}
