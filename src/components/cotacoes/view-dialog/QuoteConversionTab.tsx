import { useState, useMemo } from "react";
import { Package, DollarSign, Trophy, TrendingDown, ShoppingCart, Calendar, FileText, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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

  return (
    <div className="p-3 space-y-3">
      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-teal-500/5 dark:bg-teal-900/10 rounded-2xl p-3 border border-teal-500/20 dark:border-teal-800/30 backdrop-blur-md shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <div className="w-6 h-6 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 shadow-sm">
              <DollarSign className="h-3 w-3" />
            </div>
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Total Selecionado</span>
          </div>
          <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter relative z-10">
            <span className="text-xs mr-1 text-teal-500/50">R$</span>
            {totalSelecao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-emerald-500/5 dark:bg-emerald-900/10 rounded-2xl p-3 border border-emerald-500/20 dark:border-emerald-800/30 backdrop-blur-md shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20 shadow-sm">
              <Trophy className="h-3 w-3" />
            </div>
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Melhor Total Possível</span>
          </div>
          <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter relative z-10">
            <span className="text-xs mr-1 text-emerald-500/50">R$</span>
            {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Estratégias */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white/30 dark:bg-black/20 p-2 rounded-xl border border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
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
          <TabsList className="h-8 p-1 bg-white/40 dark:bg-gray-950/40 backdrop-blur-xl rounded-lg border border-white/20 shadow-inner gap-1">
            <TabsTrigger value="melhores" className="h-full px-3 text-[7px] font-black uppercase tracking-widest rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-emerald-600 data-[state=active]:shadow-md transition-all">
              <Trophy className="h-2.5 w-2.5 mr-1.5" /> Melhores Preços
            </TabsTrigger>
            <TabsTrigger value="unico" className="h-full px-3 text-[7px] font-black uppercase tracking-widest rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-blue-600 data-[state=active]:shadow-md transition-all">
              <Building2 className="h-2.5 w-2.5 mr-1.5" /> Fornecedor Único
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {totalSelecao > melhorTotal && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl flex items-center gap-2 animate-bounce-subtle">
          <TrendingDown className="h-3 w-3 text-amber-600" />
          <span className="text-[9px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight">
            Economia Pendente: R$ {(totalSelecao - melhorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      )}

      {/* Tabela de Seleção */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <ShoppingCart className="h-3 w-3 text-teal-500" />
          <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Configuração do Pedido</span>
        </div>
        <Card className="border-white/30 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl shadow-xl rounded-xl overflow-hidden ring-1 ring-white/20">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] border-collapse">
              <thead className="bg-white/30 dark:bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Produto</th>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Qtd</th>
                  <th className="px-3 py-2 text-left text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Fornecedor</th>
                  <th className="px-3 py-2 text-right text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-white/5">
                {products.map((product: any) => {
                  const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
                  const selectedSupplierId = productSelections[product.product_id];
                  const selectedValue = selectedSupplierId ? getSupplierProductValue(selectedSupplierId, product.product_id) : 0;
                  const isBest = selectedValue > 0 && Math.abs(selectedValue - bestPrice) < 0.01;

                  return (
                    <tr key={product.product_id} className={cn("hover:bg-white/20 dark:hover:bg-white/5 transition-all group/row", isBest && "bg-emerald-500/5")}>
                      <td className="px-3 py-1.5">
                        <p className="font-bold text-[11px] text-gray-900 dark:text-white truncate max-w-[200px]" title={safeStr(product.product_name)}>{safeStr(product.product_name)}</p>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded border border-white/20">{safeStr(product.quantidade)} {safeStr(product.unidade)}</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <Select value={selectedSupplierId || ""} onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}>
                          <SelectTrigger className="w-full h-7 bg-white/60 dark:bg-white/5 border-white/30 dark:border-white/10 font-bold rounded-lg text-[10px] shadow-sm transition-all">
                            <SelectValue placeholder="Escolha..." />
                          </SelectTrigger>
                          <SelectContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl border-white/30 rounded-xl shadow-2xl">
                            {fornecedores.filter((f: any) => getSupplierProductValue(f.id, product.product_id) > 0).map((f: any) => (
                              <SelectItem key={f.id} value={f.id} className="font-bold text-xs">
                                {safeStr(f.nome)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className={cn("font-black text-[11px] tracking-tight", isBest ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white")}>
                            R$ {selectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {isBest && (
                            <span className="text-[6px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Melhor</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Preview de Envio */}
      {supplierGroups.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Package className="h-3 w-3 text-blue-500" />
            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Preview de Envio</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {supplierGroups.map((group, index) => (
              <Card key={group.supplierId} className="p-3 bg-white/40 dark:bg-gray-900/40 border-white/30 dark:border-white/10 backdrop-blur-2xl rounded-xl shadow-lg group/order hover:border-blue-500/40 transition-all duration-300">
                <div className="flex items-center justify-between mb-1.5">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 font-black text-[7px] uppercase tracking-widest px-1.5 py-0 rounded shadow-sm">Pedido #{index + 1}</Badge>
                  <span className="font-black text-[10px] text-emerald-600 dark:text-emerald-400">R$ {group.products.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="font-black text-[11px] text-gray-900 dark:text-white truncate mb-0.5 group-hover/order:text-blue-600 transition-colors" title={group.supplierName}>{group.supplierName}</p>
                <div className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter line-clamp-2 leading-relaxed opacity-60">
                  {group.products.map((p: any) => safeStr(p.product_name)).join(", ")}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Dados de Entrega */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/20 dark:bg-black/10 p-3 rounded-xl border border-white/20">
        <div className="space-y-1.5">
          <label className="block text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Data de Entrega *</label>
          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-hover:text-teal-500 transition-colors pointer-events-none" />
            <Input 
              type="date" 
              value={deliveryDate} 
              onChange={(e) => setDeliveryDate(e.target.value)} 
              className="h-9 bg-white/60 dark:bg-gray-950/60 border-white/30 dark:border-white/10 font-bold rounded-xl pl-9 focus:ring-teal-500/20 shadow-sm text-xs" 
              min={new Date().toISOString().split('T')[0]} 
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] pl-1">Observações</label>
          <div className="relative group">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-hover:text-teal-500 transition-colors pointer-events-none" />
            <Input 
              value={observations} 
              onChange={(e) => setObservations(e.target.value)} 
              placeholder="Instruções..." 
              className="h-9 bg-white/60 dark:bg-gray-950/60 border-white/30 dark:border-white/10 font-medium rounded-xl pl-9 focus:ring-teal-500/20 shadow-sm text-xs" 
            />
          </div>
        </div>
      </div>

      {/* Botão de Ação */}
      <div className="pt-1 pb-3">
        <Button 
          onClick={handleConvertToOrder} 
          disabled={!deliveryDate || Object.keys(productSelections).length === 0} 
          className="w-full h-10 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-emerald-500/20 rounded-xl transition-all active:scale-[0.98] ring-2 ring-white/20 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer pointer-events-none"></div>
          <ShoppingCart className="h-3.5 w-3.5 mr-2" />
          {supplierGroups.length > 1 ? `Confirmar ${supplierGroups.length} Pedidos` : "Converter em Pedido"}
        </Button>
      </div>
    </div>
  );
}
