import { useState, useMemo, useCallback, startTransition, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { usePackagingItems } from "@/hooks/usePackagingItems";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { usePagination } from "@/hooks/usePagination";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataPagination } from "@/components/ui/data-pagination";
import { StatCard } from "@/components/ui/stat-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import {
  Package, Plus, Trash2, DollarSign,
  Building2, MoreVertical, Eye, CheckCircle2,
  PackageOpen, Loader2, ClipboardList, ShoppingCart, BarChart3, TrendingDown, Calculator,
  CircleCheck, PiggyBank, SlidersHorizontal, Archive
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { PackagingQuoteDisplay } from "@/types/packaging";
import { designSystem } from "@/styles/design-system";

import { MobilePackagingQuoteCard } from "./embalagens/MobilePackagingQuoteCard";
import { MobileMetricRibbon } from "@/components/dashboard/MobileMetricRibbon";
import { MobileMetricCard } from "@/components/dashboard/MobileMetricCard";

// Dialogs e componentes
import {
  AddPackagingQuoteDialog,
  ManagePackagingQuoteDialog,
  DeletePackagingQuoteDialog,
  PackagingItemsDialog,
  ConvertToPackagingOrderDialog,
  PackagingQuotesTable,
  PackagingOrdersTab,
  PackagingAnalysisTab,
  PackagingEconomyTab,
  ResumoPackagingQuoteDialog
} from "./embalagens";

const SUBTABS = [
  { value: "cotacoes", icon: ClipboardList, label: "Cotações" },
  { value: "pedidos",  icon: ShoppingCart,  label: "Pedidos"  },
  { value: "analise",  icon: BarChart3,     label: "Análise"  },
  { value: "economia", icon: PiggyBank,     label: "Poupança" },
];

function EmbalagensTab() {
  const { isMobile } = useBreakpoint();
  const { paginate } = usePagination<PackagingQuoteDisplay>({ initialItemsPerPage: isMobile ? 8 : 10 });
  const [activeSubTab, setActiveSubTab] = useState("cotacoes");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [resumoDialogOpen, setResumoDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const { quotes, isLoading: quotesLoading, deleteQuote } = usePackagingQuotes();
  const { orders } = usePackagingOrders();
  const { items: packagingItems } = usePackagingItems();
  const { suppliers } = useSuppliers();

  // Derive selectedQuote from quotes
  const selectedQuote = useMemo(() => {
    if (!selectedQuoteId) return null;
    return quotes.find(q => q.id === selectedQuoteId) || null;
  }, [quotes, selectedQuoteId]);

  // Ouvir evento de atalho de teclado
  useEffect(() => {
    const handleNovaEvent = (e: CustomEvent) => {
      if (e.detail?.tab === 'embalagens') {
        setAddDialogOpen(true);
      }
    };
    window.addEventListener('compras:nova', handleNovaEvent as EventListener);
    return () => window.removeEventListener('compras:nova', handleNovaEvent as EventListener);
  }, []);

  const handleManageQuote = useCallback((quote: PackagingQuoteDisplay) => {
    startTransition(() => {
      setSelectedQuoteId(quote.id);
      setManageDialogOpen(true);
    });
  }, []);

  const handleViewSummary = useCallback((quote: PackagingQuoteDisplay) => {
    startTransition(() => {
      setSelectedQuoteId(quote.id);
      setResumoDialogOpen(true);
    });
  }, []);

  const handleDeleteQuote = useCallback((quote: PackagingQuoteDisplay) => {
    startTransition(() => {
      setSelectedQuoteId(quote.id);
      setDeleteDialogOpen(true);
    });
  }, []);

  const handleConvertToOrder = useCallback((quote: PackagingQuoteDisplay) => {
    startTransition(() => {
      setSelectedQuoteId(quote.id);
      setConvertDialogOpen(true);
    });
  }, []);

  // IDs de cotações que já foram convertidas em pedidos
  const convertedQuoteIds = useMemo(() => {
    return new Set(orders.filter(o => o.quoteId).map(o => o.quoteId));
  }, [orders]);

  // Filtrar cotações (INCLUINDO as concluídas para histórico)
  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const itemNames = q.itens.map(i => i.packagingName.toLowerCase()).join(' ');
      const matchesSearch = itemNames.includes(debouncedSearchTerm.toLowerCase()) ||
        q.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      if (statusFilter === "all") return matchesSearch;
      if (statusFilter === "prontas") {
        const respondidos = q.fornecedores.filter(f => f.status === "respondido").length;
        return matchesSearch && q.status === "ativa" && respondidos === q.fornecedores.length && q.fornecedores.length > 0;
      }
      if (statusFilter === "concluida") {
        return matchesSearch && (q.status === "concluida" || convertedQuoteIds.has(q.id));
      }
      return matchesSearch && q.status === statusFilter;
    });
  }, [quotes, debouncedSearchTerm, statusFilter, convertedQuoteIds]);

  const paginatedData = paginate(filteredQuotes);

  // Estatísticas (excluindo cotações já convertidas)
  const stats = useMemo(() => {
    const quotesNaoConvertidas = quotes.filter(q => !convertedQuoteIds.has(q.id));
    const ativas = quotesNaoConvertidas.filter(q => q.status === "ativa").length;
    const concluidas = quotesNaoConvertidas.filter(q => q.status === "concluida").length;
    const prontasParaDecisao = quotesNaoConvertidas.filter(q => {
      const respondidos = q.fornecedores.filter(f => f.status === "respondido").length;
      return q.status === "ativa" && respondidos === q.fornecedores.length && q.fornecedores.length > 0;
    }).length;
    const totalPedidos = orders.length;

    // Calcular economia total dos pedidos
    const economiaTotal = orders.reduce((sum, order) => sum + (order.economiaEstimada || 0), 0);

    return { total: quotesNaoConvertidas.length, ativas, concluidas, prontasParaDecisao, totalPedidos, economiaTotal };
  }, [quotes, orders, convertedQuoteIds]);

  const getQuoteStatus = (quote: PackagingQuoteDisplay) => {
    const respondidos = quote.fornecedores.filter(f => f.status === "respondido").length;
    const total = quote.fornecedores.length;
    const isPronta = quote.status === "ativa" && respondidos === total && total > 0;
    return { respondidos, total, isPronta };
  };

  if (quotesLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className={cn("h-10 w-10 animate-spin", designSystem.colors.text.primary)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList variant="line" className="overflow-x-auto [&::-webkit-scrollbar]:hidden w-full">
          {SUBTABS.map(t => (
            <TabsTrigger key={t.value} value={t.value} variant="line" className="gap-1.5 whitespace-nowrap relative">
              <t.icon className={cn("h-3.5 w-3.5 transition-colors", activeSubTab === t.value ? "text-brand" : "opacity-40")} />
              {t.label}
              {t.value === "cotacoes" && stats.prontasParaDecisao > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Cotações Content */}
      {activeSubTab === "cotacoes" && (
        <div className="space-y-4">
          {/* Métricas — desktop only */}
          {!isMobile && (
            <ResponsiveGrid config={{ mobile: 2, tablet: 2, desktop: 4 }} gap="sm">
              <StatCard title="Cotações Ativas" value={stats.ativas.toString()} icon={PackageOpen} variant="info" />
              <StatCard title="Prontas p/ Decisão" value={stats.prontasParaDecisao.toString()} icon={CheckCircle2} variant="success" onClick={() => setStatusFilter("prontas")} />
              <StatCard title="Concluídas" value={stats.concluidas.toString()} icon={CircleCheck} variant="warning" onClick={() => setStatusFilter("concluida")} />
              <StatCard title="Economia Acumulada" value={formatCurrency(stats.economiaTotal)} icon={TrendingDown} variant="success" />
            </ResponsiveGrid>
          )}

          {/* Unified Container — matches CotacoesTab pattern */}
          <div className="w-full bg-white dark:bg-card border border-border dark:border-white/5 sm:rounded-xl overflow-hidden shadow-sm">
            {/* Action bar */}
            <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5 border-b border-border dark:border-white/5 bg-zinc-50/50 dark:bg-muted/30">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar..." />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5 text-sm">
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Status</span>
                      {statusFilter !== "all" && (
                        <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold bg-brand text-white rounded-full">1</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-52 p-1.5" align="start">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">Filtrar por status</p>
                    {[
                      { value: "all",      label: "Todos os Status" },
                      { value: "ativa",    label: "Ativas" },
                      { value: "prontas",  label: "Prontas p/ Decisão" },
                      { value: "concluida",label: "Concluídas" },
                    ].map(item => (
                      <button
                        key={item.value}
                        onClick={() => setStatusFilter(item.value)}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors",
                          statusFilter === item.value ? "bg-brand text-white font-medium" : "text-foreground hover:bg-muted"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItemsDialogOpen(true)}
                  className="h-9 shrink-0 gap-1.5 text-sm"
                  title="Gestão de Itens"
                >
                  <Package className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Gestão de Itens</span>
                </Button>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <Button onClick={() => setAddDialogOpen(true)} className={cn(designSystem.components.button.primary, "h-9 px-4")}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Nova Cotação</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="w-full">
              {paginatedData.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Package className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-6" />
                  <p className="text-zinc-500 font-medium">Nenhuma cotação de embalagem encontrada</p>
                  <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Criar Primeira Cotação
                  </Button>
                </div>
              ) : (
                <>
                  {/* Só monta a view do dispositivo atual (evita cards + tabela juntos no DOM) */}
                  {isMobile ? (
                    <div className="space-y-3 p-2 pb-24">
                      {paginatedData.items.map((quote, index) => {
                        const numero = paginatedData.pagination.startIndex + index + 1;
                        return (
                          <MobilePackagingQuoteCard
                            key={quote.id}
                            quote={quote}
                            quoteNumber={numero}
                            onManage={handleManageQuote}
                            onViewSummary={handleViewSummary}
                            onDelete={handleDeleteQuote}
                            onConvertToOrder={handleConvertToOrder}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6">
                    {stats.prontasParaDecisao > 0 && (
                      <div className="mb-6 animate-in zoom-in-95 duration-500">
                        <div className="bg-brand/5 border border-brand/20 rounded-2xl p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-brand" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-bold", designSystem.colors.text.primary)}>
                              {stats.prontasParaDecisao} cotação(ões) pronta(s) para decisão
                            </p>
                            <p className={cn("text-xs", designSystem.colors.text.secondary)}>Todos os fornecedores já enviaram suas propostas</p>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-xl border-brand/30 text-brand hover:bg-brand/10" onClick={() => setStatusFilter("prontas")}>
                            Analisar agora
                          </Button>
                        </div>
                      </div>
                    )}
                    <PackagingQuotesTable
                      quotes={paginatedData.items}
                      startIndex={paginatedData.pagination.startIndex}
                      onManage={handleManageQuote}
                      onViewSummary={handleViewSummary}
                      onDelete={handleDeleteQuote}
                      onConvertToOrder={handleConvertToOrder}
                    />
                  </div>
                  )}
                </>
              )}
            </div>

            {/* Paginação */}
            {paginatedData.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border dark:border-white/5">
                <DataPagination
                  currentPage={paginatedData.pagination.currentPage}
                  totalPages={paginatedData.pagination.totalPages}
                  onPageChange={paginatedData.pagination.goToPage}
                  totalItems={paginatedData.pagination.totalItems}
                  itemsPerPage={paginatedData.pagination.itemsPerPage}
                  onItemsPerPageChange={paginatedData.pagination.setItemsPerPage}
                  startIndex={paginatedData.pagination.startIndex}
                  endIndex={paginatedData.pagination.endIndex}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other Pages Content - Persistent Display toggled via CSS */}
      <div className={activeSubTab !== "pedidos" ? "hidden" : ""}>
        <PackagingOrdersTab onCreateOrder={() => setAddDialogOpen(true)} />
      </div>

      <div className={activeSubTab !== "analise" ? "hidden" : ""}>
        <PackagingAnalysisTab />
      </div>

      <div className={activeSubTab !== "economia" ? "hidden" : ""}>
        <PackagingEconomyTab />
      </div>

      {/* Dialogs */}
      <AddPackagingQuoteDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        packagingItems={packagingItems}
        suppliers={suppliers}
      />

      <ManagePackagingQuoteDialog
        open={manageDialogOpen}
        onOpenChange={setManageDialogOpen}
        quote={selectedQuote}
        availablePackagingItems={packagingItems}
        availableSuppliers={suppliers}
      />

      <DeletePackagingQuoteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        quote={selectedQuote}
        onConfirm={() => {
          if (selectedQuote) {
            deleteQuote.mutate(selectedQuote.id);
            setDeleteDialogOpen(false);
          }
        }}
      />

      <ConvertToPackagingOrderDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        quote={selectedQuote}
      />

      <PackagingItemsDialog
        open={itemsDialogOpen}
        onOpenChange={setItemsDialogOpen}
      />

      {selectedQuote && (
        <ResumoPackagingQuoteDialog
          open={resumoDialogOpen}
          onOpenChange={setResumoDialogOpen}
          quote={selectedQuote}
        />
      )}
    </div>
  );
}

export default memo(EmbalagensTab);

