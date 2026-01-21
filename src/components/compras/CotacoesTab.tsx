import { useState, useMemo, useCallback, startTransition, memo, useEffect } from "react";
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
import { FileText, Plus, Trash2, Download, Building2, MoreVertical, ClipboardList, Eye, CheckCircle2, AlertTriangle, ShoppingCart, TrendingDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [gerenciarDialogOpen, setGerenciarDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

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
    <div className="space-y-4">
      {/* Metrics */}
      <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 4 }}>
        <MetricCard title="Ativas" value={stats.ativas} icon={FileText} variant="info" />
        <MetricCard 
          title="Prontas" 
          value={stats.prontasParaDecisao} 
          icon={CheckCircle2} 
          variant="success"
          onClick={() => setStatusFilter("prontas")}
        />
        <MetricCard 
          title="Vencendo" 
          value={stats.vencendo} 
          icon={AlertTriangle} 
          variant="warning"
          onClick={() => setStatusFilter("vencendo")}
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
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <ExpandableSearch value={searchTerm} onChange={setSearchTerm} placeholder="Buscar..." accentColor="teal" expandedWidth="w-full sm:w-48" data-search-input />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="prontas">✅ Prontas p/ Decisão</SelectItem>
            <SelectItem value="vencendo">⚠️ Vencendo em 48h</SelectItem>
            <SelectItem value="concluida">Concluídas</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={handleExportQuotes} className="h-10">
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} className="h-10 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
            <Plus className="h-4 w-4 mr-1" />Nova
          </Button>
        </div>
      </div>

      {/* Alert: Cotações prontas para decisão */}
      {stats.prontasParaDecisao > 0 && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              {stats.prontasParaDecisao} cotação(ões) pronta(s) para decisão
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Todos os fornecedores já responderam</p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-300"
            onClick={() => setStatusFilter("prontas")}
          >
            Ver
          </Button>
        </div>
      )}

      {/* Alert: Cotações vencendo */}
      {stats.vencendo > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {stats.vencendo} cotação(ões) vencendo em 48h
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Prazo expirando em breve</p>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
            onClick={() => setStatusFilter("vencendo")}
          >
            Ver
          </Button>
        </div>
      )}

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-2">
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

      {/* Pagination */}
      {paginatedData.pagination.totalPages > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-3">
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
      )}

      {/* Dialogs */}
      <AddQuoteDialogLazy 
        open={addDialogOpen} 
        onOpenChange={(open) => {
          console.log("[CotacoesTab] onOpenChange chamado com:", open);
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
