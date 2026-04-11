import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { 
  ShoppingCart, Building2, DollarSign, Calendar, 
  Loader2, Award, AlertCircle,
  Zap, Settings2, TrendingDown, CheckCircle2, Send, MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingQuoteDisplay } from "@/types/packaging";
import { useToast } from "@/hooks/use-toast";
import { generatePackagingOrderMessage, sendWhatsApp } from "@/lib/whatsapp-service";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  quote: PackagingQuoteDisplay;
  onConversionComplete?: () => void;
}

type ConversionMode = "auto" | "custom";
type SendMode = "convert_only" | "convert_and_send";

interface OrderItem {
  packagingId: string;
  packagingName: string;
  quantidade: number;
  unidadeCompra: string;
  quantidadePorUnidade?: number;
  valorUnitario: number;
}

interface ConversionResult {
  totalOrders: number;
  totalValue: number;
  whatsappSent: number;
  whatsappFailed: number;
  failedSuppliers: string[];
}

export function ConvertTab({ quote, onConversionComplete }: Props) {
  const { createOrderFromQuote } = usePackagingOrders();
  const { updateQuoteStatus } = usePackagingQuotes();
  const { toast } = useToast();
  const [conversionMode, setConversionMode] = useState<ConversionMode>("auto");
  const [sendMode, setSendMode] = useState<SendMode>("convert_and_send");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customSelections, setCustomSelections] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState("");
  const [conversionDone, setConversionDone] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);

  // Inicializar quantidades
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

  // Calcular melhor e pior fornecedor por item
  const supplierDataByItem = useMemo(() => {
    if (!quote) return { best: {} as Record<string, any>, worst: {} as Record<string, any> };
    
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
          packagingName: quote.itens.find(i => i.packagingId === packagingId)?.packagingName || ''
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

  // Economia
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
          if (maiorPreco > precoEscolhido) {
            supplierEconomia += (maiorPreco - precoEscolhido) * qty;
          }
        }
      });
      
      economia[supplierId] = supplierEconomia;
    });
    
    return economia;
  }, [ordersBySupplier, quantities, worstSupplierByItem, quote]);

  const economiaTotal = useMemo(() => {
    return Object.values(economiaBySupplier).reduce((sum, val) => sum + val, 0);
  }, [economiaBySupplier]);

  const initCustomSelections = useCallback(() => {
    const selections: Record<string, string> = {};
    Object.entries(bestSupplierByItem).forEach(([packagingId, data]) => {
      selections[packagingId] = data.supplierId;
    });
    setCustomSelections(selections);
  }, [bestSupplierByItem]);

  const handleQuantityChange = (packagingId: string, value: string) => {
    const qty = parseInt(value) || 1;
    setQuantities(prev => ({ ...prev, [packagingId]: qty }));
  };

  const handleCustomSelectionChange = (packagingId: string, supplierId: string) => {
    setCustomSelections(prev => ({ ...prev, [packagingId]: supplierId }));
  };

  const handleSubmit = async () => {
    if (!deliveryDate || !quote || Object.keys(ordersBySupplier).length === 0) return;

    setIsSubmitting(true);
    const result: ConversionResult = {
      totalOrders: 0,
      totalValue: totalGeral,
      whatsappSent: 0,
      whatsappFailed: 0,
      failedSuppliers: [],
    };

    try {
      const createdOrderIds: { orderId: string; supplierId: string; supplierName: string }[] = [];

      // STEP 1: Criar todos os pedidos
      for (const [supplierId, orderData] of Object.entries(ordersBySupplier)) {
        setSubmittingStep(`Criando pedido: ${orderData.supplierName}...`);
        
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

        const createdOrder = await createOrderFromQuote.mutateAsync({
          quoteId: quote.id,
          supplierId,
          supplierName: orderData.supplierName,
          deliveryDate,
          observations: observations || undefined,
          economiaEstimada: economiaBySupplier[supplierId] || 0,
          itens,
        });

        // O mutate retorna o pedido criado - capturamos o ID
        if (createdOrder?.id) {
          createdOrderIds.push({ orderId: createdOrder.id, supplierId, supplierName: orderData.supplierName });
        }
        result.totalOrders++;
      }

      // STEP 2: Enviar via WhatsApp (se selecionado)
      if (sendMode === "convert_and_send" && createdOrderIds.length > 0) {
        for (const { orderId, supplierName } of createdOrderIds) {
          setSubmittingStep(`Enviando WhatsApp: ${supplierName}...`);
          
          try {
            // Gerar mensagem com link de confirmação
            const { message, phone } = await generatePackagingOrderMessage(orderId);
            
            if (!phone) {
              result.whatsappFailed++;
              result.failedSuppliers.push(`${supplierName} (sem telefone)`);
              continue;
            }

            // Buscar company_id do pedido
            const { data: orderData } = await supabase
              .from('packaging_orders')
              .select('company_id')
              .eq('id', orderId)
              .single();

            // Enviar mensagem
            const sendResult = await sendWhatsApp(phone, message, orderData?.company_id);
            
            if (sendResult.success) {
              // Atualizar status do pedido para "enviado"
              await supabase
                .from('packaging_orders')
                .update({ status: 'enviado' })
                .eq('id', orderId);
              
              result.whatsappSent++;
            } else {
              result.whatsappFailed++;
              result.failedSuppliers.push(`${supplierName} (${sendResult.error || 'erro no envio'})`);
            }
          } catch (err: any) {
            result.whatsappFailed++;
            result.failedSuppliers.push(`${supplierName} (${err.message || 'erro'})`);
          }
        }
      }

      // STEP 3: Atualizar status da cotação
      setSubmittingStep("Finalizando cotação...");
      await updateQuoteStatus.mutateAsync({ quoteId: quote.id, status: 'concluida' });
      
      setConversionResult(result);
      setConversionDone(true);

      // Toast de sucesso
      if (sendMode === "convert_and_send") {
        if (result.whatsappFailed === 0) {
          toast({
            title: "✅ Pedido(s) criado(s) e enviados!",
            description: `${result.totalOrders} pedido(s) criado(s) e ${result.whatsappSent} enviado(s) via WhatsApp.`,
          });
        } else {
          toast({
            title: "⚠️ Pedido(s) criado(s) com alertas",
            description: `${result.whatsappSent} enviado(s) via WhatsApp, ${result.whatsappFailed} falharam.`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "✅ Pedido(s) criado(s) com sucesso!",
          description: `${result.totalOrders} pedido(s) de embalagens criado(s). Disponíveis na aba de Pedidos.`,
        });
      }
      
      onConversionComplete?.();
    } catch (error) {
      console.error('Erro ao criar pedidos:', error);
      toast({
        title: "Erro ao criar pedidos",
        description: "Ocorreu um erro ao criar os pedidos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setSubmittingStep("");
    }
  };

  const suppliersCount = Object.keys(ordersBySupplier).length;
  const itemsCount = Object.values(ordersBySupplier).reduce((sum, o) => sum + o.items.length, 0);

  // Estado de sucesso
  if (conversionDone && conversionResult) {
    const wasSent = conversionResult.whatsappSent > 0;
    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6",
            wasSent
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : "bg-brand/10"
          )}>
            {wasSent ? (
              <Send className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-brand" />
            )}
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight mb-2">
            {wasSent ? "Pedido(s) Enviados!" : "Pedido(s) Criado(s)!"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {wasSent 
              ? `${conversionResult.totalOrders} pedido(s) criado(s) e ${conversionResult.whatsappSent} enviado(s) via WhatsApp com link de confirmação.`
              : `A cotação foi convertida em ${conversionResult.totalOrders} pedido(s) de embalagens. Disponíveis na aba Pedidos.`
            }
          </p>

          {/* Resumo visual */}
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center gap-3 bg-muted/50 border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-brand" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</span>
              </div>
              <span className="ml-auto text-lg font-black text-brand">{formatCurrency(conversionResult.totalValue)}</span>
            </div>

            {wasSent && (
              <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">WhatsApp</span>
                </div>
                <span className="ml-auto text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {conversionResult.whatsappSent} enviado(s)
                </span>
              </div>
            )}

            {conversionResult.whatsappFailed > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    {conversionResult.whatsappFailed} falha(s) no envio
                  </span>
                </div>
                <div className="space-y-1">
                  {conversionResult.failedSuppliers.map((name, i) => (
                    <p key={i} className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">• {name}</p>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Os pedidos foram criados. Envie manualmente pela aba de Pedidos.
                </p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    );
  }

  // Nenhum fornecedor respondeu
  if (respondedSuppliers.length === 0) {
    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Nenhum Fornecedor Respondeu</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Para converter esta cotação em pedido, pelo menos um fornecedor precisa ter enviado seus preços.
          </p>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-5 space-y-5">
        
        {/* Header da Conversão */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/50">
          <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground tracking-tight">Converter em Pedido(s)</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              {suppliersCount > 1 
                ? `${suppliersCount} pedidos para fornecedores diferentes`
                : "Selecione o modo de conversão e confirme"
              }
            </p>
          </div>
        </div>

        {/* Modo de Conversão */}
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Modo de Conversão</Label>
          <RadioGroup 
            value={conversionMode} 
            onValueChange={(v) => {
              setConversionMode(v as ConversionMode);
              if (v === "custom") initCustomSelections();
            }}
            className="grid grid-cols-2 gap-3"
          >
            <Label
              htmlFor="convert-auto"
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                conversionMode === "auto"
                  ? "bg-brand/5 border-brand/40 ring-1 ring-brand/20"
                  : "bg-card border-border hover:border-brand/20"
              )}
            >
              <RadioGroupItem value="auto" id="convert-auto" className="sr-only" />
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                conversionMode === "auto" ? "bg-brand text-black" : "bg-muted text-muted-foreground"
              )}>
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Melhor Preço</p>
                <p className="text-[10px] text-muted-foreground font-medium">Automático por item</p>
              </div>
            </Label>
            
            <Label
              htmlFor="convert-custom"
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                conversionMode === "custom"
                  ? "bg-brand/5 border-brand/40 ring-1 ring-brand/20"
                  : "bg-card border-border hover:border-brand/20"
              )}
            >
              <RadioGroupItem value="custom" id="convert-custom" className="sr-only" />
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                conversionMode === "custom" ? "bg-brand text-black" : "bg-muted text-muted-foreground"
              )}>
                <Settings2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">Personalizado</p>
                <p className="text-[10px] text-muted-foreground font-medium">Escolher por item</p>
              </div>
            </Label>
          </RadioGroup>
        </div>

        {/* Modo Personalizado - Seleção por Item */}
        {conversionMode === "custom" && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selecionar Fornecedor por Item</Label>
            <div className="space-y-2">
              {quote.itens.map((item) => {
                const best = bestSupplierByItem[item.packagingId];
                const available = respondedSuppliers.filter(f => 
                  f.itens.some(si => si.packagingId === item.packagingId && si.valorTotal && si.valorTotal > 0)
                );
                
                return (
                  <Card key={item.packagingId} className="overflow-hidden border-border/50 bg-card">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-foreground">{item.packagingName}</p>
                          {best && (
                            <p className="text-[10px] text-muted-foreground font-medium">
                              Melhor: {best.supplierName} ({formatCurrency(best.costPerUnit)}/un)
                            </p>
                          )}
                        </div>
                        <Select
                          value={customSelections[item.packagingId] || ""}
                          onValueChange={(v) => handleCustomSelectionChange(item.packagingId, v)}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs font-bold bg-background border-border">
                            <SelectValue placeholder="Fornecedor" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border">
                            {available.map(f => {
                              const supplierItem = f.itens.find(si => si.packagingId === item.packagingId);
                              const isBest = best?.supplierId === f.supplierId;
                              return (
                                <SelectItem key={f.supplierId} value={f.supplierId}>
                                  <div className="flex items-center gap-1">
                                    {isBest && <Award className="h-3 w-3 text-emerald-600" />}
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
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
                  <Card key={supplierId} className="overflow-hidden border-brand/20 bg-card">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-brand/10 flex items-center justify-center">
                            <Building2 className="h-3.5 w-3.5 text-brand" />
                          </div>
                          <span className="font-bold text-sm text-foreground">{orderData.supplierName}</span>
                        </div>
                        <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 font-black text-xs">
                          {formatCurrency(orderTotal)}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        {orderData.items.map(item => (
                          <div key={item.packagingId} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground truncate flex-1 font-medium">{item.packagingName}</span>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={quantities[item.packagingId] || quote?.itens.find(i => i.packagingId === item.packagingId)?.quantidadeNecessaria || 1}
                                onChange={(e) => handleQuantityChange(item.packagingId, e.target.value)}
                                className="w-14 h-6 text-center text-xs font-bold bg-background border-border"
                              />
                              <span className="text-muted-foreground w-20 text-right font-bold">
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

        {/* Data de Entrega e Observações */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Data de Entrega Prevista *
            </Label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="h-10 text-sm font-bold bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Observações (opcional)</Label>
            <Input
              placeholder="Observações sobre o pedido..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="h-10 text-sm bg-background border-border"
            />
          </div>
        </div>

        {/* Total Geral e Economia */}
        <div className="p-4 bg-brand/5 rounded-xl border-2 border-brand/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-brand" />
              <span className="font-black text-sm text-foreground uppercase tracking-wider">Total Geral</span>
              <span className="text-[10px] text-muted-foreground font-bold">
                ({itemsCount} itens em {suppliersCount} pedido{suppliersCount > 1 ? 's' : ''})
              </span>
            </div>
            <span className="text-xl font-black text-brand">
              {formatCurrency(totalGeral)}
            </span>
          </div>
          
          {economiaTotal > 0 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand/20">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-emerald-600" />
                <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Economia Estimada</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  (vs maior preço cotado)
                </span>
              </div>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(economiaTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Opção de Envio: Converter ou Converter + WhatsApp */}
        {Object.keys(ordersBySupplier).length > 0 && (
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ação após conversão</Label>
            <RadioGroup 
              value={sendMode} 
              onValueChange={(v) => setSendMode(v as SendMode)}
              className="grid grid-cols-1 gap-2"
            >
              <Label
                htmlFor="send-convert-and-send"
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                  sendMode === "convert_and_send"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-200 dark:ring-emerald-800"
                    : "bg-card border-border hover:border-emerald-200"
                )}
              >
                <RadioGroupItem value="convert_and_send" id="send-convert-and-send" className="sr-only" />
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                  sendMode === "convert_and_send" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                )}>
                  <Send className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">Converter e Enviar via WhatsApp</p>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    Cria os pedidos e envia automaticamente para cada fornecedor com link de confirmação
                  </p>
                </div>
                {sendMode === "convert_and_send" && (
                  <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 text-[9px] font-black uppercase tracking-wider flex-shrink-0">
                    Recomendado
                  </Badge>
                )}
              </Label>

              <Label
                htmlFor="send-convert-only"
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                  sendMode === "convert_only"
                    ? "bg-brand/5 border-brand/40 ring-1 ring-brand/20"
                    : "bg-card border-border hover:border-brand/20"
                )}
              >
                <RadioGroupItem value="convert_only" id="send-convert-only" className="sr-only" />
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                  sendMode === "convert_only" ? "bg-brand text-black" : "bg-muted text-muted-foreground"
                )}>
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">Apenas Converter em Pedido</p>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    Cria os pedidos sem enviar. Envie manualmente depois pela aba de Pedidos.
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>
        )}

        {/* Botão de Conversão */}
        <Button
          onClick={handleSubmit}
          disabled={!deliveryDate || Object.keys(ordersBySupplier).length === 0 || isSubmitting}
          className={cn(
            "w-full h-12 font-black uppercase tracking-wider text-sm rounded-xl shadow-lg transition-all",
            sendMode === "convert_and_send" 
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              : "bg-brand hover:bg-brand/90 text-black shadow-brand/20"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="truncate">{submittingStep || "Processando..."}</span>
            </span>
          ) : sendMode === "convert_and_send" ? (
            <>
              <Send className="h-5 w-5 mr-2" />
              Converter e Enviar ({suppliersCount} {suppliersCount > 1 ? 'pedidos' : 'pedido'})
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5 mr-2" />
              Criar {suppliersCount > 1 ? `${suppliersCount} Pedidos` : 'Pedido'}
            </>
          )}
        </Button>

        {!deliveryDate && Object.keys(ordersBySupplier).length > 0 && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold text-center uppercase tracking-wider">
            ⚠️ Preencha a data de entrega para habilitar a conversão
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
