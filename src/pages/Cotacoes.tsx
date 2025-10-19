import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useDebounce } from "@/hooks/useDebounce";
import type { Quote, FornecedorParticipante } from "@/hooks/useCotacoes";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Plus, Search, Filter, Eye, Edit, Trash2, Download, Calendar, DollarSign, Building2, MoreVertical, ChevronDown, Package } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddQuoteDialog from "@/components/forms/AddQuoteDialog";
import EditQuoteDialog from "@/components/forms/EditQuoteDialog";
import DeleteQuoteDialog from "@/components/forms/DeleteQuoteDialog";
import ViewQuoteDialog from "@/components/forms/ViewQuoteDialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { MetricCard } from "@/components/ui/metric-card";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { ViewMode } from "@/types/pagination";
import { cn } from "@/lib/utils";
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
  const addQuoteRef = useRef<HTMLButtonElement>(null);

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

  // OPTIMIZED: Use React Query with single optimized query (no N+1)
  const {
    cotacoes,
    isLoading,
    refetch,
    updateSupplierProductValue,
    deleteQuote,
    updateQuote,
    convertToOrder,
    isUpdating
  } = useCotacoes();
  const getStatusBadge = (status: string) => {
    const variants = {
      ativa: "default",
      concluida: "secondary",
      pendente: "outline",
      expirada: "destructive",
      finalizada: "default"
    };
    const labels = {
      ativa: "Ativa",
      concluida: "Concluída",
      pendente: "Pendente",
      expirada: "Expirada",
      finalizada: "Finalizada"
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>;
  };

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
      const matchesStatus = statusFilter === "all" || cotacao.status === statusFilter;

      // Filtro por fornecedor - verifica se algum fornecedor participante corresponde
      const matchesSupplier = supplierFilter === "all" || cotacao.fornecedoresParticipantes?.some(fornecedor => fornecedor.nome.toLowerCase().includes(supplierFilter.toLowerCase()));
      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [cotacoes, debouncedSearchTerm, statusFilter, supplierFilter]);

  // Calcular estatísticas dinâmicas
  const stats = useMemo(() => {
    const porStatus = {
      ativas: cotacoes.filter(c => c.status === "ativa").length,
      pendentes: cotacoes.filter(c => c.status === "pendente").length,
      concluidas: cotacoes.filter(c => c.status === "concluida" || c.status === "finalizada").length,
      expiradas: cotacoes.filter(c => c.status === "expirada").length
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

  if (isLoading) {
    return <div className="p-6 flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando cotações...</p>
      </div>;
  }
  const paginatedData = paginate(filteredCotacoes);
  return <div className="page-container">
      {/* Statistics Cards - Estilo Apple */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 mb-6 overflow-visible">
        <Card className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50 md:shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-500 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-teal-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ativas</span>
              </div>
              {stats.percentualAtivas > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/20 rounded-full">
                  <span className="text-xs font-semibold text-teal-600">{stats.percentualAtivas}%</span>
                </div>
              )}
            </div>
            <div className="mb-3">
              <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stats.porStatus.ativas}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">cotações ativas</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${stats.percentualAtivas}%` }}></div>
              </div>
              <span className="text-xs font-semibold text-teal-600">{stats.percentualAtivas}%</span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {stats.porStatus.pendentes} pendentes • {stats.porStatus.concluidas} finalizadas
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50 md:shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-500 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pendentes</span>
              </div>
              {stats.pendentesMais24h > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 rounded-full">
                  <span className="text-xs font-semibold text-red-600">⚠ {stats.pendentesMais24h}</span>
                </div>
              )}
            </div>
            <div className="mb-3">
              <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stats.porStatus.pendentes}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">aguardando resposta</p>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {stats.pendentesMais24h > 0 ? (
                <span className="text-red-600 dark:text-red-400 font-semibold">{stats.pendentesMais24h} há mais de 24h</span>
              ) : (
                <span className="text-green-600 dark:text-green-400">Todas dentro do prazo</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50 md:shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-500 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Economia</span>
              </div>
              {stats.economiaTotal > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <span className="text-xs font-semibold text-green-600">Total</span>
                </div>
              )}
            </div>
            <div className="mb-3">
              <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stats.economiaFormatada}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">economizados</p>
            </div>
            <div className="flex items-end gap-0.5 h-8">
              {stats.ultimas7Economias.map((economia, i) => {
                const maxEconomia = Math.max(...stats.ultimas7Economias, 1);
                const heightPercent = (economia / maxEconomia) * 100;
                return (
                  <div 
                    key={i} 
                    className="flex-1 bg-gradient-to-t from-emerald-500 to-green-400 rounded-t opacity-60 hover:opacity-100 transition-all duration-300 relative group" 
                    style={{ height: `${Math.max(heightPercent, 8)}%`, minHeight: '8px' }}
                    title={economia > 0 ? `Economia: R$ ${economia.toLocaleString('pt-BR')}` : 'Sem economia'}
                  >
                    {economia > 0 && (
                      <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-lg border border-gray-200 dark:border-gray-700">
                        R$ {economia.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50 md:shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-500 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fornecedores</span>
              </div>
              {stats.totalFornecedoresUnicos > 0 && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                  <span className="text-xs font-semibold text-blue-600">{stats.totalFornecedoresUnicos} únicos</span>
                </div>
              )}
            </div>
            <div className="mb-3">
              <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{stats.mediaFornecedores}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">média por cotação</p>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {stats.totalFornecedoresUnicos} fornecedores únicos participantes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:justify-between">
            <ViewToggle view={viewMode} onViewChange={setViewMode} />

            <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:justify-end">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4 z-10" />
                <Input placeholder="Buscar por produto ou ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 pr-4 w-64 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-teal-300/70 dark:hover:border-teal-600/70 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 dark:focus:ring-teal-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white" />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-teal-300/70 dark:hover:border-teal-600/70 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 dark:focus:ring-teal-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="concluida">Concluídas</SelectItem>
                  <SelectItem value="expirada">Expiradas</SelectItem>
                  <SelectItem value="finalizada">Finalizadas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-full sm:w-[200px] h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 hover:border-teal-300/70 dark:hover:border-teal-600/70 focus:border-teal-400 dark:focus:border-teal-500 focus:ring-2 focus:ring-teal-200/50 dark:focus:ring-teal-800/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 text-gray-900 dark:text-white">
                  <SelectValue placeholder="Fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Fornecedores</SelectItem>
                  {Array.from(new Set(cotacoes.flatMap(cotacao => cotacao.fornecedoresParticipantes?.map(f => f.nome) || []))).sort().map(fornecedor => <SelectItem key={fornecedor} value={fornecedor}>
                      {fornecedor}
                    </SelectItem>)}
                </SelectContent>
              </Select>

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
                  <DropdownMenuItem onClick={() => addQuoteRef.current?.click()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cotação
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
      {viewMode === "grid" ? <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {paginatedData.items.map(cotacao => {
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
        return <Card key={cotacao.id} className={cn("group hover:shadow-xl transition-all duration-300 border border-gray-200/60 hover:", colors.border, "bg-gradient-to-br", colors.bg, "backdrop-blur-sm")}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={cn("p-2.5 rounded-xl transition-all duration-300", colors.iconBg)}>
                      <FileText className={cn("h-5 w-5 group-hover:scale-110 transition-transform duration-300", colors.iconColor)} />
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-teal-700 transition-colors duration-300 truncate">
                        {cotacao.produto}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(cotacao.status)}
                        <Badge variant="outline" className="bg-gray-50/80 border-gray-200/60 text-gray-700 font-medium text-xs">
                          {cotacao.quantidade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  {/* Desktop: Menu dropdown tradicional */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-teal-100 hidden md:flex">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ViewQuoteDialog quote={cotacao} onUpdateSupplierProductValue={(quoteId, supplierId, productId, newValue) => updateSupplierProductValue({
                    quoteId,
                    supplierId,
                    productId,
                    newValue
                  })} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>} />
                      
                      {/* Só permite editar se não estiver concluída */}
                      {cotacao.status !== "concluida" && <EditQuoteDialog quote={cotacao} onEdit={(quoteId, data) => updateQuote({
                    quoteId,
                    data
                  })} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>} />}
                      
                      {/* Só permite excluir se não estiver concluída */}
                      {cotacao.status !== "concluida" && <DeleteQuoteDialog quote={cotacao} onDelete={id => deleteQuote(id)} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>} />}
                    </DropdownMenuContent>
                  </DropdownMenu>


                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/60">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">ID</span>
                      </div>
                      <p className="text-sm font-bold text-gray-800 font-mono">
                        {cotacao.id.length > 12 ? `${cotacao.id.substring(0, 6)}...${cotacao.id.substring(cotacao.id.length - 4)}` : cotacao.id}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">Fornecedores</span>
                      </div>
                      <p className="text-sm font-bold text-blue-800">{cotacao.fornecedores}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-indigo-50/80 border border-indigo-200/60">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-700">Período</span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-800">{cotacao.dataInicio} - {cotacao.dataFim}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Melhor Preço</p>
                      <p className="text-xl font-bold text-success">{cotacao.melhorPreco}</p>
                      <p className="text-xs text-muted-foreground">{cotacao.melhorFornecedor}</p>
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
                    {/* Botão principal - Ver Detalhes */}
                    <ViewQuoteDialog quote={cotacao} onUpdateSupplierProductValue={(quoteId, supplierId, productId, newValue) => updateSupplierProductValue({
                  quoteId,
                  supplierId,
                  productId,
                  newValue
                })} trigger={<Button size="sm" className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                          <Eye className="h-3 w-3 mr-2" />
                          Ver Detalhes
                        </Button>} />

                    {/* Botões secundários baseados no status */}
                    {cotacao.status !== "concluida" ? <>
                        <EditQuoteDialog quote={cotacao} onEdit={(quoteId, data) => updateQuote({
                    quoteId,
                    data
                  })} trigger={<Button size="sm" variant="outline" className="bg-white/80 hover:bg-blue-50 border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800">
                              <Edit className="h-3 w-3" />
                            </Button>} />
                        
                        <DeleteQuoteDialog quote={cotacao} onDelete={id => deleteQuote(id)} trigger={<Button size="sm" variant="outline" className="bg-white/80 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700">
                              <Trash2 className="h-3 w-3" />
                            </Button>} />
                      </> : <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
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
                      <ViewQuoteDialog quote={cotacao} onUpdateSupplierProductValue={(quoteId, supplierId, productId, newValue) => updateSupplierProductValue({
                    quoteId,
                    supplierId,
                    productId,
                    newValue
                  })} onConvertToOrder={(quoteId, supplierId, deliveryDate, observations) => convertToOrder({
                    quoteId,
                    supplierId,
                    deliveryDate,
                    observations
                  })} isUpdating={isUpdating} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>} />
                      
                      {/* Só permite editar se não estiver concluída */}
                      {cotacao.status !== "concluida" && <EditQuoteDialog quote={cotacao} onEdit={(quoteId, data) => updateQuote({
                    quoteId,
                    data
                  })} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>} />}
                      
                      {/* Só permite excluir se não estiver concluída */}
                      {cotacao.status !== "concluida" && <DeleteQuoteDialog quote={cotacao} onDelete={id => deleteQuote(id)} trigger={<DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>} />}
                      
                      {/* Mostra mensagem informativa para cotações concluídas */}
                      {cotacao.status === "concluida" && <DropdownMenuItem disabled className="text-muted-foreground">
                          <FileText className="h-4 w-4 mr-2" />
                          Cotação finalizada
                        </DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>;
      })}
        </div> : <Card className="border-0 bg-transparent">
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table className="w-full">
                <TableHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 border-b border-teal-200 dark:border-gray-700">
                  <TableRow className="border-b-2 border-gray-100 dark:border-gray-700">
                    <TableHead className="font-semibold text-teal-900 dark:text-gray-200 py-4 px-4 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Cotação
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell font-semibold text-teal-900 dark:text-gray-200 py-4 px-4 text-xs">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Produto
                      </div>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell font-semibold text-teal-900 dark:text-gray-200 py-4 px-4 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Período
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-teal-900 dark:text-gray-200 py-4 px-4 text-xs">Status</TableHead>
                    <TableHead className="font-semibold text-teal-900 dark:text-gray-200 py-4 px-4 text-xs">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Melhor Preço
                      </div>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell font-semibold text-teal-900 dark:text-gray-200 py-4 px-4 text-xs">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Fornecedores
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-semibold text-teal-900 dark:text-gray-200 py-4 px-4 w-32 text-xs">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.items.map((cotacao, index) => <TableRow key={cotacao.id} className="group border-none">
                      <TableCell colSpan={7} className="p-3">
                        <div className="flex items-center p-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg border border-gray-300/70 dark:border-gray-700/70 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                          {/* Cotação - Largura fixa */}
                          <div className="w-[18%] flex items-center gap-3 pr-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/10 to-cyan-500/10 dark:from-teal-400/20 dark:to-cyan-400/20 flex items-center justify-center flex-shrink-0 shadow-sm border border-teal-200/50 dark:border-teal-700/50">
                              <FileText className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold font-mono text-sm text-gray-900 dark:text-white truncate">
                                #{cotacao.id.substring(0, 8)}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 md:hidden mt-1 truncate">{cotacao.produto}</div>
                            </div>
                          </div>

                          {/* Produto - Largura fixa, hidden on mobile */}
                          <div className="hidden md:block w-[20%] px-2">
                            <div className="min-w-0 max-w-[150px]">
                              <div className="font-medium text-sm text-gray-900 dark:text-white truncate">{cotacao.produto}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded-md">
                                  <Package className="h-3 w-3" />
                                  {cotacao.quantidade}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Período - Largura fixa, hidden on large screens */}
                          <div className="hidden lg:block w-[15%] px-2">
                            <div className="text-xs space-y-1">
                              <div className="flex items-center gap-1 text-gray-900">
                                <Calendar className="h-3 w-3 text-teal-600" />
                                {cotacao.dataInicio}
                              </div>
                              <div className="flex items-center gap-1 text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {cotacao.dataFim}
                              </div>
                            </div>
                          </div>

                          {/* Status - Largura fixa */}
                          <div className="w-[12%] px-2">
                            <div className="flex justify-center">
                              {getStatusBadge(cotacao.status)}
                            </div>
                          </div>

                          {/* Melhor Preço - Largura fixa */}
                          <div className="w-[15%] px-2">
                            <div className="space-y-1">
                              <div className="font-bold text-green-600 text-sm">{cotacao.melhorPreco}</div>
                              <div className="text-xs text-gray-600 truncate max-w-[100px]">{cotacao.melhorFornecedor}</div>
                              {(() => {
                                const { economia, percentual } = calcularEconomiaCotacao(cotacao);
                                return economia > 0 ? (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-medium justify-center" title={`Economia: R$ ${economia.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}>
                                    <DollarSign className="h-3 w-3" />
                                    -{percentual.toFixed(1)}%
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium justify-center">
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
                              <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 font-medium">
                                <Building2 className="h-3 w-3 mr-1" />
                                {cotacao.fornecedores}
                              </Badge>
                            </div>
                          </div>

                          {/* Ações - Largura fixa */}
                          <div className="w-[10%] pl-4">
                            <div className="flex items-center justify-end gap-2">
                              {/* Botão Detalhes - Direto na tabela */}
                              <ViewQuoteDialog quote={cotacao} onUpdateSupplierProductValue={(quoteId, supplierId, productId, newValue) => updateSupplierProductValue({
                            quoteId,
                            supplierId,
                            productId,
                            newValue
                          })} onConvertToOrder={(quoteId, supplierId, deliveryDate, observations) => convertToOrder({
                            quoteId,
                            supplierId,
                            deliveryDate,
                            observations
                          })} isUpdating={isUpdating} trigger={<Button variant="outline" size="sm" className="h-8 w-8 p-0 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <Eye className="h-3 w-3" />
                                    <span className="sr-only">Ver detalhes da cotação</span>
                                  </Button>} />

                              {/* Botão Editar - Só aparece se não estiver concluída */}
                              {cotacao.status !== "concluida" && <EditQuoteDialog quote={cotacao} onEdit={(quoteId, data) => updateQuote({
                            quoteId,
                            data
                          })} trigger={<Button variant="outline" size="sm" className="h-8 w-8 p-0 border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-all duration-200 shadow-sm hover:shadow-md">
                                      <Edit className="h-3 w-3" />
                                      <span className="sr-only">Editar cotação</span>
                                    </Button>} />}

                              {/* Botão Excluir - Só aparece se não estiver concluída */}
                              {cotacao.status !== "concluida" && <DeleteQuoteDialog quote={cotacao} onDelete={id => deleteQuote(id)} trigger={<Button variant="outline" size="sm" className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all duration-200 shadow-sm hover:shadow-md">
                                      <Trash2 className="h-3 w-3" />
                                      <span className="sr-only">Excluir cotação</span>
                                    </Button>} />}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
            
            {/* Paginação com melhor espaçamento */}
            <div className="border-t border-teal-100/80 bg-gradient-to-r from-teal-50/30 to-cyan-50/30 px-6 py-4">
              <DataPagination currentPage={paginatedData.pagination.currentPage} totalPages={paginatedData.pagination.totalPages} itemsPerPage={paginatedData.pagination.itemsPerPage} totalItems={paginatedData.pagination.totalItems} onPageChange={paginatedData.pagination.goToPage} onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} startIndex={paginatedData.pagination.startIndex} endIndex={paginatedData.pagination.endIndex} />
            </div>
          </CardContent>
        </Card>}

      {filteredCotacoes.length === 0 && !isLoading && <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma cotação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou crie uma nova cotação
            </p>
          </CardContent>
        </Card>}

      {/* Hidden trigger for dialog */}
      <div className="hidden">
        <AddQuoteDialog onAdd={refetch} trigger={<button ref={addQuoteRef} />} />
      </div>
    </div>;
}