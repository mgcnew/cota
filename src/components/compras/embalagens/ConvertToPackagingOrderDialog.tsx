import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import {
  ShoppingCart, Building2, DollarSign, Calendar,
  Check, Loader2, Award, AlertCircle, FileText,
  Zap, Settings2, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingQuoteDisplay } from "@/types/packaging";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PackagingQuoteDisplay | null;
}

type ConversionMode = "auto" | "custom";

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
  const { updateQuoteStatus } = usePackagingQuotes();
  const [conversionMode, setConversionMode] = useState<ConversionMode>("auto");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customSelections, setCustomSelections] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar quantidades com as quantidades necessárias da cotação
  useEffect(() => {
    if (quote && open) {
      const initialQuantities: Record<string, number> = {};
      quote.itens.forEach(item => {
        initialQuantities[item.packagingId] = item.quantidadeNecessaria || 1;
      });
      setQuantities(initialQuantities);
    }
  }, [quote, open]);

  // Fornecedores que responderam
  const respondedSuppliers = useMemo(() => {
    if (!quote) return [];
    return quote.fornecedores.filter(f => f.status === "respondido");
  }, [quote]);

  // Melhor e pior fornecedor por item
  const supplierDataByItem = useMemo(() => {
    if (!quote) return { best: {}, worst: {} };

    const best: Record<string, { supplierId: string; supplierName: string; costPerUnit: number; item: any }> = {};
    const worst: Record<string, { supplierId: string; supplierName: string; costPerUnit: number; item: any }> = {};

    quote.itens.forEach(item => {
      let bestSupplierId: string | null = null;
      let bestSupplierName = "";
      let bestCostPerUnit = Infinity;
      let bestItem: any = null;

      let worstSupplierId: string | null = null;
      let worstSupplierName = "";
      let worstCostPerUnit = 0;
      let worstItem: any = null;

      respondedSuppliers.forEach(fornecedor => {
        const supplierItem = fornecedor.itens.find(si => si.packagingId === item.packagingId);
        if (!supplierItem || !supplierItem.valorTotal || supplierItem.valorTotal <= 0) return;

        const costPerUnit = supplierItem.custoPorUnidade && supplierItem.custoPorUnidade > 0
          ? supplierItem.custoPorUnidade
          : (supplierItem.quantidadeUnidadesEstimada && supplierItem.quantidadeUnidadesEstimada > 0
              ? supplierItem.valorTotal / supplierItem.quantidadeUnidadesEstimada
              : supplierItem.valorTotal);

        if (costPerUnit > 0 && costPerUnit < bestCostPerUnit) {
          bestCostPerUnit = costPerUnit;
          bestSupplierId = fornecedor.supplierId;
          bestSupplierName = fornecedor.supplierName;
          bestItem = supplierItem;
        }
        if (costPerUnit > worstCostPerUnit) {
          worstCostPerUnit = costPerUnit;
          worstSupplierId = fornecedor.supplierId;
          worstSupplierName = fornecedor.supplierName;
          worstItem = supplierItem;
        }
      });

      if (bestSupplierId && bestItem) {
        best[item.packagingId] = { supplierId: bestSupplierId, supplierName: bestSupplierName, costPerUnit: bestCostPerUnit, item: bestItem };
      }
      if (worstSupplierId && worstItem) {
        worst[item.packagingId] = { supplierId: worstSupplierId, supplierName: worstSupplierName, costPerUnit: worstCostPerUnit, item: worstItem };
      }
    });

    return { best, worst };
  }, [quote, respondedSuppliers]);

  const bestSupplierByItem = supplierDataByItem.best;
  const worstSupplierByItem = supplierDataByItem.worst;

  // Agrupar itens por fornecedor
  const ordersBySupplier = useMemo(() => {
    if (!quote) return {};

    const orders: Record<string, { supplierName: string; items: any[] }> = {};

    if (conversionMode === "auto") {
      Object.entries(bestSupplierByItem).forEach(([packagingId, data]) => {
        if (!orders[data.supplierId]) {
          orders[data.supplierId] = { supplierName: data.supplierName, items: [] };
        }
        orders[data.supplierId].items.push({
          ...data.item,
          packagingId,
          packagingName: quote.itens.find(i => i.packagingId === packagingId)?.packagingName || '',
        });
      });
    } else {
      Object.entries(customSelections).forEach(([packagingId, supplierId]) => {
        const fornecedor = respondedSuppliers.find(f => f.supplierId === supplierId);
        if (!fornecedor) return;
        const supplierItem = fornecedor.itens.find(si => si.packagingId === packagingId);
        if (!supplierItem || !supplierItem.valorTotal) return;
        if (!orders[supplierId]) {
          orders[supplierId] = { supplierName: fornecedor.supplierName, items: [] };
        }
        orders[supplierId].items.push({
          ...supplierItem,
          packagingId,
          packagingName: quote.itens.find(i => i.packagingId === packagingId)?.packagingName || '',
        });
      });
    }

    return orders;
  }, [quote, conversionMode, bestSupplierByItem, customSelections, respondedSuppliers]);

  const totalGeral = useMemo(() => {
    return Object.values(ordersBySupplier).reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        const defaultQtd = quote?.itens.find(i => i.packagingId === item.packagingId)?.quantidadeNecessaria || 1;
        const qty = quantities[item.packagingId] || defaultQtd;
        return itemSum + (qty * (item.valorTotal || 0));
      }, 0);
    }, 0);
  }, [ordersBySupplier, quantities, quote]);

  const economiaBySupplier = useMemo(() => {
    const economia: Record<string, number> = {};
    Object.entries(ordersBySupplier).forEach(([supplierId, orderData]) => {
      let supplierEconomia = 0;
      orderData.items.forEach(item => {
        const defaultQtd = quote?.itens.find(i => i.packagingId === item.packagingId)?.quantidadeNecessaria || 1;
        const qty = quantities[item.packagingId] || defaultQtd;
        const worst = worstSupplierByItem[item.packagingId];
        if (worst && worst.item?.valorTotal) {
          const precoEscolhido = item.valorTotal || 0;
          const maiorPreco = worst.item.valorTotal;
          if (maiorPreco > precoEscolhido) supplierEconomia += (maiorPreco - precoEscolhido) * qty;
        }
      });
      economia[supplierId] = supplierEconomia;
    });
    return economia;
  }, [ordersBySupplier, quantities, worstSupplierByItem]);

  const economiaTotal = useMemo(() =>
    Object.values(economiaBySupplier).reduce((sum, val) => sum + val, 0),
  [economiaBySupplier]);

  const initCustomSelections = () => {
    const selections: Record<string, string> = {};
    Object.entries(bestSupplierByItem).forEach(([packagingId, data]) => {
      selections[packagingId] = data.supplierId;
    });
    setCustomSelections(selections);
  };

  const handleQuantityChange = (packagingId: string, value: string) => {
    setQuantities(prev => ({ ...prev, [packagingId]: parseInt(value) || 1 }));
  };

  const handleCustomSelectionChange = (packagingId: string, supplierId: string) => {
    setCustomSelections(prev => ({ ...prev, [packagingId]: supplierId }));
  };

  const resetForm = () => {
    setConversionMode("auto");
    setDeliveryDate("");
    setObservations("");
    setQuantities({});
    setCustomSelections({});
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!deliveryDate || !quote || Object.keys(ordersBySupplier).length === 0) return;
    setIsSubmitting(true);
    try {
      for (const [supplierId, orderData] of Object.entries(ordersBySupplier)) {
        const itens: OrderItem[] = orderData.items.map(item => {
          const defaultQtd = quote?.itens.find(i => i.packagingId === item.packagingId)?.quantidadeNecessaria || 1;
          return {
            packagingId: item.packagingId,
            packagingName: item.packagingName,
            quantidade: quantities[item.packagingId] || defaultQtd,
            unidadeCompra: item.unidadeVenda || 'un',
            quantidadePorUnidade: item.quantidadeVenda || undefined,
            valorUnitario: item.valorTotal || 0,
          };
        });
        await createOrderFromQuote.mutateAsync({
          quoteId: quote.id,
          supplierId,
          supplierName: orderData.supplierName,
          deliveryDate,
          observations: observations || undefined,
          economiaEstimada: economiaBySupplier[supplierId] || 0,
          itens,
        });
      }
      await updateQuoteStatus.mutateAsync({ quoteId: quote.id, status: 'concluida' });
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao criar pedidos:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quote) return null;

  const suppliersCount = Object.keys(ordersBySupplier).length;
  const itemsCount = Object.values(ordersBySupplier).reduce((sum, o) => sum + o.items.length, 0);
  const canSubmit = !!deliveryDate && Object.keys(ordersBySupplier).length > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0">

        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-5 py-4 border-b border-border dark:border-white/5 space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-[18px] w-[18px] text-brand" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <DialogTitle className="text-base font-bold text-foreground">
                Converter em Pedido
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {suppliersCount > 1
                  ? `Serão criados ${suppliersCount} pedidos para fornecedores diferentes`
                  : "Selecione o modo de conversão e confirme os itens"}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 min-h-0 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>

          {/* Modo de Conversão */}
          <div className="space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Modo de Conversão
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "auto",   Icon: Zap,      label: "Melhor Preço",  desc: "Automático por item" },
                { value: "custom", Icon: Settings2, label: "Personalizado", desc: "Escolher por item"  },
              ] as const).map(({ value, Icon, label, desc }) => {
                const isActive = conversionMode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setConversionMode(value);
                      if (value === "custom") initCustomSelections();
                    }}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all",
                      isActive
                        ? "bg-brand/8 border-brand/40 ring-1 ring-brand/30"
                        : "bg-card border-border dark:border-white/5 hover:border-brand/30"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                      isActive ? "bg-brand text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={cn("font-semibold text-sm", isActive ? "text-brand" : "text-foreground")}>
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-brand flex items-center justify-center flex-shrink-0">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aviso sem fornecedores */}
          {respondedSuppliers.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/30">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Nenhum fornecedor respondeu ainda
              </p>
            </div>
          ) : (
            <>
              {/* Modo Personalizado — seleção por item */}
              {conversionMode === "custom" && (
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Selecionar Fornecedor por Item
                  </Label>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
                    {quote.itens.map((item) => {
                      const best = bestSupplierByItem[item.packagingId];
                      const availableSuppliers = respondedSuppliers.filter(f =>
                        f.itens.some(si => si.packagingId === item.packagingId && si.valorTotal && si.valorTotal > 0)
                      );
                      return (
                        <div key={item.packagingId} className="flex items-center gap-3 p-3 rounded-xl border border-border dark:border-white/5 bg-card">
                          <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0">
                            <Package className="h-3.5 w-3.5 text-brand" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.packagingName}</p>
                            {best && (
                              <p className="text-[11px] text-muted-foreground">
                                Melhor: {best.supplierName} · {formatCurrency(best.costPerUnit)}/un
                              </p>
                            )}
                          </div>
                          <Select
                            value={customSelections[item.packagingId] || ""}
                            onValueChange={(v) => handleCustomSelectionChange(item.packagingId, v)}
                          >
                            <SelectTrigger className="w-[148px] h-8 text-xs flex-shrink-0">
                              <SelectValue placeholder="Fornecedor" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSuppliers.map(f => {
                                const supplierItem = f.itens.find(si => si.packagingId === item.packagingId);
                                const isBest = best?.supplierId === f.supplierId;
                                return (
                                  <SelectItem key={f.supplierId} value={f.supplierId}>
                                    <div className="flex items-center gap-1.5">
                                      {isBest && <Award className="h-3 w-3 text-emerald-600 flex-shrink-0" />}
                                      <span className="truncate">{f.supplierName}</span>
                                      <span className="text-muted-foreground text-[10px] ml-1">
                                        {formatCurrency(supplierItem?.valorTotal)}
                                      </span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resumo dos pedidos a criar */}
              {Object.keys(ordersBySupplier).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Pedidos a Criar · {suppliersCount} fornecedor{suppliersCount > 1 ? 'es' : ''}
                  </Label>
                  <div className="space-y-2">
                    {Object.entries(ordersBySupplier).map(([supplierId, orderData]) => {
                      const orderTotal = orderData.items.reduce((sum, item) => {
                        const defaultQtd = quote?.itens.find(i => i.packagingId === item.packagingId)?.quantidadeNecessaria || 1;
                        const qty = quantities[item.packagingId] || defaultQtd;
                        return sum + (qty * (item.valorTotal || 0));
                      }, 0);

                      return (
                        <div key={supplierId} className="rounded-xl border border-border dark:border-white/5 bg-card overflow-hidden">
                          {/* Cabeçalho do fornecedor */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-white/5 bg-muted/30">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="h-3.5 w-3.5 text-brand" />
                              </div>
                              <span className="font-semibold text-sm text-foreground">{orderData.supplierName}</span>
                            </div>
                            <span className={cn(ds.components.badge.success, "tabular-nums font-bold")}>
                              {formatCurrency(orderTotal)}
                            </span>
                          </div>

                          {/* Linhas de itens com quantidade editável */}
                          <div className="px-4 py-2 space-y-2">
                            {orderData.items.map(item => (
                              <div key={item.packagingId} className="flex items-center gap-3 py-1">
                                <span className="text-sm text-foreground truncate flex-1">{item.packagingName}</span>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Input
                                    type="number"
                                    min="1"
                                    value={quantities[item.packagingId] || quote?.itens.find(i => i.packagingId === item.packagingId)?.quantidadeNecessaria || 1}
                                    onChange={(e) => handleQuantityChange(item.packagingId, e.target.value)}
                                    className="w-16 h-7 text-center text-xs"
                                  />
                                  <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">
                                    {formatCurrency(item.valorTotal)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Detalhes do pedido — sempre visíveis */}
              <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Detalhes do Pedido
                </Label>
                <div className="rounded-xl border border-border dark:border-white/5 bg-card p-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Data de Entrega Prevista
                      <span className="text-brand">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={cn(!deliveryDate && "border-amber-300 dark:border-amber-700 focus-visible:ring-amber-400")}
                    />
                    {!deliveryDate && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Obrigatório para criar o pedido
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Observações <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                    <Input
                      placeholder="Observações sobre o pedido..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Total geral + economia */}
              <div className="rounded-xl border border-border dark:border-white/5 bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm text-foreground">Total Geral</span>
                    <span className="text-xs text-muted-foreground">
                      ({itemsCount} {itemsCount === 1 ? 'item' : 'itens'} · {suppliersCount} {suppliersCount === 1 ? 'pedido' : 'pedidos'})
                    </span>
                  </div>
                  <span className="text-lg font-extrabold text-foreground tabular-nums">
                    {formatCurrency(totalGeral)}
                  </span>
                </div>

                {economiaTotal > 0 && (
                  <div className="flex items-center justify-between pt-3 border-t border-border dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="font-medium text-sm text-emerald-700 dark:text-emerald-400">Economia Estimada</span>
                      <span className="text-xs text-muted-foreground">(vs maior preço cotado)</span>
                    </div>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatCurrency(economiaTotal)}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-t border-border dark:border-white/5 bg-muted/20">
          <span className="text-xs text-muted-foreground">
            {canSubmit
              ? `${suppliersCount} pedido${suppliersCount > 1 ? 's' : ''} pronto${suppliersCount > 1 ? 's' : ''} para criar`
              : "Preencha a data de entrega para continuar"}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { resetForm(); onOpenChange(false); }}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-brand hover:bg-brand/90 text-white gap-1.5"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Criando...</>
              ) : (
                <><ShoppingCart className="h-4 w-4" />Criar {suppliersCount > 1 ? `${suppliersCount} Pedidos` : 'Pedido'}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
