import { useState, useMemo } from "react";
import { Package, DollarSign, Trophy, TrendingDown, ShoppingCart, Calendar, FileText, Building2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";

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
  const [pedidoSubTab, setPedidoSubTab] = useState("melhores");
  const [productSelections, setProductSelections] = useState<Record<string, string>>({});
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");

  // Initialize selections with best price if empty
  useMemo(() => {
    if (Object.keys(productSelections).length === 0 && products.length > 0) {
      const initialSelections: Record<string, string> = {};
      products.forEach((product: any) => {
        const { bestSupplierId } = getBestPriceInfoForProduct(product.product_id);
        if (bestSupplierId) initialSelections[product.product_id] = bestSupplierId;
      });
      setProductSelections(initialSelections);
    }
  }, [products, getBestPriceInfoForProduct]);

  const totalSelecao = useMemo(() => {
    return products.reduce((total: number, product: any) => {
      const supplierId = productSelections[product.product_id];
      if (supplierId) {
        return total + getSupplierProductValue(supplierId, product.product_id);
      }
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
      <div className="flex-1 flex items-center justify-center p-12">
        <EmptyState 
          icon={Inbox}
          title="Nenhum produto disponível"
          description="Não há produtos nesta cotação para converter em pedido."
          variant="inline"
        />
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 bg-gray-50 dark:bg-gray-900 min-h-full">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-950 rounded-2xl p-3 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 border border-gray-200 dark:border-gray-700 shadow-sm">
              <DollarSign className="h-3 w-3" />
            </div>
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Total Selecionado</span>
          </div>
          <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter relative z-10">
            <span className="text-xs mr-1 text-gray-400">R$</span>
            {totalSelecao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-950 rounded-2xl p-3 border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <div className="w-6 h-6 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 border border-gray-900 dark:border-white shadow-sm">
              <Trophy className="h-3 w-3" />
            </div>
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Melhor Total Possível</span>
          </div>
          <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter relative z-10">
            <span className="text-xs mr-1 text-gray-400">R$</span>
            {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Estratégias */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white dark:bg-gray-950 p-2 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-pulse"></div>
          <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Estratégia de Seleção</span>
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
            const supplierTotalsArray = fornecedores.map((f: any) => {
              const total = products.reduce((sum: number, p: any) => {
                const value = getSupplierProductValue(f.id, p.product_id);
                return sum + (value > 0 ? value : Infinity);
              }, 0);
              return { id: f.id, total, hasAllProducts: !products.some((p: any) => getSupplierProductValue(f.id, p.product_id) === 0) };
            }).filter((s: any) => s.hasAllProducts).sort((a: any, b: any) => a.total - b.total);
            
            if (supplierTotalsArray.length > 0) {
              const bestSingleSupplier = supplierTotalsArray[0].id;
              const singleSelections: Record<string, string> = {};
              products.forEach((product: any) => {
                singleSelections[product.product_id] = bestSingleSupplier;
              });
              setProductSelections(singleSelections);
            }
          }
        }}>
          <TabsList className="h-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-inner gap-1">
            <TabsTrigger value="melhores" className="h-full px-3 text-[7px] font-black uppercase tracking-widest rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
              <Trophy className="h-2.5 w-2.5 mr-1.5" /> Melhores Preços
            </TabsTrigger>
            <TabsTrigger value="unico" className="h-full px-3 text-[7px] font-black uppercase tracking-widest rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-950 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all">
              <Building2 className="h-2.5 w-2.5 mr-1.5" /> Fornecedor Único
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {totalSelecao > melhorTotal && (
        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-xl flex items-center gap-2 animate-bounce-subtle">
          <TrendingDown className="h-3 w-3 text-gray-500" />
          <span className="text-[9px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">
            Economia Pendente: R$ {(totalSelecao - melhorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Tabela de Seleção */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <ShoppingCart className="h-3 w-3 text-gray-400" />
          <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Configuração do Pedido</span>
        </div>
        
        {/* Header da Tabela (Fixo) - Igual ao QuoteValuesTab */}
        <div className="grid grid-cols-[1.5fr_0.8fr_1.5fr_auto] gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-gray-800 text-[8px] font-black uppercase text-gray-500 tracking-[0.2em] bg-gray-100 dark:bg-gray-800 rounded-t-xl">
           <div>Produto</div>
           <div className="hidden sm:block">Qtd</div>
           <div>Fornecedor</div>
           <div className="text-right">Subtotal</div>
        </div>

        <div className="flex flex-col gap-1.5">
          {products.map((product: any) => {
            const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
            const selectedSupplierId = productSelections[product.product_id];
            const selectedValue = selectedSupplierId ? getSupplierProductValue(selectedSupplierId, product.product_id) : 0;
            const isBest = selectedValue > 0 && Math.abs(selectedValue - bestPrice) < 0.01;

            return (
              <div 
                key={product.product_id} 
                className={cn(
                  "flex items-center px-3 rounded-xl border transition-all duration-300 group/row bg-white dark:bg-gray-950 shadow-sm hover:shadow-md", 
                  isBest ? "border-emerald-200 dark:border-emerald-800/50" : "border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                )}
                style={{ height: '52px' }}
              >
                <div className="grid grid-cols-[1.5fr_0.8fr_1.5fr_auto] gap-2 w-full items-center">
                  {/* Produto */}
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] text-gray-900 dark:text-white truncate tracking-tight" title={safeStr(product.product_name)}>
                      {safeStr(product.product_name)}
                    </p>
                    <span className="sm:hidden text-[7px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800 px-1 py-0 rounded border border-gray-200 dark:border-gray-700 w-fit mt-0.5 block">
                      {safeStr(product.quantidade)} {safeStr(product.unidade)}
                    </span>
                  </div>

                  {/* Qtd Desktop */}
                  <div className="hidden sm:block">
                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                      {safeStr(product.quantidade)} {safeStr(product.unidade)}
                    </span>
                  </div>

                  {/* Select Fornecedor */}
                  <div className="min-w-0">
                    <Select value={selectedSupplierId || ""} onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}>
                      <SelectTrigger className="w-full h-7 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 font-bold rounded-lg text-[10px] shadow-sm transition-all text-gray-700 dark:text-gray-300">
                        <SelectValue placeholder="Escolha..." />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                        {fornecedores.filter((f: any) => getSupplierProductValue(f.id, product.product_id) > 0).map((f: any) => (
                          <SelectItem key={f.id} value={f.id} className="font-bold text-xs">
                            {safeStr(f.nome)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      <span className={cn("font-bold text-[11px] tracking-tight", isBest ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>
                        R$ {selectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {isBest && (
                        <div className="bg-gray-900 text-white dark:bg-white dark:text-gray-900 border border-gray-800 dark:border-gray-200 px-1.5 py-0 rounded text-[6px] font-black uppercase tracking-wider shadow-sm flex items-center gap-0.5 mt-0.5">
                          <Trophy className="h-2 w-2" />
                          Melhor
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview de Envio */}
      {supplierGroups.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Package className="h-3 w-3 text-gray-400" />
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Preview de Envio</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {supplierGroups.map((group, index) => (
              <Card key={group.supplierId} className="p-3 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-xl shadow-sm group/order hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300">
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant="outline" className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded shadow-sm">Pedido #{index + 1}</Badge>
                  <span className="font-black text-[10px] text-gray-900 dark:text-white">R$ {group.products.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="font-black text-[11px] text-gray-900 dark:text-white truncate mb-0.5 group-hover/order:text-gray-600 transition-colors" title={group.supplierName}>{group.supplierName}</p>
                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter line-clamp-2 leading-relaxed opacity-60">
                  {group.products.map((p: any) => safeStr(p.product_name)).join(", ")}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dados de Entrega */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-gray-950 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="space-y-1.5">
          <label className="block text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Data de Entrega *</label>
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors pointer-events-none" />
            <Input 
              type="date" 
              value={deliveryDate} 
              onChange={(e) => setDeliveryDate(e.target.value)} 
              className="h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 font-bold rounded-xl pl-9 focus:ring-gray-400/20 shadow-sm text-xs" 
              min={new Date().toISOString().split('T')[0]} 
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Observações</label>
          <div className="relative group">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors pointer-events-none" />
            <Input 
              value={observations} 
              onChange={(e) => setObservations(e.target.value)} 
              placeholder="Instruções..." 
              className="h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 font-medium rounded-xl pl-9 focus:ring-gray-400/20 shadow-sm text-xs" 
            />
          </div>
        </div>
      </div>

      {/* Botão de Ação */}
      <div className="pt-1 pb-3">
        <Button 
          onClick={handleConvertToOrder} 
          disabled={!deliveryDate || Object.keys(productSelections).length === 0} 
          className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 rounded-xl transition-all active:scale-[0.98] ring-2 ring-white/20 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
          <ShoppingCart className="h-3.5 w-3.5 mr-2" />
          {supplierGroups.length > 1 ? `Confirmar ${supplierGroups.length} Pedidos` : "Converter em Pedido"}
        </Button>
      </div>
    </div>
  );
}
