import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AddProductDialog } from "@/components/forms/AddProductDialog";
import { EditProductDialog } from "@/components/forms/EditProductDialog";
import { DeleteProductDialog } from "@/components/forms/DeleteProductDialog";
import { ImportProductsDialog } from "@/components/forms/ImportProductsDialog";
import { ProductPriceHistoryDialog } from "@/components/forms/ProductPriceHistoryDialog";
import { useProducts, Product } from "@/hooks/useProducts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/layout/PageWrapper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Produtos = () => {
  const { products, categories, isLoading, deleteProduct } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [priceHistoryProduct, setPriceHistoryProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    console.info(`[FILTER DEBUG] Product: ${product.name} | Category: ${product.category} | Matches: ${matchesSearch && matchesCategory}`);
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="space-y-6 p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seu catálogo de produtos
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(true)}
            >
              Importar
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>
        </div>

        <Card className="p-4 bg-transparent">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "Todas" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card/95 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all"
              >
                <div className="flex-1">
                  <h3 className="font-semibold">{product.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{product.category}</Badge>
                    {product.quotesCount > 0 && (
                      <Badge variant="secondary">
                        {product.quotesCount} cotações
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPriceHistoryProduct(product)}
                  >
                    Histórico
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingProduct(product)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingProduct(product)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <AddProductDialog
          onProductAdded={() => {}}
        />

        <ImportProductsDialog
          onProductsImported={() => {}}
          onCategoryAdded={() => {}}
        />

        {editingProduct && (
          <EditProductDialog
            product={editingProduct}
            open={!!editingProduct}
            onOpenChange={(open) => !open && setEditingProduct(null)}
            onProductUpdated={() => {}}
            categories={categories}
          />
        )}

        {deletingProduct && (
          <DeleteProductDialog
            product={deletingProduct}
            open={!!deletingProduct}
            onOpenChange={(open) => !open && setDeletingProduct(null)}
            onProductDeleted={(id) => deleteProduct(id)}
          />
        )}

        {priceHistoryProduct && (
          <ProductPriceHistoryDialog
            productName={priceHistoryProduct.name}
            productId={priceHistoryProduct.id}
          />
        )}
      </div>
    </PageWrapper>
  );
};

export default Produtos;
