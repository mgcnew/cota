import { useState, useEffect, useMemo, useRef } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  ShoppingBasket,
  Search,
  Package,
  Check,
  Clock,
  Zap,
  ArrowUp,
  Minus,
  Plus,
  X,
  Trash2,
} from "lucide-react";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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
    bg: "bg-gray-100 dark:bg-gray-800",
  },
  medium: {
    label: "Média",
    icon: Minus,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
  },
  high: {
    label: "Alta",
    icon: ArrowUp,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30",
  },
  urgent: {
    label: "Urgente",
    icon: Zap,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
  },
};

interface SelectedItem {
  product: any;
  quantity: number;
}

export function AddProductToListDialog({ open, onOpenChange }: AddProductToListDialogProps) {
  const isMobile = useIsMobile();
  const { products } = useProducts();
  const { addItem } = useShoppingList();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  
  // Global settings for the batch
  const [priority, setPriority] = useState<Priority>("medium");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"select" | "configure">("select");

  // Debounce search
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset form
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setDebouncedSearch("");
      setSelectedItems([]);
      setPriority("medium");
      setNotes("");
      setStep("select");
    }
  }, [open]);

  // Filter products based on debounced search
  const filteredProducts = useMemo(() => {
    if (!debouncedSearch.trim()) return []; // Empty list initially
    const query = debouncedSearch.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          (p.category && p.category.toLowerCase().includes(query))
      )
      .slice(0, 50);
  }, [products, debouncedSearch]);

  const toggleProduct = (product: any) => {
    setSelectedItems((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        return prev.filter((item) => item.product.id !== product.id);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, value: number) => {
    // Ensure positive integer
    const newQty = Math.max(1, Math.floor(value));
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleNext = () => {
    if (selectedItems.length > 0) {
      setStep("configure");
    }
  };

  const handleBack = () => {
    setStep("select");
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;

    try {
      await Promise.all(
        selectedItems.map((item) =>
          addItem.mutateAsync({
            product_id: item.product.id,
            product_name: item.product.name,
            quantity: item.quantity,
            unit: item.product.unit || "un",
            priority,
            notes: notes.trim() || undefined,
            category: item.product.category || undefined,
          })
        )
      );

      toast({
        title: "Sucesso",
        description: `${selectedItems.length} itens adicionados à lista.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adicionar itens.",
        variant: "destructive",
      });
    }
  };

  const DialogTitleComponent = isMobile ? DrawerTitle : DialogTitle;
  const DialogDescriptionComponent = isMobile ? DrawerDescription : DialogDescription;

  // Shared content for Drawer and Dialog
  const renderHeader = () => (
    <div className="flex-shrink-0 px-5 py-4 border-b border-gray-200/60 dark:border-gray-700/40 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
            <ShoppingBasket className="h-5 w-5" />
          </div>
          <div>
            <DialogTitleComponent className="text-lg font-bold text-gray-900 dark:text-white">
              {step === "select" ? "Selecionar Produtos" : "Configurar Itens"}
            </DialogTitleComponent>
            <DialogDescriptionComponent className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {step === "select"
                ? "Busque e selecione os itens"
                : `Configurando ${selectedItems.length} itens`}
            </DialogDescriptionComponent>
          </div>
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      {step === "select" ? (
        <>
          <div className="p-4 bg-white/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 backdrop-blur-sm z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Digite para buscar produtos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-blue-500/20"
                autoFocus
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                </div>
              )}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {!debouncedSearch.trim() ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                  <Search className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Digite para buscar produtos</p>
                  <p className="text-xs opacity-60 mt-1">Busque por nome ou categoria</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                  <Package className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Nenhum produto encontrado</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isSelected = selectedItems.some((i) => i.product.id === product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                        isSelected
                          ? "bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                          : "bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm truncate", isSelected ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300")}>
                          {product.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{product.unit || "UN"}</span>
                          {product.category && (
                            <>
                              <span>•</span>
                              <span>{product.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
          
          {/* Selected Items Summary/Preview */}
          {selectedItems.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  {selectedItems.length} itens selecionados
                </span>
                <div className="flex -space-x-2">
                   {selectedItems.slice(0, 5).map((item, i) => (
                     <div 
                       key={item.product.id} 
                       className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 relative"
                       style={{ zIndex: 5 - i, marginLeft: i > 0 ? -8 : 0 }}
                     >
                       {item.product.name.charAt(0)}
                     </div>
                   ))}
                   {selectedItems.length > 5 && (
                     <div 
                       className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 relative"
                       style={{ zIndex: 0, marginLeft: -8 }}
                     >
                       +{selectedItems.length - 5}
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-6">
            {/* List of selected items */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Itens Selecionados</Label>
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.product.id} className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 transition-all hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{item.product.name}</p>
                        <span className="text-xs text-gray-400">{item.product.unit || "UN"}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 -mt-1 -mr-1"
                        onClick={() => toggleProduct(item.product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Quantity Control */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-md hover:bg-white dark:hover:bg-gray-800 shadow-sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input 
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                          className="flex-1 h-8 text-center border-none bg-transparent focus-visible:ring-0 font-bold p-0"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-md hover:bg-white dark:hover:bg-gray-800 shadow-sm"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-400 font-medium whitespace-nowrap px-2">
                        {item.product.unit || "un"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Settings */}
            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="space-y-3">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Prioridade (Geral)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(priorityConfig) as Priority[]).map((key) => {
                    const config = priorityConfig[key];
                    const Icon = config.icon;
                    const isSelected = priority === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setPriority(key)}
                        className={cn(
                          "flex flex-col items-center justify-center gap-2 p-2 rounded-lg border transition-all",
                          isSelected
                            ? cn(config.bg, "border-current ring-1 ring-current/20", config.color)
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Observações (Opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações para todos os itens..."
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm min-h-[80px]"
                />
              </div>
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );

  const renderFooter = () => (
    <div className="flex-shrink-0 p-4 border-t border-gray-200/60 dark:border-gray-700/40 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm flex gap-3">
      {step === "configure" && (
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex-1 h-11 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
        >
          Voltar
        </Button>
      )}
      {step === "select" ? (
        <div className="flex gap-3 w-full">
           <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleNext}
            disabled={selectedItems.length === 0}
            className="flex-[2] h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md disabled:opacity-50 disabled:shadow-none transition-all"
          >
            {selectedItems.length > 0 ? `Continuar (${selectedItems.length})` : "Selecione..."}
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleSubmit}
          disabled={addItem.isPending}
          className="flex-[2] h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20 transition-all"
        >
          {addItem.isPending ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Check className="w-5 h-5 mr-2" />
          )}
          Adicionar à Lista
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] flex flex-col rounded-t-[1.5rem] !bg-white/95 dark:!bg-gray-950/95 backdrop-blur-xl border-t border-white/20">
          <DrawerHeader className="p-0 border-b-0 text-left">
            {renderHeader()}
          </DrawerHeader>
          {renderContent()}
          {renderFooter()}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden !bg-white/95 dark:!bg-gray-950/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl rounded-2xl [&>button]:hidden flex flex-col max-h-[85vh] h-[600px]">
        <DialogHeader className="p-0 border-b-0 text-left">
          {renderHeader()}
        </DialogHeader>
        {renderContent()}
        {renderFooter()}
      </DialogContent>
    </Dialog>
  );
}
