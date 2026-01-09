import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import {
  Search, Package, Building2, TrendingUp, TrendingDown, Minus,
  DollarSign, ShoppingCart, FileText, Calendar, Award, AlertCircle,
  ArrowRight, BarChart3, Target, Clock, CheckCircle, XCircle, Loader2
} from "lucide-react";

interface AnaliseTabProps {}

type SearchType = "product" | "supplier";
type SelectedItem = {
  type: SearchType;
  id: string;
  name: string;
};

export default function AnaliseTab({}: AnaliseTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Buscar produtos
  const { data: products = [] } = useQuery({
    queryKey: ["analysis-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name").order("name");
      return data || [];
    },
  });

  // Buscar fornecedores
  const { data: suppliers = [] } = useQuery({
    queryKey: ["analysis-suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("id, name, contact").order("name");
      return data || [];
    },
  });

  // Filtrar resultados da busca
  const searchResults = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];
    
    const term = debouncedSearch.toLowerCase();
    const productResults = products
      .filter(p => p.name.toLowerCase().includes(term))
      .slice(0, 5)
      .map(p => ({ type: "product" as SearchType, id: p.id, name: p.name }));
    
    const supplierResults = suppliers
      .filter(s => s.name.toLowerCase().includes(term))
      .slice(0, 5)
      .map(s => ({ type: "supplier" as SearchType, id: s.id, name: s.name }));
    
    return [...productResults, ...supplierResults];
  }, [debouncedSearch, products, suppliers]);

  // Handler de teclado para navegação
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectItem(searchResults[highlightedIndex]);
    } else if (e.key === "Escape") {
      setSearchTerm("");
      setHighlightedIndex(-1);
    }
  }, [searchResults, highlightedIndex]);

  const selectItem = (item: SelectedItem) => {
    setSelectedItem(item);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="relative">
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border border-violet-200/50 dark:border-violet-800/50">
          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/40">
            <BarChart3 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-violet-900 dark:text-violet-100">Central de Análise</p>
            <p className="text-xs text-violet-600 dark:text-violet-400">Busque um produto ou fornecedor para análise detalhada</p>
          </div>
        </div>
        
        <div className="mt-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Digite o nome do produto ou fornecedor..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setHighlightedIndex(-1); }}
            onKeyDown={handleSearchKeyDown}
            className="pl-12 h-12 text-base bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
            data-search-input
          />
          
          {/* Dropdown de resultados */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
              {searchResults.map((item, index) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "w-full px-4 py-3 flex items-center gap-3 text-left transition-colors",
                    highlightedIndex === index
                      ? "bg-violet-50 dark:bg-violet-900/30"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    item.type === "product"
                      ? "bg-orange-100 dark:bg-orange-900/30"
                      : "bg-blue-100 dark:bg-blue-900/30"
                  )}>
                    {item.type === "product" 
                      ? <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      : <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    }
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      {item.type === "product" ? "Produto" : "Fornecedor"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
              <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">↑↓</kbd> Navegar • <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">Enter</kbd> Selecionar
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo da análise */}
      {selectedItem ? (
        selectedItem.type === "product" ? (
          <ProductAnalysis productId={selectedItem.id} productName={selectedItem.name} onClear={() => setSelectedItem(null)} />
        ) : (
          <SupplierAnalysis supplierId={selectedItem.id} supplierName={selectedItem.name} onClear={() => setSelectedItem(null)} />
        )
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

// Estado vazio
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
        <BarChart3 className="h-10 w-10 text-violet-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Selecione um item para análise</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
        Use a barra de busca acima para encontrar um produto ou fornecedor e visualizar métricas detalhadas, histórico de preços e insights.
      </p>
    </div>
  );
}


// Análise de Produto
function ProductAnalysis({ productId, productName, onClear }: { productId: string; productName: string; onClear: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Buscar cotações do produto (de quote_supplier_items que tem os preços oferecidos)
  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["product-quotes", productId],
    queryFn: async () => {
      // Buscar itens de cotação com preços oferecidos
      const { data: quoteItems } = await supabase
        .from("quote_supplier_items")
        .select("id, valor_oferecido, created_at, quote_id, supplier_id, product_name")
        .eq("product_id", productId)
        .gt("valor_oferecido", 0)
        .order("created_at", { ascending: false });
      
      if (!quoteItems || quoteItems.length === 0) return [];
      
      // Buscar dados dos fornecedores
      const supplierIds = [...new Set(quoteItems.map(q => q.supplier_id))];
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("id, name")
        .in("id", supplierIds);
      
      // Buscar dados das cotações
      const quoteIds = [...new Set(quoteItems.map(q => q.quote_id))];
      const { data: quotesData } = await supabase
        .from("quotes")
        .select("id, status, created_at")
        .in("id", quoteIds);
      
      const suppliersMap = new Map(suppliersData?.map(s => [s.id, s]) || []);
      const quotesMap = new Map(quotesData?.map(q => [q.id, q]) || []);
      
      return quoteItems.map(item => ({
        id: item.id,
        price: item.valor_oferecido || 0,
        created_at: item.created_at,
        suppliers: suppliersMap.get(item.supplier_id) || null,
        quotes: quotesMap.get(item.quote_id) || null,
      }));
    },
  });

  // Buscar pedidos do produto
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["product-orders", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_items")
        .select(`
          id, quantity, unit_price, total_price, unit,
          orders!inner(id, status, order_date, delivery_date, supplier_name)
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  // Calcular métricas
  const metrics = useMemo(() => {
    const prices = quotes.map(q => q.price).filter(p => p > 0);
    const orderPrices = orders.map(o => o.unit_price).filter(p => p > 0);
    const allPrices = [...prices, ...orderPrices];
    
    const avgPrice = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0;
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
    
    // Fornecedores únicos
    const supplierSet = new Set<string>();
    quotes.forEach(q => q.suppliers?.name && supplierSet.add(q.suppliers.name));
    orders.forEach(o => o.orders?.supplier_name && supplierSet.add(o.orders.supplier_name));
    
    // Tendência de preço (últimos 5 vs anteriores)
    const recentPrices = orderPrices.slice(0, 5);
    const olderPrices = orderPrices.slice(5, 10);
    let trend: "up" | "down" | "stable" = "stable";
    let trendPercent = 0;
    
    if (recentPrices.length > 0 && olderPrices.length > 0) {
      const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
      const olderAvg = olderPrices.reduce((a, b) => a + b, 0) / olderPrices.length;
      trendPercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      trend = Math.abs(trendPercent) < 2 ? "stable" : trendPercent > 0 ? "up" : "down";
    }

    // Melhor fornecedor (menor preço médio)
    const supplierPrices: Record<string, number[]> = {};
    orders.forEach(o => {
      const name = o.orders?.supplier_name;
      if (name && o.unit_price > 0) {
        if (!supplierPrices[name]) supplierPrices[name] = [];
        supplierPrices[name].push(o.unit_price);
      }
    });
    
    let bestSupplier = { name: "-", avgPrice: 0 };
    Object.entries(supplierPrices).forEach(([name, prices]) => {
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      if (!bestSupplier.avgPrice || avg < bestSupplier.avgPrice) {
        bestSupplier = { name, avgPrice: avg };
      }
    });

    return {
      totalQuotes: quotes.length,
      totalOrders: orders.length,
      totalQuantity: orders.reduce((sum, o) => sum + (o.quantity || 0), 0),
      totalSpent: orders.reduce((sum, o) => sum + (o.total_price || 0), 0),
      avgPrice,
      minPrice,
      maxPrice,
      uniqueSuppliers: supplierSet.size,
      trend,
      trendPercent,
      bestSupplier,
      lastOrderDate: orders[0]?.orders?.order_date || null,
    };
  }, [quotes, orders]);

  // Histórico de preços por fornecedor
  const priceHistory = useMemo(() => {
    const history: Array<{ date: string; price: number; supplier: string; type: "quote" | "order" }> = [];
    
    quotes.forEach(q => {
      history.push({
        date: q.created_at,
        price: q.price,
        supplier: q.suppliers?.name || "Desconhecido",
        type: "quote",
      });
    });
    
    orders.forEach(o => {
      history.push({
        date: o.orders?.order_date || "",
        price: o.unit_price,
        supplier: o.orders?.supplier_name || "Desconhecido",
        type: "order",
      });
    });
    
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
  }, [quotes, orders]);

  const isLoading = quotesLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl border border-orange-200/50 dark:border-orange-800/50">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/40">
            <Package className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{productName}</h2>
            <p className="text-sm text-gray-500">Análise de Produto</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>
          Nova busca
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          label="Cotações"
          value={metrics.totalQuotes.toString()}
          color="blue"
        />
        <MetricCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Pedidos"
          value={metrics.totalOrders.toString()}
          color="green"
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Preço Médio"
          value={metrics.avgPrice > 0 ? `R$ ${metrics.avgPrice.toFixed(2)}` : "-"}
          color="violet"
        />
        <MetricCard
          icon={metrics.trend === "up" ? <TrendingUp className="h-4 w-4" /> : metrics.trend === "down" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          label="Tendência"
          value={metrics.trend === "stable" ? "Estável" : `${metrics.trendPercent > 0 ? "+" : ""}${metrics.trendPercent.toFixed(1)}%`}
          color={metrics.trend === "up" ? "red" : metrics.trend === "down" ? "green" : "gray"}
        />
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InsightCard
          icon={<Target className="h-5 w-5" />}
          title="Melhor Fornecedor"
          value={metrics.bestSupplier.name}
          subtitle={metrics.bestSupplier.avgPrice > 0 ? `Média: R$ ${metrics.bestSupplier.avgPrice.toFixed(2)}` : "Sem dados"}
          color="emerald"
        />
        <InsightCard
          icon={<DollarSign className="h-5 w-5" />}
          title="Faixa de Preço"
          value={metrics.minPrice > 0 ? `R$ ${metrics.minPrice.toFixed(2)} - R$ ${metrics.maxPrice.toFixed(2)}` : "-"}
          subtitle={`Variação: ${metrics.maxPrice > 0 ? ((metrics.maxPrice - metrics.minPrice) / metrics.minPrice * 100).toFixed(0) : 0}%`}
          color="amber"
        />
        <InsightCard
          icon={<Building2 className="h-5 w-5" />}
          title="Fornecedores"
          value={metrics.uniqueSuppliers.toString()}
          subtitle="Fornecedores diferentes"
          color="blue"
        />
      </div>

      {/* Tabs de detalhes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="overview">Histórico de Preços</TabsTrigger>
          <TabsTrigger value="suppliers">Por Fornecedor</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <PriceHistoryList history={priceHistory} />
        </TabsContent>

        <TabsContent value="suppliers" className="mt-4">
          <SupplierComparison orders={orders} quotes={quotes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


// Análise de Fornecedor
function SupplierAnalysis({ supplierId, supplierName, onClear }: { supplierId: string; supplierName: string; onClear: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Buscar cotações do fornecedor (de quote_supplier_items que tem os preços oferecidos)
  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["supplier-quotes-analysis", supplierId],
    queryFn: async () => {
      // Buscar itens de cotação com preços oferecidos
      const { data: quoteItems } = await supabase
        .from("quote_supplier_items")
        .select("id, valor_oferecido, created_at, quote_id, product_id, product_name")
        .eq("supplier_id", supplierId)
        .gt("valor_oferecido", 0)
        .order("created_at", { ascending: false });
      
      if (!quoteItems || quoteItems.length === 0) return [];
      
      // Buscar dados dos produtos
      const productIds = [...new Set(quoteItems.map(q => q.product_id))];
      const { data: productsData } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);
      
      // Buscar dados das cotações
      const quoteIds = [...new Set(quoteItems.map(q => q.quote_id))];
      const { data: quotesData } = await supabase
        .from("quotes")
        .select("id, status, created_at")
        .in("id", quoteIds);
      
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      const quotesMap = new Map(quotesData?.map(q => [q.id, q]) || []);
      
      return quoteItems.map(item => ({
        id: item.id,
        price: item.valor_oferecido || 0,
        created_at: item.created_at,
        products: productsMap.get(item.product_id) || { id: item.product_id, name: item.product_name },
        quotes: quotesMap.get(item.quote_id) || null,
      }));
    },
  });

  // Buscar pedidos do fornecedor
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["supplier-orders-analysis", supplierId],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select(`
          id, status, order_date, delivery_date, total_value, observations,
          order_items(id, product_name, quantity, unit_price, total_price)
        `)
        .eq("supplier_id", supplierId)
        .order("order_date", { ascending: false });
      return data || [];
    },
  });

  // Calcular métricas
  const metrics = useMemo(() => {
    // Cotações que resultaram em pedidos para este fornecedor (aproximação de "ganhas")
    const quotesWithOrders = quotes.filter(q => {
      // Verifica se há pedido para o mesmo produto
      return orders.some(o => 
        o.order_items?.some((item: any) => item.product_name === q.products?.name)
      );
    });
    const winRate = quotes.length > 0 ? (quotesWithOrders.length / quotes.length) * 100 : 0;
    
    const deliveredOrders = orders.filter(o => o.status === "entregue" || o.status === "completed");
    const deliveryRate = orders.length > 0 ? (deliveredOrders.length / orders.length) * 100 : 0;
    
    const totalValue = orders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalValue / orders.length : 0;
    
    // Produtos únicos
    const productSet = new Set<string>();
    quotes.forEach(q => q.products?.name && productSet.add(q.products.name));
    orders.forEach(o => o.order_items?.forEach((item: any) => item.product_name && productSet.add(item.product_name)));
    
    // Tendência de valor dos pedidos
    const recentOrders = orders.slice(0, 5);
    const olderOrders = orders.slice(5, 10);
    let trend: "up" | "down" | "stable" = "stable";
    let trendPercent = 0;
    
    if (recentOrders.length > 0 && olderOrders.length > 0) {
      const recentAvg = recentOrders.reduce((sum, o) => sum + (o.total_value || 0), 0) / recentOrders.length;
      const olderAvg = olderOrders.reduce((sum, o) => sum + (o.total_value || 0), 0) / olderOrders.length;
      trendPercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      trend = Math.abs(trendPercent) < 5 ? "stable" : trendPercent > 0 ? "up" : "down";
    }

    return {
      totalQuotes: quotes.length,
      wonQuotes: quotesWithOrders.length,
      winRate,
      totalOrders: orders.length,
      deliveredOrders: deliveredOrders.length,
      deliveryRate,
      totalValue,
      avgOrderValue,
      uniqueProducts: productSet.size,
      trend,
      trendPercent,
      lastOrderDate: orders[0]?.order_date || null,
    };
  }, [quotes, orders]);

  // Produtos mais comprados
  const topProducts = useMemo(() => {
    const productMap: Record<string, { name: string; quantity: number; totalSpent: number; count: number }> = {};
    
    orders.forEach(o => {
      o.order_items?.forEach((item: any) => {
        const name = item.product_name;
        if (!productMap[name]) {
          productMap[name] = { name, quantity: 0, totalSpent: 0, count: 0 };
        }
        productMap[name].quantity += item.quantity || 0;
        productMap[name].totalSpent += item.total_price || 0;
        productMap[name].count += 1;
      });
    });
    
    return Object.values(productMap)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }, [orders]);

  const isLoading = quotesLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40">
            <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{supplierName}</h2>
            <p className="text-sm text-gray-500">Análise de Fornecedor</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>
          Nova busca
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={<FileText className="h-4 w-4" />}
          label="Cotações"
          value={`${metrics.wonQuotes}/${metrics.totalQuotes}`}
          subtitle={`${metrics.winRate.toFixed(0)}% vitórias`}
          color="blue"
        />
        <MetricCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Pedidos"
          value={metrics.totalOrders.toString()}
          subtitle={`${metrics.deliveredOrders} entregues`}
          color="green"
        />
        <MetricCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Comprado"
          value={`R$ ${metrics.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          color="violet"
        />
        <MetricCard
          icon={<Target className="h-4 w-4" />}
          label="Ticket Médio"
          value={metrics.avgOrderValue > 0 ? `R$ ${metrics.avgOrderValue.toFixed(2)}` : "-"}
          color="amber"
        />
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InsightCard
          icon={<Award className="h-5 w-5" />}
          title="Taxa de Vitória"
          value={`${metrics.winRate.toFixed(0)}%`}
          subtitle={`${metrics.wonQuotes} de ${metrics.totalQuotes} cotações`}
          color={metrics.winRate >= 50 ? "emerald" : metrics.winRate >= 25 ? "amber" : "red"}
        />
        <InsightCard
          icon={<CheckCircle className="h-5 w-5" />}
          title="Taxa de Entrega"
          value={`${metrics.deliveryRate.toFixed(0)}%`}
          subtitle={`${metrics.deliveredOrders} de ${metrics.totalOrders} pedidos`}
          color={metrics.deliveryRate >= 80 ? "emerald" : metrics.deliveryRate >= 50 ? "amber" : "red"}
        />
        <InsightCard
          icon={<Package className="h-5 w-5" />}
          title="Produtos"
          value={metrics.uniqueProducts.toString()}
          subtitle="Produtos diferentes"
          color="blue"
        />
      </div>

      {/* Tabs de detalhes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="overview">Pedidos Recentes</TabsTrigger>
          <TabsTrigger value="products">Produtos Comprados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OrderHistoryList orders={orders} />
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <TopProductsList products={topProducts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


// Componentes auxiliares
function MetricCard({ icon, label, value, subtitle, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subtitle?: string;
  color: "blue" | "green" | "violet" | "amber" | "red" | "gray" | "emerald";
}) {
  const colors = {
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400",
    green: "bg-green-50 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/50 text-green-600 dark:text-green-400",
    violet: "bg-violet-50 dark:bg-violet-900/20 border-violet-200/50 dark:border-violet-800/50 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50 text-amber-600 dark:text-amber-400",
    red: "bg-red-50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50 text-red-600 dark:text-red-400",
    gray: "bg-gray-50 dark:bg-gray-900/20 border-gray-200/50 dark:border-gray-800/50 text-gray-600 dark:text-gray-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400",
  };

  return (
    <div className={cn("p-3 rounded-xl border", colors[color])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium opacity-80">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function InsightCard({ icon, title, value, subtitle, color }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: "emerald" | "amber" | "blue" | "red";
}) {
  const colors = {
    emerald: "from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-800/50",
    amber: "from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200/50 dark:border-amber-800/50",
    blue: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50",
    red: "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-800/50",
  };
  const iconColors = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    blue: "text-blue-600 dark:text-blue-400",
    red: "text-red-600 dark:text-red-400",
  };

  return (
    <div className={cn("p-4 rounded-xl border bg-gradient-to-br", colors[color])}>
      <div className={cn("mb-2", iconColors[color])}>{icon}</div>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}

function PriceHistoryList({ history }: { history: Array<{ date: string; price: number; supplier: string; type: "quote" | "order" }> }) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum histórico de preços encontrado</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {history.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className={cn(
              "p-2 rounded-lg",
              item.type === "order" ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30"
            )}>
              {item.type === "order" 
                ? <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                : <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.supplier}</p>
              <p className="text-xs text-gray-500">
                {new Date(item.date).toLocaleDateString("pt-BR")} • {item.type === "order" ? "Pedido" : "Cotação"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 dark:text-white">R$ {item.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function SupplierComparison({ orders, quotes }: { orders: any[]; quotes: any[] }) {
  const supplierData = useMemo(() => {
    const data: Record<string, { name: string; avgPrice: number; count: number; prices: number[] }> = {};
    
    orders.forEach(o => {
      const name = o.orders?.supplier_name;
      if (name && o.unit_price > 0) {
        if (!data[name]) data[name] = { name, avgPrice: 0, count: 0, prices: [] };
        data[name].prices.push(o.unit_price);
        data[name].count += 1;
      }
    });
    
    quotes.forEach(q => {
      const name = q.suppliers?.name;
      if (name && q.price > 0) {
        if (!data[name]) data[name] = { name, avgPrice: 0, count: 0, prices: [] };
        data[name].prices.push(q.price);
        data[name].count += 1;
      }
    });
    
    return Object.values(data)
      .map(d => ({ ...d, avgPrice: d.prices.reduce((a, b) => a + b, 0) / d.prices.length }))
      .sort((a, b) => a.avgPrice - b.avgPrice);
  }, [orders, quotes]);

  if (supplierData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum fornecedor encontrado</p>
      </div>
    );
  }

  const minPrice = Math.min(...supplierData.map(s => s.avgPrice));

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {supplierData.map((supplier, index) => (
          <div key={supplier.name} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              index === 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            )}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{supplier.name}</p>
                {index === 0 && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Melhor preço</Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">{supplier.count} registro(s)</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900 dark:text-white">R$ {supplier.avgPrice.toFixed(2)}</p>
              {index > 0 && (
                <p className="text-xs text-red-500">
                  +{((supplier.avgPrice - minPrice) / minPrice * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function OrderHistoryList({ orders }: { orders: any[] }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum pedido encontrado</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {orders.slice(0, 15).map((order) => (
          <div key={order.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">#{order.id.substring(0, 8)}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    order.status === "entregue" || order.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : order.status === "pendente"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  )}
                >
                  {order.status}
                </Badge>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                R$ {(order.total_value || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(order.order_date).toLocaleDateString("pt-BR")}
              </span>
              <span>{order.order_items?.length || 0} item(s)</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function TopProductsList({ products }: { products: Array<{ name: string; quantity: number; totalSpent: number; count: number }> }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {products.map((product, index) => (
          <div key={product.name} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              index < 3 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            )}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
              <p className="text-xs text-gray-500">{product.count} pedido(s) • {product.quantity} unidades</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-emerald-600">R$ {product.totalSpent.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
