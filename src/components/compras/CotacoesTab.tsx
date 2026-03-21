import { useState, useMemo, useCallback, startTransition, memo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCotacoes } from "@/hooks/useCotacoes";
import { usePedidos } from "@/hooks/usePedidos";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import type { Quote } from "@/hooks/useCotacoes";
import { Badge } from "@/components/ui/badge";
import { StatusSelect, QUOTE_STATUS_OPTIONS } from "@/components/ui/status-select";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { FileText, Plus, Trash2, Download, Building2, MoreVertical, ClipboardList, Eye, CheckCircle2, AlertTriangle, ShoppingCart, TrendingDown, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useExportCSV } from "@/hooks/useExportCSV";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { useToast } from "@/hooks/use-toast";
import { useCotacoesStats } from "@/hooks/useCotacoesStats";
import { CotacoesListDesktop } from "./CotacoesListDesktop";
import { MobileQuoteCard } from "./MobileQuoteCard";

import {
  AddQuoteDialogLazy,
  DeleteQuoteDialogLazy,
  ResumoCotacaoDialogLazy,
  GerenciarCotacaoDialogLazy
} from "@/components/forms/LazyDialogs";

function CotacoesTab() {
  const { isMobile } = useBreakpoint();
  const { paginate } = usePagination<Quote>({ initialItemsPerPage: isMobile ? 8 : 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [gerenciarDialogOpen, setGerenciarDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("filter") || "all");

  useEffect(() => {
    const filter = searchParams.get("filter");
    if (filter && filter !== statusFilter) {
      setStatusFilter(filter);
    }
  }, [searchParams]);

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setSearchParams(prev => {
      if (val === "all") prev.delete("filter");
      else prev.set("filter", val);
      return prev;
    });
  };

  const { cotacoes, isLoading, refetch, updateSupplierProductValue, deleteQuote, convertToOrder, addQuoteItem, removeQuoteItem, addQuoteSupplier, removeQuoteSupplier, updateQuoteStatus, isUpdating } = useCotacoes();
  const { pedidos } = usePedidos();

  const stats = useCotacoesStats(cotacoes, pedidos);

  // Derive selectedQuote from cotacoes to ensure real-time updates
  const selectedQuote = useMemo(() => {
    if (!selectedQuoteId) return null;
    return cotacoes.find(c => c.id === selectedQuoteId) || null;
  }, [cotacoes, selectedQuoteId]);
  const { products: allProducts } = useProducts();
  const { suppliers: allSuppliers } = useSuppliers();

  const availableProducts = useMemo(() => allProducts.map(p => ({ id: p.id, name: p.name, unit: p.unit || 'un' })), [allProducts]);
  const availableSuppliers = useMemo(() => allSuppliers.map(s => ({ id: s.id, name: s.name })), [allSuppliers]);

  // Ouvir evento de atalho de teclado para nova cotação
  useEffect(() => {
    const handleNovaEvent = (e: CustomEvent) => {
      if (e.detail?.tab === 'cotacoes') {
        setAddDialogOpen(true);
      }
    };
    window.addEventListener('compras:nova', handleNovaEvent as EventListener);
    return () => window.removeEventListener('compras:nova', handleNovaEvent as EventListener);
  }, []);

  const handleViewQuote = useCallback((quote: Quote) => {
    startTransition(() => { setSelectedQuoteId(quote.id); setViewDialogOpen(true); });
  }, []);

  const handleGerenciarQuote = useCallback((quote: Quote) => {
    startTransition(() => { setSelectedQuoteId(quote.id); setGerenciarDialogOpen(true); });
  }, []);

  // Interceptar URL param para abrir modal de gerenciar automaticamente
  useEffect(() => {
    const manageQuoteId = searchParams.get("manageQuote");
    if (manageQuoteId && cotacoes.length > 0) {
      const quoteToManage = cotacoes.find(c => c.id?.toString() === manageQuoteId.toString());
      if (quoteToManage) {
        // Timeout para evitar conflitos de re-render com react-router
        setTimeout(() => {
          handleGerenciarQuote(quoteToManage);
          // Limpar o parâmetro da URL para não reabrir se ele fechar e voltar
          setSearchParams(prev => {
            prev.delete("manageQuote");
            return prev;
          }, { replace: true });
        }, 100);
      }
    }
  }, [searchParams, cotacoes, handleGerenciarQuote, setSearchParams]);

  const handleDeleteQuote = useCallback((quote: Quote) => {
    startTransition(() => { setSelectedQuoteId(quote.id); setDeleteDialogOpen(true); });
  }, []);

  const handleUpdateStatus = useCallback((quoteId: string, status: string) => {
    updateQuoteStatus.mutate({ quoteId, status });
  }, [updateQuoteStatus]);

  // Helper para verificar status especial da cotação
  const getQuoteSpecialStatus = useCallback((cotacao: Quote) => {
    const fornecedoresRespondidos = cotacao.fornecedoresParticipantes?.filter(f => f.status === "respondido").length || 0;
    const totalFornecedores = cotacao.fornecedoresParticipantes?.length || 0;
    const isProntaParaDecisao = cotacao.statusReal === "ativa" && totalFornecedores > 0 && fornecedoresRespondidos === totalFornecedores;

    const hoje = new Date();
    const em48h = new Date(hoje.getTime() + 48 * 60 * 60 * 1000);
    const dataFim = new Date(cotacao.dataFim.split('/').reverse().join('-'));
    const isVencendo = cotacao.statusReal === "ativa" && dataFim <= em48h && dataFim >= hoje;

    return { isProntaParaDecisao, isVencendo, fornecedoresRespondidos, totalFornecedores };
  }, []);

  const filteredCotacoes = useMemo(() => {
    return cotacoes.filter(c => {
      const matchesSearch = c.produto.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || c.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      // Filtros especiais
      if (statusFilter === "prontas") {
        const fornecedoresRespondidos = c.fornecedoresParticipantes?.filter(f => f.status === "respondido").length || 0;
        const totalFornecedores = c.fornecedoresParticipantes?.length || 0;
        return matchesSearch && c.statusReal === "ativa" && totalFornecedores > 0 && fornecedoresRespondidos === totalFornecedores;
      }

      if (statusFilter === "vencendo") {
        const hoje = new Date();
        const em48h = new Date(hoje.getTime() + 48 * 60 * 60 * 1000);
        const dataFim = new Date(c.dataFim.split('/').reverse().join('-'));
        return matchesSearch && c.statusReal === "ativa" && dataFim <= em48h && dataFim >= hoje;
      }

      const matchesStatus = statusFilter === "all" || c.statusReal === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cotacoes, debouncedSearchTerm, statusFilter]);

  const { exportToCSV } = useExportCSV();

  const handleExportQuotes = useCallback(() => {
    if (filteredCotacoes.length === 0) {
      toast({ title: "Nenhuma cotação", variant: "destructive" });
      return;
    }
    const data = filteredCotacoes.map(c => ({
      id: c.id.substring(0, 8),
      produto: c.produto,
      status: c.statusReal,
      melhorPreco: c.melhorPreco
    }));
    exportToCSV({
      filename: 'cotacoes',
      data,
      columns: { id: 'ID', produto: 'Produto', status: 'Status', melhorPreco: 'Melhor Preço' }
    });
    toast({ title: "Exportado!" });
  }, [filteredCotacoes, toast, exportToCSV]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando...</p></div>;

  const paginatedData = paginate(filteredCotacoes);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Metrics */}
      <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 4 }}>
        <MetricCard title="Ativas" value={stats.ativas} icon={FileText} variant="info" />
        <MetricCard
          title="Prontas"
          value={stats.prontasParaDecisao}
          icon={CheckCircle2}
          variant="success"
          onClick={() => handleStatusFilterChange("prontas")}
        />
        <MetricCard
          title="Vencendo"
          value={stats.vencendo}
          icon={AlertTriangle}
          variant="warning"
          onClick={() => handleStatusFilterChange("vencendo")}
        />
        <MetricCard
          title="Economia Real"
          value={stats.economiaRealFormatada}
          icon={TrendingDown}
          variant="success"
          trend={{
            value: stats.economiaEstimadaFormatada,
            label: "estimada",
            type: "neutral"
          }}
        />
      </ResponsiveGrid>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <ExpandableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar cotação..."
            accentColor="brand"
            expandedWidth="w-full sm:w-64"
            data-search-input
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile: reduced width to fit "Nova Cotação" button */}
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className={cn("w-[130px] sm:w-[180px] rounded-xl h-10", designSystem.components.input.root)}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="ativa">🟢 Ativas</SelectItem>
              <SelectItem value="pendente">🟡 Pendentes</SelectItem>
              <SelectItem value="prontas">✅ Prontas p/ Decisão</SelectItem>
              <SelectItem value="vencendo">⚠️ Vencendo em 48h</SelectItem>
              <SelectItem value="concluida">🔵 Concluídas</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleExportQuotes}
            className={cn("h-10 w-10 rounded-xl", designSystem.components.button.secondary)}
            title="Exportar CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className={cn(designSystem.components.button.primary, "shrink-0")}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Cotação
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(stats.prontasParaDecisao > 0 || stats.vencendo > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.prontasParaDecisao > 0 && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-bold", designSystem.colors.text.primary)}>
                  {stats.prontasParaDecisao} cotação(ões) pronta(s)
                </p>
                <p className={cn("text-xs", designSystem.colors.text.secondary)}>Todos os fornecedores já responderam</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                onClick={() => handleStatusFilterChange("prontas")}
              >
                Ver agora
              </Button>
            </div>
          )}

          {stats.vencendo > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-bold", designSystem.colors.text.primary)}>
                  {stats.vencendo} cotação(ões) para vencer
                </p>
                <p className={cn("text-xs", designSystem.colors.text.secondary)}>Prazo termina em menos de 48h</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg h-8 border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
                onClick={() => handleStatusFilterChange("vencendo")}
              >
                Revisar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Desktop Table View */}
      <CotacoesListDesktop
        cotacoes={paginatedData.items}
        startIndex={paginatedData.pagination.startIndex}
        onUpdateStatus={handleUpdateStatus}
        onView={handleViewQuote}
        onManage={handleGerenciarQuote}
        onDelete={handleDeleteQuote}
        isUpdating={isUpdating}
      />

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
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

      {/* Pagination */}
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

      {/* Dialogs */}
      <AddQuoteDialogLazy
        open={addDialogOpen}
        onOpenChange={(open) => {
          setAddDialogOpen(open);
        }}
        onAdd={() => { refetch(); setAddDialogOpen(false); }}
      />
      <ResumoCotacaoDialogLazy open={viewDialogOpen} onOpenChange={setViewDialogOpen} quote={selectedQuote} />
      <GerenciarCotacaoDialogLazy
        open={gerenciarDialogOpen}
        onOpenChange={setGerenciarDialogOpen}
        quote={selectedQuote}
      />
      <DeleteQuoteDialogLazy open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} quote={selectedQuote} onDelete={(id) => { deleteQuote.mutate(id); setDeleteDialogOpen(false); }} trigger={<div />} />
    </div>
  );
}

export default memo(CotacoesTab);
