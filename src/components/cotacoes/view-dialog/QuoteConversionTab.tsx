import { useState, useMemo } from "react";
import { Package, DollarSign, Trophy, TrendingDown, ShoppingCart, Calendar, FileText, Building2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
      <div className="flex-1 flex items-center justify-center p-12">
        <EmptyState
          icon={Inbox}
          title="Nenhum produto"
          description="Não há produtos para converter."
          variant="inline"
        />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-teal-600" />
              <span className="text-xs text-teal-700">Total Selecionado</span>
            </div>
            <p className="text-2xl font-bold text-teal-800">
              R$ {totalSelecao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700">Melhor Total Possível</span>
            </div>
            <p className="text-2xl font-bold text-green-800">
              R$ {melhorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Estratégia */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border">
          <span className="text-sm font-medium text-gray-600">Estratégia de Seleção:</span>
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
            <TabsList className="h-8">
              <TabsTrigger value="melhores" className="text-xs">
                <Trophy className="h-3 w-3 mr-1" /> Melhores Preços
              </TabsTrigger>
              <TabsTrigger value="unico" className="text-xs">
                <Building2 className="h-3 w-3 mr-1" /> Fornecedor Único
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Lista de Seleção */}
        <div className="space-y-2">
          <h4 className="font-semibold flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Configurar Pedido
          </h4>
          {products.map((product: any) => {
            const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
            const selectedSupplierId = productSelections[product.product_id];
            const selectedValue = selectedSupplierId ? getSupplierProductValue(selectedSupplierId, product.product_id) : 0;
            const isBest = selectedValue > 0 && Math.abs(selectedValue - bestPrice) < 0.01;

            return (
              <div
                key={product.product_id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  isBest ? "bg-green-50 border-green-200" : "bg-white"
                )}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{safeStr(product.product_name)}</p>
                  <p className="text-xs text-muted-foreground">Qtd: {safeStr(product.quantidade)} {safeStr(product.unidade)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedSupplierId || ""}
                    onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.filter((f: any) => getSupplierProductValue(f.id, product.product_id) > 0).map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>{safeStr(f.nome)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-right min-w-[100px]">
                    <p className={cn("font-semibold", isBest ? "text-green-600" : "text-gray-700")}>
                      R$ {selectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {isBest && <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Melhor</Badge>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview de Pedidos */}
        {supplierGroups.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Preview de Envio ({supplierGroups.length} {supplierGroups.length === 1 ? 'pedido' : 'pedidos'})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {supplierGroups.map((group, idx) => (
                <div key={group.supplierId} className="p-3 rounded-lg bg-gray-50 border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Pedido #{idx + 1}</Badge>
                    <span className="font-semibold">
                      R$ {group.products.reduce((sum: number, p: any) => sum + p.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="font-medium">{group.supplierName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {group.products.map((p: any) => safeStr(p.product_name)).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dados de Entrega */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Data de Entrega *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Observações</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Instruções..."
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Botão de Ação */}
        <Button
          onClick={handleConvertToOrder}
          disabled={!deliveryDate || Object.keys(productSelections).length === 0}
          className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {supplierGroups.length > 1 ? `Confirmar ${supplierGroups.length} Pedidos` : "Converter em Pedido"}
        </Button>
      </div>
    </ScrollArea>
  );
}
