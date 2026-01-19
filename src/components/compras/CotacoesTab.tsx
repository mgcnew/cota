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
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusSelect, QUOTE_STATUS_OPTIONS } from "@/components/ui/status-select";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { FileText, Plus, Trash2, Download, Calendar, DollarSign, Building2, MoreVertical, ClipboardList, Eye, Package, CircleDot, Info, CheckCircle2, AlertTriangle, ShoppingCart, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { Table, TableCell, TableRow } from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useExportCSV } from "@/hooks/useExportCSV";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { useToast } from "@/hooks/use-toast";

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

  const stats = useMemo(() => {
    const ativas = cotacoes.filter(c => c.statusReal === "ativa").length;
    const pendentes = cotacoes.filter(c => c.status === "pendente").length;
    
    // Cotações prontas para decisão (todos fornecedores responderam)
    const prontasParaDecisao = cotacoes.filter(c => {
      if (c.statusReal !== "ativa") return false;
      const fornecedoresRespondidos = c.fornecedoresParticipantes?.filter(f => f.status === "respondido").length || 0;
      const totalFornecedores = c.fornecedoresParticipantes?.length || 0;
      return totalFornecedores > 0 && fornecedoresRespondidos === totalFornecedores;
    }).length;
    
    // Cotações vencendo em 48h
    const hoje = new Date();
    const em48h = new Date(hoje.getTime() + 48 * 60 * 60 * 1000);
    const vencendo = cotacoes.filter(c => {
      if (c.statusReal !== "ativa") return false;
      const dataFim = new Date(c.dataFim.split('/').reverse().join('-'));
      return dataFim <= em48h && dataFim >= hoje;
    }).length;
    
    // Calcular economia dos pedidos que vieram de cotações
    const pedidosDeCotacao = pedidos.filter(p => p.quote_id);
    
    // Economia REAL = soma de economia_real dos pedidos entregues
    const economiaReal = pedidosDeCotacao
      .filter(p => p.status === 'entregue')
      .reduce((sum, p) => sum + (p.economia_real || 0), 0);
    
    // Economia ESTIMADA = soma de economia_estimada de todos os pedidos de cotação
    const economiaEstimada = pedidosDeCotacao
      .reduce((sum, p) => sum + (p.economia_estimada || 0), 0);
    
    return { 
      ativas, 
      pendentes,
      prontasParaDecisao,
      vencendo,
      economiaReal,
      economiaEstimada,
      economiaRealFormatada: economiaReal > 0 ? `R$ ${economiaReal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : "R$ 0",
      economiaEstimadaFormatada: economiaEstimada > 0 ? `R$ ${economiaEstimada.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : "R$ 0"
    };
  }, [cotacoes, pedidos]);

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
          const { isProntaParaDecisao, isVencendo, fornecedoresRespondidos, totalFornecedores } = getQuoteSpecialStatus(cotacao);
          
          return (
            <div 
              key={cotacao.id} 
              className={`bg-white dark:bg-gray-800/50 rounded-xl border p-3 shadow-sm ${
                isProntaParaDecisao 
                  ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800' 
                  : isVencendo 
                    ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800'
                    : 'border-gray-200 dark:border-gray-700/30'
              }`}
            >
              {/* Indicador de status especial */}
              {isProntaParaDecisao && (
                <div className="flex items-center gap-1.5 mb-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase">Pronta para decisão</span>
                </div>
              )}
              {isVencendo && !isProntaParaDecisao && (
                <div className="flex items-center gap-1.5 mb-2 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold uppercase">Vencendo em breve</span>
                </div>
              )}
              
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isProntaParaDecisao 
                      ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                      : 'bg-teal-100 dark:bg-teal-900/30'
                  }`}>
                    {isProntaParaDecisao ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <ClipboardList className="h-5 w-5 text-teal-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate"><CapitalizedText>{cotacao.produtoResumo || cotacao.produto}</CapitalizedText></p>
                    <p className="text-xs text-muted-foreground">#{cotacaoNumero.toString().padStart(4, '0')}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(cotacao.status === "concluida" || cotacao.status === "finalizada") ? (
                      <DropdownMenuItem onClick={() => handleViewQuote(cotacao)}><Eye className="h-4 w-4 mr-2" />Resumo</DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => handleGerenciarQuote(cotacao)}><ClipboardList className="h-4 w-4 mr-2" />Gerenciar</DropdownMenuItem>
                        {isProntaParaDecisao && (
                          <DropdownMenuItem onClick={() => handleGerenciarQuote(cotacao)} className="text-emerald-600">
                            <ShoppingCart className="h-4 w-4 mr-2" />Converter em Pedido
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDeleteQuote(cotacao)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <StatusSelect
                  value={cotacao.status}
                  options={QUOTE_STATUS_OPTIONS}
                  onChange={(newStatus) => updateQuoteStatus({ quoteId: cotacao.id, status: newStatus })}
                  isLoading={isUpdating}
                />
                <Badge variant="outline" className={`text-xs ${
                  fornecedoresRespondidos === totalFornecedores && totalFornecedores > 0
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700'
                    : ''
                }`}>
                  <Building2 className="h-3 w-3 mr-1" />{fornecedoresRespondidos}/{totalFornecedores}
                </Badge>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Melhor: <span className="font-semibold text-green-600">{cotacao.melhorPreco || 'R$ 0,00'}</span></span>
                <span className={`${isVencendo ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                  Fim: {cotacao.dataFim || '-'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <thead>
            <tr>
              <td colSpan={7} className="px-1 pb-3 pt-0 border-none">
                <div className="flex items-center bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-sm px-4 py-4">
                  <div className="w-[15%] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Cotação</span>
                  </div>
                  <div className="w-[18%] pl-2 flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Produto</span>
                  </div>
                  <div className="w-[10%] pl-2 flex justify-center items-center gap-2">
                    <CircleDot className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Status</span>
                  </div>
                  <div className="w-[14%] pl-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Melhor Preço</span>
                  </div>
                  <div className="w-[12%] pl-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Fornec.</span>
                  </div>
                  <div className="w-[8%] pl-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Itens</span>
                  </div>
                  <div className="w-[10%] pl-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Prazo</span>
                  </div>
                  <div className="w-[8%] pl-2 flex justify-end items-center">
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Ações</span>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.map((cotacao, index) => {
              const cotacaoNumero = paginatedData.pagination.startIndex + index + 1;
              return (
                <TableRow key={cotacao.id} className="group border-none">
                  <TableCell colSpan={7} className="px-1 py-1.5">
                    <div className="flex items-center px-4 py-3 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800/70">
                      <div className="w-[15%] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center border border-gray-200 dark:border-gray-600/30">
                          <ClipboardList className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        </div>
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">#{cotacaoNumero.toString().padStart(4, '0')}</span>
                      </div>
                      <div className="w-[18%] pl-2">
                        <CapitalizedText className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate block max-w-[150px]">
                          {cotacao.produtoResumo || cotacao.produto}
                        </CapitalizedText>
                      </div>
                      <div className="w-[10%] pl-2 flex justify-center">
                        <StatusSelect
                          value={cotacao.status}
                          options={QUOTE_STATUS_OPTIONS}
                          onChange={(newStatus) => updateQuoteStatus({ quoteId: cotacao.id, status: newStatus })}
                          isLoading={isUpdating}
                        />
                      </div>
                      <div className="w-[14%] pl-2">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{cotacao.melhorPreco || 'R$ 0,00'}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">{cotacao.melhorFornecedor || '-'}</p>
                      </div>
                      <div className="w-[12%] pl-2">
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full w-fit">
                          <Building2 className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                          <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs">{cotacao.fornecedores}</span>
                        </div>
                      </div>
                      <div className="w-[8%] pl-2 flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cotacao.produtosLista?.length || 0}</span>
                        {cotacao.produtosLista && cotacao.produtosLista.length > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[250px]">
                                <p className="font-semibold text-xs mb-1">Produtos cotados:</p>
                                <ul className="text-xs space-y-0.5">
                                  {cotacao.produtosLista.map((produto, idx) => (
                                    <li key={idx}>• {produto}</li>
                                  ))}
                                </ul>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="w-[10%] pl-2 text-sm text-gray-500 dark:text-gray-400">
                        {cotacao.dataFim || '-'}
                      </div>
                      <div className="w-[8%] pl-2 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/70 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                            {(cotacao.status === "concluida" || cotacao.status === "finalizada") ? (
                              <DropdownMenuItem onClick={() => handleViewQuote(cotacao)} className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                                <Eye className="h-4 w-4 mr-2" />Resumo
                              </DropdownMenuItem>
                            ) : (
                              <>
                                <DropdownMenuItem onClick={() => handleGerenciarQuote(cotacao)} className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70">
                                  <ClipboardList className="h-4 w-4 mr-2" />Gerenciar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                                <DropdownMenuItem onClick={() => handleDeleteQuote(cotacao)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
                                  <Trash2 className="h-4 w-4 mr-2" />Excluir
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
      </div>

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
      <GerenciarCotacaoDialogLazy open={gerenciarDialogOpen} onOpenChange={setGerenciarDialogOpen} quote={selectedQuote} onUpdateSupplierProductValue={updateSupplierProductValue} onConvertToOrder={(quoteId, orders) => convertToOrder({ quoteId, orders })} onAddQuoteItem={addQuoteItem} onRemoveQuoteItem={removeQuoteItem} onAddQuoteSupplier={addQuoteSupplier} onRemoveQuoteSupplier={removeQuoteSupplier} availableProducts={availableProducts} availableSuppliers={availableSuppliers} onRefresh={refetch} isUpdating={isUpdating} />
      <DeleteQuoteDialogLazy open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} quote={selectedQuote} onDelete={(id) => { deleteQuote(id); setDeleteDialogOpen(false); }} trigger={<div />} />
    </div>
  );
}

export default memo(CotacoesTab);
