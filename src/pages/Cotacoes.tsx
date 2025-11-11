import { useState, useMemo, useRef, useEffect, useCallback, lazy, Suspense, startTransition } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useDebounce } from "@/hooks/useDebounce";
import type { Quote, FornecedorParticipante } from "@/hooks/useCotacoes";
import { useCotacoesMobile } from "@/hooks/mobile/useCotacoesMobile";
import type { CotacaoMobile } from "@/hooks/mobile/useCotacoesMobile";
import { CotacoesMobileList } from "@/components/cotacoes/CotacoesMobileList";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search, Filter, Eye, Edit, Trash2, Download, Calendar, DollarSign, Building2, MoreVertical, ChevronDown, Package, Clock, CircleDot, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { capitalize } from "@/lib/text-utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/ui/metric-card";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { ViewMode } from "@/types/pagination";
import { cn } from "@/lib/utils";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { useMobile } from "@/contexts/MobileProvider";
import { CotacoesStatsMemoized } from "@/components/cotacoes/CotacoesStatsMemoized";
import { CotacoesVirtualList } from "@/components/cotacoes/CotacoesVirtualList";
import { useToast } from "@/hooks/use-toast";

// Lazy load dialogs - apenas carregados quando necessários
const AddQuoteDialog = lazy(() => import("@/components/forms/AddQuoteDialog"));
const DeleteQuoteDialog = lazy(() => import("@/components/forms/DeleteQuoteDialog"));
const ViewQuoteDialog = lazy(() => import("@/components/forms/ViewQuoteDialog"));

export default function Cotacoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    viewMode,
    setViewMode
  } = useResponsiveViewMode();
  const {
    paginate
  } = usePagination<Quote>({
    initialItemsPerPage: 10
  });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const isMobile = useMobile();
  const addQuoteRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  
  // Estados para modais (lazy loading)
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Callbacks memoizados para navegação do carousel
  const handlePrevCard = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCardIndex((prev) => (prev === 0 ? 3 : prev - 1));
  }, []);

  const handleNextCard = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCardIndex((prev) => (prev === 3 ? 0 : prev + 1));
  }, []);

  // Ler parâmetros da URL ao carregar a página
  useEffect(() => {
    const fornecedor = searchParams.get('fornecedor');
    const produto = searchParams.get('produto');
    if (fornecedor) {
      setSupplierFilter(fornecedor);
    }
    if (produto) {
      setSearchTerm(produto);
    }
  }, [searchParams]);

  // Desktop: Use React Query with single optimized query (no N+1)
  const desktopData = useCotacoes();
  
  // Mobile: Use infinite scroll hook
  const mobileData = useCotacoesMobile({
    searchTerm: debouncedSearchTerm,
    statusFilter,
    supplierFilter,
  });

  // Selecionar dados baseado no dispositivo
  const cotacoes = isMobile ? (mobileData.cotacoes as unknown as Quote[]) : desktopData.cotacoes;
  const isLoading = isMobile ? mobileData.isLoading : desktopData.isLoading;
  const refetch = isMobile ? mobileData.refetch : desktopData.refetch;
  const updateSupplierProductValue = isMobile ? mobileData.updateSupplierProductValue : desktopData.updateSupplierProductValue;
  const deleteQuote = isMobile ? mobileData.deleteQuote : desktopData.deleteQuote;
  const updateQuote = isMobile ? mobileData.updateQuote : desktopData.updateQuote;
  const convertToOrder = isMobile ? mobileData.convertToOrder : desktopData.convertToOrder;
  const isUpdating = isMobile ? mobileData.isUpdating : desktopData.isUpdating;
  
  // Callbacks memoizados para ações (desktop)
  const handleViewQuote = useCallback((quote: Quote) => {
    startTransition(() => {
      setSelectedQuote(quote);
      setViewDialogOpen(true);
    });
  }, []);

  const handleEditQuote = useCallback((quote: Quote) => {
    startTransition(() => {
      setSelectedQuote(quote);
      setDesktopEditMode(true);
      setViewDialogOpen(true);
    });
  }, []);

  const handleDeleteQuote = useCallback((quote: Quote) => {
    startTransition(() => {
      setSelectedQuote(quote);
      setDeleteDialogOpen(true);
    });
  }, []);

  // Callbacks para mobile (compatibilidade com CotacaoMobile)
  // Helper para converter CotacaoMobile para Quote
  const convertMobileToQuote = useCallback((quote: CotacaoMobile): Quote => {
    return {
      id: quote.id,
      produto: quote.produto,
      produtoResumo: quote.produtoResumo,
      produtosLista: quote.produtosLista,
      quantidade: quote.quantidade,
      status: quote.status,
      statusReal: quote.statusReal,
      dataInicio: quote.dataInicio,
      dataFim: quote.dataFim,
      dataPlanejada: quote.dataPlanejada,
      fornecedores: quote.fornecedores,
      melhorPreco: quote.melhorPreco,
      melhorFornecedor: quote.melhorFornecedor,
      economia: quote.economia,
      fornecedoresParticipantes: quote.fornecedoresParticipantes.map(f => ({
        id: f.id,
        nome: f.nome,
        valorOferecido: f.valorOferecido,
        dataResposta: f.dataResposta,
        observacoes: f.observacoes,
        status: f.status,
      })) as FornecedorParticipante[],
    };
  }, []);

  // Estados para mobile: usar apenas quoteId para lazy loading
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Estado para desktop também (usado no ViewQuoteDialog)
  const [desktopEditMode, setDesktopEditMode] = useState(false);

  const handleViewQuoteMobile = useCallback((quote: CotacaoMobile) => {
    startTransition(() => {
      setSelectedQuoteId(quote.id);
      setIsEditMode(false);
      setViewDialogOpen(true);
    });
  }, []);

  const handleEditQuoteMobile = useCallback((quote: CotacaoMobile) => {
    startTransition(() => {
      setSelectedQuoteId(quote.id);
      setIsEditMode(true);
      setViewDialogOpen(true);
    });
  }, []);

  const handleDeleteQuoteMobile = useCallback((quote: CotacaoMobile) => {
    if (mobileData.deleteQuote) {
      mobileData.deleteQuote(quote.id);
    }
  }, [mobileData]);

  const getStatusBadge = useCallback((status: string) => {
    const variants = {
      ativa: "default",
      concluida: "secondary",
      pendente: "outline",
      expirada: "destructive",
      finalizada: "default",
      planejada: "outline"
    };
    const labels = {
      ativa: "Ativa",
      concluida: "Concluída",
      pendente: "Pendente",
      expirada: "Expirada",
      finalizada: "Finalizada",
      planejada: "Planejada"
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>;
  }, []);

  // Calcular economia de uma cotação específica
  const calcularEconomiaCotacao = (cotacao: Quote): { economia: number; percentual: number } => {
    if (!cotacao.fornecedoresParticipantes || cotacao.fornecedoresParticipantes.length < 2) {
      return { economia: 0, percentual: 0 };
    }
    
    const valores = cotacao.fornecedoresParticipantes
      .map(f => {
        const valor = f.valorOferecido || 0;
        return typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
      })
      .filter(v => v > 0);
    
    if (valores.length < 2) {
      return { economia: 0, percentual: 0 };
    }
    
    const maiorValor = Math.max(...valores);
    const menorValor = Math.min(...valores);
    const economia = maiorValor - menorValor;
    const percentual = maiorValor > 0 ? ((economia / maiorValor) * 100) : 0;
    
    return { economia, percentual };
  };

  // OPTIMIZED: Memoize filtered results
  const filteredCotacoes = useMemo(() => {
    return cotacoes.filter(cotacao => {
      const matchesSearch = cotacao.produto.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || cotacao.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || cotacao.statusReal === statusFilter;

      // Filtro por fornecedor - verifica se algum fornecedor participante corresponde
      const matchesSupplier = supplierFilter === "all" || cotacao.fornecedoresParticipantes?.some(fornecedor => fornecedor.nome.toLowerCase().includes(supplierFilter.toLowerCase()));
      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [cotacoes, debouncedSearchTerm, statusFilter, supplierFilter]);

  // Handler para exportar cotações (definido após filteredCotacoes)
  const handleExportQuotes = useCallback(() => {
    try {
      if (filteredCotacoes.length === 0) {
        toast({
          title: "Nenhuma cotação para exportar",
          description: "Não há cotações filtradas para exportar.",
          variant: "destructive",
        });
        return;
      }

      // Preparar dados para exportação
      const exportData = filteredCotacoes.map((cotacao) => ({
        'ID': cotacao.id.substring(0, 8),
        'Produto': cotacao.produto,
        'Quantidade': cotacao.quantidade,
        'Status': cotacao.statusReal,
        'Data Início': cotacao.dataInicio,
        'Data Fim': cotacao.dataFim,
        'Fornecedores': cotacao.fornecedores,
        'Melhor Preço': cotacao.melhorPreco,
        'Melhor Fornecedor': cotacao.melhorFornecedor,
        'Economia': cotacao.economia,
      }));

      // Criar CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escapar vírgulas e aspas
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          }).join(',')
        )
      ].join('\n');

      // Adicionar BOM para Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Criar link de download
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `cotacoes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Mostrar toast de sucesso
      toast({
        title: "Exportação realizada",
        description: `${exportData.length} cotações exportadas com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao exportar cotações:', error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar as cotações. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [filteredCotacoes, toast]);

  // Calcular estatísticas dinâmicas
  const stats = useMemo(() => {
    const porStatus = {
      ativas: cotacoes.filter(c => c.statusReal === "ativa").length,
      pendentes: cotacoes.filter(c => c.status === "pendente").length,
      concluidas: cotacoes.filter(c => c.status === "concluida" || c.status === "finalizada").length,
      expiradas: cotacoes.filter(c => c.status === "expirada").length,
      planejadas: cotacoes.filter(c => c.statusReal === "planejada").length
    };
    
    const percentualAtivas = cotacoes.length > 0 ? Math.round((porStatus.ativas / cotacoes.length) * 100) : 0;
    
    const agora = new Date();
    const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    const pendentesMais24h = cotacoes.filter(c => {
      if (c.status !== "pendente") return false;
      try {
        const dataInicio = new Date(c.dataInicio);
        return dataInicio < umDiaAtras;
      } catch {
        return false;
      }
    }).length;
    
    let economiaTotal = 0;
    const economiasPorCotacao: number[] = [];
    
    cotacoes.forEach(cotacao => {
      if (cotacao.fornecedoresParticipantes && cotacao.fornecedoresParticipantes.length >= 2) {
        const valores = cotacao.fornecedoresParticipantes
          .map(f => {
            const valor = f.valorOferecido || 0;
            return typeof valor === 'number' ? valor : parseFloat(String(valor).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
          })
          .filter(v => v > 0);
        
        if (valores.length >= 2) {
          const maiorValor = Math.max(...valores);
          const menorValor = Math.min(...valores);
          const economia = maiorValor - menorValor;
          
          if (economia > 0) {
            economiaTotal += economia;
            economiasPorCotacao.push(economia);
          }
        }
      }
    });
    
    const economiaFormatada = economiaTotal > 0 
      ? `R$ ${economiaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      : "R$ 0";
    
    const ultimas7Economias = economiasPorCotacao.slice(-7);
    while (ultimas7Economias.length < 7) {
      ultimas7Economias.unshift(0);
    }
    
    const fornecedoresUnicos = new Set<string>();
    cotacoes.forEach(cotacao => {
      cotacao.fornecedoresParticipantes?.forEach(f => {
        if (f.nome) fornecedoresUnicos.add(f.nome);
      });
    });
    
    const mediaFornecedores = cotacoes.length > 0 
      ? Math.round(cotacoes.reduce((acc, c) => acc + c.fornecedores, 0) / cotacoes.length)
      : 0;
    
    return {
      porStatus,
      percentualAtivas,
      pendentesMais24h,
      economiaTotal,
      economiaFormatada,
      ultimas7Economias,
      totalFornecedoresUnicos: fornecedoresUnicos.size,
      mediaFornecedores,
      total: cotacoes.length
    };
  }, [cotacoes]);

  // Helper functions para renderizar Cards (memoizadas inline)
  const renderCard1 = useMemo(() => (
    <Card className="bg-teal-600 dark:bg-[#1C1F26] border border-teal-500/30 dark:border-gray-800 rounded-lg hover:border-teal-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-teal-700/50 dark:bg-gray-800">
            <FileText className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Ativas
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {stats.porStatus.ativas}
          </span>
          {stats.percentualAtivas > 0 && (
            <Badge className="bg-teal-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
              {stats.percentualAtivas}%
            </Badge>
          )}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Cotações ativas:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {stats.porStatus.ativas}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>Percentual:</span>
            <span className="font-medium">{stats.percentualAtivas}%</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
            <span>{stats.porStatus.pendentes} pendentes</span>
            <span>•</span>
            <span>{stats.porStatus.concluidas} finalizadas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  const renderCard2 = useMemo(() => (
    <Card className="bg-primary dark:bg-[#1C1F26] border border-primary/30 dark:border-gray-800 rounded-lg hover:border-primary/50 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/50 dark:bg-gray-800">
            <Calendar className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Pendentes
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {stats.porStatus.pendentes}
          </span>
          {stats.pendentesMais24h > 0 && (
            <Badge className="bg-primary/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
              ⚠ {stats.pendentesMais24h}
            </Badge>
          )}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Aguardando resposta:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {stats.porStatus.pendentes}
            </span>
          </div>
          {stats.pendentesMais24h > 0 ? (
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Com mais de 24h:</span>
              <span className="font-medium text-red-300">{stats.pendentesMais24h}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
              <span>Status:</span>
              <span className="font-medium text-green-300">Todas no prazo</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  const renderCard3 = useMemo(() => (
    <Card className="bg-success dark:bg-[#1C1F26] border border-success/30 dark:border-gray-800 rounded-lg hover:border-success/50 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-success/50 dark:bg-gray-800">
            <DollarSign className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Economia
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xl font-bold tracking-tight text-white dark:text-white truncate">
            {stats.economiaFormatada}
          </span>
          {stats.economiaTotal > 0 && (
            <Badge className="bg-success/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
              Total
            </Badge>
          )}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Economizados:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {stats.economiaFormatada}
            </span>
          </div>
          <div className="flex items-end gap-0.5 h-6 mt-2">
            {stats.ultimas7Economias.map((economia, i) => {
              const maxEconomia = Math.max(...stats.ultimas7Economias, 1);
              const heightPercent = (economia / maxEconomia) * 100;
              return (
                <div 
                  key={i} 
                  className="flex-1 bg-white/30 rounded-t hover:bg-white/40 transition-colors duration-200" 
                  style={{ height: `${Math.max(heightPercent, 10)}%`, minHeight: '4px' }}
                  title={economia > 0 ? `Economia: R$ ${economia.toLocaleString('pt-BR')}` : 'Sem economia'}
                />
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  const renderCard4 = useMemo(() => (
    <Card className="bg-primary dark:bg-[#1C1F26] border border-primary/30 dark:border-gray-800 rounded-lg hover:border-primary/50 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/50 dark:bg-gray-800">
            <Building2 className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Fornecedores
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {stats.mediaFornecedores}
          </span>
          {stats.totalFornecedoresUnicos > 0 && (
            <Badge className="bg-primary/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
              {stats.totalFornecedoresUnicos} únicos
            </Badge>
          )}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Média por cotação:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {stats.mediaFornecedores}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>Fornecedores únicos:</span>
            <span className="font-medium">{stats.totalFornecedoresUnicos}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [stats]);

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando cotações...</p>
      </div>;
  }
  const paginatedData = paginate(filteredCotacoes);
  return <div className="page-container">
      {/* Statistics Cards - Componente Memoizado */}
      {isMobile ? (
        <div className="mb-8">
          {/* Card wrapper com navegação integrada no topo */}
          <div className="relative">
            {/* Navegação integrada no topo do card */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center gap-2 pt-3 pb-2 px-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevCard}
                className="h-8 w-8 p-0 rounded-full bg-white/20 dark:bg-gray-900/40 hover:bg-white/30 dark:hover:bg-gray-900/60 text-white dark:text-gray-200 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 shadow-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 dark:bg-gray-900/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 shadow-lg">
                <span className="text-xs font-semibold text-white dark:text-gray-200">
                  {activeCardIndex + 1} / 4
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextCard}
                className="h-8 w-8 p-0 rounded-full bg-white/20 dark:bg-gray-900/40 hover:bg-white/30 dark:hover:bg-gray-900/60 text-white dark:text-gray-200 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 shadow-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Container do carousel - Sem animações pesadas */}
            <div className="relative overflow-hidden rounded-xl" style={{ minHeight: '180px' }}>
              <div 
                className="flex"
                style={{ 
                  transform: `translateX(-${activeCardIndex * 100}%)`,
                  transition: 'none', // Remover transição para mobile
                }}
              >
                <div className="w-full flex-shrink-0">
                  {renderCard1}
                </div>
                <div className="w-full flex-shrink-0">
                  {renderCard2}
                </div>
                <div className="w-full flex-shrink-0">
                  {renderCard3}
                </div>
                <div className="w-full flex-shrink-0">
                  {renderCard4}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <CotacoesStatsMemoized stats={stats} />
        </div>
      )}

      {/* Filters */}
      <Card className="bg-white dark:bg-[#1C1F26] border border-gray-200/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
            {/* ViewToggle - Esconder no mobile */}
            <div className="hidden lg:block">
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:justify-end flex-1 lg:flex-initial">
              {/* Barra de busca + Botão Criar (lado a lado no mobile) */}
              <div className="flex gap-2 flex-1 sm:flex-initial">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 z-10" />
                  <Input placeholder="Buscar por produto ou ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 sm:pl-12 pr-4 w-full sm:w-64 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-teal-300/70 dark:hover:border-teal-600/70 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 dark:focus:ring-teal-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white" />
                </div>
                
                {/* Botão Mobile - Apenas criar (ao lado da busca) */}
                <Button 
                  onClick={() => addQuoteRef.current?.click()}
                  className="sm:hidden bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl flex-shrink-0 px-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-teal-300/70 dark:hover:border-teal-600/70 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 dark:focus:ring-teal-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white hidden sm:flex">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="planejada">Planejadas</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="concluida">Concluídas</SelectItem>
                  <SelectItem value="expirada">Expiradas</SelectItem>
                  <SelectItem value="finalizada">Finalizadas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-teal-300/70 dark:hover:border-teal-600/70 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 dark:focus:ring-teal-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white hidden sm:flex">
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Fornecedores</SelectItem>
                  {Array.from(new Set(cotacoes.flatMap(cotacao => cotacao.fornecedoresParticipantes?.map(f => f.nome) || []))).sort().map(fornecedor => <SelectItem key={fornecedor} value={fornecedor}>
                      {fornecedor}
                    </SelectItem>)}
                </SelectContent>
              </Select>

              {/* Botão de Ações - Desktop: dropdown com exportar, Mobile: botão direto criar */}
              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl">
                      <Plus className="h-4 w-4 mr-2" />
                      Ações
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border z-50 w-48 shadow-lg">
                    <DropdownMenuLabel className="text-gray-600 font-medium">Gerenciar Cotações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault();
                        startTransition(() => {
                          setAddDialogOpen(true);
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Cotação
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault();
                        handleExportQuotes();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Indicador de filtro ativo por fornecedor */}
          {supplierFilter !== "all" && <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="bg-teal-100 text-teal-700 border-teal-300">
                <Building2 className="h-3 w-3 mr-1" />
                Fornecedor: {supplierFilter}
              </Badge>
            </div>}
        </CardContent>
      </Card>

      {/* Cotações View */}
      {isMobile ? (
        // Mobile: Infinite scroll list
        <CotacoesMobileList
          cotacoes={mobileData.cotacoes}
          isLoading={mobileData.isLoading}
          isFetchingNextPage={mobileData.isFetchingNextPage}
          hasNextPage={mobileData.hasNextPage}
          fetchNextPage={mobileData.fetchNextPage}
          onView={handleViewQuoteMobile}
          onEdit={handleEditQuoteMobile}
          onDelete={handleDeleteQuoteMobile}
          getStatusBadge={getStatusBadge}
        />
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map((cotacao, index) => {
        const getStatusColors = (status: string) => {
          switch (status) {
            case "ativa":
              return {
                border: "border-teal-300/60",
                bg: "from-white to-teal-50/30",
                iconBg: "from-teal-500/10 to-cyan-500/10 group-hover:from-teal-500/20 group-hover:to-cyan-500/20",
                iconColor: "text-teal-600"
              };
            case "pendente":
              return {
                border: "border-amber-300/60",
                bg: "from-white to-amber-50/30",
                iconBg: "from-amber-500/10 to-yellow-500/10 group-hover:from-amber-500/20 group-hover:to-yellow-500/20",
                iconColor: "text-amber-600"
              };
            case "concluida":
              return {
                border: "border-green-300/60",
                bg: "from-white to-green-50/30",
                iconBg: "from-green-500/10 to-emerald-500/10 group-hover:from-green-500/20 group-hover:to-emerald-500/20",
                iconColor: "text-green-600"
              };
            default:
              return {
                border: "border-red-300/60",
                bg: "from-white to-red-50/30",
                iconBg: "from-red-500/10 to-pink-500/10 group-hover:from-red-500/20 group-hover:to-pink-500/20",
                iconColor: "text-red-600"
              };
          }
        };
        const colors = getStatusColors(cotacao.status);
        const cotacaoNumero = paginatedData.pagination.startIndex + index + 1;
        return <Card key={cotacao.id} className={cn("group border border-gray-200/60 dark:border-gray-700/30 bg-gradient-to-br", colors.bg, "dark:from-[#1C1F26] dark:to-[#1C1F26]", `sm:hover:${colors.border}`, "sm:hover:shadow-xl sm:dark:hover:shadow-lg sm:dark:hover:shadow-black/20 sm:transition-shadow sm:duration-200", "backdrop-blur-sm")}>
              <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1">
                    <div className={cn("p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl", colors.iconBg, "sm:transition-all sm:duration-200")}>
                      <FileText className={cn("h-4 w-4 sm:h-5 sm:w-5", colors.iconColor, "sm:group-hover:scale-110 sm:transition-transform sm:duration-200")} />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                      <CardTitle className={cn("text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate", "sm:group-hover:text-teal-700 sm:dark:group-hover:text-teal-400 sm:transition-colors sm:duration-200")} title={cotacao.produto}>
                        <CapitalizedText>
                          {cotacao.produtoResumo}
                        </CapitalizedText>
                      </CardTitle>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        {getStatusBadge(cotacao.status)}
                        <Badge variant="outline" className="bg-gray-50/80 border-gray-200/60 text-gray-700 font-medium text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                          {cotacao.quantidade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {/* Desktop: Menu dropdown tradicional */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:duration-200 sm:hover:bg-teal-100 h-8 w-8 sm:h-9 sm:w-9 rounded-full">
                        <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Opção de editar - abre diretamente na tab de edição */}
                      {cotacao.status !== "concluida" && <ViewQuoteDialog 
                        quote={cotacao} 
                        onUpdateSupplierProductValue={(quoteId, supplierId, productId, newValue) => updateSupplierProductValue({
                          quoteId,
                          supplierId,
                          productId,
                          newValue
                        })} 
                        onConvertToOrder={(quoteId, orders) => convertToOrder({
                          quoteId,
                          orders
                        })}
                        onEdit={(quoteId, data) => updateQuote({
                          quoteId,
                          data
                        })}
                        defaultTab="edicao"
                        isUpdating={isUpdating} 
                        trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>} 
                      />}
                      
                      {/* Só permite excluir se não estiver concluída */}
                      {cotacao.status !== "concluida" && <DeleteQuoteDialog quote={cotacao} onDelete={id => deleteQuote(id)} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>} />}
                    </DropdownMenuContent>
                  </DropdownMenu>


                </div>
              </CardHeader>
              
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/60 dark:border-gray-700/30">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Cotação</span>
                      </div>
                      <p className="text-base sm:text-lg font-bold text-gray-800 dark:text-gray-200">
                        #{cotacaoNumero.toString().padStart(4, '0')}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        <span className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-400">Fornecedores</span>
                      </div>
                      <p className="text-base sm:text-lg font-bold text-blue-800 dark:text-blue-300">{cotacao.fornecedores}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="p-2.5 sm:p-3 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                      <span className="text-xs sm:text-sm font-medium text-indigo-700 dark:text-indigo-400">Período</span>
                    </div>
                    <p className="text-[10px] sm:text-xs font-semibold text-indigo-800 dark:text-indigo-300">{cotacao.dataInicio} - {cotacao.dataFim}</p>
                  </div>
                </div>

                <div className="pt-2 sm:pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">Melhor Preço</p>
                      <p className="text-lg sm:text-xl font-bold text-success">{cotacao.melhorPreco}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px]">{cotacao.melhorFornecedor}</p>
                    </div>
                    <div className="text-right">
                      {(() => {
                        const { economia, percentual } = calcularEconomiaCotacao(cotacao);
                        return economia > 0 ? (
                          <Badge variant="secondary" className="text-success" title={`Economia: R$ ${economia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                            -{percentual.toFixed(1)}%
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-gray-600">
                            0%
                          </Badge>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Mobile: Botões de ação diretos e intuitivos */}
                <div className="md:hidden pt-3 border-t border-gray-200/60">
                  <div className="flex items-center gap-2">
                    {/* Botão principal - Editar (se não estiver concluída) ou Ver Detalhes (se concluída) */}
                    {cotacao.status !== "concluida" ? (
                      <ViewQuoteDialog 
                        quote={cotacao} 
                        onUpdateSupplierProductValue={(quoteId, supplierId, productId, newValue) => updateSupplierProductValue({
                          quoteId,
                          supplierId,
                          productId,
                          newValue
                        })} 
                        onConvertToOrder={(quoteId, orders) => convertToOrder({
                          quoteId,
                          orders
                        })}
                        onEdit={(quoteId, data) => updateQuote({
                          quoteId,
                          data
                        })}
                        defaultTab="edicao"
                        isUpdating={isUpdating} 
                        trigger={<Button size="sm" className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                          <Edit className="h-3 w-3 mr-2" />
                          Editar
                        </Button>} 
                      />
                    ) : (
                      <ViewQuoteDialog 
                        quote={cotacao}
                        readOnly={true}
                        isUpdating={isUpdating} 
                        trigger={<Button size="sm" className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                          <Eye className="h-3 w-3 mr-2" />
                          Ver Detalhes
                        </Button>} 
                      />
                    )}

                    {/* Botão secundário - Excluir (apenas para cotações não concluídas) */}
                    {cotacao.status !== "concluida" && (
                      <DeleteQuoteDialog quote={cotacao} onDelete={id => deleteQuote(id)} trigger={<Button size="sm" variant="outline" className="bg-white/80 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                      </Button>} />
                    )}
                    {cotacao.status === "concluida" && <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
                        <FileText className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Concluída</span>
                      </div>}
                  </div>
                </div>

                {/* Desktop: Menu dropdown tradicional (mantido para compatibilidade) */}
                <div className="hidden md:block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="ml-auto">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {/* Opção de editar - abre diretamente na tab de edição */}
                      {cotacao.status !== "concluida" && (
                        <DropdownMenuItem 
                          onSelect={(e) => {
                            e.preventDefault();
                            handleEditQuote(cotacao);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      
                      {/* Só permite excluir se não estiver concluída */}
                      {cotacao.status !== "concluida" && (
                        <DropdownMenuItem 
                          onSelect={(e) => {
                            e.preventDefault();
                            handleDeleteQuote(cotacao);
                          }} 
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                      
                      {/* Mostra mensagem informativa para cotações concluídas */}
                      {cotacao.status === "concluida" && (
                        <DropdownMenuItem disabled className="text-muted-foreground">
                          <FileText className="h-4 w-4 mr-2" />
                          Cotação finalizada
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>;
      })}
        </div>
          ) : (
            <Card className="border-0 bg-transparent">
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableCell colSpan={7} className="px-1 pb-3 pt-0 border-none">
                      <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-teal-200/60 dark:border-teal-800/40 rounded-lg shadow-sm px-4 py-3">
                        <div className="w-[18%] flex items-center gap-2 pr-4 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/15 to-cyan-500/15 flex items-center justify-center text-teal-600 dark:text-cyan-300">
                            <ClipboardList className="h-4 w-4" />
                          </div>
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-800 dark:text-teal-200">Cotação</span>
                        </div>
                        <div className="hidden md:flex w-[20%] pl-2 items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-teal-600/70 dark:text-teal-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-800 dark:text-teal-200">Produto</span>
                        </div>
                        <div className="hidden lg:flex w-[15%] pl-2 items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-teal-600/70 dark:text-teal-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-800 dark:text-teal-200">Período</span>
                        </div>
                        <div className="w-[12%] pl-2 justify-center flex items-center gap-1.5">
                          <CircleDot className="h-3.5 w-3.5 text-teal-600/70 dark:text-teal-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-800 dark:text-teal-200">Status</span>
                        </div>
                        <div className="w-[15%] pl-2 flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-teal-600/70 dark:text-teal-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-800 dark:text-teal-200">Melhor Preço</span>
                        </div>
                        <div className="hidden sm:flex w-[10%] pl-2 justify-center items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-teal-600/70 dark:text-teal-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-800 dark:text-teal-200">Fornecedores</span>
                        </div>
                        <div className="w-[10%] pl-4 flex justify-end items-center gap-1.5">
                          <MoreVertical className="h-3.5 w-3.5 text-teal-600/70 dark:text-teal-400/70" />
                          <span className="uppercase tracking-wide text-[11px] font-semibold text-teal-800 dark:text-teal-200">Ações</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map((cotacao, index) => {
                    const cotacaoNumero = paginatedData.pagination.startIndex + index + 1;
                    return <TableRow key={cotacao.id} className="group border-none">
                      <TableCell colSpan={7} className="px-1 py-3">
                        <div className="flex items-center px-1.5 py-2 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300/70 dark:border-gray-700/30 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-teal-300/60 dark:hover:border-teal-700/50 transition-[box-shadow,border-color] duration-200 [&_*]:!transition-none">
                          {/* Cotação - Largura fixa */}
                          <div className="w-[18%] flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/10 to-cyan-500/10 dark:from-teal-400/20 dark:to-cyan-400/20 flex items-center justify-center flex-shrink-0 shadow-sm border border-teal-200/50 dark:border-teal-700/50">
                              <ClipboardList className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm text-foreground truncate">
                                #{cotacaoNumero.toString().padStart(4, '0')}
                              </div>
                              <div className="text-xs text-muted-foreground md:hidden mt-1 truncate" title={cotacao.produto}>
                                <CapitalizedText>
                                  {cotacao.produtoResumo}
                                </CapitalizedText>
                              </div>
                            </div>
                          </div>

                          {/* Produto - Largura fixa, hidden on mobile */}
                          <div className="hidden md:block w-[20%] px-2">
                            <div className="min-w-0 max-w-[150px]" title={cotacao.produto}>
                              <CapitalizedText className="font-medium text-sm text-foreground truncate">
                                {cotacao.produtoResumo}
                              </CapitalizedText>
                              <div className="text-xs text-muted-foreground mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded-md">
                                  <Package className="h-3 w-3" />
                                  {cotacao.quantidade}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Período - Largura fixa, hidden on large screens */}
                          <div className="hidden lg:block w-[15%] px-2">
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1 text-foreground">
                                <Calendar className="h-3 w-3 text-primary" />
                                {cotacao.dataInicio}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {cotacao.dataFim}
                              </div>
                            </div>
                          </div>

                          {/* Status - Largura fixa */}
                          <div className="w-[12%] px-2">
                            <div className="flex flex-col gap-1 items-center">
                              {getStatusBadge(cotacao.statusReal)}
                              {cotacao.statusReal === 'planejada' && cotacao.dataPlanejada && (
                                <Badge variant="outline" className="bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border-primary/20 dark:border-primary/30 text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(cotacao.dataPlanejada).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Melhor Preço - Largura fixa */}
                          <div className="w-[15%] px-2">
                            <div className="space-y-1">
                              <div className="font-bold text-green-600 dark:text-green-400 text-sm">{cotacao.melhorPreco}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[100px]">{cotacao.melhorFornecedor}</div>
                              {(() => {
                                const { economia, percentual } = calcularEconomiaCotacao(cotacao);
                                return economia > 0 ? (
                                   <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md text-xs font-medium justify-center" title={`Economia: R$ ${economia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                                    <DollarSign className="h-3 w-3" />
                                    -{percentual.toFixed(1)}%
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs font-medium justify-center">
                                    <DollarSign className="h-3 w-3" />
                                    0%
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Fornecedores - Largura fixa, hidden on small screens */}
                          <div className="hidden sm:block w-[10%] px-2">
                            <div className="flex justify-center">
                              <Badge variant="outline" className="bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30 text-primary dark:text-primary font-medium">
                                <Building2 className="h-3 w-3 mr-1" />
                                {cotacao.fornecedores}
                              </Badge>
                            </div>
                          </div>

                          {/* Ações - Largura fixa */}
                          <div className="w-[10%] px-2">
                            <div className="flex items-center justify-end gap-2">
                              {/* Botão Editar ou Ver Detalhes baseado no status */}
                              {cotacao.status !== "concluida" ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 p-0 h-8 w-8 rounded-lg border border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 flex items-center justify-center shadow-sm hover:shadow-md !transition-all"
                                  onClick={() => handleEditQuote(cotacao)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span className="sr-only">Editar cotação</span>
                                </Button>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-0 h-8 w-8 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 flex items-center justify-center shadow-sm hover:shadow-md !transition-all"
                                  onClick={() => handleViewQuote(cotacao)}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">Gerenciar cotação</span>
                                </Button>
                              )}


                              {/* Botão Excluir - Só aparece se não estiver concluída */}
                              {cotacao.status !== "concluida" && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 p-0 h-8 w-8 rounded-lg border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 flex items-center justify-center shadow-sm hover:shadow-md !transition-all"
                                  onClick={() => handleDeleteQuote(cotacao)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir cotação</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>;
                  })}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginação com melhor espaçamento */}
            <div className="border-t border-teal-100/80 dark:border-gray-700/30 bg-gradient-to-r from-teal-50/30 to-cyan-50/30 dark:from-gray-800/30 dark:to-gray-800/20 px-6 py-4">
              <DataPagination currentPage={paginatedData.pagination.currentPage} totalPages={paginatedData.pagination.totalPages} itemsPerPage={paginatedData.pagination.itemsPerPage} totalItems={paginatedData.pagination.totalItems} onPageChange={paginatedData.pagination.goToPage} onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} startIndex={paginatedData.pagination.startIndex} endIndex={paginatedData.pagination.endIndex} />
            </div>
          </CardContent>
        </Card>
            )}
        </>
      )}

      {!isMobile && filteredCotacoes.length === 0 && !isLoading && (
        <Card className="bg-white dark:bg-[#1C1F26] border border-gray-200/80 dark:border-gray-700/30">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Nenhuma cotação encontrada</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tente ajustar os filtros ou crie uma nova cotação
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialogs com lazy loading */}
      {addDialogOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
            <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        </div>}>
          <AddQuoteDialog 
            onAdd={() => { 
              refetch(); 
              startTransition(() => {
                setAddDialogOpen(false);
              });
            }} 
            open={addDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                startTransition(() => {
                  setAddDialogOpen(false);
                });
              }
            }}
            trigger={<div />}
          />
        </Suspense>
      )}
      
      {viewDialogOpen && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
            <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
        </div>}>
          <ViewQuoteDialog 
            quote={!isMobile ? selectedQuote || undefined : undefined} // Desktop: passa quote completo
            quoteId={isMobile ? selectedQuoteId || undefined : undefined} // Mobile: passa apenas ID
            onUpdateSupplierProductValue={updateSupplierProductValue ? (quoteId, supplierId, productId, newValue) => updateSupplierProductValue({ quoteId, supplierId, productId, newValue }) : undefined}
            onConvertToOrder={convertToOrder ? (quoteId, orders) => convertToOrder({ quoteId, orders }) : undefined}
            onEdit={updateQuote ? (quoteId, data) => updateQuote({ quoteId, data }) : undefined}
            isUpdating={isUpdating}
            defaultTab={(isMobile ? isEditMode : desktopEditMode) ? "edicao" : "detalhes"}
            open={viewDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                startTransition(() => {
                  setViewDialogOpen(false);
                  setSelectedQuoteId(null);
                  setIsEditMode(false);
                  setDesktopEditMode(false);
                  setSelectedQuote(null);
                });
              }
            }}
            trigger={<div />}
          />
        </Suspense>
      )}
      
      {deleteDialogOpen && selectedQuote && (
        <Suspense fallback={<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
            <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
          </div>
        </div>}>
          <DeleteQuoteDialog
            quote={selectedQuote}
            onDelete={(id) => { 
              deleteQuote(id);
              startTransition(() => {
                setDeleteDialogOpen(false);
                setSelectedQuote(null);
              });
            }}
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                startTransition(() => {
                  setDeleteDialogOpen(false);
                  setSelectedQuote(null);
                });
              }
            }}
            trigger={<div />}
          />
        </Suspense>
      )}
    </div>;
}