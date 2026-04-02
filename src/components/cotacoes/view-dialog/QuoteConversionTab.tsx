import { useState, useMemo, useEffect } from "react";
import { Package, DollarSign, Trophy, TrendingDown, ShoppingCart, Calendar, FileText, Building2, Inbox, MessageCircle } from "lucide-react";
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
  safeStr
}: QuoteConversionTabProps) {
  const { data: company } = useCompany();
  const [pedidoSubTab, setPedidoSubTab] = useState("melhores");
  const [productSelections, setProductSelections] = useState<Record<string, string>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");
  const [allowItemsWithoutPrice, setAllowItemsWithoutPrice] = useState(false);

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
    return products.reduce((total: number, product: any) => {
      const supplierId = productSelections[product.product_id];
      if (supplierId) return total + getSupplierProductValue(supplierId, product.product_id);
      return total;
    }, 0);
  }, [products, productSelections, getSupplierProductValue]);

  const melhorTotal = useMemo(() => {
    return products.reduce((total: number, product: any) => {
      const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
      return total + bestPrice;
    }, 0);
  }, [products, getBestPriceInfoForProduct]);

  const supplierGroups = useMemo(() => {
    const groups = new Map<string, { supplierId: string; supplierName: string; products: any[] }>();
    Object.entries(productSelections).forEach(([productId, supplierId]) => {
      const product = products.find((p: any) => p.product_id === productId);
      const fornecedor = fornecedores.find((f: any) => f.id === supplierId);
      if (product && fornecedor) {
        if (!groups.has(supplierId)) {
          groups.set(supplierId, { supplierId, supplierName: safeStr(fornecedor.nome), products: [] });
        }
        groups.get(supplierId)!.products.push({
          ...product,
          value: getSupplierProductValue(supplierId, productId)
        });
      }
    });
    return Array.from(groups.values());
  }, [productSelections, products, fornecedores, getSupplierProductValue, safeStr]);

  const handleConvertToOrder = () => {
    if (!deliveryDate) {
      toast.error("Informe a data de entrega");
      return;
    }
    if (supplierGroups.length === 0) {
      toast.error("Selecione fornecedores para os produtos");
      return;
    }
    if (onConvertToOrder) {
      const orders = supplierGroups.map(group => ({
        supplierId: group.supplierId,
        productIds: group.products.map((p: any) => p.product_id),
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
        const { bestPrice } = getBestPriceInfoForProduct(p.product_id);
        const supplierItem = supplierItems.find(si => si.product_id === p.product_id && si.supplier_id === group.supplierId);
        
        return {
          productName: p.product_name,
          product_name: p.product_name, // Suporte a ambos os nomes
          quantidade: p.quantidade,
          unidade: p.unidade,
          bestPrice: p.value,
          bestSupplierId: group.supplierId,
          initialOffer: supplierItem?.price_history?.[0]?.old_price || p.value,
          allPrices: [], // Estrutura mínima
          savings: bestPrice > 0 ? (bestPrice - p.value) : 0
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
      totalSelecao,
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
              onClick={handleWhatsAppExport}
              disabled={Object.keys(productSelections).length === 0}
              className="h-8 border-brand/20 text-brand font-bold text-[9px] uppercase hover:bg-brand/10 transition-all active:scale-95 shadow-sm"
            >
              <MessageCircle className="h-3.5 w-3.5 mr-1" />
              Relatório WhatsApp
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
              }
            }}>
              <TabsList className="bg-muted p-1 rounded-lg h-8 border border-border">
                <TabsTrigger value="melhores" className="rounded-md px-2.5 h-6 text-[10px] font-bold uppercase transition-all">Melhores</TabsTrigger>
                <TabsTrigger value="unico" className="rounded-md px-2.5 h-6 text-[10px] font-bold uppercase transition-all">Unificado</TabsTrigger>
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
          <Button onClick={handleConvertToOrder} disabled={!deliveryDate || Object.keys(productSelections).length === 0} className="w-full h-9 rounded-lg bg-brand hover:bg-brand/80 text-black font-black text-[11px] shadow-sm shadow-brand/20 transition-all">
            <ShoppingCart className="h-3.5 w-3.5 mr-2" />
            Converter em Pedidos de Compra
          </Button>
        </div>
      </div>
    </div>
  );
}
