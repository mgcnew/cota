import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShoppingCart } from "lucide-react";
import { useMobile } from "@/contexts/MobileProvider";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useShoppingListMobile } from "@/hooks/mobile/useShoppingListMobile";
import { useProducts } from "@/hooks/useProducts";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddProductToListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddProductToListDialog({ open, onOpenChange }: AddProductToListDialogProps) {
  const isMobile = useMobile();
  const { products } = useProducts();
  const { addItem: desktopAdd } = useShoppingList();
  const { addItem: mobileAdd } = useShoppingListMobile();
  
  const addItem = isMobile ? mobileAdd : desktopAdd;
  
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [notes, setNotes] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [openCombobox, setOpenCombobox] = useState(false);

  // Reset form quando fechar
  useEffect(() => {
    if (!open) {
      setSelectedProduct(null);
      setQuantity(1);
      setPriority("medium");
      setNotes("");
      setEstimatedPrice(0);
      setProductSearch("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedProduct) return;

    await addItem.mutateAsync({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity,
      unit: selectedProduct.unit || "un",
      priority,
      notes: notes.trim() || undefined,
      estimated_price: estimatedPrice > 0 ? estimatedPrice : undefined,
      category: selectedProduct.category || undefined,
    });

    onOpenChange(false);
  };

  const FormContent = () => (
    <div className="space-y-4">
      {/* Seleção de Produto */}
      <div className="space-y-2">
        <Label>Produto *</Label>
        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCombobox}
              className="w-full justify-between"
            >
              {selectedProduct ? selectedProduct.name : "Selecione um produto..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar produto..." value={productSearch} onValueChange={setProductSearch} />
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {products
                    .filter(p => 
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
                    )
                    .slice(0, 50)
                    .map((product) => (
                      <CommandItem
                        key={product.id}
                        value={product.name}
                        onSelect={() => {
                          setSelectedProduct(product);
                          setOpenCombobox(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          {product.category && (
                            <div className="text-xs text-muted-foreground">{product.category}</div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Quantidade */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade *</Label>
        <Input
          id="quantity"
          type="number"
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          placeholder="Ex: 10"
        />
      </div>

      {/* Prioridade */}
      <div className="space-y-2">
        <Label htmlFor="priority">Prioridade</Label>
        <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
          <SelectTrigger id="priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Preço Estimado */}
      <div className="space-y-2">
        <Label htmlFor="estimated_price">Preço Estimado (opcional)</Label>
        <Input
          id="estimated_price"
          type="number"
          min="0"
          step="0.01"
          value={estimatedPrice}
          onChange={(e) => setEstimatedPrice(Number(e.target.value))}
          placeholder="R$ 0,00"
        />
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Adicione observações sobre este produto..."
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">
          {notes.length}/500 caracteres
        </p>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] max-h-[90vh] p-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Adicionar Produto à Lista</SheetTitle>
          </SheetHeader>
          
          <div className="flex-shrink-0 px-4 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-bold">Adicionar Produto</div>
                <div className="text-xs text-muted-foreground">Adicione à lista de compras</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <FormContent />
          </div>
          
          <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedProduct || quantity <= 0 || addItem.isPending}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {addItem.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Produto à Lista</DialogTitle>
        </DialogHeader>
        <FormContent />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedProduct || quantity <= 0 || addItem.isPending}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {addItem.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              "Adicionar à Lista"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
