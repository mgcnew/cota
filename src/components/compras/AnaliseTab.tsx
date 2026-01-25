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
  ArrowRight, BarChart3, Target, Clock, CheckCircle, XCircle, Loader2,
  ChevronDown, ChevronUp
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { designSystem } from "@/styles/design-system";

interface AnaliseTabProps { }

type SearchType = "product" | "supplier";
type SelectedItem = {
  type: SearchType;
  id: string;
  name: string;
  contact?: string | null;
};

export default function AnaliseTab({ }: AnaliseTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Buscar produtos (com paginação para carregar todos)
  const { data: products = [] } = useQuery({
    queryKey: ["analysis-products"],
    queryFn: async () => {
      const { count: totalCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      if (!totalCount || totalCount === 0) return [];

      if (totalCount <= 1000) {
        const { data } = await supabase.from("products").select("id, name").order("name");
        return data || [];
      }

      const pageSize = 1000;
      const totalPages = Math.ceil(totalCount / pageSize);
      const allProducts: Array<{ id: string; name: string }> = [];

      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data: pageData } = await supabase
          .from("products")
          .select("id, name")
          .order("name")
          .range(from, to);
        if (pageData) allProducts.push(...pageData);
      }
      return allProducts;
    },
  });

  // Buscar fornecedores (com paginação para carregar todos)
  const { data: suppliers = [] } = useQuery({
    queryKey: ["analysis-suppliers"],
    queryFn: async () => {
      const { count: totalCount } = await supabase
        .from("suppliers")
        .select("*", { count: "exact", head: true });

      if (!totalCount || totalCount === 0) return [];

      if (totalCount <= 1000) {
        const { data } = await supabase.from("suppliers").select("id, name, contact").order("name");
        return data || [];
      }

      const pageSize = 1000;
      const totalPages = Math.ceil(totalCount / pageSize);
      const allSuppliers: Array<{ id: string; name: string; contact: string | null }> = [];

      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data: pageData } = await supabase
          .from("suppliers")
          .select("id, name, contact")
          .order("name")
          .range(from, to);
        if (pageData) allSuppliers.push(...pageData);
      }
      return allSuppliers;
    },
  });

  // Filtrar resultados da busca
  const searchResults = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return [];

    const term = debouncedSearch.toLowerCase();
    const productResults = products
      .filter(p => p.name.toLowerCase().includes(term))
      .slice(0, 5)
      .map(p => ({ type: "product" as SearchType, id: p.id, name: p.name, contact: null }));

    const supplierResults = suppliers
      .filter(s =>
        s.name.toLowerCase().includes(term) ||
        (s.contact && s.contact.toLowerCase().includes(term))
      )
      .slice(0, 5)
      .map(s => ({
        type: "supplier" as SearchType,
        id: s.id,
        name: s.name,
        contact: s.contact
      }));

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
    <div className="space-y-6">
      {/* Search Bar & Header */}
      <div className="relative">
        <div className={cn(
          "flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300",
          designSystem.components.card.root,
          designSystem.colors.border.subtle
        )}>
          <div className="p-3 rounded-xl bg-[#83E509]/10 border border-[#83E509]/20 shadow-[0_0_15px_rgba(131,229,9,0.1)]">
            <BarChart3 className="h-6 w-6 text-[#83E509]" />
          </div>
          <div className="flex-1">
            <h3 className={cn("text-lg font-bold", designSystem.colors.text.primary)}>Central de Inteligência</h3>
            <p className={cn("text-sm opacity-70", designSystem.colors.text.secondary)}>
              Consulte históricos e tendências de produtos ou fornecedores
            </p>
          </div>
        </div>

        <div className="mt-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-[#83E509] transition-colors" />
          <Input
            placeholder="O que você deseja analisar hoje? (Produto, fornecedor ou vendedor)"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setHighlightedIndex(-1); }}
            onKeyDown={handleSearchKeyDown}
            className={cn(
              "pl-12 h-14 text-base rounded-2xl shadow-sm transition-all border-2",
              "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800",
              "focus:border-[#83E509] focus:ring-4 focus:ring-[#83E509]/10 outline-none"
            )}
            data-search-input
          />

          {searchResults.length > 0 && (
            <div className="absolute z-50 w-full mt-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Sugestões encontradas</span>
              </div>
              {searchResults.map((item, index) => (
                <button
                  key={`${item.type}-${item.id}`}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "w-full px-5 py-4 flex items-center gap-4 text-left transition-all",
                    highlightedIndex === index
                      ? "bg-[#83E509]/10 border-l-4 border-l-[#83E509]"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 border-l-4 border-l-transparent"
                  )}
                >
                  <div className={cn(
                    "p-2.5 rounded-xl flex-shrink-0",
                    item.type === "product"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-blue-500/10 text-blue-500"
                  )}>
                    {item.type === "product"
                      ? <Package className="h-5 w-5" />
                      : <Building2 className="h-5 w-5" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-bold text-sm truncate", designSystem.colors.text.primary)}>{item.name}</p>
                    <p className={cn("text-xs opacity-60 flex items-center gap-2", designSystem.colors.text.secondary)}>
                      {item.type === "product" ? "📦 Produto" : (
                        <>
                          <span>🏢 Fornecedor</span>
                          {item.contact && (
                            <span className="text-blue-500 font-medium">
                              • 👤 {item.contact}
                            </span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <ArrowRight className={cn("h-4 w-4 transition-transform", highlightedIndex === index ? "translate-x-1 text-[#83E509]" : "text-zinc-300")} />
                </button>
              ))}
              <div className="px-5 py-3 text-[10px] font-medium text-zinc-400 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-800 flex justify-between">
                <div>DICA: Use as setas para navegar</div>
                <div className="flex gap-3">
                  <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-700 rounded border border-zinc-200 dark:border-zinc-600">↑↓</kbd> Mudar</span>
                  <span><kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-700 rounded border border-zinc-200 dark:border-zinc-600">Enter</kbd> Abrir</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="transition-all duration-500">
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
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
      <div className="w-24 h-24 rounded-full bg-white dark:bg-zinc-800 shadow-xl flex items-center justify-center mb-8 animate-pulse">
        <Target className="h-12 w-12 text-[#83E509]" />
      </div>
      <h3 className={cn("text-xl font-bold mb-3", designSystem.colors.text.primary)}>Pronto para o próximo insight?</h3>
      <p className={cn("text-sm max-w-sm mx-auto opacity-70 mb-8", designSystem.colors.text.secondary)}>
        Analise o desempenho de qualquer item ou parceiro comercial em tempo real para tomar decisões baseadas em dados.
      </p>
      <div className="flex gap-4">
        <div className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Powered by Data Intelligence</div>
      </div>
    </div>
  );
}

// Product Analysis Component
function ProductAnalysis({ productId, productName, onClear }: { productId: string; productName: string; onClear: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ["product-quotes", productId],
    queryFn: async () => {
      const { data: quoteItems } = await supabase
        .from("quote_supplier_items")
        .select("id, valor_oferecido, created_at, quote_id, supplier_id, product_name")
        .eq("product_id", productId)
        .gt("valor_oferecido", 0)
        .order("created_at", { ascending: false });

      if (!quoteItems || quoteItems.length === 0) return [];

      const supplierIds = [...new Set(quoteItems.map(q => q.supplier_id))];
      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("id, name")
        .in("id", supplierIds);

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
        date: item.created_at,
        supplier: suppliersMap.get(item.supplier_id)?.name || "Desconhecido",
        quote: quotesMap.get(item.quote_id) || null,
      }));
    },
  });

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

  const metrics = useMemo(() => {
    const quotePrices = quotes.map(q => q.price);
    const orderPrices = orders.map(o => o.unit_price);
    const allPrices = [...quotePrices, ...orderPrices];

    const avgPrice = allPrices.length > 0 ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length : 0;
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
    const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

    return {
      totalQuotes: quotes.length,
      totalOrders: orders.length,
      avgPrice,
      minPrice,
      maxPrice,
      lastPrice: orderPrices[0] || quotePrices[0] || 0
    };
  }, [quotes, orders]);

  const isLoading = quotesLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-[#83E509]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between p-6 rounded-2xl bg-zinc-900 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/10">
            <Package className="h-8 w-8 text-[#83E509]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{productName}</h2>
            <p className="text-zinc-400 text-sm">Visão analítica do produto</p>
          </div>
        </div>
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={onClear}>
          Fechar Análise
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Preço Médio" value={`R$ ${metrics.avgPrice.toFixed(2)}`} icon={DollarSign} />
        <MetricCard title="Melhor Preço" value={`R$ ${metrics.minPrice.toFixed(2)}`} icon={Award} />
        <MetricCard title="Cotações" value={metrics.totalQuotes.toString()} icon={FileText} />
        <MetricCard title="Pedidos" value={metrics.totalOrders.toString()} icon={ShoppingCart} />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Histórico</TabsTrigger>
          <TabsTrigger value="details" className="rounded-lg">Fornecedores</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <PriceHistoryList quotes={quotes} orders={orders} />
        </TabsContent>
        <TabsContent value="details" className="mt-6">
          <SupplierStats orders={orders} quotes={quotes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Supplier Analysis Component
function SupplierAnalysis({ supplierId, supplierName, onClear }: { supplierId: string; supplierName: string; onClear: () => void }) {
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["supplier-orders-analysis", supplierId],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select(`
          id, status, order_date, total_value,
          order_items(id, product_name, quantity, unit_price, total_price)
        `)
        .eq("supplier_id", supplierId)
        .order("order_date", { ascending: false });
      return data || [];
    },
  });

  const metrics = useMemo(() => {
    const totalSpent = orders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    const avgOrder = orders.length > 0 ? totalSpent / orders.length : 0;
    return {
      count: orders.length,
      totalSpent,
      avgOrder
    };
  }, [orders]);

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-[#83E509]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between p-6 rounded-2xl bg-zinc-900 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-white/10">
            <Building2 className="h-8 w-8 text-[#83E509]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{supplierName}</h2>
            <p className="text-zinc-400 text-sm">Histórico do parceiro comercial</p>
          </div>
        </div>
        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={onClear}>
          Fechar Análise
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total de Pedidos" value={metrics.count.toString()} icon={Package} />
        <MetricCard title="Volume Total" value={`R$ ${metrics.totalSpent.toLocaleString('pt-BR')}`} icon={DollarSign} />
        <MetricCard title="Ticket Médio" value={`R$ ${metrics.avgOrder.toFixed(2)}`} icon={TrendingUp} />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#83E509]/10 text-[#83E509]">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold">Pedidos Recentes</h3>
        </div>
        <OrderHistoryList orders={orders} />
      </div>
    </div>
  );
}

// Shared UI components for Analysis
function PriceHistoryList({ quotes, orders }: { quotes: any[]; orders: any[] }) {
  const combined = useMemo(() => {
    const q = quotes.map(x => ({ ...x, type: 'quote', date: new Date(x.date) }));
    const o = orders.map(x => ({ ...x, type: 'order', date: new Date(x.orders.order_date), price: x.unit_price, supplier: x.orders.supplier_name }));
    return [...q, ...o].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [quotes, orders]);

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {combined.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-[#83E509]/30 transition-all">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", item.type === 'order' ? 'bg-[#83E509]/10 text-[#83E509]' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500')}>
                {item.type === 'order' ? <ShoppingCart className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div>
                <p className="font-bold text-sm">{item.supplier}</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{item.date.toLocaleDateString('pt-BR')} • {item.type === 'order' ? 'Pedido' : 'Cotação'}</p>
              </div>
            </div>
            <span className="font-black text-zinc-900 dark:text-zinc-100 italic">R$ {item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function OrderHistoryList({ orders }: { orders: any[] }) {
  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-[#83E509]/30 transition-all bg-white dark:bg-zinc-950/20">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">#ORD-{order.id.substring(0, 8)}</span>
            <Badge variant="secondary" className="text-[10px] uppercase font-black tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-0">{order.status}</Badge>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">R$ {Number(order.total_value).toFixed(2)}</p>
              <p className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5 mt-1">
                <Calendar className="h-3 w-3" />
                {new Date(order.order_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
              <Package className="h-3 w-3 text-zinc-400" />
              <span className="text-[11px] font-black text-zinc-500">{order.order_items?.length} itens</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SupplierStats({ orders, quotes }: { orders: any[]; quotes: any[] }) {
  const stats = useMemo(() => {
    const map: Record<string, { count: number; avg: number; total: number }> = {};
    [...orders.map(o => ({ s: o.orders.supplier_name, p: o.unit_price })),
    ...quotes.map(q => ({ s: q.supplier, p: q.price }))].forEach(x => {
      if (!map[x.s]) map[x.s] = { count: 0, avg: 0, total: 0 };
      map[x.s].count++;
      map[x.s].total += x.p;
    });
    return Object.entries(map).map(([name, s]) => ({ name, ...s, avg: s.total / s.count })).sort((a, b) => a.avg - b.avg);
  }, [orders, quotes]);

  return (
    <div className="space-y-3">
      {stats.map((s, idx) => (
        <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:border-[#83E509]/30 transition-all">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[10px] text-zinc-500">{idx + 1}</div>
            <span className="font-bold text-sm">{s.name}</span>
          </div>
          <div className="text-right">
            <p className="font-black text-zinc-900 dark:text-zinc-100">R$ {s.avg.toFixed(2)}</p>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{s.count} interações</p>
          </div>
        </div>
      ))}
    </div>
  );
}
