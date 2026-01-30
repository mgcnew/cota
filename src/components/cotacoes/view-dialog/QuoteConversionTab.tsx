import { useState, useMemo, useEffect } from "react";
import { Package, DollarSign, Trophy, TrendingDown, ShoppingCart, Calendar, FileText, Building2, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
        <Inbox className="h-12 w-12 text-zinc-400 mb-6" />
        <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 tracking-tight uppercase">Nenhum produto</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-background">
      <div className="p-6 space-y-6 pb-20">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand mb-0.5">ESTRATÉGIA</span>
            <span className="text-sm font-bold text-foreground">Montagem do pedido</span>
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
                const total = products.reduce((sum: number, p: any) => sum + getSupplierProductValue(f.id, p.product_id), 0);
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
            <TabsList className="bg-muted p-1 rounded-xl h-10 border border-border">
              <TabsTrigger value="melhores" className="rounded-lg px-3 text-xs font-bold transition-all">Melhores Preços</TabsTrigger>
              <TabsTrigger value="unico" className="rounded-lg px-3 text-xs font-bold transition-all">Forn. Único</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2 p-1">
            <ShoppingCart className="h-4 w-4 text-brand" />
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Itens e Atribuições</h4>
          </div>
          <div className="space-y-3">
            {products.map((product: any) => {
              const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
              const selectedSupplierId = productSelections[product.product_id];
              const selectedValue = selectedSupplierId ? getSupplierProductValue(selectedSupplierId, product.product_id) : 0;
              const isBest = selectedValue > 0 && Math.abs(selectedValue - bestPrice) < 0.01;

              return (
                <div key={product.product_id} className={cn("flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border transition-all duration-200 gap-4", isBest ? "bg-card/50 border-brand/30" : "bg-card border-border")}>
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-bold text-foreground truncate">{safeStr(product.product_name)}</p>
                    <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-black uppercase text-muted-foreground mt-1">{safeStr(product.quantidade)} {safeStr(product.unidade)}</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select value={selectedSupplierId || ""} onValueChange={(value) => setProductSelections(prev => ({ ...prev, [product.product_id]: value }))}>
                      <SelectTrigger className={cn("w-full md:w-52 h-10 rounded-xl font-bold text-xs", designSystem.components.input.root)}>
                        <SelectValue placeholder="Selecione Fornecedor" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        {fornecedores.filter((f: any) => getSupplierProductValue(f.id, product.product_id) > 0).map((f: any) => (
                          <SelectItem key={f.id} value={f.id} className="text-xs font-bold">{safeStr(f.nome)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-right min-w-[120px] pr-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Valor</p>
                      <p className={cn("text-base font-black", isBest ? "text-brand" : "text-foreground")}>
                        R$ {selectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 rounded-2xl bg-muted/30 border border-border/50 shadow-sm relative overflow-hidden">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Entrega *</label>
            <Input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className={cn("h-11 rounded-xl font-bold bg-background", designSystem.components.input.root)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Observações</label>
            <Input
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Ex: Entregar após as 14h..."
              className={cn("h-11 rounded-xl font-bold bg-background", designSystem.components.input.root)}
            />
          </div>
        </div>

        <Button onClick={handleConvertToOrder} disabled={!deliveryDate || Object.keys(productSelections).length === 0} className="w-full h-14 rounded-2xl bg-brand hover:bg-brand/80 text-black font-black text-base shadow-xl transition-all">
          <ShoppingCart className="h-5 w-5 mr-3" />
          Converter em Pedido
        </Button>
      </div>
    </div>
  );
}
