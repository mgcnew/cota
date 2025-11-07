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
    <Card className="bg-orange-600 dark:bg-[#1C1F26] border border-orange-500/30 dark:border-gray-800 rounded-lg hover:border-orange-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-700/50 dark:bg-gray-800">
            <Package className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Total de Produtos
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {stats.totalProducts}
          </span>
          <Badge className="bg-orange-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
            {stats.percentualComCotacao}%
          </Badge>
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Com cotação:</span>
            <span className="font-medium text-white dark:text-gray-300">{stats.percentualComCotacao}%</span>
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
    <Card className="bg-blue-600 dark:bg-[#1C1F26] border border-blue-500/30 dark:border-gray-800 rounded-lg hover:border-blue-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-700/50 dark:bg-gray-800">
            <Filter className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Categorias Ativas
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {stats.totalCategories}
          </span>
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Total de categorias:</span>
            <span className="font-medium text-white dark:text-gray-300">{stats.totalCategories}</span>
          </div>
          {stats.topCategoria && (
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Top categoria:</span>
              <span className="font-medium text-white dark:text-gray-300">
                {stats.topCategoria?.nome || 'N/A'} • {stats.topCategoria?.count || 0} produtos
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  const renderCard3 = useMemo(() => (
    <Card className="bg-purple-600 dark:bg-[#1C1F26] border border-purple-500/30 dark:border-gray-800 rounded-lg hover:border-purple-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-700/50 dark:bg-gray-800">
            <FileText className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Cotações Ativas
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {typeof stats.activeQuotes === 'number' ? stats.activeQuotes : 0}
          </span>
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Média por produto:</span>
            <span className="font-medium text-white dark:text-gray-300">{stats.mediaCotacoesPorProduto}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  const renderCard4 = useMemo(() => (
    <Card className="bg-emerald-600 dark:bg-[#1C1F26] border border-emerald-500/30 dark:border-gray-800 rounded-lg hover:border-emerald-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-700/50 dark:bg-gray-800">
            <Scale className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Valor Médio
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {stats.averageValue}
          </span>
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Produtos com preço:</span>
            <span className="font-medium text-white dark:text-gray-300">{stats.productsWithPrices}</span>
          </div>
          {stats.percentualEconomiaMedia > 0 ? (
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Economia média:</span>
              <span className="font-medium text-white dark:text-gray-300">R$ {stats.economiaMediaPorProduto}/produto</span>
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

          <Card className="bg-white dark:bg-[#1C1F26] border border-gray-200/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
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
            <CardContent className="p-0">
              {paginatedData.items.length === 0 && !productsLoading ? (
                <div className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">Nenhum produto encontrado.</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Tente ajustar sua busca ou filtros.</p>
                  <Button onClick={triggerAddDialog} className="mt-4 bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto w-full">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow>
                          <TableCell colSpan={8} className="px-1 pb-3 pt-0 border-none">
                            <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-orange-200/60 dark:border-orange-900/40 rounded-lg shadow-sm px-4 py-3">
                              <div className="w-[30%] flex items-center gap-2 pr-4 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/15 to-amber-500/15 flex items-center justify-center text-orange-600 dark:text-orange-300">
                                  <Package className="h-4 w-4" />
                                </div>
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Produto</span>
                              </div>
                              <div className="hidden md:flex w-[15%] pl-2 justify-center items-center gap-1.5">
                                <Tags className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Categoria</span>
                              </div>
                              <div className="hidden md:flex w-[12%] pl-2 justify-center items-center gap-1.5">
                                <Barcode className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Código</span>
                              </div>
                              <div className="hidden sm:flex w-[13%] pl-2 justify-center items-center gap-1.5">
                                <CircleDot className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Status</span>
                              </div>
                              <div className="hidden sm:flex w-[12%] pl-2 justify-center items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Preço</span>
                              </div>
                              <div className="hidden lg:flex w-[15%] pl-2 justify-center items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Fornecedor</span>
                              </div>
                              <div className="hidden sm:flex w-[8%] pl-2 justify-center items-center gap-1.5">
                                <ClipboardList className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Cotações</span>
                              </div>
                              <div className="w-[10%] flex justify-end items-center gap-1.5">
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
                            <TableCell colSpan={8} className="px-1 py-3">
                              <div className="flex items-center p-3 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300/70 dark:border-gray-700/30 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-orange-300/60 dark:hover:border-orange-700/50 transition-[box-shadow,border-color] duration-200 [&_*]:!transition-none">
                                {/* Produto - Largura fixa */}
                                <div className="w-[30%] flex items-center gap-3 pr-4">
                                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    {product.image_url ? (
                                      <img src={product.image_url} alt={product.name} className="w-8 h-8 rounded-lg object-cover" />
                                    ) : (
                                      <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{capitalize(product.name)}</div>
                                  </div>
                                </div>

                                {/* Categoria - Largura fixa, hidden on mobile */}
                                <div className="hidden md:block w-[15%] px-2">
                                  <div className="flex justify-center">
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                                      {capitalize(product.category)}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Código - Largura fixa, hidden on mobile */}
                                <div className="hidden md:block w-[12%] px-2">
                                  <div className="flex justify-center">
                                    <Badge variant="outline" className="text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600">
                                      {product.barcode || "N/A"}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Status - Largura fixa, hidden on small */}
                                <div className="hidden sm:block w-[13%] px-2">
                                  <div className="flex justify-center">
                                    {getStatusBadge(getProductStatus(product))}
                                  </div>
                                </div>

                                {/* Preço - Largura fixa, hidden on small */}
                                <div className="hidden sm:block w-[12%] px-2">
                                  <div className="flex justify-center items-center gap-1">
                                    <span className="font-semibold text-green-700 dark:text-green-400 text-sm">{product.lastQuotePrice}</span>
                                    {getTrendIcon(product.trend)}
                                  </div>
                                </div>

                                {/* Fornecedor - Largura fixa, hidden on large */}
                                <div className="hidden lg:block w-[15%] px-2">
                                  <div className="flex justify-center">
                                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{capitalize(product.bestSupplier || "N/A")}</span>
                                  </div>
                                </div>

                                {/* Cotações - Largura fixa, hidden on small */}
                                <div className="hidden sm:block w-[8%] px-2">
                                  <div className="flex justify-center items-center gap-1">
                                    <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                                      <ClipboardList className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="font-semibold text-blue-700 dark:text-blue-400 text-sm">{product.quotesCount || 0}</span>
                                  </div>
                                </div>

                                {/* Ações - Largura fixa */}
                                <div className="w-[10%] flex justify-end items-center gap-2">
                                  <ProductPriceHistoryDialog productName={product.name} productId={product.id} trigger={<Button variant="ghost" size="sm" className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 p-0 h-8 w-8 rounded-lg border border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 flex items-center justify-center shadow-sm hover:shadow-md !transition-all">
                                    <History className="h-4 w-4" />
                                  </Button>} />
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 h-8 w-8 p-0 rounded-full !transition-colors">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-background border z-50 w-48 shadow-lg">
                                      <DropdownMenuItem onClick={() => setEditingProduct(product)} className="hover:bg-green-50 hover:text-green-700 cursor-pointer transition-colors py-2">
                                        <Edit className="h-4 w-4 mr-2 text-green-600" />
                                        <span className="font-medium">Editar Produto</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors py-2" onClick={() => setDeletingProduct(product)}>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        <span className="font-medium">Excluir Produto</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Área de Paginação Melhorada */}
                  <div className="border-t border-orange-100/80 dark:border-gray-700/30 bg-gradient-to-r from-orange-50/30 via-amber-50/30 to-orange-50/30 dark:from-gray-800/30 dark:via-gray-800/20 dark:to-gray-800/30">
                    <div className="px-6 py-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Informações de Resultados */}
                        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-orange-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                            <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {paginatedData.items.length > 0 
                                ? `${((paginatedData.pagination.currentPage - 1) * paginatedData.pagination.itemsPerPage) + 1}-${Math.min(paginatedData.pagination.currentPage * paginatedData.pagination.itemsPerPage, safeFilteredProducts.length)}`
                                : '0'
                              } de {safeFilteredProducts.length}
                            </span>
                            <span className="text-gray-500 dark:text-gray-500">produtos</span>
                          </div>
                          {safeFilteredProducts.length > 0 && (
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-orange-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                              <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-gray-700 dark:text-gray-300">
                                Página <span className="font-semibold text-orange-600 dark:text-orange-400">{paginatedData.pagination.currentPage}</span> de <span className="font-semibold">{paginatedData.pagination.totalPages}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Controles de Paginação */}
                        <div className="flex items-center gap-2">
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
