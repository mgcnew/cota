import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ViewHistoricoDialog from "@/components/forms/ViewHistoricoDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { History, Search, Filter, Eye, Download, Calendar, TrendingUp, TrendingDown, FileText, ShoppingCart, Building2, X, Loader2, Activity, Clock } from "lucide-react";
export default function Historico() {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const {
    paginate
  } = usePagination<any>({
    initialItemsPerPage: 10
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [usuarioFilter, setUsuarioFilter] = useState("all");
  const [valorMin, setValorMin] = useState("");
  const [valorMax, setValorMax] = useState("");
  const [economiaMin, setEconomiaMin] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<any[]>([]);
  useEffect(() => {
    if (user) {
      loadHistorico();
    }
  }, [user]);
  const loadHistorico = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from("activity_log").select("*").order("created_at", {
        ascending: false
      });
      if (error) throw error;

      // Transform database data to match UI format
      const formattedData = data.map(item => ({
        id: item.id,
        tipo: item.tipo,
        acao: item.acao,
        detalhes: item.detalhes,
        data: format(new Date(item.created_at), "dd/MM/yyyy HH:mm", {
          locale: ptBR
        }),
        usuario: user?.email || "Usuário",
        valor: item.valor ? `R$ ${item.valor.toFixed(2).replace(".", ",")}` : "",
        economia: item.economia ? `${item.economia}%` : ""
      }));
      setHistorico(formattedData);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar o histórico de atividades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const getTipoIcon = (tipo: string) => {
    const icons = {
      cotacao: FileText,
      pedido: ShoppingCart,
      fornecedor: Building2,
      produto: TrendingUp
    };
    const Icon = icons[tipo as keyof typeof icons] || History;
    return <Icon className="h-4 w-4" />;
  };
  const getTipoBadge = (tipo: string) => {
    const variants = {
      cotacao: "default",
      pedido: "secondary",
      fornecedor: "outline",
      produto: "secondary"
    };
    const labels = {
      cotacao: "Cotação",
      pedido: "Pedido",
      fornecedor: "Fornecedor",
      produto: "Produto"
    };
    return <Badge variant={variants[tipo as keyof typeof variants] as any}>
        {labels[tipo as keyof typeof labels]}
      </Badge>;
  };
  const usuarios = [...new Set(historico.map(h => h.usuario))];
  const parseDataHora = (dataString: string) => {
    const [dataPart] = dataString.split(' ');
    const [dia, mes, ano] = dataPart.split('/');
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
  };
  const handleClearFilters = () => {
    setSearchTerm("");
    setTipoFilter("all");
    setUsuarioFilter("all");
    setValorMin("");
    setValorMax("");
    setEconomiaMin("");
    setDataInicio(undefined);
    setDataFim(undefined);
  };
  const exportToCSV = () => {
    const headers = ["ID", "Tipo", "Ação", "Detalhes", "Data", "Usuário", "Valor", "Economia"];
    const csvData = filteredHistorico.map(h => [h.id, h.tipo, h.acao, h.detalhes, h.data, h.usuario, h.valor, h.economia]);
    const csvContent = [headers.join(","), ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historico_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Exportação concluída",
      description: "Histórico exportado com sucesso"
    });
  };
  const filteredHistorico = historico.filter(item => {
    const matchesSearch = item.acao.toLowerCase().includes(searchTerm.toLowerCase()) || item.detalhes.toLowerCase().includes(searchTerm.toLowerCase()) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === "all" || item.tipo === tipoFilter;
    const matchesUsuario = usuarioFilter === "all" || item.usuario === usuarioFilter;
    const itemValor = item.valor ? parseFloat(item.valor.replace("R$ ", "").replace(".", "").replace(",", ".")) : 0;
    const matchesValorMin = !valorMin || itemValor >= parseFloat(valorMin);
    const matchesValorMax = !valorMax || itemValor <= parseFloat(valorMax);
    const itemEconomia = item.economia ? parseFloat(item.economia.replace("%", "")) : 0;
    const matchesEconomia = !economiaMin || itemEconomia >= parseFloat(economiaMin);
    const itemData = parseDataHora(item.data);
    const matchesDataInicio = !dataInicio || itemData >= dataInicio;
    const matchesDataFim = !dataFim || itemData <= dataFim;
    return matchesSearch && matchesTipo && matchesUsuario && matchesValorMin && matchesValorMax && matchesEconomia && matchesDataInicio && matchesDataFim;
  });

  // Aplicar paginação aos dados filtrados
  const paginatedData = paginate(filteredHistorico);

  // Estatísticas do histórico
  const stats = {
    totalAcoes: historico.length,
    cotacoesFinalizadas: historico.filter(h => h.tipo === "cotacao" && h.acao.includes("finalizada")).length,
    pedidosCriados: historico.filter(h => h.tipo === "pedido" && h.acao.includes("criado")).length,
    economiaTotal: historico.filter(h => h.economia).reduce((acc, h) => acc + parseFloat(h.economia.replace("%", "")), 0)
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }

  return <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 py-4 md:p-3 border border-slate-100/60 rounded-lg backdrop-blur-sm hover:border-gray-200/20 md:shadow-[0_2px_8px_rgba(0,0,0,0.08)] md:hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-300 bg-gradient-to-r from-slate-50 to-gray-50 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
              <History className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 to-gray-700 bg-clip-text text-transparent">
                Histórico
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-sm">
                  <Clock className="h-3 w-3" />
                  Registro de Atividades
                </div>
                {(dataInicio || dataFim) && <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                    <Calendar className="h-3 w-3" />
                    <span className="hidden sm:inline">
                      {dataInicio && dataFim ? `${format(dataInicio, "dd/MM", {
                    locale: ptBR
                  })} - ${format(dataFim, "dd/MM", {
                    locale: ptBR
                  })}` : dataInicio ? `A partir de ${format(dataInicio, "dd/MM", {
                    locale: ptBR
                  })}` : `Até ${format(dataFim!, "dd/MM", {
                    locale: ptBR
                  })}`}
                    </span>
                    <span className="sm:hidden">Filtrado</span>
                  </div>}
              </div>
            </div>
          </div>
        </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={`bg-white/70 backdrop-blur-sm border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 text-xs sm:text-sm ${dataInicio || dataFim ? 'ring-2 ring-slate-500 bg-slate-50 border-slate-300' : ''}`}>
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {dataInicio && dataFim ? `${format(dataInicio, "dd/MM", {
                    locale: ptBR
                  })} - ${format(dataFim, "dd/MM", {
                    locale: ptBR
                  })}` : dataInicio || dataFim ? "Período Parcial" : "Filtrar Período"}
                  </span>
                  <span className="sm:hidden">
                    {dataInicio || dataFim ? "Ativo" : "Período"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-white border border-gray-200 shadow-xl rounded-xl" align="end">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <span className="font-medium text-gray-900">Filtrar por Período</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Presets Rápidos */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700">Períodos Rápidos</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                      const hoje = new Date();
                      const seteDiasAtras = new Date();
                      seteDiasAtras.setDate(hoje.getDate() - 7);
                      setDataInicio(seteDiasAtras);
                      setDataFim(hoje);
                    }} className="h-9 text-xs hover:bg-slate-50 hover:border-slate-300">
                        Últimos 7 dias
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                      const hoje = new Date();
                      const trintaDiasAtras = new Date();
                      trintaDiasAtras.setDate(hoje.getDate() - 30);
                      setDataInicio(trintaDiasAtras);
                      setDataFim(hoje);
                    }} className="h-9 text-xs hover:bg-slate-50 hover:border-slate-300">
                        Últimos 30 dias
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                      const hoje = new Date();
                      const noventaDiasAtras = new Date();
                      noventaDiasAtras.setDate(hoje.getDate() - 90);
                      setDataInicio(noventaDiasAtras);
                      setDataFim(hoje);
                    }} className="h-9 text-xs hover:bg-slate-50 hover:border-slate-300">
                        Últimos 90 dias
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                      const hoje = new Date();
                      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                      setDataInicio(inicioMes);
                      setDataFim(hoje);
                    }} className="h-9 text-xs hover:bg-slate-50 hover:border-slate-300">
                        Este mês
                      </Button>
                    </div>
                  </div>

                  {/* Seleção Manual */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-gray-700">Período Personalizado</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Data Início</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs", !dataInicio && "text-gray-500", dataInicio && "border-slate-300 bg-slate-50 text-slate-700")}>
                              <Calendar className="mr-2 h-3 w-3" />
                              {dataInicio ? format(dataInicio, "dd/MM/yyyy", {
                              locale: ptBR
                            }) : "Selecionar"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent mode="single" selected={dataInicio} onSelect={setDataInicio} locale={ptBR} className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Data Fim</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9 text-xs", !dataFim && "text-gray-500", dataFim && "border-slate-300 bg-slate-50 text-slate-700")}>
                              <Calendar className="mr-2 h-3 w-3" />
                              {dataFim ? format(dataFim, "dd/MM/yyyy", {
                              locale: ptBR
                            }) : "Selecionar"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent mode="single" selected={dataFim} onSelect={setDataFim} locale={ptBR} disabled={date => dataInicio ? date < dataInicio : false} className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Resumo do Período */}
                  {(dataInicio || dataFim) && <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-slate-900">
                            {dataInicio && dataFim ? `${format(dataInicio, "dd/MM/yyyy", {
                          locale: ptBR
                        })} - ${format(dataFim, "dd/MM/yyyy", {
                          locale: ptBR
                        })}` : dataInicio ? `A partir de ${format(dataInicio, "dd/MM/yyyy", {
                          locale: ptBR
                        })}` : `Até ${format(dataFim!, "dd/MM/yyyy", {
                          locale: ptBR
                        })}`}
                          </div>
                          {dataInicio && dataFim && <div className="text-xs text-slate-600">
                              {Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))} dias
                            </div>}
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-gray-500 flex items-center justify-center text-white">
                          <Calendar className="h-4 w-4" />
                        </div>
                      </div>
                    </div>}

                  {/* Ações */}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => {
                    setDataInicio(undefined);
                    setDataFim(undefined);
                  }}>
                      Limpar
                    </Button>
                    <Button size="sm" className="flex-1 bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white text-xs" onClick={() => {
                    // Popover fecha automaticamente
                  }}>
                      Aplicar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          
            <Button onClick={exportToCSV} size="sm" className="bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 text-xs sm:text-sm">
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar no histórico..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 text-sm" />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)} className="px-2 sm:px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm flex-1 sm:flex-none min-w-0">
                <option value="all">Todos</option>
                <option value="cotacao">Cotações</option>
                <option value="pedido">Pedidos</option>
                <option value="fornecedor">Fornecedores</option>
                <option value="produto">Produtos</option>
              </select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Mais Filtros</span>
                    <span className="sm:hidden">Filtros</span>
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="w-96" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Filtros Avançados</h4>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Limpar Todos
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Usuário</Label>
                    <select value={usuarioFilter} onChange={e => setUsuarioFilter(e.target.value)} className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground">
                      <option value="all">Todos os Usuários</option>
                      {usuarios.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Valor Mínimo</Label>
                      <Input type="number" placeholder="R$ 0,00" value={valorMin} onChange={e => setValorMin(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Máximo</Label>
                      <Input type="number" placeholder="R$ 0,00" value={valorMax} onChange={e => setValorMax(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Economia Mínima (%)</Label>
                    <Input type="number" placeholder="0%" value={economiaMin} onChange={e => setEconomiaMin(e.target.value)} />
                  </div>

                  {(dataInicio || dataFim) && <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Período Selecionado</p>
                      <div className="text-sm">
                        {dataInicio && <div>De: {format(dataInicio, "dd/MM/yyyy", {
                          locale: ptBR
                        })}</div>}
                        {dataFim && <div>Até: {format(dataFim, "dd/MM/yyyy", {
                          locale: ptBR
                        })}</div>}
                      </div>
                    </div>}
                </div>
              </PopoverContent>
            </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="card-gradient-primary">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <History className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{stats.totalAcoes}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Total de Ações</p>
          </CardContent>
        </Card>
        <Card className="card-gradient-info">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-info/10">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-info" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{stats.cotacoesFinalizadas}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Cotações Finalizadas</p>
          </CardContent>
        </Card>
        <Card className="card-gradient-warning">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-warning/10">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-foreground">{stats.pedidosCriados}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Pedidos Criados</p>
          </CardContent>
        </Card>
        <Card className="card-gradient-success">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-success">{stats.economiaTotal}%</div>
            <p className="text-xs sm:text-sm text-muted-foreground">Economia Acumulada</p>
          </CardContent>
        </Card>
      </div>

      {/* Histórico List com Paginação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Atividades Recentes</span>
            <Badge variant="outline" className="text-xs">
              {filteredHistorico.length > 0 ? `Página ${paginatedData.pagination.currentPage} de ${paginatedData.pagination.totalPages}` : "Sem dados"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedData.items.map(item => {
            const iconColorClass = item.tipo === "cotacao" ? "text-info" : item.tipo === "pedido" ? "text-warning" : item.tipo === "fornecedor" ? "text-primary" : "text-success";
            const bgColorClass = item.tipo === "cotacao" ? "bg-info/10" : item.tipo === "pedido" ? "bg-warning/10" : item.tipo === "fornecedor" ? "bg-primary/10" : "bg-success/10";
            return <div key={item.id} className="group flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border-2 border-border hover:border-primary/40 bg-card hover:shadow-lg dark:hover:shadow-primary/20 transition-all duration-300">
                <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center mt-0.5 transition-transform duration-300 group-hover:scale-110 flex-shrink-0", bgColorClass)}>
                  <div className={iconColorClass}>
                    {getTipoIcon(item.tipo)}
                  </div>
                </div>
                
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="font-medium text-foreground text-sm sm:text-base truncate">{item.acao}</span>
                    <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                      {getTipoBadge(item.tipo)}
                      {item.economia && <Badge variant="outline" className="text-success border-success text-xs">
                          -{item.economia}
                        </Badge>}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {item.detalhes}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-muted-foreground">
                    <span className="truncate">{item.data}</span>
                    <span className="truncate">por {item.usuario}</span>
                    {item.valor && <span className="font-medium text-foreground text-xs sm:text-sm">{item.valor}</span>}
                  </div>
                </div>
                
                <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors h-8 w-8 sm:h-9 sm:w-9 p-0 flex-shrink-0" onClick={() => {
                setSelectedItem(item);
                setViewDialogOpen(true);
              }}>
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>;
          })}
            
            {filteredHistorico.length === 0 && <div className="text-center py-8 text-muted-foreground">
                Nenhuma atividade encontrada com os filtros aplicados.
              </div>}
          </div>

          {/* Componente de Paginação */}
          {filteredHistorico.length > 0 && <div className="mt-6 border-t pt-4">
              <DataPagination currentPage={paginatedData.pagination.currentPage} totalPages={paginatedData.pagination.totalPages} itemsPerPage={paginatedData.pagination.itemsPerPage} totalItems={paginatedData.pagination.totalItems} onPageChange={paginatedData.pagination.goToPage} onItemsPerPageChange={paginatedData.pagination.setItemsPerPage} startIndex={paginatedData.pagination.startIndex} endIndex={paginatedData.pagination.endIndex} />
            </div>}
        </CardContent>
      </Card>

      {/* View Dialog */}
      {selectedItem && <ViewHistoricoDialog open={viewDialogOpen} onOpenChange={setViewDialogOpen} item={selectedItem} />}
    </div>;
}