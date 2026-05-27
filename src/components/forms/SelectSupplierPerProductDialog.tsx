import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Award, AlertCircle, X, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SupplierOption {
  supplierId: string;
  supplierName: string;
  price: number;
  isBest: boolean;
}

interface ProductSelection {
  productId: string;
  productName: string;
  quantity: string;
  unit: string;
  selectedSupplierId: string;
  selectedSupplierName: string;
  supplierOptions: SupplierOption[];
  isActuallyIncluded?: boolean;
}

interface SelectSupplierPerProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: ProductSelection[];
  onConfirm: (selections: Map<string, { supplierId: string; supplierName: string }>) => void;
}

export function SelectSupplierPerProductDialog({
  open,
  onOpenChange,
  products,
  onConfirm,
}: SelectSupplierPerProductDialogProps) {
  const isMobile = useIsMobile();

  const [selections, setSelections] = useState<Map<string, { supplierId: string; supplierName: string }>>(
    new Map(products.map(p => [p.productId, { supplierId: p.selectedSupplierId, supplierName: p.selectedSupplierName }]))
  );

  const [includedItems, setIncludedItems] = useState<Set<string>>(
    new Set(products.filter(p => p.isActuallyIncluded).map(p => p.productId))
  );

  const toggleInclude = (productId: string) => {
    const newIncluded = new Set(includedItems);
    if (newIncluded.has(productId)) {
      newIncluded.delete(productId);
    } else {
      newIncluded.add(productId);
      const selection = selections.get(productId);
      if (!selection || !selection.supplierId) {
        const product = products.find(p => p.productId === productId);
        if (product && product.supplierOptions.length > 0) {
          const best = product.supplierOptions.find(s => s.isBest) || product.supplierOptions[0];
          const newSelections = new Map(selections);
          newSelections.set(productId, { supplierId: best.supplierId, supplierName: best.supplierName });
          setSelections(newSelections);
        }
      }
    }
    setIncludedItems(newIncluded);
  };

  const handleSelectionChange = (productId: string, supplierId: string) => {
    const product = products.find(p => p.productId === productId);
    const supplier = product?.supplierOptions.find(s => s.supplierId === supplierId);
    if (supplier) {
      const newSelections = new Map(selections);
      newSelections.set(productId, { supplierId: supplier.supplierId, supplierName: supplier.supplierName });
      setSelections(newSelections);
    }
  };

  const calculateTotal = () => products.reduce((total, product) => {
    if (!includedItems.has(product.productId)) return total;
    const selection = selections.get(product.productId);
    const supplier = product.supplierOptions.find(s => s.supplierId === selection?.supplierId);
    return total + (supplier?.price || 0);
  }, 0);

  const calculateBestTotal = () => products.reduce((total, product) => {
    if (!includedItems.has(product.productId)) return total;
    const bestSupplier = product.supplierOptions.find(s => s.isBest);
    return total + (bestSupplier?.price || 0);
  }, 0);

  const hasNonOptimalSelection = () => products.some(product => {
    if (!includedItems.has(product.productId)) return false;
    const selection = selections.get(product.productId);
    const selectedSupplier = product.supplierOptions.find(s => s.supplierId === selection?.supplierId);
    return selectedSupplier && !selectedSupplier.isBest && selectedSupplier.price > 0;
  });

  const getSupplierGroups = () => {
    const groups = new Map<string, string[]>();
    selections.forEach((selection, productId) => {
      if (!includedItems.has(productId)) return;
      const product = products.find(p => p.productId === productId);
      if (product) {
        if (!groups.has(selection.supplierId)) groups.set(selection.supplierId, []);
        groups.get(selection.supplierId)!.push(product.productName);
      }
    });
    return groups;
  };

  const handleConfirm = () => {
    const finalSelections = new Map<string, { supplierId: string; supplierName: string }>();
    includedItems.forEach(productId => {
      const selection = selections.get(productId);
      if (selection && selection.supplierId) finalSelections.set(productId, selection);
    });
    onConfirm(finalSelections);
  };

  const total = calculateTotal();
  const bestTotal = calculateBestTotal();
  const supplierGroups = getSupplierGroups();
  const canConfirm = includedItems.size > 0 && !Array.from(includedItems).some(id => !selections.get(id)?.supplierId);

  const modalContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border dark:border-white/5 bg-card flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white flex-shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-foreground truncate">Selecionar Fornecedor por Produto</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg flex-shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {hasNonOptimalSelection() && (
          <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
              <strong>Atenção:</strong> Economia perdida:{" "}
              <span className="font-bold">R$ {(total - bestTotal).toFixed(2)}</span>
            </AlertDescription>
          </Alert>
        )}

        {/* Mobile: card list; Desktop: table */}
        {isMobile ? (
          <div className="space-y-2">
            {products.map((product) => {
              const selection = selections.get(product.productId);
              const selectedSupplier = product.supplierOptions.find(s => s.supplierId === selection?.supplierId);
              const isIncluded = includedItems.has(product.productId);
              return (
                <div key={product.productId}
                  className={cn(
                    "border rounded-xl p-3 space-y-2.5 transition-colors",
                    isIncluded ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"
                  )}>
                  <div className="flex items-start gap-2.5">
                    <Checkbox checked={isIncluded} onCheckedChange={() => toggleInclude(product.productId)}
                      className="h-4 w-4 mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{product.productName}</p>
                      <p className="text-[10px] text-muted-foreground">{product.quantity} {product.unit}</p>
                    </div>
                    {selectedSupplier && (
                      <span className={cn(
                        "text-xs font-black tabular-nums flex-shrink-0",
                        selectedSupplier.isBest ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                      )}>
                        R$ {selectedSupplier.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {isIncluded && (
                    <div className="flex items-center gap-2">
                      <Combobox
                        options={product.supplierOptions.map(s => ({
                          value: s.supplierId,
                          label: s.price > 0
                            ? `${s.supplierName} - R$ ${s.price.toFixed(2)}${s.isBest ? ' ⭐' : ''}`
                            : `${s.supplierName} - (Sem preço)`
                        }))}
                        value={selection?.supplierId || ''}
                        onValueChange={(value) => handleSelectionChange(product.productId, value)}
                        placeholder="Selecione o fornecedor"
                        className="flex-1 text-xs"
                      />
                      {selectedSupplier?.isBest && (
                        <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] flex-shrink-0 px-1.5 py-0.5">
                          <Award className="h-2.5 w-2.5 mr-0.5" />Melhor
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-border dark:border-white/5 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b border-border">
                    <TableHead className="px-2 py-1.5 text-[10px] font-semibold w-10">Inc.</TableHead>
                    <TableHead className="px-2 py-1.5 text-[10px] font-semibold min-w-[140px]">Produto</TableHead>
                    <TableHead className="px-2 py-1.5 text-[10px] font-semibold min-w-[70px]">Qtd</TableHead>
                    <TableHead className="px-2 py-1.5 text-[10px] font-semibold min-w-[260px]">Fornecedor</TableHead>
                    <TableHead className="px-2 py-1.5 text-right text-[10px] font-semibold min-w-[100px]">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border dark:divide-white/5">
                  {products.map((product) => {
                    const selection = selections.get(product.productId);
                    const selectedSupplier = product.supplierOptions.find(s => s.supplierId === selection?.supplierId);
                    const isIncluded = includedItems.has(product.productId);
                    return (
                      <TableRow key={product.productId}
                        className={cn("transition-colors", !isIncluded && "opacity-60 bg-muted/20")}>
                        <TableCell className="px-2 py-2">
                          <Checkbox checked={isIncluded} onCheckedChange={() => toggleInclude(product.productId)}
                            className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <p className={cn("font-bold text-xs truncate", isIncluded ? "text-foreground" : "text-muted-foreground")}>{product.productName}</p>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <span className="text-[10px] text-muted-foreground">{product.quantity} {product.unit}</span>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div className="flex items-center gap-1.5">
                            <Combobox disabled={!isIncluded}
                              options={product.supplierOptions.map(s => ({
                                value: s.supplierId,
                                label: s.price > 0 ? `${s.supplierName} - R$ ${s.price.toFixed(2)}${s.isBest ? ' ⭐' : ''}` : `${s.supplierName} - (Sem preço)`
                              }))}
                              value={selection?.supplierId || ''}
                              onValueChange={(value) => handleSelectionChange(product.productId, value)}
                              placeholder="Selecione"
                              className={cn("w-full min-w-[180px] text-xs", !selection?.supplierId && isIncluded && "border-red-300 dark:border-red-900")}
                            />
                            {selectedSupplier?.isBest && (
                              <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 text-[10px] whitespace-nowrap flex-shrink-0 px-1.5 py-0.5">
                                <Award className="h-2.5 w-2.5 mr-0.5" />Melhor
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-right">
                          <span className={cn("font-bold text-xs", selectedSupplier?.isBest ? "text-emerald-600 dark:text-emerald-400" : "text-foreground", !isIncluded && "text-muted-foreground")}>
                            {selectedSupplier ? `R$ ${selectedSupplier.price.toFixed(2)}` : '---'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {supplierGroups.size > 1 && (
          <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-200 text-xs">
              <strong>Múltiplos fornecedores:</strong> {supplierGroups.size} selecionados
              {Array.from(supplierGroups.entries()).map(([supplierId, productNames]) => {
                const supplier = products.find(p => p.supplierOptions.some(s => s.supplierId === supplierId))
                  ?.supplierOptions.find(s => s.supplierId === supplierId);
                return (
                  <div key={supplierId} className="mt-0.5 text-[10px]">
                    • <strong>{supplier?.supplierName}:</strong> {productNames.length} produto(s)
                  </div>
                );
              })}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-border dark:border-white/5 bg-muted/20">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-muted-foreground">Total do Pedido:</span>
          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">R$ {total.toFixed(2)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-10 font-bold text-xs">
            Cancelar
          </Button>
          <Button disabled={!canConfirm} onClick={handleConfirm}
            className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirmar e Continuar
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[92vh] rounded-t-2xl p-0 overflow-hidden flex flex-col bg-background border-t border-border dark:border-white/5">
          <DrawerTitle className="sr-only">Selecionar Fornecedor por Produto</DrawerTitle>
          <DrawerDescription className="sr-only">Escolha o fornecedor para cada produto</DrawerDescription>
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-5xl h-[90vh] sm:h-[85vh] p-0 flex flex-col bg-background border border-border dark:border-white/5 rounded-xl [&>button]:hidden">
        <DialogTitle className="sr-only">Selecionar Fornecedor por Produto</DialogTitle>
        <DialogDescription className="sr-only">Escolha o fornecedor para cada produto</DialogDescription>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
