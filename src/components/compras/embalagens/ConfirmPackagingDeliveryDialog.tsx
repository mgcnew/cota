import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { useToast } from "@/hooks/use-toast";
import { 
  Truck, Check, Loader2, DollarSign, Package, TrendingDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingOrderDisplay } from "@/types/packaging";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PackagingOrderDisplay | null;
}

export function ConfirmPackagingDeliveryDialog({ open, onOpenChange, order }: Props) {
  const { confirmDelivery } = usePackagingOrders();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // States para armazenar as edições do usuário para cada item
  // A chave é o id do order entry item.
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({});
  const [itemTotals, setItemTotals] = useState<Record<string, string>>({});

  // Helpers de formatação para moeda BRL
  const formatInputToBRL = (value: string) => {
    const digitOnly = value.replace(/\D/g, "");
    if (!digitOnly) return "";
    const numericValue = parseInt(digitOnly, 10) / 100;
    return numericValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const parseBRLToNumber = (value: string) => {
    return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
  };

  // Inicializar states com os valores do pedido quando abrir
  useEffect(() => {
    if (order && open) {
      const q: Record<string, string> = {};
      const t: Record<string, string> = {};
      order.itens.forEach(item => {
        q[item.id] = String(item.quantidade);
        t[item.id] = item.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      });
      setItemQuantities(q);
      setItemTotals(t);
    }
  }, [order, open]);

  const handleQuantityChange = (itemId: string, value: string) => {
    setItemQuantities(prev => ({ ...prev, [itemId]: value }));
  };

  const handleTotalChange = (itemId: string, value: string) => {
    setItemTotals(prev => ({ ...prev, [itemId]: formatInputToBRL(value) }));
  };

  // Cálculos reativos em tempo real
  const summary = useMemo(() => {
    if (!order) return { totalGeral: 0, newEconomy: 0 };
    
    let totalGeral = 0;
    
    order.itens.forEach(item => {
      const valorTotalItem = parseBRLToNumber(itemTotals[item.id]) || 0;
      totalGeral += valorTotalItem;
    });

    const originalTotal = order.totalValue || 1; // previne divisões por 0
    // Proporção de economia = economia original / total original 
    // Nova Economia = Nova Total * Proporção
    const proportion = order.economiaEstimada / originalTotal;
    const newEconomy = totalGeral * proportion;

    return { totalGeral, newEconomy };
  }, [order, itemQuantities, itemTotals]);

  const resetForm = () => {
    setItemQuantities({});
    setItemTotals({});
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);

    try {
      // Prepara os itens atualizados
      const updatedItens = order.itens.map(item => {
        const qtd = parseFloat(itemQuantities[item.id]) || item.quantidade;
        const vTotalVal = itemTotals[item.id] ? parseBRLToNumber(itemTotals[item.id]) : item.valorTotal;
        const vTotal = vTotalVal || item.valorTotal;
        // O valor unitário é sempre o total/quantidade
        const vUnit = qtd > 0 ? vTotal / qtd : 0;
        
        return {
          id: item.id,
          quantidade: qtd,
          valorTotal: vTotal,
          valorUnitario: vUnit
        };
      });

      await confirmDelivery.mutateAsync({
        orderId: order.id,
        totalValue: summary.totalGeral,
        economiaEstimada: summary.newEconomy,
        itens: updatedItens
      });

      onOpenChange(false);
      resetForm();
    } catch (e) {
      console.error(e);
      // O erro é lidado pela mutation, mas se cairmos aqui garantimos liberar a interface
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Confirmar Entrega: {order.supplierName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1 text-sm">
            Nesta etapa, preencha os valores exatos de peso/quantidade e valor cobrado presentes na Nota Fiscal para dar baixa neste pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          
          <div className="space-y-4 pb-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" /> Itens Recebidos
            </h4>
            
            <div className="space-y-3">
              {order.itens.map(item => {
                const isWeight = item.unidadeCompra === "kg" || item.unidadeCompra === "g";
                
                return (
                  <Card key={item.id} className="overflow-hidden shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-sm line-clamp-2">{item.packagingName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Originalmente pedido: {item.quantidade} {item.unidadeCompra} a {formatCurrency(item.valorTotal)}
                          </p>
                        </div>
                        
                        <div className="flex gap-3 justify-end items-center mt-2 sm:mt-0">
                          {/* Qtd Recebida */}
                          <div className="flex flex-col gap-1 w-[100px]">
                            <label className="text-[10px] font-medium text-muted-foreground uppercase">
                              Qtd ({item.unidadeCompra})
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={itemQuantities[item.id] || ""}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className={cn("h-8 text-sm", isWeight ? "border-amber-300 dark:border-amber-700 focus-visible:ring-amber-500" : "")}
                            />
                          </div>

                          {/* Valor da Nota */}
                          <div className="flex flex-col gap-1 w-[120px]">
                            <label className="text-[10px] font-medium text-muted-foreground uppercase">
                              Valor Nota (R$)
                            </label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={itemTotals[item.id] || ""}
                              onChange={(e) => handleTotalChange(item.id, e.target.value)}
                              className="h-8 text-sm text-right font-medium text-brand"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Total Atualizado Panel */}
            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">Total Apurado</span>
                </div>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(summary.totalGeral)}
                </span>
              </div>
              
              {summary.newEconomy > 0 && (
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/40">
                  <div className="flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Economia Efetiva Calculada</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.newEconomy)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t bg-white dark:bg-gray-950">
          <Button
            variant="outline"
            onClick={() => { resetForm(); onOpenChange(false); }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Dando Baixa...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Confirmar Valores e Entregar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
