import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Award, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      const selection = selections.get(product.productId);
      const supplier = product.supplierOptions.find(s => s.supplierId === selection?.supplierId);
      return total + (supplier?.price || 0);
    }, 0);
  };

  const calculateBestTotal = () => {
    return products.reduce((total, product) => {
      const bestSupplier = product.supplierOptions.find(s => s.isBest);
      return total + (bestSupplier?.price || 0);
    }, 0);
  };

  const hasNonOptimalSelection = () => {
    return products.some(product => {
      const selection = selections.get(product.productId);
      const selectedSupplier = product.supplierOptions.find(s => s.supplierId === selection?.supplierId);
      return selectedSupplier && !selectedSupplier.isBest;
    });
  };

  const getSupplierGroups = () => {
    const groups = new Map<string, string[]>();
    selections.forEach((selection, productId) => {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Selecionar Fornecedor por Produto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasNonOptimalSelection() && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você selecionou fornecedores que não oferecem o melhor preço para alguns produtos.
                Economia potencial perdida: R$ {(total - bestTotal).toFixed(2)}
              </AlertDescription>
            </Alert>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Fornecedor Selecionado</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const selection = selections.get(product.productId);
                  const selectedSupplier = product.supplierOptions.find(s => s.supplierId === selection?.supplierId);
                  
                  return (
                    <TableRow key={product.productId}>
                      <TableCell>
                        <div className="font-medium">{product.productName}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {product.quantity} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Combobox
                            options={product.supplierOptions.map(s => ({
                              value: s.supplierId,
                              label: `${s.supplierName} - R$ ${s.price.toFixed(2)}${s.isBest ? ' ⭐' : ''}`
                            }))}
                            value={selection?.supplierId || ''}
                            onValueChange={(value) => handleSelectionChange(product.productId, value)}
                            placeholder="Selecione o fornecedor"
                            className="w-[300px]"
                          />
                          {selectedSupplier?.isBest && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Award className="h-3 w-3 mr-1" />
                              Melhor Preço
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold ${selectedSupplier?.isBest ? 'text-green-600' : 'text-gray-900'}`}>
                          R$ {selectedSupplier?.price.toFixed(2) || '0.00'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total do Pedido:</span>
              <span className="text-2xl font-bold text-green-600">R$ {total.toFixed(2)}</span>
            </div>
            
            {supplierGroups.size > 1 && (
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900">
                  <strong>Atenção:</strong> Você selecionou produtos de {supplierGroups.size} fornecedores diferentes.
                  {Array.from(supplierGroups.entries()).map(([supplierId, productNames]) => {
                    const supplier = products.find(p => 
                      p.supplierOptions.some(s => s.supplierId === supplierId)
                    )?.supplierOptions.find(s => s.supplierId === supplierId);
                    
                    return (
                      <div key={supplierId} className="mt-2">
                        • <strong>{supplier?.supplierName}:</strong> {productNames.join(', ')}
                      </div>
                    );
                  })}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(selections)}>
            Confirmar e Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
