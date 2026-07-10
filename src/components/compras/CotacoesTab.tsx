import { useCallback, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import type { Quote } from "@/hooks/useCotacoes";
import { useCotacoesFilters } from "@/hooks/useCotacoesFilters";
import { useCotacoesDialogs } from "@/hooks/useCotacoesDialogs";
import { Plus, FileText, Download, Users, Zap, CheckCircle2, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { usePagination } from "@/hooks/usePagination";
import { useCotacoesStats } from "@/hooks/useCotacoesStats";
import { CotacoesListDesktop } from "./CotacoesListDesktop";
import { MobileQuoteCard } from "./MobileQuoteCard";
import { RelatorioEconomiaDialog } from "./RelatorioEconomiaDialog";
import { MobileMetricRibbon } from "@/components/dashboard/MobileMetricRibbon";
import { MobileMetricCard } from "@/components/dashboard/MobileMetricCard";

import {
  AddQuoteDialogLazy,
  DeleteQuoteDialogLazy,
  ResumoCotacaoDialogLazy,
  GerenciarCotacaoDialogLazy
} from "@/components/forms/LazyDialogs";

function CotacoesTab() {
  const { isMobile } = useBreakpoint();
  
  const { 
    cotacoes, 
    isLoading, 
    isUpdating,
    refetch, 
    updateQuoteStatus, 
    deleteQuote 
  } = useCotacoes();

  const stats = useCotacoesStats(cotacoes);

  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    handleStatusFilterChange,
    filteredCotacoes
  } = useCotacoesFilters(cotacoes);

  const {
    addDialogOpen,
    setAddDialogOpen,
    viewDialogOpen,
    setViewDialogOpen,
    gerenciarDialogOpen,
    setGerenciarDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    relatorioDialogOpen,
    setRelatorioDialogOpen,
    selectedQuote,
    initialSupplierId,
    setInitialSupplierId,
    handleViewQuote,
    handleGerenciarQuote,
    handleDeleteQuote
  } = useCotacoesDialogs(cotacoes);

  const { paginate } = usePagination<Quote>({ initialItemsPerPage: isMobile ? 8 : 10 });
  const paginatedData = paginate(filteredCotacoes);

  const handleUpdateStatus = useCallback((quoteId: string, status: string) => {
    updateQuoteStatus.mutate({ quoteId, status });
  }, [updateQuoteStatus]);

  const handleExportQuotes = useCallback(() => {
    setRelatorioDialogOpen(true);
  }, [setRelatorioDialogOpen]);

  // Ouvir evento de atalho de teclado para nova cotação
  useEffect(() => {
    const handleNovaEvent = (e: CustomEvent) => {
      if (e.detail?.tab === 'cotacoes') {
        setAddDialogOpen(true);
      }
    };
    window.addEventListener('compras:nova', handleNovaEvent as EventListener);
    return () => window.removeEventListener('compras:nova', handleNovaEvent as EventListener);
  }, [setAddDialogOpen]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      {isMobile ? (
        <div className="mb-4 -mx-1">
          <MobileMetricRibbon>
            <MobileMetricCard title="Cotações Ativas" value={stats.ativas} icon={FileText} variant="info" />
            <MobileMetricCard
              title="Adesão Fornecedores"
              value={stats.adesaoFormatada}
              icon={Users}
              variant="success"
              trend={{ value: `${stats.pendentes} pendentes`, label: "aguardando", type: "neutral" }}
            />
            <MobileMetricCard
              title="Ações Urgentes"
              value={stats.vencendo}
              icon={Zap}
              variant="warning"
              trend={{ value: "Vencendo", label: "em 48h", type: "neutral" }}
              onClick={() => handleStatusFilterChange("vencendo")}
            />
            <MobileMetricCard
              title="Prontas p/ Fechar"
              value={stats.prontasParaDecisao}
              icon={CheckCircle2}
              variant="success"
              onClick={() => handleStatusFilterChange("prontas")}
            />
          </MobileMetricRibbon>
        </div>
      ) : (
        <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 4 }}>
          <StatCard title="Cotações Ativas" value={stats.ativas} icon={FileText} variant="info" />

          <StatCard
            title="Adesão de Fornecedores"
            value={stats.adesaoFormatada}
            icon={Users}
            variant="success"
            trend={{
              value: `${stats.pendentes} pendentes`,
              label: "aguardando",
              type: "neutral"
            }}
          />

          <StatCard
            title="Ações Urgentes"
            value={stats.vencendo}
            icon={Zap}
            variant="warning"
            trend={{
              value: "Vencendo",
              label: "em 48h",
              type: "neutral"
            }}
            onClick={() => handleStatusFilterChange("vencendo")}
          />

          <StatCard
            title="Prontas p/ Fechar"
            value={stats.prontasParaDecisao}
            icon={CheckCircle2}
            variant="success"
            trend={{
              value: "Todos responderam",
              label: "aguardando decisão",
              type: "positive"
            }}
            onClick={() => handleStatusFilterChange("prontas")}
          />
        </ResponsiveGrid>
      )}

      {/* Unified Container for Search, Table and Mobile Cards */}
      <div className="w-full bg-white dark:bg-card border border-border dark:border-white/5 sm:rounded-xl overflow-hidden shadow-sm mb-8">
        {/* Header / Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5 border-b border-border dark:border-white/5 bg-zinc-50/50 dark:bg-muted/30">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-full sm:w-56">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Pesquisar..."
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5 text-sm">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Status</span>
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold bg-brand text-white rounded-full">1</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-1.5" align="start">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">Filtrar por status</p>
                {[
                  { value: 'all',      label: 'Todos os Status' },
                  { value: 'ativa',    label: 'Ativas' },
                  { value: 'pendente', label: 'Pendentes' },
                  { value: 'prontas',  label: 'Prontas p/ Decisão' },
                  { value: 'vencendo', label: 'Vencendo em 48h' },
                  { value: 'concluida',label: 'Concluídas' },
                ].map(item => (
                  <button
                    key={item.value}
                    onClick={() => handleStatusFilterChange(item.value)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors",
                      statusFilter === item.value
                        ? "bg-brand text-white font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportQuotes}
              className="h-9 w-9 p-0"
              title="Relatório de Economia e Resultados"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className={cn(ds.components.button.primary, "h-9 px-4")}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Nova Cotação</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>

<div className="w-full">
          {paginatedData.items.length === 0 && !isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">Nenhuma cotação encontrada</h3>
              <p className="text-zinc-500 max-w-sm mx-auto mb-6">Tente ajustar os filtros ou crie uma nova cotação.</p>
              <Button onClick={() => setAddDialogOpen(true)} className={cn(ds.components.button.primary)}>
                <Plus className="h-4 w-4 mr-2" /> Nova Cotação
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="md:hidden">
                <div className="space-y-3 p-2 pb-24">
                  {paginatedData.items.map((cotacao, index) => {
                    const cotacaoNumero = paginatedData.pagination.startIndex + index + 1;
                    return (
                      <MobileQuoteCard
                        key={cotacao.id}
                        cotacao={cotacao}
                        cotacaoNumero={cotacaoNumero}
                        onView={handleViewQuote}
                        onManage={handleGerenciarQuote}
                        onDelete={handleDeleteQuote}
                        onUpdateStatus={handleUpdateStatus}
                        isUpdating={isUpdating}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <CotacoesListDesktop
                  cotacoes={paginatedData.items}
                  startIndex={paginatedData.pagination.startIndex}
                  onUpdateStatus={handleUpdateStatus}
                  onView={handleViewQuote}
                  onManage={handleGerenciarQuote}
                  onDelete={handleDeleteQuote}
                  isUpdating={isUpdating}
                />
              </div>

              {/* Pagination */}
              <div className="px-3.5 py-2 border-t border-border dark:border-white/5 bg-zinc-50/50 dark:bg-muted/30">
                <Pagination className="w-full max-w-xs mx-0">
                  <PaginationContent className="w-full justify-between">
                    <PaginationItem>
                      <PaginationLink
                        size="icon"
                        aria-label="Página anterior"
                        onClick={() => paginatedData.pagination.goToPage(paginatedData.pagination.currentPage - 1)}
                        className={cn(paginatedData.pagination.currentPage <= 1 && "pointer-events-none opacity-40")}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-muted-foreground text-xs">
                        Página <span className="text-foreground font-medium">{paginatedData.pagination.currentPage}</span> de{" "}
                        <span className="text-foreground font-medium">{paginatedData.pagination.totalPages || 1}</span>
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        size="icon"
                        aria-label="Próxima página"
                        onClick={() => paginatedData.pagination.goToPage(paginatedData.pagination.currentPage + 1)}
                        className={cn(paginatedData.pagination.currentPage >= paginatedData.pagination.totalPages && "pointer-events-none opacity-40")}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </PaginationLink>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddQuoteDialogLazy
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setInitialSupplierId(null);
        }}
        onAdd={() => { refetch(); setAddDialogOpen(false); setInitialSupplierId(null); }}
        defaultSupplierId={initialSupplierId}
      />
      <ResumoCotacaoDialogLazy open={viewDialogOpen} onOpenChange={setViewDialogOpen} quote={selectedQuote} />
      <GerenciarCotacaoDialogLazy
        open={gerenciarDialogOpen}
        onOpenChange={setGerenciarDialogOpen}
        quote={selectedQuote}
      />
      <DeleteQuoteDialogLazy open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} quote={selectedQuote} onDelete={(id) => { deleteQuote.mutate(id); setDeleteDialogOpen(false); }} trigger={<div />} />
      <RelatorioEconomiaDialog open={relatorioDialogOpen} onOpenChange={setRelatorioDialogOpen} />
    </div>
  );
}

export default memo(CotacoesTab);

