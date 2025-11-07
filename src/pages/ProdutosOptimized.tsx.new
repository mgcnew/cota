import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProducts } from "@/hooks/useProducts";
import { useProductsMobile } from "@/hooks/mobile/useProductsMobile";
import { useDebounce } from "@/hooks/useDebounce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Search, Plus, Filter, MoreVertical, Edit, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CategorySelect } from "@/components/ui/category-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddProductDialog } from "@/components/forms/AddProductDialog";
import { EditProductDialog } from "@/components/forms/EditProductDialog";
import { DeleteProductDialog } from "@/components/forms/DeleteProductDialog";
import { ImportProductsDialog } from "@/components/forms/ImportProductsDialog";
import { ProductPriceHistoryDialog } from "@/components/forms/ProductPriceHistoryDialog";
import { DataPagination } from "@/components/ui/data-pagination";
import type { Product } from "@/hooks/useProducts";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useMobile } from "@/contexts/MobileProvider";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { MobileFAB } from "@/components/mobile/MobileFAB";

// FASE 2: Componente de card memoizado para evitar re-renders
const ProductCard = memo(({ 
  product, 
  onEdit, 
  onDelete, 
  onViewHistory,
  getStatusBadge,
  getTrendIcon 
}: any) => (
  <Card className="hover:shadow-md transition-shadow">
    <CardContent className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewHistory(product)}>
              Ver Histórico
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Categoria:</span>
          <Badge variant="outline">{product.category}</Badge>
        </div>
        {product.lastQuotePrice && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Último Preço:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">{product.lastQuotePrice}</span>
              {getTrendIcon(product.trend)}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
));
ProductCard.displayName = "ProductCard";

// FASE 2: Componente de estatísticas memoizado separado
const StatsCards = memo(({ stats }: any) => (
  <div className="grid grid-cols-2 gap-4 mb-6">
    <Card className="bg-orange-600 border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-white" />
          <CardTitle className="text-sm text-white">Produtos</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{stats.totalProducts}</div>
        <div className="text-xs text-white/80 mt-2">
          Com cotação: {stats.percentualComCotacao}%
        </div>
      </CardContent>
    </Card>

    <Card className="bg-blue-600 border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-white" />
          <CardTitle className="text-sm text-white">Categorias</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{stats.totalCategories}</div>
        {stats.topCategoria && (
          <div className="text-xs text-white/80 mt-2">
            Top: {stats.topCategoria.nome}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
));
StatsCards.displayName = "StatsCards";

export default function Produtos() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const isMobile = useMobile();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // Debounce mais agressivo no mobile
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);

  // FASE 1: Condicionalizar execução dos hooks - evitar carregar dados desnecessários
  const desktopProducts = useProducts();
  const mobileProducts = useProductsMobile(isMobile ? debouncedSearchQuery : undefined);

  // Selecionar dados baseado no dispositivo
  const {
    products,
    categories,
    isLoading,
    deleteProduct,
    updateProduct,
    invalidateCache,
  } = isMobile ? {
    products: mobileProducts.products,
    categories: [] as string[],
    isLoading: mobileProducts.isLoading,
    deleteProduct: (id: string) => mobileProducts.deleteProduct.mutate(id),
    updateProduct: (data: any) => mobileProducts.updateProduct.mutate(data),
    invalidateCache: mobileProducts.refetch,
  } : desktopProducts;

  useEffect(() => {
    if (!loading && !user) {
      setAuthDialogOpen(true);
    }
  }, [loading, user]);

  // FASE 3: Busca server-side no mobile, client-side no desktop
  const filteredProducts = useMemo(() => {
    if (isMobile) {
      // Mobile: busca server-side, apenas filtrar por categoria
      if (selectedCategory === 'all') return products;
      return products.filter(p => 
        p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    } else {
      // Desktop: filtro client-side completo
      if (!debouncedSearchQuery && selectedCategory === 'all') return products;
      
      return products.filter(p => {
        const matchesSearch = !debouncedSearchQuery || 
          p.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || 
          p.category.toLowerCase() === selectedCategory.toLowerCase();
        return matchesSearch && matchesCategory;
      });
    }
  }, [products, debouncedSearchQuery, selectedCategory, isMobile]);

  // FASE 1: Lazy load de estatísticas - simplificadas no mobile
  const stats = useMemo(() => {
    if (isMobile) {
      // Mobile: estatísticas simplificadas, sem cálculos pesados
      return {
        totalProducts: products.length,
        totalCategories: categories.length - 1,
        percentualComCotacao: 0,
        topCategoria: null,
      };
    }

    // Desktop: estatísticas completas
    const totalCategories = categories.length - 1;
    const produtosComCotacao = products.filter((p: any) => p.quotesCount > 0).length;
    const percentualComCotacao = products.length > 0 
      ? Math.round((produtosComCotacao / products.length) * 100) 
      : 0;

    const categoriaCount = new Map();
    products.forEach(p => {
      const cat = p.category || 'Sem Categoria';
      categoriaCount.set(cat, (categoriaCount.get(cat) || 0) + 1);
    });
    const topCategoria = Array.from(categoriaCount.entries())
      .sort((a, b) => b[1] - a[1])[0];

    return {
      totalProducts: products.length,
      totalCategories,
      percentualComCotacao,
      topCategoria: topCategoria ? { nome: topCategoria[0], count: topCategoria[1] } : null,
    };
  }, [products, categories, isMobile]);

  // FASE 2: Callbacks memoizados
  const getTrendIcon = useCallback((trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
    if (trend === "down") return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
    return <Minus className="h-3.5 w-3.5 text-gray-400" />;
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const config = {
      ativo: { label: "Ativo", className: "bg-green-100 text-green-700" },
      cotado: { label: "Cotado", className: "bg-blue-100 text-blue-700" },
      pendente: { label: "Pendente", className: "bg-amber-100 text-amber-700" },
      sem_cotacao: { label: "Sem Cotação", className: "bg-gray-100 text-gray-700" }
    };
    const cfg = config[status as keyof typeof config] || config.sem_cotacao;
    return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
  }, []);

  const handleEdit = useCallback((product: Product) => setEditingProduct(product), []);
  const handleDelete = useCallback((product: Product) => setDeletingProduct(product), []);
  const handleViewHistory = useCallback((product: Product) => setHistoryProduct(product), []);

  // Paginação - mobile usa paginação do hook
  const currentPage = isMobile && mobileProducts.pagination ? mobileProducts.pagination.currentPage : 1;
  const totalPages = isMobile && mobileProducts.pagination ? mobileProducts.pagination.totalPages : 1;
  const displayedProducts = isMobile ? filteredProducts : filteredProducts.slice(0, 50); // Desktop: limitar a 50 por página

  return (
    <PageWrapper>
      <div className="page-container">
        <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />

        {/* Pull to Refresh - Mobile */}
        {isMobile && <PullToRefresh onRefresh={async () => { await invalidateCache(); }} />}

        {/* Estatísticas - Simplificadas no mobile */}
        {!isMobile && <StatsCards stats={stats} />}

        {/* Busca e Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {!isMobile && (
            <>
              <CategorySelect
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                className="w-full sm:w-[200px]"
              />
              <AddProductDialog triggerRef={useRef()} />
              <ImportProductsDialog triggerRef={useRef()} />
            </>
          )}
        </div>

        {/* Lista de Produtos */}
        {isLoading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum produto encontrado
          </div>
        ) : isMobile ? (
          // FASE 5: Mobile - Cards simples sem animações
          <div className="grid grid-cols-1 gap-3 mb-20">
            {displayedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewHistory={handleViewHistory}
                getStatusBadge={getStatusBadge}
                getTrendIcon={getTrendIcon}
              />
            ))}
          </div>
        ) : (
          // Desktop - Tabela
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Último Preço</TableHead>
                <TableHead>Tendência</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProducts.map(product => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>{product.lastQuotePrice || "N/A"}</TableCell>
                  <TableCell>{getTrendIcon(product.trend)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(product)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewHistory(product)}>
                          Ver Histórico
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(product)}>
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Paginação Mobile */}
        {isMobile && mobileProducts.pagination && (
          <div className="flex justify-center gap-2 mt-4 mb-20">
            <Button
              variant="outline"
              size="sm"
              onClick={() => mobileProducts.pagination.prevPage()}
              disabled={!mobileProducts.pagination.hasPrevPage}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mobileProducts.pagination.nextPage()}
              disabled={!mobileProducts.pagination.hasNextPage}
            >
              Próximo
            </Button>
          </div>
        )}

        {/* Mobile FAB */}
        {isMobile && <MobileFAB onClick={() => {}} label="Novo Produto" />}

        {/* Dialogs */}
        {editingProduct && (
          <EditProductDialog
            product={editingProduct}
            open={!!editingProduct}
            onOpenChange={(open) => !open && setEditingProduct(null)}
          />
        )}
        {deletingProduct && (
          <DeleteProductDialog
            product={deletingProduct}
            open={!!deletingProduct}
            onOpenChange={(open) => !open && setDeletingProduct(null)}
          />
        )}
        {historyProduct && (
          <ProductPriceHistoryDialog
            productId={historyProduct.id}
            open={!!historyProduct}
            onOpenChange={(open) => !open && setHistoryProduct(null)}
          />
        )}
      </div>
    </PageWrapper>
  );
}
