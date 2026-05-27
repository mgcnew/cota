import { useCallback, memo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import type { Quote } from "@/hooks/useCotacoes";
import { useCotacoesFilters } from "@/hooks/useCotacoesFilters";
import { useCotacoesDialogs } from "@/hooks/useCotacoesDialogs";
import { Plus, FileText, Download, Users, Zap, CheckCircle2 } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { DataPagination } from "@/components/ui/data-pagination";
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
          <MetricCard title="Cotações Ativas" value={stats.ativas} icon={FileText} variant="info" />
          
          <MetricCard
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

          <MetricCard
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

          <MetricCard
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
        <div className="p-3 md:p-4 border-b border-border dark:border-white/5 bg-zinc-50/50 dark:bg-muted/30">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
            {/* Search Field */}
            <div className="flex-1 max-w-xl">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar cotação..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
              <div className="hidden md:block">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className={cn("w-[180px] h-11 bg-white dark:bg-background border border-border dark:border-white/5 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/10 rounded-lg shadow-sm transition-all", ds.colors.text.primary)}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="ativa">Ativas</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="prontas">Prontas p/ Decisão</SelectItem>
                    <SelectItem value="vencendo">Vencendo em 48h</SelectItem>
                    <SelectItem value="concluida">Concluídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleExportQuotes}
                className={cn("h-11 w-11 rounded-lg border-border dark:border-white/5", ds.components.button.secondary)}
                title="Relatório de Economia e Resultados"
              >
                <Download className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
              </Button>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className={cn(ds.components.button.primary, "h-11 px-6 w-full sm:w-auto")}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nova Cotação
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Filter Chips */}
        <div className="md:hidden flex overflow-x-auto gap-2 p-3 pb-3 border-b border-border dark:border-white/5 bg-zinc-50/50 dark:bg-muted/30 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style dangerouslySetInnerHTML={{__html: `
            .md\\:hidden::-webkit-scrollbar { display: none; }
          `}} />
          {[
            { value: 'all', label: 'Todos' },
            { value: 'ativa', label: 'Ativas' },
            { value: 'pendente', label: 'Pendentes' },
            { value: 'prontas', label: 'Prontas' },
            { value: 'vencendo', label: 'Vencendo' },
            { value: 'concluida', label: 'Concluídas' },
          ].map(status => (
            <button
              key={status.value}
              onClick={() => handleStatusFilterChange(status.value)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border touch-manipulation active:scale-95",
                statusFilter === status.value 
                  ? "bg-brand text-white border-brand shadow-md" 
                  : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {status.label}
            </button>
          ))}
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
              <div className="p-4 bg-white dark:bg-[#1C1E23] border-t border-border dark:border-white/5">
                <DataPagination
                  currentPage={paginatedData.pagination.currentPage}
                  totalPages={paginatedData.pagination.totalPages}
                  itemsPerPage={paginatedData.pagination.itemsPerPage}
                  totalItems={paginatedData.pagination.totalItems}
                  onPageChange={paginatedData.pagination.goToPage}
                  onItemsPerPageChange={paginatedData.pagination.setItemsPerPage}
                  startIndex={paginatedData.pagination.startIndex}
                  endIndex={paginatedData.pagination.endIndex}
                />
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

