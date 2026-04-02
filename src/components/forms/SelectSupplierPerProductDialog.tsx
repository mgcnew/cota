import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Award, AlertCircle, X, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
      
      // Se estamos incluindo e não tem fornecedor selecionado, tenta o melhor ou o primeiro
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

  const calculateTotal = () => {
    return products.reduce((total, product) => {
      if (!includedItems.has(product.productId)) return total;
      const selection = selections.get(product.productId);
      const supplier = product.supplierOptions.find(s => s.supplierId === selection?.supplierId);
      return total + (supplier?.price || 0);
    }, 0);
  };

  const calculateBestTotal = () => {
    return products.reduce((total, product) => {
      if (!includedItems.has(product.productId)) return total;
      const bestSupplier = product.supplierOptions.find(s => s.isBest);
      return total + (bestSupplier?.price || 0);
    }, 0);
  };

  const hasNonOptimalSelection = () => {
    return products.some(product => {
      if (!includedItems.has(product.productId)) return false;
      const selection = selections.get(product.productId);
      const selectedSupplier = product.supplierOptions.find(s => s.supplierId === selection?.supplierId);
      return selectedSupplier && !selectedSupplier.isBest && selectedSupplier.price > 0;
    });
  };

  const getSupplierGroups = () => {
    const groups = new Map<string, string[]>();
    selections.forEach((selection, productId) => {
      if (!includedItems.has(productId)) return;
      const product = products.find(p => p.productId === productId);
      if (product) {
        if (!groups.has(selection.supplierId)) {
          groups.set(selection.supplierId, []);
        }
        groups.get(selection.supplierId)!.push(product.productName);
      }
    });
    return groups;
  };

  const total = calculateTotal();
  const bestTotal = calculateBestTotal();
  const supplierGroups = getSupplierGroups();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="w-[96vw] sm:w-[92vw] md:w-[90vw] max-w-5xl h-[90vh] sm:h-[85vh] p-0 flex flex-col bg-white dark:bg-gray-900 border-0 dark:border dark:border-gray-700 rounded-lg sm:rounded-xl [&>button]:hidden">
        <DialogHeader className="px-3 sm:px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <div className="p-1.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex-shrink-0">
                <Package className="h-4 w-4" />
              </div>
              <span className="text-sm sm:text-base font-bold truncate">Selecionar Fornecedor por Produto</span>
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 text-gray-400 hover:text-gray-900 dark:hover:text-white !bg-transparent p-0 border-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-3 sm:p-4 space-y-3">
          {hasNonOptimalSelection() && (
            <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
                <strong>Atenção:</strong> Economia perdida: <span className="font-bold">R$ {(total - bestTotal).toFixed(2)}</span>
              </AlertDescription>
            </Alert>
          )}

          <div className="border border-slate-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-700">
                    <TableHead className="px-2 py-1.5 text-[10px] font-semibold text-slate-700 dark:text-gray-300 w-10">Inc.</TableHead>
                    <TableHead className="px-2 py-1.5 text-[10px] font-semibold text-slate-700 dark:text-gray-300 min-w-[140px]">Produto</TableHead>
                    <TableHead className="px-2 py-1.5 text-[10px] font-semibold text-slate-700 dark:text-gray-300 min-w-[70px]">Qtd</TableHead>
                    <TableHead className="px-2 py-1.5 text-[10px] font-semibold text-slate-700 dark:text-gray-300 min-w-[260px]">Fornecedor</TableHead>
                    <TableHead className="px-2 py-1.5 text-right text-[10px] font-semibold text-slate-700 dark:text-gray-300 min-w-[100px]">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 dark:divide-gray-700">
                  {products.map((product) => {
                    const selection = selections.get(product.productId);
                    const selectedSupplier = product.supplierOptions.find(s => s.supplierId === selection?.supplierId);
                    const isIncluded = includedItems.has(product.productId);

                    return (
                      <TableRow key={product.productId} className={cn(
                        "hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors",
                        !isIncluded && "opacity-60 bg-slate-50/30 dark:bg-gray-900/10"
                      )}>
                        <TableCell className="px-2 py-2">
                          <Checkbox 
                            checked={isIncluded}
                            onCheckedChange={() => toggleInclude(product.productId)}
                            className="h-4 w-4 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div className="flex flex-col">
                            <p className={cn("font-bold text-xs truncate", isIncluded ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-gray-600")} title={product.productName}>
                              {product.productName}
                            </p>
                            {!product.isActuallyIncluded && isIncluded && (
                              <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium uppercase leading-tight">
                                Sem preço cotado
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <span className="text-[10px] text-slate-600 dark:text-gray-400 whitespace-nowrap">
                            {product.quantity} {product.unit}
                          </span>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                            <Combobox
                              disabled={!isIncluded}
                              options={product.supplierOptions.map(s => ({
                                value: s.supplierId,
                                label: s.price > 0 
                                  ? `${s.supplierName} - R$ ${s.price.toFixed(2)}${s.isBest ? ' ⭐' : ''}`
                                  : `${s.supplierName} - (Sem preço registrado)`
                              }))}
                              value={selection?.supplierId || ''}
                              onValueChange={(value) => handleSelectionChange(product.productId, value)}
                              placeholder="Selecione"
                              className={cn(
                                "w-full min-w-[180px] text-xs",
                                !selection?.supplierId && isIncluded && "border-red-300 dark:border-red-900 shadow-sm shadow-red-100"
                              )}
                            />
                            {selectedSupplier?.isBest && (
                              <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 text-[10px] whitespace-nowrap flex-shrink-0 px-1.5 py-0.5">
                                <Award className="h-2.5 w-2.5 mr-0.5" />
                                Melhor
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2 text-right">
                          <span className={cn(
                            "font-bold text-xs whitespace-nowrap",
                            selectedSupplier?.isBest ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white',
                            !isIncluded && "text-slate-300 dark:text-gray-700"
                          )}>
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

          {supplierGroups.size > 1 && (
            <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-200 text-xs">
                <strong>Múltiplos fornecedores:</strong> {supplierGroups.size} selecionados
                {Array.from(supplierGroups.entries()).map(([supplierId, productNames]) => {
                  const supplier = products.find(p => 
                    p.supplierOptions.some(s => s.supplierId === supplierId)
                  )?.supplierOptions.find(s => s.supplierId === supplierId);
                  
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

        <div className="flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between mb-2 gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 whitespace-nowrap">Total do Pedido:</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1 border-slate-300 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button 
              disabled={includedItems.size === 0 || Array.from(includedItems).some(id => !selections.get(id)?.supplierId)}
              onClick={() => {
                const finalSelections = new Map<string, { supplierId: string; supplierName: string }>();
                includedItems.forEach(productId => {
                  const selection = selections.get(productId);
                  if (selection && selection.supplierId) {
                    finalSelections.set(productId, selection);
                  }
                });
                onConfirm(finalSelections);
              }}
              className="flex-1 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white"
            >
              Confirmar e Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
