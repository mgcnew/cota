import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { useProducts } from "@/hooks/useProducts";
import { useDebounce } from "@/hooks/useDebounce";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  Search, 
  Plus, 
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  Scale
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddProductDialog } from "@/components/forms/AddProductDialog";
import { EditProductDialog } from "@/components/forms/EditProductDialog";
import { DeleteProductDialog } from "@/components/forms/DeleteProductDialog";
import { ImportProductsDialog } from "@/components/forms/ImportProductsDialog";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { ViewMode } from "@/types/pagination";
import type { Product } from "@/hooks/useProducts";

export default function Produtos() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { paginate } = usePagination<Product>({ initialItemsPerPage: 10 });
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // OPTIMIZED: Use React Query for data fetching with caching
  const { products, categories, isLoading: productsLoading, deleteProduct } = useProducts();

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

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-success" />;
    if (trend === "down") return <TrendingUp className="h-4 w-4 text-error rotate-180" />;
    return <span className="h-4 w-4 rounded-full bg-muted-foreground/50" />;
  };

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
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gerencie seu catálogo de produtos e acompanhe preços
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewToggle view={viewMode} onViewChange={setViewMode} />
          <ImportProductsDialog 
            onProductsImported={() => {}}
            onCategoryAdded={() => {}}
          />
          <AddProductDialog onProductAdded={() => {}} onCategoryAdded={() => {}} />
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1 max-w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category === "all" ? "Todos" : category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Total de Produtos</p>
                <p className="text-xl md:text-2xl font-bold">{products.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-info/20 hover:border-info/40 transition-all">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Categorias</p>
                <p className="text-xl md:text-2xl font-bold">{categories.length - 1}</p>
              </div>
              <div className="p-2 rounded-lg bg-info/10">
                <Filter className="h-5 w-5 md:h-6 md:w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-success/20 hover:border-success/40 transition-all">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Cotações Ativas</p>
                <p className="text-xl md:text-2xl font-bold">24</p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-warning/20 hover:border-warning/40 transition-all">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-muted-foreground">Valor Médio</p>
                <p className="text-xl md:text-2xl font-bold">R$ 14.52</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <Scale className="h-5 w-5 md:h-6 md:w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products View */}
      {viewMode === "grid" ? (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map((product) => (
            <Card key={product.id} className="card-elevated border-2 hover:border-primary/30 transition-all hover:shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{product.category}</Badge>
                      <Badge variant="secondary">{product.weight}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border z-50">
                      <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeletingProduct(product)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Melhor preço</p>
                    <p className="text-xl font-bold text-success">{product.lastQuotePrice}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {getTrendIcon(product.trend)}
                      <span className="text-sm text-muted-foreground">Tendência</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fornecedor:</span>
                    <span className="font-medium">{product.bestSupplier}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cotações:</span>
                    <span className="font-medium">{product.quotesCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Atualizado:</span>
                    <span className="font-medium">{product.lastUpdate}</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/cotacoes?produto=${encodeURIComponent(product.name)}`)}
                >
                  Ver Cotações
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="hidden md:table-cell">Peso</TableHead>
                    <TableHead>Melhor Preço</TableHead>
                    <TableHead className="hidden lg:table-cell">Fornecedor</TableHead>
                    <TableHead className="hidden sm:table-cell">Cotações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground md:hidden">{product.category}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary">{product.weight}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-success">{product.lastQuotePrice}</span>
                          {getTrendIcon(product.trend)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{product.bestSupplier}</TableCell>
                      <TableCell className="hidden sm:table-cell">{product.quotesCount}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/cotacoes?produto=${encodeURIComponent(product.name)}`)}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeletingProduct(product)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
          </CardContent>
        </Card>
      )}

      {filteredProducts.length === 0 && (
        <Card>
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
        </Card>
      )}

      {/* Edit Product Dialog */}
      <EditProductDialog
        product={editingProduct}
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        onProductUpdated={handleProductUpdated}
        onCategoryAdded={handleCategoryAdded}
        categories={categories}
      />

      {/* Delete Product Dialog */}
      <DeleteProductDialog
        product={deletingProduct}
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        onProductDeleted={handleProductDeleted}
      />
      </div>
    </>
  );
}