import { useState, useMemo } from "react";
import { Package, DollarSign, Trophy, TrendingDown, ShoppingCart, Calendar, FileText, Building2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { designSystem } from "@/styles/design-system";

interface QuoteConversionTabProps {
  products: any[];
  fornecedores: any[];
  quote: any;
  onConvertToOrder?: (quoteId: string, orders: any[]) => void;
  onOpenChange: (open: boolean) => void;
  getSupplierProductValue: (supplierId: string, productId: string) => number;
  getBestPriceInfoForProduct: (productId: string) => { bestPrice: number; bestSupplierId: string | null };
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
  safeStr
}: QuoteConversionTabProps) {
  const { toast } = useToast();
  const [pedidoSubTab, setPedidoSubTab] = useState("melhores");
  const [productSelections, setProductSelections] = useState<Record<string, string>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");

  // Inicializa seleções com melhor preço
  useMemo(() => {
    if (Object.keys(productSelections).length === 0 && products.length > 0) {
      const initialSelections: Record<string, string> = {};
      products.forEach((product: any) => {
        const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
        if (bestSupplierId) initialSelections[product.product_id] = bestSupplierId;
      });
      setProductSelections(initialSelections);
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
      toast({ title: "Informe a data de entrega", variant: "destructive" });
      return;
    }
    if (supplierGroups.length === 0) {
      toast({ title: "Selecione fornecedores para os produtos", variant: "destructive" });
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

  if (products.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
        <div className="p-6 rounded-full bg-zinc-100 dark:bg-zinc-900 mb-6">
          <Inbox className="h-12 w-12 text-zinc-400" />
        </div>
        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase">Nenhum produto</h3>
        <p className="text-zinc-500 text-sm mt-1 mx-auto max-w-[200px]">Não há produtos vinculados a esta cotação para converter.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#83E509]/10">
                  <DollarSign className="h-4 w-4 text-[#83E509]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Total Selecionado</span>
              </div>
              <p className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                R$ {totalSelecao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="absolute top-0 right-0 h-1 w-0 bg-[#83E509] group-hover:w-full transition-all duration-500" />
            </div>

            <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xl overflow-hidden relative group">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-[#83E509]/20">
                  <Trophy className="h-4 w-4 text-[#83E509]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Benchmark (Ideal)</span>
              </div>
              <p className="text-2xl font-black text-white">
                R$ {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingDown className="h-12 w-12 text-[#83E509]" />
              </div>
            </div>
          </div>

          {/* Estratégia */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#83E509] mb-0.5">ESTRATÉGIA</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Como deseja montar o pedido?</span>
            </div>
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
                  const total = products.reduce((sum: number, p: any) => {
                    const value = getSupplierProductValue(f.id, p.product_id);
                    return sum + (value > 0 ? value : Infinity);
                  }, 0);
                  const hasAll = !products.some((p: any) => getSupplierProductValue(f.id, p.product_id) === 0);
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
              <TabsList className="bg-zinc-200 dark:bg-zinc-950 p-1 rounded-xl h-10 border border-zinc-300 dark:border-zinc-800">
                <TabsTrigger value="melhores" className="rounded-lg px-3 text-xs font-bold data-[state=active]:bg-[#83E509] data-[state=active]:text-black transition-all">
                  Melhores Preços
                </TabsTrigger>
                <TabsTrigger value="unico" className="rounded-lg px-3 text-xs font-bold data-[state=active]:bg-[#83E509] data-[state=active]:text-black transition-all">
                  Forn. Único
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Lista de Seleção */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2 p-1">
              <ShoppingCart className="h-4 w-4 text-[#83E509]" />
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Itens e Atribuições</h4>
            </div>
            <div className="space-y-3">
              {products.map((product: any) => {
                const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
                const selectedSupplierId = productSelections[product.product_id];
                const selectedValue = selectedSupplierId ? getSupplierProductValue(selectedSupplierId, product.product_id) : 0;
                const isBest = selectedValue > 0 && Math.abs(selectedValue - bestPrice) < 0.01;

                return (
                  <div
                    key={product.product_id}
                    className={cn(
                      "flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all duration-200 gap-4",
                      isBest
                        ? "bg-white dark:bg-zinc-900/40 border-[#83E509]/30"
                        : "bg-white dark:bg-zinc-900/20 border-zinc-100 dark:border-zinc-800"
                    )}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 truncate">{safeStr(product.product_name)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-black uppercase text-zinc-500 border-zinc-200 dark:border-zinc-800 bg-transparent">
                          {safeStr(product.quantidade)} {safeStr(product.unidade)}
                        </Badge>
                        {isBest && (
                          <div className="flex items-center gap-1 text-[10px] font-black text-[#83E509] uppercase tracking-tighter">
                            <Trophy className="h-3 w-3" /> Benchmark
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <Select
                        value={selectedSupplierId || ""}
                        onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}
                      >
                        <SelectTrigger className={cn("w-full md:w-52 h-10 rounded-xl font-bold text-xs", designSystem.components.input.root)}>
                          <SelectValue placeholder="Selecione Fornecedor" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-800">
                          {fornecedores.filter((f: any) => getSupplierProductValue(f.id, product.product_id) > 0).map((f: any) => (
                            <SelectItem key={f.id} value={f.id} className="text-xs font-bold">{safeStr(f.nome)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="text-right min-w-[120px] pr-2">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Vlr Escolhido</p>
                        <p className={cn(
                          "text-base font-black tracking-tight",
                          isBest ? "text-[#83E509]" : "text-zinc-900 dark:text-zinc-100"
                        )}>
                          R$ {selectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview de Pedidos */}
          {supplierGroups.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2 p-1">
                <Package className="h-4 w-4 text-[#83E509]" />
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">Visualização de Pedidos Gerados</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {supplierGroups.map((group, idx) => (
                  <div key={group.supplierId} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:border-[#83E509]/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950 text-[9px] font-black uppercase tracking-widest">PEDIDO 0{idx + 1}</div>
                      <span className="text-sm font-black text-[#83E509]">
                        R$ {group.products.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate uppercase tracking-tight">{group.supplierName}</p>
                    <p className="text-[10px] font-bold text-zinc-400 truncate opacity-70 mt-1">
                      {group.products.map((p: any) => safeStr(p.product_name)).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dados de Entrega */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#83E509]/20 to-transparent" />
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Expectativa de Entrega *</label>
              <div className="relative group">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#83E509] transition-colors" />
                <Input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={cn("pl-11 h-11 rounded-xl font-bold bg-zinc-900/50", designSystem.components.input.root)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Observações do Pedido</label>
              <div className="relative group">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-[#83E509] transition-colors" />
                <Input
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Ex: Entregar após as 14h..."
                  className={cn("pl-11 h-11 rounded-xl font-bold bg-zinc-900/50", designSystem.components.input.root)}
                />
              </div>
            </div>
          </div>

          {/* Botão de Ação */}
          <Button
            onClick={handleConvertToOrder}
            disabled={!deliveryDate || Object.keys(productSelections).length === 0}
            className="w-full h-14 rounded-2xl bg-[#83E509] hover:bg-[#83E509]/80 text-black font-black text-base shadow-xl shadow-[#83E509]/10 transition-all active:scale-[0.98] disabled:opacity-20 disabled:grayscale"
          >
            <ShoppingCart className="h-5 w-5 mr-3" />
            {supplierGroups.length > 1 ? `FINALIZAR ${supplierGroups.length} PEDIDOS` : "GERAR PEDIDO AGORA"}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
