import { useState, useEffect, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  ShoppingBasket,
  Search,
  Package,
  Check,
  AlertCircle,
  Clock,
  Zap,
  ArrowUp,
  Minus,
  Plus,
} from "lucide-react";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";

interface AddProductToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Priority = "low" | "medium" | "high" | "urgent";

const priorityConfig: Record<Priority, { label: string; icon: any; color: string; bg: string }> = {
  low: {
    label: "Baixa",
    icon: Clock,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600",
  },
  medium: {
    label: "Média",
    icon: Minus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-300 dark:border-blue-700",
  },
  high: {
    label: "Alta",
    icon: ArrowUp,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 border-orange-300 dark:border-orange-700",
  },
  urgent: {
    label: "Urgente",
    icon: Zap,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-300 dark:border-red-700",
  },
};

export function AddProductToListDialog({ open, onOpenChange }: AddProductToListDialogProps) {
  const isMobile = useIsMobile();
  const { products } = useProducts();
  const { addItem } = useShoppingList();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [priority, setPriority] = useState<Priority>("medium");
  const [estimatedPrice, setEstimatedPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"select" | "details">("select");

  // Reset form
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSelectedProduct(null);
      setQuantity(1);
      setPriority("medium");
      setEstimatedPrice("");
      setNotes("");
      setStep("select");
    }
  }, [open]);

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.category && p.category.toLowerCase().includes(query))
      )
      .slice(0, 50);
  }, [products, searchQuery]);

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setStep("details");
  };

  const handleBack = () => {
    setStep("select");
  };

  const handleSubmit = async () => {
    if (!selectedProduct || quantity <= 0) return;

    await addItem.mutateAsync({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity,
      unit: selectedProduct.unit || "un",
      priority,
      notes: notes.trim() || undefined,
      estimated_price: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
      category: selectedProduct.category || undefined,
    });

    onOpenChange(false);
  };

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => setQuantity((q) => Math.max(0.5, q - 1));


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <ShoppingBasket className="w-6 h-6" />
            </div>
            <div>
              <DialogHeader className="p-0 space-y-1">
                <DialogTitle className="text-xl font-bold text-white">
                  {step === "select" ? "Adicionar à Lista" : "Detalhes do Item"}
                </DialogTitle>
                <DialogDescription className="text-blue-100">
                  {step === "select"
                    ? "Selecione um produto para adicionar"
                    : selectedProduct?.name}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex gap-2 mt-4">
            <div
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                step === "select" ? "bg-white" : "bg-white/40"
              )}
            />
            <div
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                step === "details" ? "bg-white" : "bg-white/40"
              )}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-0">
          {step === "select" ? (
            <div className="flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar produto por nome ou categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              {/* Product List */}
              <ScrollArea className="h-[300px]">
                <div className="p-2">
                  {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 font-medium">
                        Nenhum produto encontrado
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Tente buscar por outro termo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSelectProduct(product)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {product.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {product.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {product.category}
                                </Badge>
                              )}
                              {product.unit && (
                                <span className="text-xs text-gray-400">
                                  {product.unit}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Quantity */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quantidade</Label>
                <div className="flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decrementQuantity}
                    className="h-12 w-12 rounded-xl"
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 max-w-[120px]">
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                      min="0.01"
                      step="0.5"
                      className="text-center text-2xl font-bold h-14"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={incrementQuantity}
                    className="h-12 w-12 rounded-xl"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-center text-sm text-gray-500">
                  {selectedProduct?.unit || "unidades"}
                </p>
              </div>

              {/* Priority */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Prioridade</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(priorityConfig) as Priority[]).map((key) => {
                    const config = priorityConfig[key];
                    const Icon = config.icon;
                    const isSelected = priority === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPriority(key)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                          isSelected
                            ? cn(config.bg, "border-current ring-2 ring-offset-2", config.color)
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        <Icon className={cn("w-5 h-5", isSelected ? config.color : "text-gray-400")} />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isSelected ? config.color : "text-gray-500"
                          )}
                        >
                          {config.label}
                        </span>
                        {isSelected && (
                          <Check className={cn("w-3 h-3", config.color)} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated Price */}
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Preço Estimado (opcional)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    R$
                  </span>
                  <Input
                    id="price"
                    type="number"
                    value={estimatedPrice}
                    onChange={(e) => setEstimatedPrice(e.target.value)}
                    placeholder="0,00"
                    min="0"
                    step="0.01"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Observações (opcional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Preferência por marca X, verificar validade..."
                  rows={2}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-gray-400 text-right">{notes.length}/500</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
          {step === "details" && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Voltar
            </Button>
          )}
          {step === "select" ? (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!selectedProduct || quantity <= 0 || addItem.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {addItem.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Adicionar à Lista
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
