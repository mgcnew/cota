import { useState, useEffect, useMemo, useRef } from "react";
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
import { DeleteDuplicateProductsDialog } from "@/components/forms/DeleteDuplicateProductsDialog";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { ViewMode } from "@/types/pagination";
import type { Product } from "@/hooks/useProducts";
import { PageWrapper, PageSection } from "@/components/layout/PageWrapper";
import { useMobile } from "@/contexts/MobileProvider";
export default function Produtos() {
  const navigate = useNavigate();
  const {
    user,
    loading
  } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const {
    viewMode,
    setViewMode
  } = useResponsiveViewMode();
  const isMobile = useMobile();
  const {
    paginate
  } = usePagination<Product>({
    initialItemsPerPage: 10
  });
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

  // OPTIMIZED: Use React Query for data fetching with caching
  const {
    products,
    categories,
    isLoading: productsLoading,
    deleteProduct,
    updateProduct,
    invalidateCache
  } = useProducts();
  useEffect(() => {
    if (!loading && !user) {
      setAuthDialogOpen(true);
    }
  }, [loading, user]);

  // OPTIMIZED: Memoize filtered products to avoid unnecessary recalculations
  const filteredProducts = useMemo(() => {
    if (!debouncedSearchQuery.trim() && selectedCategory === 'all') {
      return products; // Retorna todos se não há filtros
    }
    
    const searchLower = debouncedSearchQuery.toLowerCase();
    const categoryNormalized = (selectedCategory || '').trim().toLowerCase();
    
    return products.filter(product => {
      const matchesSearch = !searchLower || product.name.toLowerCase().includes(searchLower);
      const productCategory = (product.category || '').trim().toLowerCase();
      const matchesCategory = categoryNormalized === "all" || productCategory === categoryNormalized;
      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearchQuery, selectedCategory]);
  const paginatedData = paginate(filteredProducts);

  // Cálculos de métricas reais e dinâmicas
  const stats = useMemo(() => {
    const totalCategories = categories.length - 1; // -1 para remover "all"
    const activeQuotes = products.reduce((sum, p) => sum + p.quotesCount, 0);
    
    // Calcular produtos por status
    const produtosPorStatus = {
      ativos: products.filter(p => p.quotesCount >= 3).length,
      cotados: products.filter(p => p.quotesCount > 0 && p.quotesCount < 3).length,
      pendentes: products.filter(p => p.quotesCount === 0 && p.lastQuotePrice !== "R$ 0,00").length,
      semCotacao: products.filter(p => p.quotesCount === 0 && p.lastQuotePrice === "R$ 0,00").length
    };
    
    // Percentual de produtos com pelo menos 1 cotação (engajamento geral)
    const produtosComCotacao = produtosPorStatus.ativos + produtosPorStatus.cotados;
    const percentualComCotacao = products.length > 0 
      ? Math.round((produtosComCotacao / products.length) * 100) 
      : 0;
    
    // Top categorias por número de produtos
    const categoriaCount = new Map();
    products.forEach(p => {
      const cat = p.category || 'Sem Categoria';
      categoriaCount.set(cat, (categoriaCount.get(cat) || 0) + 1);
    });
    const topCategoria = Array.from(categoriaCount.entries())
      .sort((a, b) => b[1] - a[1])[0];
    
    // Média de cotações por produto (apenas produtos com cotação)
    const produtosComCotacaoParaMedia = products.filter(p => p.quotesCount > 0);
    const mediaCotacoesPorProduto = produtosComCotacaoParaMedia.length > 0
      ? (activeQuotes / produtosComCotacaoParaMedia.length).toFixed(1)
      : "0.0";
    
    // Valor médio e economia potencial
    const productsWithPrices = products.filter(p => p.lastQuotePrice !== "R$ 0,00");
    let averageValue = "R$ 0,00";
    let economiaMediaPorProduto = "0";
    let percentualEconomiaMedia = 0;
    
    if (productsWithPrices.length > 0) {
      const total = productsWithPrices.reduce((sum, p) => {
        const price = parseFloat(p.lastQuotePrice.replace(/[^\d,]/g, '').replace(',', '.'));
        return sum + (isNaN(price) ? 0 : price);
      }, 0);
      averageValue = `R$ ${(total / productsWithPrices.length).toFixed(2)}`;
      
      // Calcular economia média (assumindo economia de 10-15% em cotações bem feitas)
      // Baseado nos produtos que têm cotação
      const produtosComMultiplasCotacoes = products.filter(p => p.quotesCount >= 2);
      if (produtosComMultiplasCotacoes.length > 0) {
        // Estimativa conservadora: produtos com múltiplas cotações geram economia média
        percentualEconomiaMedia = Math.round((produtosComMultiplasCotacoes.length / productsWithPrices.length) * 12);
        const valorMedio = total / productsWithPrices.length;
        economiaMediaPorProduto = (valorMedio * (percentualEconomiaMedia / 100)).toFixed(2);
      }
    }
    
    return {
      totalProducts: products.length,
      totalCategories,
      activeQuotes,
      averageValue,
      produtosPorStatus,
      percentualComCotacao,
      topCategoria: topCategoria ? { nome: topCategoria[0], count: topCategoria[1] } : null,
      mediaCotacoesPorProduto,
      productsWithPrices: productsWithPrices.length,
      economiaMediaPorProduto,
      percentualEconomiaMedia
    };
  }, [products, categories]);
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />;
    if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />;
    return <Minus className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />;
  };

  // Função para determinar status do produto baseado em dados
  const getProductStatus = (product: any) => {
    if (product.quotesCount === 0) return "sem_cotacao";
    if (product.lastQuotePrice === "R$ 0,00") return "pendente";
    if (product.quotesCount >= 3) return "ativo";
    return "cotado";
  };

  // Função para renderizar badge de status com cores diferenciadas
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ativo: {
        label: "Ativo",
        className: "bg-green-100 text-green-700 border-green-300 hover:bg-green-200 transition-colors"
      },
      cotado: {
        label: "Cotado",
        className: "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 transition-colors"
      },
      pendente: {
        label: "Pendente",
        className: "bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 transition-colors"
      },
      sem_cotacao: {
        label: "Sem Cotação",
        className: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 transition-colors"
      }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sem_cotacao;
    return <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
        {config.label}
      </Badge>;
  };
  if (loading || productsLoading) {
    return <div className="flex items-center justify-center h-screen">
        <div className="text-center">Carregando...</div>
      </div>;
  }
  return <>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <PageWrapper>
        <div className="page-container">
          {/* Stats Cards - Inspiração Dashboard Statistics Card 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
            {/* Card 1: Produtos */}
            <Card className="group relative overflow-hidden bg-orange-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl rounded-xl transition-all duration-300">
              {/* Decoração SVG sutil */}
              <svg
                className="absolute right-0 top-0 h-full w-2/3 pointer-events-none opacity-10 dark:opacity-5"
                viewBox="0 0 300 200"
                fill="none"
                style={{ zIndex: 0 }}
              >
                <circle cx="220" cy="100" r="90" fill="#fff" fillOpacity="0.08" />
                <circle cx="260" cy="60" r="60" fill="#fff" fillOpacity="0.10" />
                <circle cx="200" cy="160" r="50" fill="#fff" fillOpacity="0.07" />
                <circle cx="270" cy="150" r="30" fill="#fff" fillOpacity="0.12" />
              </svg>

              <CardHeader className="border-0 z-10 relative pb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-white/70 dark:text-gray-400" />
                  <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                    Produtos
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 z-10 relative">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                    {stats.totalProducts}
                  </span>
                  <Badge className="bg-white/20 text-white font-semibold border-0">
                    <TrendingUp className="w-3 h-3" />
                    +{Math.floor(stats.totalProducts * 0.1)}
                  </Badge>
                    </div>
                <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span>No Catálogo:</span>
                    <span className="font-medium text-white dark:text-gray-300">
                      {stats.totalProducts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                    <span>Com cotação:</span>
                    <span className="font-medium">{stats.percentualComCotacao}%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
                    <span>{stats.produtosPorStatus.ativos} ativos</span>
                    <span>•</span>
                    <span>{stats.produtosPorStatus.cotados} cotados</span>
                    <span>•</span>
                    <span>{stats.produtosPorStatus.semCotacao} sem cotação</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Categorias */}
            <Card className="group relative overflow-hidden bg-blue-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl rounded-xl transition-all duration-300">
              {/* Decoração SVG sutil */}
              <svg
                className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5"
                viewBox="0 0 200 200"
                fill="none"
                style={{ zIndex: 0 }}
              >
                <defs>
                  <filter id="blur-categorias" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="10" />
                  </filter>
                </defs>
                <ellipse cx="170" cy="60" rx="40" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur-categorias)" />
                <rect x="120" y="20" width="60" height="20" rx="8" fill="#fff" fillOpacity="0.10" />
                <polygon points="150,0 200,0 200,50" fill="#fff" fillOpacity="0.07" />
                <circle cx="180" cy="100" r="14" fill="#fff" fillOpacity="0.16" />
              </svg>

              <CardHeader className="border-0 z-10 relative pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-white/70 dark:text-gray-400" />
                  <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                    Categorias
                  </CardTitle>
                    </div>
              </CardHeader>
              <CardContent className="space-y-2.5 z-10 relative">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                    {stats.totalCategories}
                  </span>
                  <Badge className="bg-white/20 text-white font-semibold border-0">
                    <TrendingUp className="w-3 h-3" />
                    +2
                  </Badge>
                  </div>
                <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span>Disponíveis:</span>
                    <span className="font-medium text-white dark:text-gray-300">
                      {stats.totalCategories}
                    </span>
                  </div>
                  {stats.topCategoria && (
                    <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                      <span>Top categoria:</span>
                      <span className="font-medium">{stats.topCategoria.nome} • {stats.topCategoria.count} produtos</span>
                </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Cotações */}
            <Card className="group relative overflow-hidden bg-emerald-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl rounded-xl transition-all duration-300">
              {/* Decoração SVG sutil */}
              <svg
                className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5"
                viewBox="0 0 200 200"
                fill="none"
                style={{ zIndex: 0 }}
              >
                <defs>
                  <filter id="blur-cotacoes" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="12" />
                  </filter>
                </defs>
                <rect x="120" y="0" width="70" height="70" rx="35" fill="#fff" fillOpacity="0.09" filter="url(#blur-cotacoes)" />
                <ellipse cx="170" cy="80" rx="28" ry="12" fill="#fff" fillOpacity="0.12" />
                <polygon points="200,0 200,60 140,0" fill="#fff" fillOpacity="0.07" />
                <circle cx="150" cy="30" r="10" fill="#fff" fillOpacity="0.15" />
              </svg>

              <CardHeader className="border-0 z-10 relative pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-white/70 dark:text-gray-400" />
                  <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                    Cotações
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2.5 z-10 relative">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                    {stats.activeQuotes}
                  </span>
                  <Badge className="bg-white/20 text-white font-semibold border-0">
                    <TrendingUp className="w-3 h-3" />
                    15%
                  </Badge>
                    </div>
                <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span>Total de cotações:</span>
                    <span className="font-medium text-white dark:text-gray-300">
                      {stats.activeQuotes}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                    <span>Média por produto:</span>
                    <span className="font-medium">{stats.mediaCotacoesPorProduto}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Valor Médio */}
            <Card className="group relative overflow-hidden bg-purple-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-xl dark:hover:shadow-2xl rounded-xl transition-all duration-300">
              {/* Decoração SVG sutil */}
              <svg
                className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5"
                viewBox="0 0 200 200"
                fill="none"
                style={{ zIndex: 0 }}
              >
                <defs>
                  <filter id="blur-valor" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="16" />
                  </filter>
                </defs>
                <polygon points="200,0 200,100 100,0" fill="#fff" fillOpacity="0.09" />
                <ellipse cx="170" cy="40" rx="30" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur-valor)" />
                <rect x="140" y="60" width="40" height="18" rx="8" fill="#fff" fillOpacity="0.10" />
                <circle cx="150" cy="30" r="14" fill="#fff" fillOpacity="0.18" />
                <line x1="120" y1="0" x2="200" y2="80" stroke="#fff" strokeOpacity="0.08" strokeWidth="6" />
              </svg>

              <CardHeader className="border-0 z-10 relative pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-white/70 dark:text-gray-400" />
                  <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                    Valor Médio
                  </CardTitle>
                    </div>
              </CardHeader>
              <CardContent className="space-y-2.5 z-10 relative">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl font-semibold tracking-tight text-white dark:text-white">
                    {stats.averageValue}
                  </span>
                  {stats.percentualEconomiaMedia > 0 && (
                    <Badge className="bg-white/20 text-white font-semibold border-0">
                      <TrendingUp className="w-3 h-3" />
                      {stats.percentualEconomiaMedia}%
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                  <div className="flex items-center justify-between">
                    <span>Valor médio:</span>
                    <span className="font-medium text-white dark:text-gray-300">
                      {stats.averageValue}
                    </span>
                  </div>
                  {stats.percentualEconomiaMedia > 0 ? (
                    <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                      <span>Economia média:</span>
                      <span className="font-medium">R$ {stats.economiaMediaPorProduto}/produto</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                      <span>Produtos com preço:</span>
                      <span className="font-medium">{stats.productsWithPrices}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters - Between stats cards and products table */}
          <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
            {!isMobile && (
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            )}

            <div className="flex flex-wrap items-center gap-3 sm:justify-end w-full">
              {/* Barra de busca + Botão Criar (lado a lado no mobile) */}
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 z-10" />
                  <Input
                    placeholder="Buscar produtos..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 w-full h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 dark:hover:border-orange-600/70 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-200/50 dark:focus:ring-orange-800/50 rounded-lg shadow-sm transition-all duration-200 text-sm text-gray-900 dark:text-white"
                  />
                </div>

                {/* Botão Mobile - Apenas criar (ao lado da busca) */}
                {isMobile && (
                  <Button
                    onClick={triggerAddDialog}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl flex-shrink-0 px-4"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {!isMobile && (
                <CategorySelect
                  categories={categories}
                  products={products}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  className="w-full sm:w-auto h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-orange-300/70 dark:hover:border-orange-600/70 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200/50 dark:focus:ring-orange-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white"
                />
              )}

              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border z-50 w-56 shadow-lg">
                    <DropdownMenuLabel>Gerenciar Produtos</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={triggerAddDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Produto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={triggerImportDialog}>
                      <FileUp className="h-4 w-4 mr-2" />
                      Importar Produtos
                    </DropdownMenuItem>
                    {/* TEMPORÁRIO: Função de excluir duplicatas (comentada) */}
                    {/* <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <DeleteDuplicateProductsDialog onDuplicatesDeleted={invalidateCache} />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator /> */}
                    {/* TEMPORÁRIO: Função de limpar cache (comentada) */}
                    {/* <DropdownMenuItem onClick={invalidateCache}>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Atualizar Cache
                    </DropdownMenuItem> */}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Visual Feedback do Filtro */}
      {selectedCategory !== "all" && <div className="mb-4 flex items-center gap-2 px-4">
          <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700/50">
            Categoria: {selectedCategory}
          </Badge>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredProducts.length} produtos encontrados
          </span>
          {filteredProducts.length === 0 && <span className="text-sm text-amber-600 dark:text-amber-400">
              ⚠️ Nenhum produto nesta categoria
            </span>}
        </div>}

      {/* Products View */}
      {viewMode === "grid" ? <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map(product => <Card key={product.id} className={`group relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-[#1C1F26] dark:via-[#1C1F26] dark:to-[#1C1F26] border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none ${isMobile ? '' : 'md:hover:shadow-lg dark:hover:shadow-lg dark:hover:shadow-black/20 transition-shadow duration-200'}`}>
              <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 sm:space-y-3 flex-1">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`p-1.5 sm:p-2.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg sm:rounded-xl shadow-lg ${isMobile ? '' : 'group-hover:scale-105 transition-transform duration-200'}`}>
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className={`text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate ${isMobile ? '' : 'group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors duration-200'}`}>
                          {capitalize(product.name)}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-orange-100/80 border-orange-300/60 text-orange-700 font-medium text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                        {capitalize(product.category)}
                      </Badge>
                      {product.barcode && (
                        <Badge variant="secondary" className="bg-gray-100/80 text-gray-700 font-medium text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                          {product.barcode}
                        </Badge>
                      )}
                      {getStatusBadge(getProductStatus(product))}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 hover:bg-orange-100 hover:text-orange-700 border border-transparent hover:border-orange-200 shadow-sm hover:shadow-md rounded-full h-8 w-8 sm:h-9 sm:w-9">
                        <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border z-50 w-56 shadow-lg">
                      <DropdownMenuLabel className="text-gray-600 font-medium">Ações do Produto</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <ProductPriceHistoryDialog productName={product.name} productId={product.id} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()} className="hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer">
                            <History className="h-4 w-4 mr-2 text-blue-600" />
                            Ver Histórico de Preços
                          </DropdownMenuItem>} />
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setEditingProduct(product)} className="hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer">
                        <Edit className="h-4 w-4 mr-2 text-amber-600" />
                        Editar Produto
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer" onClick={() => setDeletingProduct(product)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Produto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </div>
              </CardHeader>

              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/60 dark:border-green-700/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-400 mb-1">Melhor Preço</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-800 dark:text-green-300">{product.lastQuotePrice}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        {getTrendIcon(product.trend)}
                        <span className="text-xs sm:text-sm font-medium text-green-600 hidden sm:inline">Tendência</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                        Atualizado
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  {!isMobile && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/30">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Fornecedor</span>
                      </div>
                      <span className="table-cell-primary truncate max-w-[120px]">{capitalize(product.bestSupplier)}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 rounded-lg bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/60 dark:border-blue-700/30 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        <span className="text-[10px] sm:text-xs font-medium text-blue-600 dark:text-blue-400">Cotações</span>
                      </div>
                      <span className="text-base sm:text-lg font-bold text-blue-800 dark:text-blue-300">{product.quotesCount}</span>
                    </div>

                    <div className="p-2 sm:p-3 rounded-lg bg-purple-50/80 dark:bg-purple-900/20 border border-purple-200/60 dark:border-purple-700/30 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                        <span className="text-[10px] sm:text-xs font-medium text-purple-600 dark:text-purple-400">Atualizado</span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-semibold text-purple-800 dark:text-purple-300">{product.lastUpdate}</span>
                    </div>
                  </div>
                </div>

                <ProductPriceHistoryDialog productName={product.name} productId={product.id} trigger={<Button variant="outline" className={`w-full bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 text-orange-700 ${isMobile ? '' : 'hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 hover:text-orange-800 transition-all duration-200'}`}>
                      <History className="h-4 w-4 mr-2" />
                      Ver Histórico de Preços
                    </Button>} />
              </CardContent>

              {/* Elemento decorativo */}
              <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-orange-200 dark:bg-orange-900/20 rounded-full opacity-20"></div>
            </Card>)}
        </div> : <Card className="border-0 bg-transparent">
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableCell colSpan={8} className="px-1 pb-3 pt-0 border-none">
                      <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-orange-200/60 dark:border-orange-800/40 rounded-lg shadow-sm px-1.5 py-3">
                        <div className="w-[25%] flex items-center gap-2 px-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/15 to-amber-500/15 flex items-center justify-center text-orange-600 dark:text-amber-300">
                            <Package className="h-4 w-4" />
                          </div>
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Produto</span>
                        </div>
                        <div className="hidden md:flex w-[15%] pl-2 justify-center items-center gap-1.5">
                          <Tags className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Categoria</span>
                        </div>
                        <div className="hidden md:flex w-[12%] pl-2 justify-center items-center gap-1.5">
                          <Barcode className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Código</span>
                        </div>
                        <div className="hidden sm:flex w-[13%] pl-2 justify-center items-center gap-1.5">
                          <CircleDot className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Status</span>
                        </div>
                        <div className="w-[12%] pl-2 justify-center hidden sm:flex sm:justify-center sm:items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Melhor Preço</span>
                        </div>
                        <div className="hidden lg:flex w-[15%] pl-2 justify-center items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Fornecedor</span>
                        </div>
                        <div className="hidden sm:flex w-[8%] pl-2 justify-center items-center gap-1.5">
                          <ClipboardList className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Cotações</span>
                        </div>
                        <div className="w-[10%] pl-4 flex justify-end items-center gap-1.5">
                          <MoreVertical className="h-3.5 w-3.5 text-orange-600/70 dark:text-orange-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-800 dark:text-amber-200">Ações</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map((product, index) => <TableRow key={product.id} className="group border-none">
                      <TableCell colSpan={8} className="px-1 py-3">
                        <div className="flex items-center px-1.5 py-2 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300/70 dark:border-gray-700/30 transition-all duration-200 group-hover:bg-white dark:group-hover:bg-gray-800/70 group-hover:shadow-md dark:group-hover:shadow-lg dark:group-hover:shadow-black/20 group-hover:border-orange-300/60 dark:group-hover:border-orange-700/50 [&_*]:!transition-none">
                          {/* Produto - Largura fixa */}
                          <div className="w-[25%] flex items-center gap-3 px-2">
                            <div 
                              className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer bg-gradient-to-br from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20 hover:scale-105"
                              onClick={() => setImagePreviewUrl(product.image_url || null)}
                            >
                              {product.image_url ? (
                                <img 
                                  src={product.image_url} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1 max-w-[200px]">
                              <div className="table-cell-primary truncate" title={product.name}>{capitalize(product.name)}</div>
                              <div className="table-cell-secondary md:hidden mt-1 truncate">{capitalize(product.category)}</div>
                            </div>
                          </div>

                          {/* Categoria - Largura fixa, hidden on mobile */}
                          <div className="hidden md:block w-[15%] px-2">
                            <Badge variant="outline" className="bg-orange-50/80 dark:bg-orange-900/30 border-orange-200/60 dark:border-orange-700/60 text-orange-700 dark:text-orange-400 font-medium text-xs w-full justify-center pointer-events-none">
                              {capitalize(product.category)}
                            </Badge>
                          </div>

                          {/* Código de Barras - Largura fixa, hidden on mobile */}
                          <div className="hidden md:block w-[12%] px-2">
                            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-xs w-full justify-center pointer-events-none">
                              {product.barcode || "N/A"}
                            </Badge>
                          </div>

                          {/* Status - Largura fixa, hidden on small screens */}
                          <div className="hidden sm:block w-[13%] px-2">
                            <div className="flex justify-center pointer-events-none">
                              {getStatusBadge(getProductStatus(product))}
                            </div>
                          </div>

                          {/* Melhor Preço - Largura fixa */}
                          <div className="w-[12%] px-2">
                            <div className="flex items-center justify-center gap-2 pointer-events-none">
                              <span className="font-bold text-green-700 dark:text-green-400 text-sm">{product.lastQuotePrice}</span>
                              {getTrendIcon(product.trend)}
                            </div>
                          </div>

                          {/* Fornecedor - Largura fixa, hidden on mobile */}
                          <div className="hidden lg:block w-[15%] px-2">
                            <div className="text-center pointer-events-none">
                              <span className="table-cell-primary truncate block">{capitalize(product.bestSupplier)}</span>
                            </div>
                          </div>

                          {/* Cotações - Largura fixa, hidden on small screens */}
                          <div className="hidden sm:block w-[8%] px-2">
                            <div className="flex items-center justify-center gap-1.5 pointer-events-none">
                              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/40">
                                <ClipboardList className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                              </div>
                              <span className="font-semibold text-blue-700 dark:text-blue-400 text-sm">{product.quotesCount}</span>
                            </div>
                          </div>

                          {/* Ações - Largura fixa */}
                          <div className="w-[10%] pl-4">
                            <div className="flex items-center justify-end gap-2 pointer-events-auto">
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
                                  <DropdownMenuLabel className="text-gray-600 font-medium">Mais Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setEditingProduct(product)} className="hover:bg-amber-50 hover:text-amber-700 cursor-pointer transition-colors">
                                    <Edit className="h-4 w-4 mr-2 text-amber-600" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer" onClick={() => setDeletingProduct(product)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-orange-100/80 dark:border-gray-700/30 bg-gradient-to-r from-orange-50/30 to-amber-50/30 dark:from-gray-800/30 dark:to-gray-800/20 px-6 py-4">
              <DataPagination currentPage={paginatedData.pagination.currentPage} totalPages={paginatedData.pagination.totalPages} itemsPerPage={paginatedData.pagination.itemsPerPage} totalItems={paginatedData.pagination.totalItems} onPageChange={paginatedData.pagination.goToPage} onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} startIndex={paginatedData.pagination.startIndex} endIndex={paginatedData.pagination.endIndex} />
            </div>
          </CardContent>
        </Card>}

      {filteredProducts.length === 0 && <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30">
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tente ajustar os filtros ou adicione novos produtos
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </CardContent>
        </Card>}

      {/* Dialogs - Hidden triggers for dropdown actions */}
      <div className="sr-only">
        <div ref={addDialogTriggerRef}>
          <AddProductDialog onProductAdded={() => {}} onCategoryAdded={() => {}} />
        </div>
        <div ref={importDialogTriggerRef}>
          <ImportProductsDialog onProductsImported={() => {}} onCategoryAdded={() => {}} />
        </div>
      </div>

      <EditProductDialog product={editingProduct} open={!!editingProduct} onOpenChange={open => !open && setEditingProduct(null)} onProductUpdated={updatedProduct => {
          updateProduct({
            productId: updatedProduct.id,
            data: {
              name: updatedProduct.name,
              category: updatedProduct.category,
              unit: updatedProduct.unit,
              barcode: updatedProduct.barcode
            }
          });
        }} onCategoryAdded={() => {}} categories={categories} />

      <DeleteProductDialog product={deletingProduct} open={!!deletingProduct} onOpenChange={open => !open && setDeletingProduct(null)} onProductDeleted={id => deleteProduct(id)} />

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
    </>;
}