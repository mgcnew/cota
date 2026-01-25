import { useState, useMemo, useCallback, startTransition, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePackagingQuotes } from "@/hooks/usePackagingQuotes";
import { usePackagingItems } from "@/hooks/usePackagingItems";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { usePagination } from "@/hooks/usePagination";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataPagination } from "@/components/ui/data-pagination";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { cn } from "@/lib/utils";
import {
  Package, Plus, Trash2, DollarSign,
  Building2, MoreVertical, Eye, CheckCircle2,
  PackageOpen, Loader2, ClipboardList, ShoppingCart, BarChart3, TrendingDown, Calculator,
  CircleCheck
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { PackagingQuoteDisplay } from "@/types/packaging";
import { designSystem } from "@/styles/design-system";

import { MobilePackagingQuoteCard } from "./embalagens/MobilePackagingQuoteCard";

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
  PackagingEconomyTab
} from "./embalagens";

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
    <div className="space-y-6">
      {/* Sub-tabs & Actions Container */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-2 bg-transparent !bg-transparent !bg-none !shadow-none !bg-opacity-0">
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full md:w-auto bg-transparent">
          <TabsList className={designSystem.components.tabs.clean.list}>
            {[
              { value: "cotacoes", icon: ClipboardList, label: "Cotações", badge: stats.prontasParaDecisao },
              { value: "pedidos", icon: ShoppingCart, label: "Pedidos" },
              { value: "analise", icon: BarChart3, label: "Análise" },
              { value: "economia", icon: Calculator, label: "Poupança" }
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={designSystem.components.tabs.clean.trigger}
              >
                <tab.icon className={cn("h-4 w-4 mr-2", activeSubTab === tab.value ? "text-[#83E509]" : "opacity-70")} />
                {tab.label}
                {tab.badge ? (
                  <span className="ml-2 px-1.5 py-0.5 bg-[#83E509] text-black text-[10px] font-black rounded-full animate-bounce">
                    {tab.badge}
                  </span>
                ) : null}
                {activeSubTab === tab.value && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#83E509] shadow-[0_0_10px_rgba(131,229,9,0.5)] rounded-full transition-all" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {!isMobile && (
            <Button
              variant="outline"
              onClick={() => setItemsDialogOpen(true)}
              className={cn("h-10 rounded-xl", designSystem.colors.border.subtle)}
            >
              <Package className="h-4 w-4 mr-2" />
              Gerenciar Itens
            </Button>
          )}
          {activeSubTab === "cotacoes" && (
            <Button
              onClick={() => setAddDialogOpen(true)}
              className={designSystem.components.button.primary}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Cotação
            </Button>
          )}
        </div>
      </div>

      {isMobile && (
        <Button
          variant="outline"
          onClick={() => setItemsDialogOpen(true)}
          className="w-full h-11 rounded-2xl bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
        >
          <Package className="h-4 w-4 mr-2" />
          Gerenciar Itens de Embalagem
        </Button>
      )}

      {activeSubTab === "cotacoes" && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {/* Métricas */}
          <ResponsiveGrid config={{ mobile: 2, tablet: 2, desktop: 4 }} gap="sm">
            <MetricCard title="Cotações Ativas" value={stats.ativas.toString()} icon={PackageOpen} variant="info" />
            <MetricCard
              title="Prontas p/ Decisão"
              value={stats.prontasParaDecisao.toString()}
              icon={CheckCircle2}
              variant="success"
              onClick={() => setStatusFilter("prontas")}
            />
            <MetricCard
              title="Concluídas"
              value={stats.concluidas.toString()}
              icon={CircleCheck}
              variant="warning"
              onClick={() => setStatusFilter("concluida")}
            />
            <MetricCard
              title="Economia Acumulada"
              value={`R$ ${stats.economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
              icon={TrendingDown}
              variant="success"
            />
          </ResponsiveGrid>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <ExpandableSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar em embalagens..."
                accentColor="brand"
                expandedWidth="w-full sm:w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn("w-full sm:w-[180px] h-11 rounded-2xl", designSystem.components.input.root)}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ativa">🟢 Ativas</SelectItem>
                  <SelectItem value="prontas">✅ Prontas p/ Decisão</SelectItem>
                  <SelectItem value="concluida">🔵 Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Alerta de prontas */}
          {stats.prontasParaDecisao > 0 && (
            <div className="bg-[#83E509]/5 border border-[#83E509]/20 rounded-2xl p-4 flex items-center gap-4 animate-in zoom-in-95 duration-500">
              <div className="w-10 h-10 rounded-full bg-[#83E509]/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-[#83E509]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-bold", designSystem.colors.text.primary)}>
                  {stats.prontasParaDecisao} cotação(ões) pronta(s) para decisão
                </p>
                <p className={cn("text-xs", designSystem.colors.text.secondary)}>Todos os fornecedores selecionados já enviaram suas propostas</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-[#83E509]/30 text-[#83E509] hover:bg-[#83E509]/10"
                onClick={() => setStatusFilter("prontas")}
              >
                Analisar agora
              </Button>
            </div>
          )}

          {/* Lista de cotações */}
          {paginatedData.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
              <Package className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-6" />
              <p className="text-zinc-500 font-medium">Nenhuma cotação de embalagem encontrada</p>
              <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />Criar Primeira Cotação
              </Button>
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {paginatedData.items.map((quote, index) => {
                const numero = paginatedData.pagination.startIndex + index + 1;
                return (
                  <MobilePackagingQuoteCard
                    key={quote.id}
                    quote={quote}
                    quoteNumber={numero}
                    onManage={handleManageQuote}
                    onDelete={handleDeleteQuote}
                    onConvertToOrder={handleConvertToOrder}
                  />
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <PackagingQuotesTable
                quotes={paginatedData.items}
                startIndex={paginatedData.pagination.startIndex}
                onManage={handleManageQuote}
                onDelete={handleDeleteQuote}
                onConvertToOrder={handleConvertToOrder}
              />
            </div>
          )}

          {/* Paginação */}
          {paginatedData.pagination.totalPages > 1 && (
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
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
      )}

      {/* Other Content - Persistent ForceMount */}
      <TabsContent value="pedidos" className="mt-0" forceMount>
        <div className={activeSubTab !== "pedidos" ? "hidden" : "animate-in slide-in-from-right-4 duration-300"}>
          <PackagingOrdersTab onCreateOrder={() => setAddDialogOpen(true)} />
        </div>
      </TabsContent>

      <TabsContent value="analise" className="mt-0" forceMount>
        <div className={activeSubTab !== "analise" ? "hidden" : "animate-in slide-in-from-right-4 duration-300"}>
          <PackagingAnalysisTab />
        </div>
      </TabsContent>

      <TabsContent value="economia" className="mt-0" forceMount>
        <div className={activeSubTab !== "economia" ? "hidden" : "animate-in slide-in-from-right-4 duration-300"}>
          <PackagingEconomyTab />
        </div>
      </TabsContent>

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
    </div>
  );
}

export default memo(EmbalagensTab);
