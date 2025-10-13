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
import { Package, Search, Plus, Filter, MoreVertical, Edit, Trash2, TrendingUp, Scale, FileUp, Quote, Building2, Clock } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddProductDialog } from "@/components/forms/AddProductDialog";
import { EditProductDialog } from "@/components/forms/EditProductDialog";
import { DeleteProductDialog } from "@/components/forms/DeleteProductDialog";
import { ImportProductsDialog } from "@/components/forms/ImportProductsDialog";
import { ProductPriceHistoryDialog } from "@/components/forms/ProductPriceHistoryDialog";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { ViewMode } from "@/types/pagination";
import type { Product } from "@/hooks/useProducts";
import { PageWrapper, PageSection } from "@/components/layout/PageWrapper";

export default function Produtos() {
  const navigate = useNavigate();
  const {
    user,
    loading
  } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { viewMode, setViewMode } = useResponsiveViewMode();
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
    deleteProduct
  } = useProducts();
  useEffect(() => {
    if (!loading && !user) {
      setAuthDialogOpen(true);
    }
  }, [loading, user]);

  // OPTIMIZED: Memoize filtered products to avoid unnecessary recalculations
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearchQuery, selectedCategory]);
  const paginatedData = paginate(filteredProducts);

  // Cálculos de métricas reais
  const stats = useMemo(() => {
    const totalCategories = categories.length - 1; // -1 para remover "all"
    const activeQuotes = products.reduce((sum, p) => sum + p.quotesCount, 0);
    const productsWithPrices = products.filter(p => p.lastQuotePrice !== "R$ 0,00");
    let averageValue = "R$ 0,00";
    if (productsWithPrices.length > 0) {
      const total = productsWithPrices.reduce((sum, p) => {
        const price = parseFloat(p.lastQuotePrice.replace(/[^\d,]/g, '').replace(',', '.'));
        return sum + (isNaN(price) ? 0 : price);
      }, 0);
      averageValue = `R$ ${(total / productsWithPrices.length).toFixed(2)}`;
    }
    return {
      totalProducts: products.length,
      totalCategories,
      activeQuotes,
      averageValue
    };
  }, [products, categories]);
  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === "down") return <TrendingUp className="h-4 w-4 text-error rotate-180" />;
    return <span className="h-4 w-4 rounded-full bg-muted-foreground/50" />;
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
    
    return (
      <Badge variant="outline" className={`text-xs font-medium ${config.className}`}>
        {config.label}
      </Badge>
    );
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
      {/* Header Produtos com Tema Laranja */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-3xl bg-gradient-to-r from-orange-900 to-amber-700 bg-clip-text text-transparent">
                    Produtos
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200 shadow-sm">
                      <Scale className="h-3 w-3" />
                      Catálogo de Produtos
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Gerencie seu catálogo e acompanhe preços</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 bg-white/40 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Package className="h-4 w-4 text-amber-500" />
                <span>{filteredProducts.length} produtos cadastrados</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0">
                  <Plus className="h-4 w-4 mr-2" />
                  Ações
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border z-50 w-48">
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input placeholder="Buscar produtos..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-background border z-50">
                {categories.map(category => <SelectItem key={category} value={category}>
                    {category === "all" ? "Todas as categorias" : category}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards Melhorados */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500 bg-gradient-to-br from-orange-50/50 to-amber-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 relative">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Total de Produtos</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
              </div>
              <div className="flex items-center gap-1 text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+{Math.floor(stats.totalProducts * 0.1)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
              </div>
              <span className="text-xs text-gray-500">85%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 relative">
                    <Filter className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Categorias</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalCategories}</div>
              </div>
              <div className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+2</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {Math.floor(stats.totalCategories * 0.7)} ativas • {Math.floor(stats.totalCategories * 0.3)} com poucos produtos
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 bg-gradient-to-br from-green-50/50 to-emerald-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 relative">
                    <Quote className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Cotações Ativas</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.activeQuotes}</div>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+15%</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {Math.floor(stats.activeQuotes * 0.6)} aguardando • {Math.floor(stats.activeQuotes * 0.4)} em análise
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50/50 to-pink-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 relative">
                    <Scale className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Valor Médio</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.averageValue}</div>
              </div>
              <div className="flex items-center gap-1 text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs font-medium">+8%</span>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Baseado em {products.filter(p => p.lastQuotePrice !== "R$ 0,00").length} produtos com preços
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products View */}
      {viewMode === "grid" ? <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map(product => <Card key={product.id} className="group hover:shadow-xl transition-all duration-300 border border-gray-200/60 hover:border-orange-300/60 bg-gradient-to-br from-white to-orange-50/30 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 group-hover:from-orange-500/20 group-hover:to-amber-500/20 transition-all duration-300">
                        <Package className="h-5 w-5 text-orange-600 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-orange-700 transition-colors duration-300 truncate">
                          {product.name}
                        </CardTitle>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-orange-50/80 border-orange-200/60 text-orange-700 font-medium">
                        {product.category}
                      </Badge>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium">
                        {product.weight}
                      </Badge>
                      {getStatusBadge(getProductStatus(product))}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-orange-100 hover:text-orange-700 border border-transparent hover:border-orange-200 shadow-sm hover:shadow-md"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border z-50 w-56 shadow-lg">
                      <DropdownMenuLabel className="text-gray-600 font-medium">Ações do Produto</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <ProductPriceHistoryDialog
                        productName={product.name}
                        productId={product.id}
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer">
                            <Quote className="h-4 w-4 mr-2 text-blue-600" />
                            Ver Histórico de Preços
                          </DropdownMenuItem>
                        }
                      />
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setEditingProduct(product)}
                        className="hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <Edit className="h-4 w-4 mr-2 text-amber-600" />
                        Editar Produto
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer" 
                        onClick={() => setDeletingProduct(product)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Produto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-green-50/80 to-emerald-50/80 border border-green-200/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-1">Melhor Preço</p>
                      <p className="text-2xl font-bold text-green-800">{product.lastQuotePrice}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        {getTrendIcon(product.trend)}
                        <span className="text-sm font-medium text-green-600">Tendência</span>
                      </div>
                      <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Atualizado
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50/80 border border-gray-200/60">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">Fornecedor</span>
                    </div>
                    <span className="font-semibold text-gray-900 truncate max-w-[120px]">{product.bestSupplier}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200/60 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Quote className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">Cotações</span>
                      </div>
                      <span className="text-lg font-bold text-blue-800">{product.quotesCount}</span>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-purple-50/80 border border-purple-200/60 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-medium text-purple-600">Atualizado</span>
                      </div>
                      <span className="text-xs font-semibold text-purple-800">{product.lastUpdate}</span>
                    </div>
                  </div>
                </div>

                <ProductPriceHistoryDialog
                  productName={product.name}
                  productId={product.id}
                  trigger={
                    <Button 
                      variant="outline" 
                      className="w-full bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 hover:from-orange-100 hover:to-amber-100 hover:border-orange-300 text-orange-700 hover:text-orange-800 transition-all duration-300"
                    >
                      <Quote className="h-4 w-4 mr-2" />
                      Ver Histórico de Preços
                    </Button>
                  }
                />
              </CardContent>
            </Card>)}
        </div> : <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50/20">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                  <TableRow className="border-b-2 border-gray-100">
                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-xs">Produto</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-gray-700 py-4 px-4 text-xs">Categoria</TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-gray-700 py-4 px-4 text-xs">Peso</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold text-gray-700 py-4 px-4 text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 py-4 px-4 text-xs">Melhor Preço</TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-gray-700 py-4 px-4 text-xs">Fornecedor</TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold text-gray-700 py-4 px-4 text-xs">Cotações</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700 py-4 px-4 text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map(product => <TableRow key={product.id} className="hover:bg-gray-50/50 transition-all duration-200 hover:border hover:border-gray-300 mb-6 mx-2 hover:rounded-xl group hover:shadow-xl bg-white">
                      <TableCell className="py-4 px-4 rounded-l-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                            <Package className="h-3 w-3 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-xs">{product.name}</div>
                            <div className="text-xs text-gray-500 md:hidden mt-1">{product.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-4 px-4">
                        <Badge variant="outline" className="bg-orange-50/80 border-orange-200/60 text-orange-700 font-medium text-xs group-hover:bg-orange-100/80 transition-colors">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-4 px-4">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-medium text-xs group-hover:bg-gray-200 transition-colors">{product.weight}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-4 px-4">
                        {getStatusBadge(getProductStatus(product))}
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-700 text-xs">{product.lastQuotePrice}</span>
                          {getTrendIcon(product.trend)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-4 px-4">
                        <span className="text-gray-700 font-medium text-xs">{product.bestSupplier}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-4 px-4">
                        <div className="flex items-center gap-1">
                          <Quote className="h-3 w-3 text-blue-600" />
                          <span className="font-semibold text-blue-700 text-xs">{product.quotesCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 rounded-r-xl">
                        <div className="flex justify-end gap-2">
                          {/* Botão principal - Ver Histórico */}
                          <ProductPriceHistoryDialog
                            productName={product.name}
                            productId={product.id}
                            trigger={
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 p-0 h-8 w-8 rounded-full border border-gray-200 hover:border-orange-300 group flex items-center justify-center"
                              >
                                <Clock className="h-3.5 w-3.5 group-hover:animate-pulse" />
                              </Button>
                            }
                          />
                          
                          {/* Menu de ações secundárias */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-50/50 transition-colors duration-200 px-2 py-1 h-7"
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-background border z-50 w-48 shadow-lg">
                              <DropdownMenuLabel className="text-gray-600 font-medium">Mais Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setEditingProduct(product)}
                                className="hover:bg-amber-50 hover:text-amber-700 transition-colors cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2 text-amber-600" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer" 
                                onClick={() => setDeletingProduct(product)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-orange-100/80 bg-gradient-to-r from-orange-50/30 to-amber-50/30 px-6 py-4">
              <DataPagination 
                currentPage={paginatedData.pagination.currentPage} 
                totalPages={paginatedData.pagination.totalPages} 
                itemsPerPage={paginatedData.pagination.itemsPerPage} 
                totalItems={paginatedData.pagination.totalItems} 
                onPageChange={paginatedData.pagination.goToPage} 
                onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} 
                startIndex={paginatedData.pagination.startIndex} 
                endIndex={paginatedData.pagination.endIndex} 
              />
            </div>
          </CardContent>
        </Card>}

      {filteredProducts.length === 0 && <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground mb-4">
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

      <EditProductDialog product={editingProduct} open={!!editingProduct} onOpenChange={open => !open && setEditingProduct(null)} onProductUpdated={() => {}} onCategoryAdded={() => {}} categories={categories} />

      <DeleteProductDialog product={deletingProduct} open={!!deletingProduct} onOpenChange={open => !open && setDeletingProduct(null)} onProductDeleted={() => {}} />
        </div>
      </PageWrapper>
    </>;
}