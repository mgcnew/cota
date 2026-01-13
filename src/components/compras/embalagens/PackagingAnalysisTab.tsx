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
  DollarSign, ShoppingCart, FileText, Calendar, Award,
  ArrowRight, BarChart3, Target, Clock, CheckCircle, Loader2
} from "lucide-react";

type SearchType = "packaging" | "supplier";
type SelectedItem = { type: SearchType; id: string; name: string };

export default function PackagingAnalysisTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Buscar embalagens cadastradas
  const { data: packagingItems = [] } = useQuery({
    queryKey: ["analysis-packaging-items"],
    queryFn: async () => {
      const { data } = await (supabase.from("packaging_items" as any).select("id, name").order("name") as any);
      return data || [];
    },
  });

  // Buscar fornecedores
  const { data: suppliers = [] } = useQuery({
    queryKey: ["analysis-packaging-suppliers"],
    queryFn: async () => {
      const { data } = await supabase.from("suppliers").select("id, name, contact").order("name");
      return data || [];
    },
  });

  // Filtrar resultados da busca
  const searchResults = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];
    const term = debouncedSearch.toLowerCase();
    const packagingResults = packagingItems
      .filter((p: any) => p.name.toLowerCase().includes(term))
      .slice(0, 5)
      .map((p: any) => ({ type: "packaging" as SearchType, id: p.id, name: p.name, contact: null }));
    const supplierResults = suppliers
      .filter(s => s.name.toLowerCase().includes(term) || (s.contact && s.contact.toLowerCase().includes(term)))
      .slice(0, 5)
      .map(s => ({ type: "supplier" as SearchType, id: s.id, name: s.name, contact: s.contact }));
    return [...packagingResults, ...supplierResults];
  }, [debouncedSearch, packagingItems, suppliers]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlightedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlightedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1)); }
    else if (e.key === "Enter" && highlightedIndex >= 0) { e.preventDefault(); selectItem(searchResults[highlightedIndex]); }
    else if (e.key === "Escape") { setSearchTerm(""); setHighlightedIndex(-1); }
  }, [searchResults, highlightedIndex]);

  const selectItem = (item: SelectedItem) => { setSelectedItem(item); setSearchTerm(""); setHighlightedIndex(-1); };

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="relative">
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
            <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Análise de Embalagens</p>
            <p className="text-xs text-purple-600 dark:text-purple-400">Busque por embalagem ou fornecedor</p>
          </div>
        </div>
        <div className="mt-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Digite o nome da embalagem ou fornecedor..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setHighlightedIndex(-1); }}
            onKeyDown={handleSearchKeyDown}
            className="pl-12 h-12 text-base bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
          />
          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
              {searchResults.map((item, index) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn("w-full px-4 py-3 flex items-center gap-3 text-left transition-colors", highlightedIndex === index ? "bg-purple-50 dark:bg-purple-900/30" : "hover:bg-gray-50 dark:hover:bg-gray-700/50")}
                >
                  <div className={cn("p-2 rounded-lg", item.type === "packaging" ? "bg-purple-100 dark:bg-purple-900/30" : "bg-blue-100 dark:bg-blue-900/30")}>
                    {item.type === "packaging" ? <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" /> : <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.type === "packaging" ? "Embalagem" : "Fornecedor"}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedItem ? (
        selectedItem.type === "packaging" ? (
          <PackagingAnalysis packagingId={selectedItem.id} packagingName={selectedItem.name} onClear={() => setSelectedItem(null)} />
        ) : (
          <SupplierPackagingAnalysis supplierId={selectedItem.id} supplierName={selectedItem.name} onClear={() => setSelectedItem(null)} />
        )
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 flex items-center justify-center mb-4">
        <BarChart3 className="h-10 w-10 text-purple-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Selecione um item para análise</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
        Use a barra de busca acima para encontrar uma embalagem ou fornecedor e visualizar métricas detalhadas, histórico de preços e insights.
      </p>
    </div>
  );
}

// Análise de Embalagem
function PackagingAnalysis({ packagingId, packagingName, onClear }: { packagingId: string; packagingName: string; onClear: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");

  // Buscar cotações da embalagem
  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["packaging-analysis-quotes", packagingId],
    queryFn: async () => {
      const { data } = await (supabase.from("packaging_supplier_items" as any).select("*").eq("packaging_id", packagingId).gt("valor_total", 0).order("created_at", { ascending: false }) as any);
      if (!data || data.length === 0) return [];
      const supplierIds = [...new Set(data.map((d: any) => d.supplier_id))] as string[];
      const { data: suppliersData } = await supabase.from("suppliers").select("id, name").in("id", supplierIds);
      const suppliersMap = new Map(suppliersData?.map(s => [s.id, s]) || []);
      return data.map((item: any) => ({ ...item, supplier: suppliersMap.get(item.supplier_id) }));
    },
  });

  // Buscar pedidos da embalagem
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["packaging-analysis-orders", packagingId],
    queryFn: async () => {
      const { data } = await (supabase.from("packaging_order_items" as any).select("*, packaging_orders!inner(id, status, order_date, supplier_name, supplier_id)").eq("packaging_id", packagingId).order("created_at", { ascending: false }) as any);
      return data || [];
    },
  });

  // Calcular métricas
  const metrics = useMemo(() => {
    const quotePrices = quotes.map((q: any) => q.custo_por_unidade || 0).filter((p: number) => p > 0);
    const orderPrices = orders.map((o: any) => o.valor_unitario || 0).filter((p: number) => p > 0);
    const allPrices = [...quotePrices, ...orderPrices];
    const avgPrice = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0;
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
    const supplierSet = new Set<string>();
    quotes.forEach((q: any) => q.supplier?.name && supplierSet.add(q.supplier.name));
    orders.forEach((o: any) => o.packaging_orders?.supplier_name && supplierSet.add(o.packaging_orders.supplier_name));
    const recentPrices = orderPrices.slice(0, 5);
    const olderPrices = orderPrices.slice(5, 10);
    let trend: "up" | "down" | "stable" = "stable";
    let trendPercent = 0;
    if (recentPrices.length > 0 && olderPrices.length > 0) {
      const recentAvg = recentPrices.reduce((a: number, b: number) => a + b, 0) / recentPrices.length;
      const olderAvg = olderPrices.reduce((a: number, b: number) => a + b, 0) / olderPrices.length;
      trendPercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      trend = Math.abs(trendPercent) < 2 ? "stable" : trendPercent > 0 ? "up" : "down";
    }
    const supplierPrices: Record<string, number[]> = {};
    orders.forEach((o: any) => { const name = o.packaging_orders?.supplier_name; if (name && o.valor_unitario > 0) { if (!supplierPrices[name]) supplierPrices[name] = []; supplierPrices[name].push(o.valor_unitario); } });
    let bestSupplier = { name: "-", avgPrice: 0 };
    Object.entries(supplierPrices).forEach(([name, prices]) => { const avg = prices.reduce((a, b) => a + b, 0) / prices.length; if (!bestSupplier.avgPrice || avg < bestSupplier.avgPrice) { bestSupplier = { name, avgPrice: avg }; } });
    return { totalQuotes: quotes.length, totalOrders: orders.length, totalQuantity: orders.reduce((sum: number, o: any) => sum + (o.quantidade || 0), 0), totalSpent: orders.reduce((sum: number, o: any) => sum + (o.valor_total || 0), 0), avgPrice, minPrice, maxPrice, uniqueSuppliers: supplierSet.size, trend, trendPercent, bestSupplier };
  }, [quotes, orders]);

  const priceHistory = useMemo(() => {
    const history: Array<{ date: string; price: number; supplier: string; type: "quote" | "order" }> = [];
    quotes.forEach((q: any) => { history.push({ date: q.created_at, price: q.custo_por_unidade || 0, supplier: q.supplier?.name || "Desconhecido", type: "quote" }); });
    orders.forEach((o: any) => { history.push({ date: o.packaging_orders?.order_date || o.created_at, price: o.valor_unitario || 0, supplier: o.packaging_orders?.supplier_name || "Desconhecido", type: "order" }); });
    return history.filter(h => h.price > 0).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);
  }, [quotes, orders]);

  const isLoading = quotesLoading || ordersLoading;
  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/40"><Package className="h-6 w-6 text-purple-600 dark:text-purple-400" /></div>
          <div><h2 className="text-lg font-bold text-gray-900 dark:text-white">{packagingName}</h2><p className="text-sm text-gray-500">Análise de Embalagem</p></div>
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>Nova busca</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={<FileText className="h-4 w-4" />} label="Cotações" value={metrics.totalQuotes.toString()} color="blue" />
        <MetricCard icon={<ShoppingCart className="h-4 w-4" />} label="Pedidos" value={metrics.totalOrders.toString()} color="green" />
        <MetricCard icon={<DollarSign className="h-4 w-4" />} label="Preço Médio" value={metrics.avgPrice > 0 ? `R$ ${metrics.avgPrice.toFixed(2)}` : "-"} color="violet" />
        <MetricCard icon={metrics.trend === "up" ? <TrendingUp className="h-4 w-4" /> : metrics.trend === "down" ? <TrendingDown className="h-4 w-4" /> : <Minus className="h-4 w-4" />} label="Tendência" value={metrics.trend === "stable" ? "Estável" : `${metrics.trendPercent > 0 ? "+" : ""}${metrics.trendPercent.toFixed(1)}%`} color={metrics.trend === "up" ? "red" : metrics.trend === "down" ? "green" : "gray"} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InsightCard icon={<Target className="h-5 w-5" />} title="Melhor Fornecedor" value={metrics.bestSupplier.name} subtitle={metrics.bestSupplier.avgPrice > 0 ? `Média: R$ ${metrics.bestSupplier.avgPrice.toFixed(2)}` : "Sem dados"} color="emerald" />
        <InsightCard icon={<DollarSign className="h-5 w-5" />} title="Faixa de Preço" value={metrics.minPrice > 0 ? `R$ ${metrics.minPrice.toFixed(2)} - R$ ${metrics.maxPrice.toFixed(2)}` : "-"} subtitle={`Variação: ${metrics.maxPrice > 0 && metrics.minPrice > 0 ? ((metrics.maxPrice - metrics.minPrice) / metrics.minPrice * 100).toFixed(0) : 0}%`} color="amber" />
        <InsightCard icon={<Building2 className="h-5 w-5" />} title="Fornecedores" value={metrics.uniqueSuppliers.toString()} subtitle="Fornecedores diferentes" color="blue" />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="w-full grid grid-cols-2"><TabsTrigger value="overview">Histórico de Preços</TabsTrigger><TabsTrigger value="suppliers">Por Fornecedor</TabsTrigger></TabsList>
        <TabsContent value="overview" className="mt-4"><PriceHistoryList history={priceHistory} /></TabsContent>
        <TabsContent value="suppliers" className="mt-4"><SupplierComparison orders={orders} quotes={quotes} /></TabsContent>
      </Tabs>
    </div>
  );
}

// Análise de Fornecedor para Embalagens
function SupplierPackagingAnalysis({ supplierId, supplierName, onClear }: { supplierId: string; supplierName: string; onClear: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["supplier-packaging-quotes", supplierId],
    queryFn: async () => {
      const { data } = await (supabase.from("packaging_supplier_items" as any).select("*").eq("supplier_id", supplierId).gt("valor_total", 0).order("created_at", { ascending: false }) as any);
      return data || [];
    },
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["supplier-packaging-orders", supplierId],
    queryFn: async () => {
      const { data } = await (supabase.from("packaging_orders" as any).select("*, packaging_order_items(*)").eq("supplier_id", supplierId).order("order_date", { ascending: false }) as any);
      return data || [];
    },
  });

  const metrics = useMemo(() => {
    const quotesWithOrders = quotes.filter((q: any) => orders.some((o: any) => o.packaging_order_items?.some((item: any) => item.packaging_name === q.packaging_name)));
    const winRate = quotes.length > 0 ? (quotesWithOrders.length / quotes.length) * 100 : 0;
    const deliveredOrders = orders.filter((o: any) => o.status === "entregue");
    const deliveryRate = orders.length > 0 ? (deliveredOrders.length / orders.length) * 100 : 0;
    const totalValue = orders.reduce((sum: number, o: any) => sum + (o.total_value || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalValue / orders.length : 0;
    const packagingSet = new Set<string>();
    quotes.forEach((q: any) => q.packaging_name && packagingSet.add(q.packaging_name));
    orders.forEach((o: any) => o.packaging_order_items?.forEach((item: any) => item.packaging_name && packagingSet.add(item.packaging_name)));
    return { totalQuotes: quotes.length, wonQuotes: quotesWithOrders.length, winRate, totalOrders: orders.length, deliveredOrders: deliveredOrders.length, deliveryRate, totalValue, avgOrderValue, uniquePackaging: packagingSet.size };
  }, [quotes, orders]);

  const topPackaging = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; totalSpent: number; count: number }> = {};
    orders.forEach((o: any) => { o.packaging_order_items?.forEach((item: any) => { const name = item.packaging_name; if (!map[name]) map[name] = { name, quantity: 0, totalSpent: 0, count: 0 }; map[name].quantity += item.quantidade || 0; map[name].totalSpent += item.valor_total || 0; map[name].count += 1; }); });
    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10);
  }, [orders]);

  const isLoading = quotesLoading || ordersLoading;
  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40"><Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
          <div><h2 className="text-lg font-bold text-gray-900 dark:text-white">{supplierName}</h2><p className="text-sm text-gray-500">Análise de Fornecedor (Embalagens)</p></div>
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>Nova busca</Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard icon={<FileText className="h-4 w-4" />} label="Cotações" value={`${metrics.wonQuotes}/${metrics.totalQuotes}`} subtitle={`${metrics.winRate.toFixed(0)}% vitórias`} color="blue" />
        <MetricCard icon={<ShoppingCart className="h-4 w-4" />} label="Pedidos" value={metrics.totalOrders.toString()} subtitle={`${metrics.deliveredOrders} entregues`} color="green" />
        <MetricCard icon={<DollarSign className="h-4 w-4" />} label="Total Comprado" value={`R$ ${metrics.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} color="violet" />
        <MetricCard icon={<Target className="h-4 w-4" />} label="Ticket Médio" value={metrics.avgOrderValue > 0 ? `R$ ${metrics.avgOrderValue.toFixed(2)}` : "-"} color="amber" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InsightCard icon={<Award className="h-5 w-5" />} title="Taxa de Vitória" value={`${metrics.winRate.toFixed(0)}%`} subtitle={`${metrics.wonQuotes} de ${metrics.totalQuotes} cotações`} color={metrics.winRate >= 50 ? "emerald" : metrics.winRate >= 25 ? "amber" : "red"} />
        <InsightCard icon={<CheckCircle className="h-5 w-5" />} title="Taxa de Entrega" value={`${metrics.deliveryRate.toFixed(0)}%`} subtitle={`${metrics.deliveredOrders} de ${metrics.totalOrders} pedidos`} color={metrics.deliveryRate >= 80 ? "emerald" : metrics.deliveryRate >= 50 ? "amber" : "red"} />
        <InsightCard icon={<Package className="h-5 w-5" />} title="Embalagens" value={metrics.uniquePackaging.toString()} subtitle="Embalagens diferentes" color="blue" />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList className="w-full grid grid-cols-2"><TabsTrigger value="overview">Pedidos Recentes</TabsTrigger><TabsTrigger value="packaging">Embalagens Compradas</TabsTrigger></TabsList>
        <TabsContent value="overview" className="mt-4"><OrderHistoryList orders={orders} /></TabsContent>
        <TabsContent value="packaging" className="mt-4"><TopPackagingList packaging={topPackaging} /></TabsContent>
      </Tabs>
    </div>
  );
}

// Componentes auxiliares
function MetricCard({ icon, label, value, subtitle, color }: { icon: React.ReactNode; label: string; value: string; subtitle?: string; color: "blue" | "green" | "violet" | "amber" | "red" | "gray" | "emerald" }) {
  const colors = { blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400", green: "bg-green-50 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/50 text-green-600 dark:text-green-400", violet: "bg-violet-50 dark:bg-violet-900/20 border-violet-200/50 dark:border-violet-800/50 text-violet-600 dark:text-violet-400", amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/50 text-amber-600 dark:text-amber-400", red: "bg-red-50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50 text-red-600 dark:text-red-400", gray: "bg-gray-50 dark:bg-gray-900/20 border-gray-200/50 dark:border-gray-800/50 text-gray-600 dark:text-gray-400", emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400" };
  return (<div className={cn("p-3 rounded-xl border", colors[color])}><div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs font-medium opacity-80">{label}</span></div><p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>{subtitle && <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>}</div>);
}

function InsightCard({ icon, title, value, subtitle, color }: { icon: React.ReactNode; title: string; value: string; subtitle: string; color: "emerald" | "amber" | "blue" | "red" }) {
  const colors = { emerald: "from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50 dark:border-emerald-800/50", amber: "from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200/50 dark:border-amber-800/50", blue: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-800/50", red: "from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200/50 dark:border-red-800/50" };
  const iconColors = { emerald: "text-emerald-600 dark:text-emerald-400", amber: "text-amber-600 dark:text-amber-400", blue: "text-blue-600 dark:text-blue-400", red: "text-red-600 dark:text-red-400" };
  return (<div className={cn("p-4 rounded-xl border bg-gradient-to-br", colors[color])}><div className={cn("mb-2", iconColors[color])}>{icon}</div><p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p><p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p></div>);
}

function PriceHistoryList({ history }: { history: Array<{ date: string; price: number; supplier: string; type: "quote" | "order" }> }) {
  if (history.length === 0) return <div className="text-center py-8 text-gray-500"><Clock className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum histórico de preços encontrado</p></div>;
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {history.map((item, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className={cn("p-2 rounded-lg", item.type === "order" ? "bg-green-100 dark:bg-green-900/30" : "bg-blue-100 dark:bg-blue-900/30")}>
              {item.type === "order" ? <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" /> : <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.supplier}</p><p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString("pt-BR")} • {item.type === "order" ? "Pedido" : "Cotação"}</p></div>
            <div className="text-right"><p className="font-bold text-gray-900 dark:text-white">R$ {item.price.toFixed(2)}</p></div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function SupplierComparison({ orders, quotes }: { orders: any[]; quotes: any[] }) {
  const supplierData = useMemo(() => {
    const data: Record<string, { name: string; avgPrice: number; count: number; prices: number[] }> = {};
    orders.forEach((o: any) => { const name = o.packaging_orders?.supplier_name; if (name && o.valor_unitario > 0) { if (!data[name]) data[name] = { name, avgPrice: 0, count: 0, prices: [] }; data[name].prices.push(o.valor_unitario); data[name].count += 1; } });
    quotes.forEach((q: any) => { const name = q.supplier?.name; if (name && q.custo_por_unidade > 0) { if (!data[name]) data[name] = { name, avgPrice: 0, count: 0, prices: [] }; data[name].prices.push(q.custo_por_unidade); data[name].count += 1; } });
    return Object.values(data).map(d => ({ ...d, avgPrice: d.prices.reduce((a, b) => a + b, 0) / d.prices.length })).sort((a, b) => a.avgPrice - b.avgPrice);
  }, [orders, quotes]);
  if (supplierData.length === 0) return <div className="text-center py-8 text-gray-500"><Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum fornecedor encontrado</p></div>;
  const minPrice = Math.min(...supplierData.map(s => s.avgPrice));
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {supplierData.map((supplier, index) => (
          <div key={supplier.name} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", index === 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400")}>{index + 1}</div>
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{supplier.name}</p>{index === 0 && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Melhor preço</Badge>}</div><p className="text-xs text-gray-500">{supplier.count} registro(s)</p></div>
            <div className="text-right"><p className="font-bold text-gray-900 dark:text-white">R$ {supplier.avgPrice.toFixed(2)}</p>{index > 0 && <p className="text-xs text-red-500">+{((supplier.avgPrice - minPrice) / minPrice * 100).toFixed(0)}%</p>}</div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function OrderHistoryList({ orders }: { orders: any[] }) {
  if (orders.length === 0) return <div className="text-center py-8 text-gray-500"><ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum pedido encontrado</p></div>;
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {orders.slice(0, 15).map((order: any) => (
          <div key={order.id} className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><span className="text-xs text-gray-500">#{order.id.substring(0, 8)}</span><Badge variant="outline" className={cn("text-xs", order.status === "entregue" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : order.status === "pendente" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gray-50 text-gray-700 border-gray-200")}>{order.status}</Badge></div>
              <span className="font-bold text-gray-900 dark:text-white">R$ {(order.total_value || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500"><span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(order.order_date).toLocaleDateString("pt-BR")}</span><span>{order.packaging_order_items?.length || 0} item(s)</span></div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function TopPackagingList({ packaging }: { packaging: Array<{ name: string; quantity: number; totalSpent: number; count: number }> }) {
  if (packaging.length === 0) return <div className="text-center py-8 text-gray-500"><Package className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhuma embalagem encontrada</p></div>;
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {packaging.map((item, index) => (
          <div key={item.name} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", index < 3 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400")}>{index + 1}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p><p className="text-xs text-gray-500">{item.count} pedido(s) • {item.quantity} unidades</p></div>
            <div className="text-right"><p className="font-bold text-emerald-600">R$ {item.totalSpent.toFixed(2)}</p></div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
