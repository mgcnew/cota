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
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { 
  ShoppingCart, Package, Building2, DollarSign, Calendar, 
import { Check, Loader2, Award, AlertCircle, ChevronDown, FileText,
  Zap, Settings2
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
  const [customSelections, setCustomSelections] = useState<Record<string, string>>({}); // packagingId -> supplierId
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar quantidades com as quantidades necessárias da cotação
  useMemo(() => {
    if (quote && Object.keys(quantities).length === 0) {
      const initialQuantities: Record<string, number> = {};
      quote.itens.forEach(item => {
        initialQuantities[item.packagingId] = item.quantidadeNecessaria || 1;
      });
      setQuantities(initialQuantities);
    }
  }, [quote, quantities]);

  // Fornecedores que responderam
  const respondedSuppliers = useMemo(() => {
    if (!quote) return [];
    return quote.fornecedores.filter(f => f.status === "respondido");
  }, [quote]);

  // Calcular melhor e pior fornecedor por item (baseado no custo por unidade)
  const supplierDataByItem = useMemo(() => {
    if (!quote) return { best: {}, worst: {} };
    
    const best: Record<string, { supplierId: string; supplierName: string; costPerUnit: number; item: any }> = {};
    const worst: Record<string, { supplierId: string; supplierName: string; costPerUnit: number; item: any }> = {};
    
    quote.itens.forEach(item => {
      let bestSupplierId: string | null = null;
      let bestSupplierName: string = "";
      let bestCostPerUnit = Infinity;
      let bestItem: any = null;
      
      let worstSupplierId: string | null = null;
      let worstSupplierName: string = "";
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
        
        // Melhor preço (menor)
        if (costPerUnit > 0 && costPerUnit < bestCostPerUnit) {
          bestCostPerUnit = costPerUnit;
          bestSupplierId = fornecedor.supplierId;
          bestSupplierName = fornecedor.supplierName;
          bestItem = supplierItem;
        }
        
        // Pior preço (maior) - para cálculo de economia
        if (costPerUnit > worstCostPerUnit) {
          worstCostPerUnit = costPerUnit;
          worstSupplierId = fornecedor.supplierId;
          worstSupplierName = fornecedor.supplierName;
          worstItem = supplierItem;
        }
      });
      
      if (bestSupplierId && bestItem) {
        best[item.packagingId] = {
          supplierId: bestSupplierId,
          supplierName: bestSupplierName,
          costPerUnit: bestCostPerUnit,
          item: bestItem
        };
      }
      
      if (worstSupplierId && worstItem) {
        worst[item.packagingId] = {
          supplierId: worstSupplierId,
          supplierName: worstSupplierName,
          costPerUnit: worstCostPerUnit,
          item: worstItem
        };
      }
    });
    
    return { best, worst };
  }, [quote, respondedSuppliers]);

  const bestSupplierByItem = supplierDataByItem.best;
  const worstSupplierByItem = supplierDataByItem.worst;

  // Agrupar itens por fornecedor (modo automático)
  const ordersBySupplier = useMemo(() => {
    if (!quote) return {};
    
    const orders: Record<string, { supplierName: string; items: any[] }> = {};
    
    if (conversionMode === "auto") {
      // Modo automático: usar melhor preço
      Object.entries(bestSupplierByItem).forEach(([packagingId, data]) => {
        if (!orders[data.supplierId]) {
          orders[data.supplierId] = { supplierName: data.supplierName, items: [] };
        }
        orders[data.supplierId].items.push({
          ...data.item,
          packagingId,
          packagingName: quote.itens.find(i => i.packagingId === packagingId)?.packagingName || ''
        });
      });
    } else {
      // Modo personalizado: usar seleções do usuário
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
          packagingName: quote.itens.find(i => i.packagingId === packagingId)?.packagingName || ''
        });
      });
    }
    
    return orders;
  }, [quote, conversionMode, bestSupplierByItem, customSelections, respondedSuppliers]);

  // Total geral
  const totalGeral = useMemo(() => {
    return Object.values(ordersBySupplier).reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        const defaultQtd = quote?.itens.find(i => i.packagingId === item.packagingId)?.quantidadeNecessaria || 1;
        const qty = quantities[item.packagingId] || defaultQtd;
        return itemSum + (qty * (item.valorTotal || 0));
      }, 0);
    }, 0);
  }, [ordersBySupplier, quantities, quote]);

  // Calcular economia estimada: (Maior preço - Preço escolhido) × Quantidade
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
          
          // Economia = (Maior preço - Preço escolhido) × Quantidade
          if (maiorPreco > precoEscolhido) {
            supplierEconomia += (maiorPreco - precoEscolhido) * qty;
          }
        }
      });
      
      economia[supplierId] = supplierEconomia;
    });
    
    return economia;
  }, [ordersBySupplier, quantities, worstSupplierByItem]);

  // Economia total
  const economiaTotal = useMemo(() => {
    return Object.values(economiaBySupplier).reduce((sum, val) => sum + val, 0);
  }, [economiaBySupplier]);

  // Inicializar seleções personalizadas com melhor preço
  const initCustomSelections = () => {
    const selections: Record<string, string> = {};
    Object.entries(bestSupplierByItem).forEach(([packagingId, data]) => {
      selections[packagingId] = data.supplierId;
    });
    setCustomSelections(selections);
  };

  const handleQuantityChange = (packagingId: string, value: string) => {
    const qty = parseInt(value) || 1;
    setQuantities(prev => ({ ...prev, [packagingId]: qty }));
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
    setDetailsOpen(false);
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!deliveryDate || !quote || Object.keys(ordersBySupplier).length === 0) return;

    setIsSubmitting(true);

    try {
      // Criar um pedido para cada fornecedor
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); onOpenChange(isOpen); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className={cn("w-9 h-9 flex justify-center items-center rounded-xl", ds.colors.surface.card, "border", ds.colors.border.subtle)}>
              <ShoppingCart className={cn("h-4 w-4", ds.colors.icon.primary)} />
            </div>
            Converter Cotação em Pedido(s)
          </DialogTitle>
          <DialogDescription>
            {suppliersCount > 1 
              ? `Serão criados ${suppliersCount} pedidos para fornecedores diferentes`
              : "Selecione o modo de conversão e confirme os itens"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          <div className="space-y-4 pb-4 hide-scrollbar">
            
            {/* Modo de Conversão */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Modo de Conversão</Label>
              <RadioGroup 
                value={conversionMode} 
                onValueChange={(v) => {
                  setConversionMode(v as ConversionMode);
                  if (v === "custom") initCustomSelections();
                }}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="auto"
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    conversionMode === "auto"
                      ? "bg-slate-100 dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 ring-1 ring-slate-300 dark:ring-zinc-700"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                  )}
                >
                  <RadioGroupItem value="auto" id="auto" className="sr-only" />
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    conversionMode === "auto" ? "bg-slate-600 dark:bg-slate-300 text-white dark:text-slate-900" : "bg-zinc-100 dark:bg-zinc-800"
                  )}>
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Melhor Preço</p>
                    <p className="text-xs text-muted-foreground">Automático por item</p>
                  </div>
                </Label>
                
                <Label
                  htmlFor="custom"
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    conversionMode === "custom"
                      ? "bg-slate-100 dark:bg-zinc-800/50 border-slate-300 dark:border-zinc-700 ring-1 ring-slate-300 dark:ring-zinc-700"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700"
                  )}
                >
                  <RadioGroupItem value="custom" id="custom" className="sr-only" />
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    conversionMode === "custom" ? "bg-slate-600 dark:bg-slate-300 text-white dark:text-slate-900" : "bg-zinc-100 dark:bg-zinc-800"
                  )}>
                    <Settings2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Personalizado</p>
                    <p className="text-xs text-muted-foreground">Escolher por item</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>

            {respondedSuppliers.length === 0 ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Nenhum fornecedor respondeu ainda</span>
                </div>
              </div>
            ) : (
              <>
                {/* Modo Personalizado - Seleção por Item */}
                {conversionMode === "custom" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selecionar Fornecedor por Item</Label>
                    <div 
                      className="max-h-[200px] overflow-y-auto space-y-2 pr-1"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {quote.itens.map((item) => {
                        const best = bestSupplierByItem[item.packagingId];
                        const availableSuppliers = respondedSuppliers.filter(f => 
                          f.itens.some(si => si.packagingId === item.packagingId && si.valorTotal && si.valorTotal > 0)
                        );
                        
                        return (
                          <Card key={item.packagingId} className="overflow-hidden">
                            <CardContent className="p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{item.packagingName}</p>
                                  {best && (
                                    <p className="text-xs text-muted-foreground">
                                      Melhor: {best.supplierName} ({formatCurrency(best.costPerUnit)}/un)
                                    </p>
                                  )}
                                </div>
                                <Select
                                  value={customSelections[item.packagingId] || ""}
                                  onValueChange={(v) => handleCustomSelectionChange(item.packagingId, v)}
                                >
                                  <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue placeholder="Fornecedor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableSuppliers.map(f => {
                                      const supplierItem = f.itens.find(si => si.packagingId === item.packagingId);
                                      const isBest = best?.supplierId === f.supplierId;
                                      return (
                                        <SelectItem key={f.supplierId} value={f.supplierId}>
                                          <div className="flex items-center gap-1">
                                            {isBest && <Award className="h-3 w-3 text-green-600" />}
                                            <span className="truncate">{f.supplierName}</span>
                                            <span className="text-muted-foreground ml-1">
                                              {formatCurrency(supplierItem?.valorTotal)}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Resumo dos Pedidos */}
                {Object.keys(ordersBySupplier).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Pedidos a Criar ({suppliersCount} fornecedor{suppliersCount > 1 ? 'es' : ''})
                    </Label>
                    <div className="space-y-2">
                      {Object.entries(ordersBySupplier).map(([supplierId, orderData]) => {
                        const orderTotal = orderData.items.reduce((sum, item) => {
                          const defaultQtd = quote?.itens.find(i => i.packagingId === item.packagingId)?.quantidadeNecessaria || 1;
                          const qty = quantities[item.packagingId] || defaultQtd;
                          return sum + (qty * (item.valorTotal || 0));
                        }, 0);
                        
                        return (
                          <Card key={supplierId} className={cn("overflow-hidden", ds.colors.border.subtle)}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", "bg-slate-100 dark:bg-zinc-800")}>
                                    <Building2 className={cn("h-3.5 w-3.5", ds.colors.icon.primary)} />
                                  </div>
                                  <span className="font-medium text-sm">{orderData.supplierName}</span>
                                </div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                  {formatCurrency(orderTotal)}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                {orderData.items.map(item => (
                                  <div key={item.packagingId} className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground truncate flex-1">{item.packagingName}</span>
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        min="1"
                                        value={quantities[item.packagingId] || quote?.itens.find(i => i.packagingId === item.packagingId)?.quantidadeNecessaria || 1}
                                        onChange={(e) => handleQuantityChange(item.packagingId, e.target.value)}
                                        className="w-14 h-6 text-center text-xs"
                                      />
                                      <span className="text-muted-foreground w-20 text-right">
                                        {formatCurrency(item.valorTotal)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Detalhes do Pedido */}
                <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText className={cn("h-4 w-4", ds.colors.icon.primary)} />
                        <span className="font-medium text-sm">Detalhes</span>
                        {!deliveryDate && (
                          <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                            Preencher data
                          </Badge>
                        )}
                      </div>
                      <ChevronDown className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        detailsOpen && "rotate-180"
                      )} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          Data de Entrega Prevista *
                        </Label>
                        <Input
                          type="date"
                          value={deliveryDate}
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Observações (opcional)</Label>
                        <Input
                          placeholder="Observações sobre o pedido..."
                          value={observations}
                          onChange={(e) => setObservations(e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Total Geral e Economia */}
                <div className={cn("p-4 rounded-xl border", ds.colors.surface.card, ds.colors.border.subtle)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className={cn("h-4 w-4", ds.colors.icon.primary)} />
                      <span className="font-medium text-sm">Total Geral</span>
                      <span className="text-xs text-muted-foreground">
                        ({itemsCount} itens em {suppliersCount} pedido{suppliersCount > 1 ? 's' : ''})
                      </span>
                    </div>
                    <span className={cn("text-lg font-bold", ds.colors.text.primary)}>
                      {formatCurrency(totalGeral)}
                    </span>
                  </div>
                  
                  {economiaTotal > 0 && (
                    <div className={cn("flex items-center justify-between mt-3 pt-3 border-t", ds.colors.border.subtle)}>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-green-600 dark:text-green-500" />
                        <span className="font-medium text-sm text-green-700 dark:text-green-500">Economia Estimada</span>
                        <span className="text-xs text-muted-foreground">
                          (vs maior preço cotado)
                        </span>
                      </div>
                      <span className="text-lg font-bold text-green-600 dark:text-green-500">
                        {formatCurrency(economiaTotal)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end gap-2 px-6 py-3 border-t bg-white dark:bg-gray-900">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { resetForm(); onOpenChange(false); }}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!deliveryDate || Object.keys(ordersBySupplier).length === 0 || isSubmitting}
            className={cn(ds.components.button.base, ds.components.button.variants.primary)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Criar {suppliersCount > 1 ? `${suppliersCount} Pedidos` : 'Pedido'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
