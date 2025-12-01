import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ShoppingCart } from "lucide-react";
import { useShoppingList } from "@/hooks/useShoppingList";
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
  const isMobile = false; // Removida dependência mobile
  const { products } = useProducts();
  const { addItem } = useShoppingList();

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [notesLength, setNotesLength] = useState(0);

  // Refs para inputs não controlados
  const quantityRef = useRef<HTMLInputElement>(null);
  const estimatedPriceRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Reset form quando fechar
  useEffect(() => {
    if (!open) {
      setSelectedProduct(null);
      setPriority("medium");
      setOpenCombobox(false);
      // Resetar valores dos inputs
      if (quantityRef.current) quantityRef.current.value = "1";
      if (estimatedPriceRef.current) estimatedPriceRef.current.value = "";
      if (notesRef.current) notesRef.current.value = "";
      setNotesLength(0);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedProduct) return;

    const quantityValue = quantityRef.current?.value || "1";
    const estimatedPriceValue = estimatedPriceRef.current?.value || "";
    const notesValue = notesRef.current?.value || "";

    const quantityNum = parseFloat(quantityValue) || 0;
    const estimatedPriceNum = parseFloat(estimatedPriceValue) || 0;

    if (quantityNum <= 0) return;

    await addItem.mutateAsync({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      quantity: quantityNum,
      unit: selectedProduct.unit || "un",
      priority,
      notes: notesValue.trim() || undefined,
      estimated_price: estimatedPriceNum > 0 ? estimatedPriceNum : undefined,
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
            <Command shouldFilter={true}>
              <CommandInput placeholder="Buscar produto..." />
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {products
                    .slice(0, 50)
                    .map((product) => (
                      <CommandItem
                        key={product.id}
                        value={`${product.name} ${product.category || ''}`}
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
          ref={quantityRef}
          type="number"
          min="0.01"
          step="0.01"
          defaultValue="1"
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
          ref={estimatedPriceRef}
          type="number"
          min="0"
          step="0.01"
          defaultValue=""
          placeholder="R$ 0,00"
        />
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea
          id="notes"
          ref={notesRef}
          defaultValue=""
          placeholder="Adicione observações sobre este produto..."
          rows={3}
          maxLength={500}
          onChange={(e) => setNotesLength(e.target.value.length)}
        />
        <p className="text-xs text-muted-foreground">
          {notesLength}/500 caracteres
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
              disabled={!selectedProduct || !quantityRef.current?.value || parseFloat(quantityRef.current?.value || "0") <= 0 || addItem.isPending}
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
            disabled={!selectedProduct || !quantityRef.current?.value || parseFloat(quantityRef.current?.value || "0") <= 0 || addItem.isPending}
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
