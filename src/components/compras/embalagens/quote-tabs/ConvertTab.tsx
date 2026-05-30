import { useState, useMemo, useCallback, useEffect } from "react";
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
  Zap, Settings2, TrendingDown, CheckCircle2, Send, MessageCircle, Package
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

  // Inicializar quantidades quando a quote muda
  useEffect(() => {
    if (quote) {
      const initialQuantities: Record<string, number> = {};
      quote.itens.forEach(item => {
        initialQuantities[item.packagingId] = item.quantidadeNecessaria || 1;
      });
      setQuantities(initialQuantities);
    }
  }, [quote]);

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

  const economiaTotal = useMemo(() =>
    Object.values(economiaBySupplier).reduce((sum, val) => sum + val, 0),
  [economiaBySupplier]);

  const initCustomSelections = useCallback(() => {
    const selections: Record<string, string> = {};
    Object.entries(bestSupplierByItem).forEach(([packagingId, data]) => {
      selections[packagingId] = data.supplierId;
    });
    setCustomSelections(selections);
  }, [bestSupplierByItem]);

  const handleQuantityChange = (packagingId: string, value: string) => {
    setQuantities(prev => ({ ...prev, [packagingId]: parseInt(value) || 1 }));
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
            const { message, phone } = await generatePackagingOrderMessage(orderId);

            if (!phone) {
              result.whatsappFailed++;
              result.failedSuppliers.push(`${supplierName} (sem telefone)`);
              continue;
            }

            const { data: orderData } = await supabase
              .from('packaging_orders')
              .select('company_id')
              .eq('id', orderId)
              .single();

            const sendResult = await sendWhatsApp(phone, message, orderData?.company_id);

            if (sendResult.success) {
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

      if (sendMode === "convert_and_send") {
        if (result.whatsappFailed === 0) {
          toast({
            title: "Pedido(s) criado(s) e enviados!",
            description: `${result.totalOrders} pedido(s) criado(s) e ${result.whatsappSent} enviado(s) via WhatsApp.`,
          });
        } else {
          toast({
            title: "Pedido(s) criado(s) com alertas",
            description: `${result.whatsappSent} enviado(s) via WhatsApp, ${result.whatsappFailed} falharam.`,
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Pedido(s) criado(s) com sucesso!",
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
  const canSubmit = !!deliveryDate && Object.keys(ordersBySupplier).length > 0;

  // ── Estado de sucesso ──────────────────────────────────────────────────────
  if (conversionDone && conversionResult) {
    const wasSent = conversionResult.whatsappSent > 0;
    return (
      <ScrollArea className="h-full">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6",
            wasSent ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-brand/10"
          )}>
            {wasSent
              ? <Send className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
              : <CheckCircle2 className="h-10 w-10 text-brand" />
            }
          </div>
          <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">
            {wasSent ? "Pedido(s) Enviados!" : "Pedido(s) Criado(s)!"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {wasSent
              ? `${conversionResult.totalOrders} pedido(s) criado(s) e ${conversionResult.whatsappSent} enviado(s) via WhatsApp com link de confirmação.`
              : `A cotação foi convertida em ${conversionResult.totalOrders} pedido(s). Disponíveis na aba Pedidos.`
            }
          </p>

          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center gap-3 bg-muted/50 border border-border dark:border-white/5 rounded-xl p-4">
              <ShoppingCart className="h-4 w-4 text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total</span>
              <span className="ml-auto text-lg font-bold text-brand tabular-nums">{formatCurrency(conversionResult.totalValue)}</span>
            </div>

            {wasSent && (
              <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4">
                <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">WhatsApp</span>
                <span className="ml-auto text-sm font-bold text-emerald-600 dark:text-emerald-400">
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
                    <p key={i} className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">· {name}</p>
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

  // ── Nenhum fornecedor respondeu ────────────────────────────────────────────
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

  // ── Formulário principal ───────────────────────────────────────────────────
  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-5 space-y-5">

        {/* Modo de Conversão */}
        <div className="space-y-3">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Modo de Conversão
          </Label>
          <RadioGroup
            value={conversionMode}
            onValueChange={(v) => {
              setConversionMode(v as ConversionMode);
              if (v === "custom") initCustomSelections();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {([
              { value: "auto",   Icon: Zap,      label: "Melhor Preço",  desc: "Automático por item" },
              { value: "custom", Icon: Settings2, label: "Personalizado", desc: "Escolher por item"  },
            ] as const).map(({ value, Icon, label, desc }) => {
              const isActive = conversionMode === value;
              return (
                <Label
                  key={value}
                  htmlFor={`convert-${value}`}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                    isActive
                      ? "bg-brand/5 border-brand/40 ring-1 ring-brand/20"
                      : "bg-card border-border hover:border-brand/20"
                  )}
                >
                  <RadioGroupItem value={value} id={`convert-${value}`} className="sr-only" />
                  <div className={cn(
                    "p-1.5 rounded-md transition-colors flex-shrink-0",
                    isActive ? "bg-brand text-white" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{desc}</p>
                  </div>
                </Label>
              );
            })}
          </RadioGroup>
        </div>

        {/* Modo Personalizado — seleção por item */}
        {conversionMode === "custom" && (
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Selecionar Fornecedor por Item
            </Label>
            <div className="space-y-2">
              {quote.itens.map((item) => {
                const best = bestSupplierByItem[item.packagingId];
                const available = respondedSuppliers.filter(f =>
                  f.itens.some(si => si.packagingId === item.packagingId && si.valorTotal && si.valorTotal > 0)
                );
                return (
                  <div key={item.packagingId} className="flex items-center gap-3 p-3 rounded-xl border border-border dark:border-white/5 bg-card">
                    <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0">
                      <Package className="h-3.5 w-3.5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate text-foreground">{item.packagingName}</p>
                      {best && (
                        <p className="text-[10px] text-muted-foreground font-medium">
                          Melhor: {best.supplierName} · {formatCurrency(best.costPerUnit)}/un
                        </p>
                      )}
                    </div>
                    <Select
                      value={customSelections[item.packagingId] || ""}
                      onValueChange={(v) => handleCustomSelectionChange(item.packagingId, v)}
                    >
                      <SelectTrigger className="w-[140px] h-8 text-xs font-bold bg-background border-border flex-shrink-0">
                        <SelectValue placeholder="Fornecedor" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {available.map(f => {
                          const supplierItem = f.itens.find(si => si.packagingId === item.packagingId);
                          const isBest = best?.supplierId === f.supplierId;
                          return (
                            <SelectItem key={f.supplierId} value={f.supplierId}>
                              <div className="flex items-center gap-1.5">
                                {isBest && <Award className="h-3 w-3 text-emerald-600 flex-shrink-0" />}
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
                );
              })}
            </div>
          </div>
        )}

        {/* Resumo dos pedidos a criar */}
        {Object.keys(ordersBySupplier).length > 0 && (
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-white/5 bg-muted/30">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-brand/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-3.5 w-3.5 text-brand" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">{orderData.supplierName}</span>
                      </div>
                      <Badge className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold text-xs tabular-nums">
                        {formatCurrency(orderTotal)}
                      </Badge>
                    </div>
                    <div className="px-4 py-2 space-y-2">
                      {orderData.items.map(item => (
                        <div key={item.packagingId} className="flex items-center gap-3 py-1">
                          <span className="text-sm text-foreground truncate flex-1 font-medium">{item.packagingName}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Input
                              type="number"
                              min="1"
                              value={quantities[item.packagingId] || quote?.itens.find(i => i.packagingId === item.packagingId)?.quantidadeNecessaria || 1}
                              onChange={(e) => handleQuantityChange(item.packagingId, e.target.value)}
                              className="w-16 h-8 text-center text-xs font-bold bg-background border-border"
                            />
                            <span className="text-xs text-muted-foreground w-20 text-right font-bold tabular-nums">
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

        {/* Data de Entrega e Observações */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border dark:border-white/5">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Data de Entrega Prevista <span className="text-brand normal-case font-normal">*</span>
            </Label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className={cn(
                "h-10 text-sm font-bold bg-background border-border",
                !deliveryDate && "border-amber-300 dark:border-amber-700"
              )}
            />
            {!deliveryDate && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                Obrigatório para criar o pedido
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Observações <span className="normal-case font-normal text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              placeholder="Observações sobre o pedido..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="h-10 text-sm bg-background border-border"
            />
          </div>
        </div>

        {/* Total Geral e Economia */}
        <div className="p-4 bg-brand/5 rounded-xl border border-brand/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-brand" />
              <span className="font-bold text-sm text-foreground">Total Geral</span>
              <span className="text-[10px] text-muted-foreground">
                ({itemsCount} {itemsCount === 1 ? 'item' : 'itens'} · {suppliersCount} {suppliersCount === 1 ? 'pedido' : 'pedidos'})
              </span>
            </div>
            <span className="text-xl font-extrabold text-brand tabular-nums">
              {formatCurrency(totalGeral)}
            </span>
          </div>

          {economiaTotal > 0 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-brand/20">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-sm text-emerald-700 dark:text-emerald-400">Economia Estimada</span>
                <span className="text-[10px] text-muted-foreground">(vs maior preço cotado)</span>
              </div>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatCurrency(economiaTotal)}
              </span>
            </div>
          )}
        </div>

        {/* Ação após conversão */}
        {Object.keys(ordersBySupplier).length > 0 && (
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Ação após conversão
            </Label>
            <RadioGroup
              value={sendMode}
              onValueChange={(v) => setSendMode(v as SendMode)}
              className="grid grid-cols-1 gap-2"
            >
              {([
                {
                  value: "convert_and_send",
                  Icon: Send,
                  label: "Converter e Enviar via WhatsApp",
                  desc: "Cria os pedidos e envia automaticamente para cada fornecedor com link de confirmação",
                  activeColor: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-200 dark:ring-emerald-800",
                  iconActive: "bg-emerald-600 text-white",
                  badge: "Recomendado",
                },
                {
                  value: "convert_only",
                  Icon: ShoppingCart,
                  label: "Apenas Converter em Pedido",
                  desc: "Cria os pedidos sem enviar. Envie manualmente depois pela aba de Pedidos.",
                  activeColor: "bg-brand/5 border-brand/40 ring-1 ring-brand/20",
                  iconActive: "bg-brand text-white",
                  badge: null,
                },
              ] as const).map(({ value, Icon, label, desc, activeColor, iconActive, badge }) => {
                const isActive = sendMode === value;
                return (
                  <Label
                    key={value}
                    htmlFor={`send-${value}`}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
                      isActive ? activeColor : "bg-card border-border hover:border-border/80"
                    )}
                  >
                    <RadioGroupItem value={value} id={`send-${value}`} className="sr-only" />
                    <div className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                      isActive ? iconActive : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                    {badge && isActive && (
                      <Badge className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
                        {badge}
                      </Badge>
                    )}
                  </Label>
                );
              })}
            </RadioGroup>
          </div>
        )}

        {/* Botão de Conversão */}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className={cn(
            "h-12 w-full font-bold text-sm rounded-xl shadow-lg transition-all gap-2",
            sendMode === "convert_and_send"
              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
              : "bg-brand hover:bg-brand/90 text-white shadow-brand/20"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
              <span className="truncate">{submittingStep || "Processando..."}</span>
            </>
          ) : sendMode === "convert_and_send" ? (
            <>
              <Send className="h-5 w-5" />
              Converter e Enviar ({suppliersCount} {suppliersCount > 1 ? 'pedidos' : 'pedido'})
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" />
              Criar {suppliersCount > 1 ? `${suppliersCount} Pedidos` : 'Pedido'}
            </>
          )}
        </Button>

        {!deliveryDate && Object.keys(ordersBySupplier).length > 0 && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium text-center">
            Preencha a data de entrega para habilitar a conversão
          </p>
        )}
      </div>
    </ScrollArea>
  );
}
