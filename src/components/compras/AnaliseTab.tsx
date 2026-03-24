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
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { designSystem } from "@/styles/design-system";
import { MetricCard } from "@/components/ui/metric-card";

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
          designSystem.components.card.root,
          "p-6 bg-brand/5 border-brand/10"
        )}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-brand/10 border border-brand/20">
              <BarChart3 className="h-6 w-6 text-brand" />
            </div>
            <div className="flex-1">
              <h3 className={cn(designSystem.typography.size.lg, designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
                Central de Inteligência
              </h3>
              <p className={cn(designSystem.typography.size.sm, designSystem.colors.text.secondary, "opacity-70")}>
                Consulte históricos e tendências de produtos ou fornecedores
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 group-focus-within:text-brand transition-colors" />
          <Input
            placeholder="O que você deseja analisar hoje? (Produto, fornecedor ou vendedor)"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setHighlightedIndex(-1); }}
            onKeyDown={handleSearchKeyDown}
            className={cn(
              designSystem.components.input.root,
              "pl-12 h-14 text-base rounded-2xl",
              "focus:border-brand focus:ring-4 focus:ring-brand/10 outline-none"
            )}
            data-search-input
          />

          {searchResults.length > 0 && (
            <div className={cn(
              "absolute z-50 w-full mt-3 border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200",
              designSystem.colors.surface.card,
              designSystem.colors.border.subtle
            )}>
              <div className="px-5 py-3 bg-muted/30 border-b border-border">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">Sugestões encontradas</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                {searchResults.map((item, index) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => selectItem(item)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "w-full px-5 py-4 flex items-center gap-4 text-left transition-all relative group",
                      highlightedIndex === index
                        ? "bg-brand/5"
                        : "hover:bg-muted/30"
                    )}
                  >
                    {/* Active Indicator */}
                    {highlightedIndex === index && (
                      <div className="absolute left-0 top-0 w-1 h-full bg-brand" />
                    )}

                    <div className={cn(
                      "p-2.5 rounded-xl flex-shrink-0 transition-colors",
                      item.type === "product"
                        ? (highlightedIndex === index ? "bg-brand text-white" : "bg-brand/10 text-brand")
                        : (highlightedIndex === index ? "bg-blue-500 text-white" : "bg-blue-500/10 text-blue-500")
                    )}>
                      {item.type === "product"
                        ? <Package className="h-5 w-5" />
                        : <Building2 className="h-5 w-5" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-bold text-sm truncate", designSystem.colors.text.primary)}>{item.name}</p>
                      <p className={cn("text-xs flex items-center gap-2", designSystem.colors.text.secondary, "opacity-60")}>
                        {item.type === "product" ? (
                          <span className="flex items-center gap-1"><Package className="h-3 w-3" /> Produto</span>
                        ) : (
                          <>
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Fornecedor</span>
                            {item.contact && (
                              <span className="text-brand font-medium">
                                • 👤 {item.contact}
                              </span>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                    <ArrowRight className={cn(
                      "h-4 w-4 transition-all",
                      highlightedIndex === index ? "translate-x-1 text-brand opacity-100" : "text-muted-foreground opacity-0"
                    )} />
                  </button>
                ))}
              </div>
              <div className="px-5 py-3 text-[10px] font-black text-muted-foreground/50 bg-muted/30 border-t border-border flex justify-between uppercase tracking-widest">
                <div>DICA: Use as setas para navegar</div>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border border-border shadow-sm">↑↓</kbd> Mudar
                  </span>
                  <span className="flex items-center gap-1.5">
                    <kbd className="px-1.5 py-0.5 bg-background rounded border border-border shadow-sm">Enter</kbd> Abrir
                  </span>
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
    <div className={cn(
      "flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed",
      designSystem.colors.border.subtle,
      "bg-muted/20"
    )}>
      <div className={cn(
        "w-24 h-24 rounded-full flex items-center justify-center mb-8 animate-pulse",
        designSystem.colors.surface.card,
        "shadow-xl"
      )}>
        <Target className="h-12 w-12 text-brand" />
      </div>
      <h3 className={cn(designSystem.typography.size.xl, designSystem.typography.weight.bold, designSystem.colors.text.primary, "mb-3")}>
        Pronto para o próximo insight?
      </h3>
      <p className={cn(designSystem.typography.size.sm, designSystem.colors.text.secondary, "max-w-sm mx-auto opacity-70 mb-8")}>
        Analise o desempenho de qualquer item ou parceiro comercial em tempo real para tomar decisões baseadas em dados.
      </p>
      <div className="flex gap-4">
        <div className="px-4 py-2 rounded-full bg-muted text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Powered by Data Intelligence
        </div>
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
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className={cn(
        "flex items-center justify-between p-6 rounded-2xl shadow-xl overflow-hidden relative",
        "bg-zinc-900 text-white"
      )}>
        {/* Background Accent */}
        <div className="absolute right-0 top-0 w-32 h-full bg-brand/10 skew-x-[-20deg] translate-x-16 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <Package className="h-8 w-8 text-brand" />
          </div>
          <div>
            <h2 className={cn(designSystem.typography.size["2xl"], designSystem.typography.weight.bold, "tracking-tight")}>
              {productName}
            </h2>
            <p className="text-zinc-400 text-sm font-medium">Visão analítica do produto</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="relative z-10 border-white/20 text-white hover:bg-white/10 rounded-xl font-bold" 
          onClick={onClear}
        >
          Fechar Análise
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Preço Médio" value={`R$ ${metrics.avgPrice.toFixed(2)}`} icon={DollarSign} variant="default" />
        <MetricCard title="Melhor Preço" value={`R$ ${metrics.minPrice.toFixed(2)}`} icon={Award} variant="success" />
        <MetricCard title="Cotações" value={metrics.totalQuotes.toString()} icon={FileText} variant="info" />
        <MetricCard title="Pedidos" value={metrics.totalOrders.toString()} icon={ShoppingCart} variant="warning" />
      </div>

      <div className={cn(designSystem.components.card.root, "p-1")}>
        <Tabs defaultValue="overview" className="w-full">
          <div className="px-4 pt-4">
            <TabsList className={designSystem.components.tabs.clean.list}>
              <TabsTrigger value="overview" className={designSystem.components.tabs.clean.trigger}>Histórico de Preços</TabsTrigger>
              <TabsTrigger value="details" className={designSystem.components.tabs.clean.trigger}>Comparativo de Fornecedores</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="overview" className="mt-0 p-4">
            <PriceHistoryList quotes={quotes} orders={orders} />
          </TabsContent>
          <TabsContent value="details" className="mt-0 p-4">
            <SupplierStats orders={orders} quotes={quotes} />
          </TabsContent>
        </Tabs>
      </div>
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
        <Loader2 className="h-10 w-10 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className={cn(
        "flex items-center justify-between p-6 rounded-2xl shadow-xl overflow-hidden relative",
        "bg-zinc-900 text-white"
      )}>
        {/* Background Accent */}
        <div className="absolute right-0 top-0 w-32 h-full bg-brand/10 skew-x-[-20deg] translate-x-16 pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
            <Building2 className="h-8 w-8 text-brand" />
          </div>
          <div>
            <h2 className={cn(designSystem.typography.size["2xl"], designSystem.typography.weight.bold, "tracking-tight")}>
              {supplierName}
            </h2>
            <p className="text-zinc-400 text-sm font-medium">Histórico do parceiro comercial</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="relative z-10 border-white/20 text-white hover:bg-white/10 rounded-xl font-bold" 
          onClick={onClear}
        >
          Fechar Análise
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total de Pedidos" value={metrics.count.toString()} icon={Package} variant="default" />
        <MetricCard title="Volume Total" value={`R$ ${metrics.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} variant="success" />
        <MetricCard title="Ticket Médio" value={`R$ ${metrics.avgOrder.toFixed(2)}`} icon={TrendingUp} variant="info" />
      </div>

      <div className={cn(designSystem.components.card.root, "p-6")}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-brand/10 text-brand border border-brand/20">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <h3 className={cn(designSystem.typography.size.lg, designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
            Pedidos Recentes
          </h3>
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
    <div className="overflow-hidden custom-scrollbar">
      <Table className={designSystem.components.table.root}>
        <TableHeader className={designSystem.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={4} className="px-1 pb-3 pt-0 border-none">
              <div className={designSystem.components.table.headerContainer}>
                <div className="w-[15%] flex items-center gap-3">
                  <div className={designSystem.components.table.headerIcon}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className={designSystem.components.table.headerLabel}>Tipo</span>
                </div>
                <div className="w-[45%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Fornecedor</span>
                </div>
                <div className="w-[20%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Data</span>
                </div>
                <div className="w-[20%] text-right flex justify-end items-center px-2">
                  <span className={designSystem.components.table.headerLabel}>Preço</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {combined.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-muted-foreground italic">
                Nenhum histórico encontrado.
              </TableCell>
            </TableRow>
          ) : (
            combined.map((item, idx) => (
              <TableRow key={idx} className="group border-none hover:bg-transparent">
                <TableCell colSpan={4} className={designSystem.components.table.cell}>
                  <div className={cn("flex items-center px-4 py-3 mb-1", designSystem.components.table.row)}>
                    <div className="w-[15%] flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        item.type === 'order' ? 'bg-brand/10 text-brand' : 'bg-muted text-muted-foreground'
                      )}>
                        {item.type === 'order' ? <ShoppingCart className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest", designSystem.colors.text.secondary, "opacity-50")}>
                        {item.type === 'order' ? 'Pedido' : 'Cotação'}
                      </span>
                    </div>
                    <div className="w-[45%] pl-2">
                      <p className={cn("font-bold text-sm", designSystem.colors.text.primary)}>{item.supplier}</p>
                    </div>
                    <div className="w-[20%] pl-2">
                      <p className={cn("text-xs font-medium", designSystem.colors.text.secondary)}>{item.date.toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="w-[20%] text-right px-2">
                      <span className={cn("font-black italic text-base", designSystem.colors.text.primary)}>
                        R$ {item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function OrderHistoryList({ orders }: { orders: any[] }) {
  return (
    <div className="overflow-hidden custom-scrollbar">
      <Table className={designSystem.components.table.root}>
        <TableHeader className={designSystem.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={5} className="px-1 pb-3 pt-0 border-none">
              <div className={designSystem.components.table.headerContainer}>
                <div className="w-[20%] flex items-center gap-3">
                  <div className={designSystem.components.table.headerIcon}>
                    <ShoppingCart className="h-4 w-4" />
                  </div>
                  <span className={designSystem.components.table.headerLabel}>ID / Status</span>
                </div>
                <div className="w-[40%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Data</span>
                </div>
                <div className="w-[15%] pl-2 flex justify-center items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Itens</span>
                </div>
                <div className="w-[25%] text-right flex justify-end items-center px-2">
                  <span className={designSystem.components.table.headerLabel}>Valor</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground italic">
                Nenhum pedido encontrado.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id} className="group border-none hover:bg-transparent">
                <TableCell colSpan={5} className={designSystem.components.table.cell}>
                  <div className={cn("flex items-center px-4 py-3 mb-1", designSystem.components.table.row)}>
                    <div className="w-[20%] flex flex-col items-start gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">#ORD-{order.id.substring(0, 8)}</span>
                      <Badge variant="secondary" className="text-[9px] uppercase font-black tracking-widest bg-muted/50 text-muted-foreground border-border/50">{order.status}</Badge>
                    </div>
                    <div className="w-[40%] pl-2">
                      <p className={cn("text-xs font-bold flex items-center gap-1.5 opacity-60", designSystem.colors.text.secondary)}>
                        <Calendar className="h-3 w-3" />
                        {new Date(order.order_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="w-[15%] flex justify-center items-center pl-2">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/50">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{order.order_items?.length}</span>
                      </div>
                    </div>
                    <div className="w-[25%] text-right px-2">
                      <p className={cn("text-base font-black tracking-tight italic", designSystem.colors.text.primary)}>
                        R$ {Number(order.total_value).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
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
    <div className="overflow-hidden custom-scrollbar">
      <Table className={designSystem.components.table.root}>
        <TableHeader className={designSystem.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={4} className="px-1 pb-3 pt-0 border-none">
              <div className={designSystem.components.table.headerContainer}>
                <div className="w-[10%] flex items-center gap-3">
                  <span className={designSystem.components.table.headerLabel}>Pos</span>
                </div>
                <div className="w-[45%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Fornecedor</span>
                </div>
                <div className="w-[20%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Interações</span>
                </div>
                <div className="w-[25%] text-right flex justify-end items-center px-2">
                  <span className={designSystem.components.table.headerLabel}>Preço Médio</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-12 text-center text-muted-foreground italic">
                Nenhuma informação encontrada.
              </TableCell>
            </TableRow>
          ) : (
            stats.map((s, idx) => (
              <TableRow key={idx} className="group border-none hover:bg-transparent">
                <TableCell colSpan={4} className={designSystem.components.table.cell}>
                  <div className={cn("flex items-center px-4 py-3 mb-1", designSystem.components.table.row)}>
                    <div className="w-[10%] flex items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[11px] border transition-colors",
                        idx === 0 ? "bg-brand text-white border-brand" : "bg-muted text-muted-foreground border-border/50"
                      )}>
                        {idx + 1}
                      </div>
                    </div>
                    <div className="w-[45%] pl-2">
                      <span className={cn("font-bold text-sm block", designSystem.colors.text.primary)}>{s.name}</span>
                      {idx === 0 && (
                        <p className="text-[9px] font-black text-brand uppercase tracking-widest mt-0.5">Melhor Preço Médio</p>
                      )}
                    </div>
                    <div className="w-[20%] pl-2">
                      <p className={cn("font-medium text-xs opacity-70", designSystem.colors.text.secondary)}>
                        {s.count} vezes
                      </p>
                    </div>
                    <div className="w-[25%] text-right px-2">
                      <p className={cn("font-black text-base italic", designSystem.colors.text.primary)}>
                        R$ {s.avg.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
