import { useState, useMemo, useEffect } from "react";
import { Package, DollarSign, Trophy, TrendingDown, ShoppingCart, Calendar, FileText, Building2, Inbox, MessageCircle, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCompany } from "@/hooks/useCompany";
import { designSystem } from "@/styles/design-system";
import { generateQuoteExportMessage } from "@/lib/whatsapp-service";
import { Switch } from "@/components/ui/switch";

interface QuoteConversionTabProps {
  products: any[];
  fornecedores: any[];
  quote: any;
  onConvertToOrder?: (quoteId: string, orders: any[]) => void;
  onOpenChange: (open: boolean) => void;
  getSupplierProductValue: (supplierId: string, productId: string) => number;
  getBestPriceInfoForProduct: (productId: string) => { bestPrice: number; bestSupplierId: string | null };
  supplierItems?: any[];
  safeStr: (val: any) => string;
  onShowResumo?: () => void;
}

export function QuoteConversionTab({
  products,
  fornecedores,
  quote,
  onConvertToOrder,
  onOpenChange,
  getSupplierProductValue,
  getBestPriceInfoForProduct,
  supplierItems = [],
  safeStr,
  onShowResumo
}: QuoteConversionTabProps) {
  const { data: company } = useCompany();
  const [pedidoSubTab, setPedidoSubTab] = useState("melhores");
  const [productSelections, setProductSelections] = useState<Record<string, string>>({});
  const [productAllocations, setProductAllocations] = useState<Record<string, Record<string, number>>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");
  const [allowItemsWithoutPrice, setAllowItemsWithoutPrice] = useState(false);

  const updateAllocation = (productId: string, supplierId: string, qty: number) => {
    setProductAllocations(prev => {
      const prodAllocs = { ...(prev[productId] || {}) };
      if (qty <= 0) {
        delete prodAllocs[supplierId];
      } else {
        prodAllocs[supplierId] = qty;
      }
      return { ...prev, [productId]: prodAllocs };
    });
  };

  useEffect(() => {
    // Inicializa as seleções apenas uma vez quando os produtos carregarem
    // e se ainda não houver seleções feitas pelo usuário
    if (Object.keys(productSelections).length === 0 && products.length > 0) {
      const initialSelections: Record<string, string> = {};
      let hasSelections = false;

      products.forEach((product: any) => {
        const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
        if (bestSupplierId) {
          initialSelections[product.product_id] = bestSupplierId;
          hasSelections = true;
        }
      });

      if (hasSelections) {
        setProductSelections(initialSelections);
      } else {
        // Se nenhum produto tem melhor fornecedor (ex: sem preços), 
        // marcamos como inicializado com um objeto vazio mas evitamos o loop
        // definindo um valor que impeça a re-execução desta lógica se necessário,
        // mas aqui o products.length > 0 e Object.keys(productSelections).length === 0
        // continuaria sendo verdade. 
        // Vamos usar uma marcação interna ou apenas aceitar que se não há fornecedores,
        // não fazemos o set.
      }
    }
  }, [products, getBestPriceInfoForProduct, productSelections]);

  const totalSelecao = useMemo(() => {
    if (pedidoSubTab === 'dividido') {
      return Object.entries(productAllocations).reduce((total, [productId, allocs]) => {
        const totalQuoteQty = parseFloat(products.find(p => p.product_id === productId)?.quantidade?.toString().replace(',', '.') || '1') || 1;
        return total + Object.entries(allocs).reduce((sum, [supplierId, qty]) => {
          const unitPrice = getSupplierProductValue(supplierId, productId) / totalQuoteQty;
          return sum + (unitPrice * qty);
        }, 0);
      }, 0);
    }
    return products.reduce((total: number, product: any) => {
      const supplierId = productSelections[product.product_id];
      if (supplierId) {
        return total + getSupplierProductValue(supplierId, product.product_id);
      }
      return total;
    }, 0);
  }, [products, productSelections, productAllocations, pedidoSubTab, getSupplierProductValue]);

  const melhorTotal = useMemo(() => {
    return products.reduce((total: number, product: any) => {
      const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
      return total + bestPrice;
    }, 0);
  }, [products, getBestPriceInfoForProduct]);

  const supplierGroups = useMemo(() => {
    const groups = new Map<string, { supplierId: string; supplierName: string; products: any[], productQuantities: Record<string, number> }>();
    
    if (pedidoSubTab === "dividido") {
      Object.entries(productAllocations).forEach(([productId, allocs]) => {
        const product = products.find((p: any) => p.product_id === productId);
        if (!product) return;

        Object.entries(allocs).forEach(([supplierId, qty]) => {
          if (qty > 0) {
            const fornecedor = fornecedores.find((f: any) => f.id === supplierId);
            if (fornecedor) {
              if (!groups.has(supplierId)) {
                groups.set(supplierId, { supplierId, supplierName: safeStr(fornecedor.nome), products: [], productQuantities: {} });
              }
              const g = groups.get(supplierId)!;
              
              const totalQuoteQty = parseFloat(product.quantidade?.toString().replace(',', '.') || '1') || 1;
              const unitPrice = getSupplierProductValue(supplierId, productId) / totalQuoteQty;

              g.products.push({
                ...product,
                value: unitPrice * qty,
                quantidade: qty
              });
              g.productQuantities[productId] = qty;
            }
          }
        });
      });
    } else {
      Object.entries(productSelections).forEach(([productId, supplierId]) => {
        const product = products.find((p: any) => p.product_id === productId);
        const fornecedor = fornecedores.find((f: any) => f.id === supplierId);
        if (product && fornecedor) {
          if (!groups.has(supplierId)) {
            groups.set(supplierId, { supplierId, supplierName: safeStr(fornecedor.nome), products: [], productQuantities: {} });
          }
          const g = groups.get(supplierId)!;
          g.products.push({
            ...product,
            value: getSupplierProductValue(supplierId, productId)
          });
          g.productQuantities[productId] = parseFloat(product.quantidade?.toString().replace(',', '.') || '0');
        }
      });
    }
    return Array.from(groups.values());
  }, [productSelections, productAllocations, pedidoSubTab, products, fornecedores, getSupplierProductValue, safeStr]);

  // Total da seleção para exibição no botão/header
  const totalDisplay = totalSelecao;

  const handleConvertToOrder = () => {
    if (!deliveryDate) {
      toast.error("Informe a data de entrega");
      return;
    }
    if (supplierGroups.length === 0) {
      toast.error("Selecione fornecedores para os produtos");
      return;
    }

    // Validação de alocação incompleta em modo dividido
    if (pedidoSubTab === 'dividido') {
      const incompleteProducts = products.filter(product => {
        const allocs = productAllocations[product.product_id] || {};
        const totalAllocated = Object.values(allocs).reduce((sum, q) => sum + (Number(q) || 0), 0);
        return Math.abs(totalAllocated - (parseFloat(product.quantidade?.toString().replace(',', '.') || '0'))) > 0.01;
      });

      if (incompleteProducts.length > 0) {
        if (!confirm(`Alguns produtos não foram totalmente alocados ou excedem a quantidade total. Deseja continuar mesmo assim?\n\nProdutos: ${incompleteProducts.map(p => safeStr(p.product_name)).join(', ')}`)) {
          return;
        }
      }
    }

    if (onConvertToOrder) {
      const orders = supplierGroups.map(group => ({
        supplierId: group.supplierId,
        productIds: group.products.map((p: any) => p.product_id),
        productQuantities: group.productQuantities,
        deliveryDate,
        observations: observations || undefined
      }));
      onConvertToOrder(quote.id, orders);
      onOpenChange(false);
    }
  };

  const handleWhatsAppExport = () => {
    // Calcular estatísticas para o export baseado nas SELEÇÕES ATUAIS
    const statsExport = {
      totalProdutos: products.length,
      totalFornecedores: fornecedores.length,
      fornecedoresRespondidos: fornecedores.filter((f: any) => f.status === 'respondido').length,
    };

    const groupedDataExport = supplierGroups.map(group => ({
      name: group.supplierName,
      total: group.products.reduce((acc, p) => acc + p.value, 0),
      items: group.products.map(p => {
        const { bestPrice: mktBestPrice } = getBestPriceInfoForProduct(p.product_id);
        const supplierItem = supplierItems.find(si => si.product_id === p.product_id && si.supplier_id === group.supplierId);
        
        const totalQuoteQty = parseFloat(products.find(prod => prod.product_id === p.product_id)?.quantidade?.toString().replace(',', '.') || '1') || 1;
        const unitPrice = getSupplierProductValue(group.supplierId, p.product_id) / totalQuoteQty;
        const unitBestPrice = mktBestPrice / totalQuoteQty;
        const unitInitialOffer = Number(supplierItem?.valor_inicial) || unitPrice;

        return {
          productName: p.product_name,
          product_name: p.product_name,
          quantidade: p.quantidade,
          unidade: p.unidade,
          bestPrice: unitPrice, // Preço unitário selecionado
          bestSupplierId: group.supplierId,
          initialOffer: unitInitialOffer,
          allPrices: [],
          savings: unitBestPrice > 0 ? (unitBestPrice - unitPrice) : 0
        };
      })
    }));

    // Economia Real: Diferença entre a primeira oferta do fornecedor e o preço final selecionado
    const totalNegotiatedSavings = groupedDataExport.reduce((acc, g) => 
      acc + g.items.reduce((sum, i: any) => sum + (Math.max(0, (i.initialOffer - i.bestPrice)) * i.quantidade), 0), 0
    );

    // Economia de Mercado: Diferença entre o melhor preço global e o selecionado
    const totalMarketPotential = groupedDataExport.reduce((acc, g) => 
      acc + g.items.reduce((sum, i: any) => sum + (i.savings > 0 ? i.savings * i.quantidade : 0), 0), 0
    );

    const exportMsg = generateQuoteExportMessage(
      statsExport,
      groupedDataExport,
      totalNegotiatedSavings,
      totalDisplay,
      (quote as any).analise_ia || null,
      totalMarketPotential
    );

    toast.promise(
      import("@/lib/whatsapp-service").then(async m => {
        const res: any = await m.sendWhatsApp(m.DEFAULT_PHONE_NUMBER, exportMsg, company?.id);
        if (res?.success === false) throw new Error(res.error || "Erro desconhecido");
        return res;
      }),
      {
        loading: 'Enviando relatório para WhatsApp...',
        success: 'Relatório enviado com sucesso via API!',
        error: (err) => `Falha no envio via API: ${err.message}`
      }
    );
  };

  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
        <Inbox className="h-12 w-12 text-zinc-400 mb-6" />
        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase">Nenhum produto</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-background overflow-hidden relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-4 pb-16">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-brand leading-none">Estratégia</span>
            <span className="text-xs font-bold text-foreground leading-none">Montagem do pedido</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onShowResumo}
              className="h-8 border-emerald-500/30 text-emerald-600 font-black text-[9px] uppercase hover:bg-emerald-50 transition-all active:scale-95 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Relatório Visual
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsAppExport}
              disabled={Object.keys(productSelections).length === 0}
              className="h-8 border-brand/20 text-brand font-bold text-[9px] uppercase hover:bg-brand/10 transition-all active:scale-95 shadow-sm"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Relatório Texto
            </Button>
            <Tabs value={pedidoSubTab} onValueChange={(val) => {
              setPedidoSubTab(val);
              if (val === "melhores") {
                const bestSelections: Record<string, string> = {};
                products.forEach((product: any) => {
                  const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
                  if (bestSupplierId) bestSelections[product.product_id] = bestSupplierId;
                });
                setProductSelections(bestSelections);
              } else if (val === "unico") {
                const supplierTotals = fornecedores.map((f: any) => {
                  const total = products.reduce((sum: number, p: any) => sum + getSupplierProductValue(f.id, p.product_id), 0);
                  const hasAll = allowItemsWithoutPrice || !products.some((p: any) => getSupplierProductValue(f.id, p.product_id) === 0);
                  return { id: f.id, total, hasAll };
                }).filter(s => s.hasAll).sort((a, b) => a.total - b.total);
                if (supplierTotals.length > 0) {
                  const best = supplierTotals[0].id;
                  const single: Record<string, string> = {};
                  products.forEach((p: any) => { single[p.product_id] = best; });
                  setProductSelections(single);
                }
              } else if (val === "dividido") {
                const initialAllocations: Record<string, Record<string, number>> = {};
                products.forEach((p: any) => {
                  const selectedSupplier = productSelections[p.product_id];
                  if (selectedSupplier) {
                    initialAllocations[p.product_id] = { [selectedSupplier]: p.quantidade || 0 };
                  } else {
                    initialAllocations[p.product_id] = {};
                  }
                });
                setProductAllocations(initialAllocations);
              }
            }}>
              <TabsList className="bg-muted p-1 rounded-lg h-8 border border-border">
                <TabsTrigger value="melhores" className="rounded-md px-2.5 h-6 text-[10px] font-bold uppercase transition-all">Melhores</TabsTrigger>
                <TabsTrigger value="unico" className="rounded-md px-2.5 h-6 text-[10px] font-bold uppercase transition-all">Unificado</TabsTrigger>
                <TabsTrigger value="dividido" className="rounded-md px-2.5 h-6 text-[10px] font-bold uppercase transition-all">Dividido</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-brand" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Itens e Fornecedores</h4>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-muted-foreground mr-1">Permitir item sem oferta</span>
               <Switch checked={allowItemsWithoutPrice} onCheckedChange={setAllowItemsWithoutPrice} className="scale-75 data-[state=checked]:bg-brand" />
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl shadow-sm">
            {pedidoSubTab === 'dividido' ? (
              <div className="divide-y divide-border/50 max-h-[350px] overflow-y-auto custom-scrollbar p-2">
                {products.map((product: any) => {
                  const allocs = productAllocations[product.product_id] || {};
                  const totalAllocated = Object.values(allocs).reduce((sum, q) => sum + (Number(q) || 0), 0);
                  const totalQuoteQty = parseFloat(product.quantidade?.toString().replace(',', '.') || '0');
                  const isComplete = Math.abs(totalAllocated - totalQuoteQty) < 0.01;
                  const isOver = totalAllocated > totalQuoteQty + 0.01;

                  return (
                    <div key={product.product_id} className="p-3 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-[11px] text-foreground">{safeStr(product.product_name)}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                            Total: {safeStr(product.quantidade)} {safeStr(product.unidade)}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={isComplete ? "default" : isOver ? "destructive" : "outline"} className={cn("text-[9px] uppercase", isComplete ? "bg-emerald-500 hover:bg-emerald-600" : "")}>
                            {totalAllocated} / {product.quantidade} Alocados
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {fornecedores.filter((f: any) => allowItemsWithoutPrice || getSupplierProductValue(f.id, product.product_id) > 0).map((f: any) => {
                          const totalVal = getSupplierProductValue(f.id, product.product_id);
                          const unitPrice = totalVal / (totalQuoteQty || 1);
                          const qty = allocs[f.id] || 0;
                          return (
                            <div key={f.id} className="flex items-center justify-between gap-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold uppercase truncate">{safeStr(f.nome)}</p>
                                <p className="text-[9px] text-muted-foreground">R$ {unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / {safeStr(product.unidade)}</p>
                              </div>
                              <div className="w-24">
                                <Input 
                                  type="number" 
                                  min="0"
                                  step="any"
                                  value={qty === 0 ? "" : qty} 
                                  onChange={(e) => updateAllocation(product.product_id, f.id, parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="h-7 text-right text-xs font-bold bg-background"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[1fr_minmax(140px,200px)_100px] gap-2 px-3 py-2 bg-muted/40 border-b border-border items-center hidden sm:grid">
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Produto</span>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Fornecedor Alocado</span>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest text-right pr-1">Subtotal</span>
                </div>
                <div className="divide-y divide-border/50 max-h-[350px] overflow-y-auto custom-scrollbar">
                  {products.map((product: any) => {
                    const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
                    const selectedSupplierId = productSelections[product.product_id];
                    const selectedValue = selectedSupplierId ? getSupplierProductValue(selectedSupplierId, product.product_id) : 0;
                    const isBest = selectedValue > 0 && Math.abs(selectedValue - bestPrice) < 0.01;

                    return (
                      <div key={product.product_id} className={cn("grid grid-cols-1 sm:grid-cols-[1fr_minmax(140px,200px)_100px] gap-2 p-2 sm:px-3 items-center transition-colors hover:bg-muted/10", isBest ? "bg-brand/5" : "")}>
                        <div className="min-w-0 pl-1">
                          <p className="font-bold text-[10px] sm:text-[11px] text-foreground truncate">{safeStr(product.product_name)}</p>
                          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{safeStr(product.quantidade)} {safeStr(product.unidade)}</p>
                        </div>
                        <div>
                          <Select value={selectedSupplierId || ""} onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}>
                            <SelectTrigger className="w-full h-7 rounded-md font-bold text-[10px] border-border/70 bg-background hover:bg-muted/50 transition-colors">
                              <SelectValue placeholder="Fornecedor..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border">
                              {fornecedores.filter((f: any) => allowItemsWithoutPrice || getSupplierProductValue(f.id, product.product_id) > 0).map((f: any) => (
                                <SelectItem key={f.id} value={f.id} className="text-[11px] sm:text-xs font-bold uppercase">
                                  {safeStr(f.nome)} {getSupplierProductValue(f.id, product.product_id) > 0 ? '' : '(Sem Oferta)'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pr-1 gap-1">
                          <p className="text-[8px] font-bold text-muted-foreground uppercase sm:hidden block">Subtotal:</p>
                          <div className="flex items-center gap-1">
                            {isBest && <Trophy className="h-2.5 w-2.5 text-brand" />}
                            <p className={cn("text-[10px] sm:text-[11px] font-black", isBest ? "text-brand" : "text-foreground")}>
                              R$ {selectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/50 shadow-sm relative overflow-hidden">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1 block">Entrega *</label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="h-9 rounded-lg font-bold text-xs bg-background"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1 block">Observações do Pedido</label>
            <Input
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Entregar após as 14h..."
              className="h-9 rounded-lg font-bold text-xs bg-background"
            />
          </div>
        </div>
        
        <div className="pt-2">
          <Button onClick={handleConvertToOrder} disabled={!deliveryDate || (pedidoSubTab === 'dividido' ? Object.keys(productAllocations).length === 0 : Object.keys(productSelections).length === 0)} className="w-full h-9 rounded-lg bg-brand hover:bg-brand/80 text-black font-black text-[11px] shadow-sm shadow-brand/20 transition-all">
            <ShoppingCart className="h-3.5 w-3.5 mr-2" />
            Converter em Pedidos (R$ {totalDisplay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
          </Button>
        </div>
      </div>
    </div>
  );
}
