import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { 
  ShoppingCart, Package, Building2, DollarSign, Calendar, 
  Check, Loader2, Award, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackagingQuoteDisplay } from "@/types/packaging";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PackagingQuoteDisplay | null;
}

interface OrderItem {
  packagingId: string;
  packagingName: string;
  quantidade: number;
  unidadeCompra: string;
  quantidadePorUnidade?: number;
  valorUnitario: number;
}

export function ConvertToPackagingOrderDialog({ open, onOpenChange, quote }: Props) {
  const { createOrderFromQuote } = usePackagingOrders();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!quote) return null;
  
  // Fornecedores que responderam
  const respondedSuppliers = quote.fornecedores.filter(f => f.status === "respondido");
  
  // Dados do fornecedor selecionado
  const selectedSupplier = respondedSuppliers.find(f => f.supplierId === selectedSupplierId);

  // Calcular total do pedido
  const orderTotal = useMemo(() => {
    if (!selectedSupplier) return 0;
    
    return selectedSupplier.itens.reduce((sum, item) => {
      const qty = quantities[item.packagingId] || 1;
      return sum + (qty * (item.valorTotal || 0));
    }, 0);
  }, [selectedSupplier, quantities]);

  const handleQuantityChange = (packagingId: string, value: string) => {
    const qty = parseInt(value) || 1;
    setQuantities(prev => ({ ...prev, [packagingId]: qty }));
  };

  const handleSubmit = async () => {
    if (!selectedSupplier || !deliveryDate) return;

    const itens: OrderItem[] = selectedSupplier.itens
      .filter(item => item.valorTotal && item.valorTotal > 0)
      .map(item => ({
        packagingId: item.packagingId,
        packagingName: item.packagingName,
        quantidade: quantities[item.packagingId] || 1,
        unidadeCompra: item.unidadeVenda || 'un',
        quantidadePorUnidade: item.quantidadeVenda || undefined,
        valorUnitario: item.valorTotal || 0,
      }));

    await createOrderFromQuote.mutateAsync({
      quoteId: quote.id,
      supplierId: selectedSupplier.supplierId,
      supplierName: selectedSupplier.supplierName,
      deliveryDate,
      observations: observations || undefined,
      itens,
    });

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedSupplierId("");
    setDeliveryDate("");
    setObservations("");
    setQuantities({});
  };

  // Encontrar melhor fornecedor por custo total
  const bestSupplierId = useMemo(() => {
    if (respondedSuppliers.length === 0) return null;
    
    let best = respondedSuppliers[0];
    respondedSuppliers.forEach(s => {
      if (s.custoTotalEstimado < best.custoTotalEstimado && s.custoTotalEstimado > 0) {
        best = s;
      }
    });
    return best.supplierId;
  }, [respondedSuppliers]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
            Converter Cotação em Pedido
          </DialogTitle>
          <DialogDescription>
            Selecione o fornecedor e informe as quantidades para criar o pedido
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {/* Seleção de Fornecedor */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Selecione o Fornecedor</Label>
              
              {respondedSuppliers.length === 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Nenhum fornecedor respondeu ainda</span>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  {respondedSuppliers.map((fornecedor) => {
                    const isBest = fornecedor.supplierId === bestSupplierId;
                    const isSelected = selectedSupplierId === fornecedor.supplierId;
                    
                    return (
                      <button
                        key={fornecedor.supplierId}
                        type="button"
                        onClick={() => setSelectedSupplierId(fornecedor.supplierId)}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3",
                          isSelected
                            ? "bg-purple-100 dark:bg-purple-900/30 border-purple-500 ring-1 ring-purple-500"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          isSelected ? "bg-purple-500 text-white" : "bg-gray-100 dark:bg-gray-700"
                        )}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{fornecedor.supplierName}</p>
                            {isBest && (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                                <Award className="h-3 w-3 mr-0.5" />Melhor
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Total estimado: R$ {fornecedor.custoTotalEstimado.toFixed(2)}
                          </p>
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-purple-600" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Itens e Quantidades */}
            {selectedSupplier && (
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Itens e Quantidades
                </Label>
                
                <div className="space-y-2">
                  {selectedSupplier.itens
                    .filter(item => item.valorTotal && item.valorTotal > 0)
                    .map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.packagingName}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>R$ {item.valorTotal?.toFixed(2)}</span>
                                {item.unidadeVenda && (
                                  <span>/ {item.unidadeVenda}</span>
                                )}
                                {item.quantidadeVenda && (
                                  <span>({item.quantidadeVenda} un)</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground">Qtd:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={quantities[item.packagingId] || 1}
                                onChange={(e) => handleQuantityChange(item.packagingId, e.target.value)}
                                className="w-20 h-8 text-center"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Data de Entrega */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data de Entrega Prevista
              </Label>
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Observações (opcional)</Label>
              <Input
                placeholder="Observações sobre o pedido..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>

            {/* Resumo do Pedido */}
            {selectedSupplier && (
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Total do Pedido</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">
                    R$ {orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer com botões */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedSupplierId || !deliveryDate || createOrderFromQuote.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {createOrderFromQuote.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Criar Pedido
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
