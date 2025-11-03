import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, FileText, Download, Calendar, BarChart3, DollarSign, Package, Building2, Eye, Loader2, RefreshCw, FileSpreadsheet, PieChart, Filter, CheckCircle, Clock, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useReports } from "@/hooks/useReports";
import { useReportEconomia } from "@/hooks/useReportEconomia";
import { useReportFornecedores } from "@/hooks/useReportFornecedores";
import { useReportComparativo } from "@/hooks/useReportComparativo";
import { useReportEficiencia } from "@/hooks/useReportEficiencia";
import { supabase } from "@/integrations/supabase/client";

// Tipos para melhor type safety
interface ReportType {
  titulo: string;
  descricao: string;
  tipo: string;
  icone: any;
  formato: string[];
  periodo: string;
  ultimaAtualizacao: string;
  categoria: 'financeiro' | 'operacional' | 'estrategico';
  prioridade: 'alta' | 'media' | 'baixa';
  tempoEstimado: string;
}
interface Estatisticas {
  economiaTotal: string;
  economiaPercentual: string;
  cotacoesRealizadas: number;
  fornecedoresAtivos: number;
  produtosCotados: number;
  pedidosGerados: number;
}
export default function Relatorios() {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    isGenerating,
    progress,
    generateReport,
    generateAllReports,
    getReportData
  } = useReports();
  
  // Hooks personalizados para cada tipo de relatório
  const reportEconomia = useReportEconomia();
  const reportFornecedores = useReportFornecedores();
  const reportComparativo = useReportComparativo();
  const reportEficiencia = useReportEficiencia();

  // Estados otimizados
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(1); // Primeiro dia do mês atual
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);
  const [previewReport, setPreviewReport] = useState<{
    isOpen: boolean;
    type: string;
  }>({
    isOpen: false,
    type: ''
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [estatisticasGerais, setEstatisticasGerais] = useState<Estatisticas>({
    economiaTotal: "R$ 0,00",
    economiaPercentual: "0%",
    cotacoesRealizadas: 0,
    fornecedoresAtivos: 0,
    produtosCotados: 0,
    pedidosGerados: 0
  });
  
  // Novos estados para sistema unificado
  const [selectedReportType, setSelectedReportType] = useState("economia");
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Relatórios estratégicos para tomada de decisão
  const relatoriosDisponiveis: ReportType[] = useMemo(() => [{
    titulo: "Análise de Economia Gerada",
    descricao: "Economia real gerada por período, melhor fornecedor e oportunidades de redução de custos",
    tipo: "economia",
    icone: DollarSign,
    formato: ["PDF", "Excel"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
    categoria: 'financeiro',
    prioridade: 'alta',
    tempoEstimado: '1-2 min'
  }, {
    titulo: "Performance de Fornecedores",
    descricao: "Taxa de vitória, valor médio, tempo de resposta e score de cada fornecedor para decisões estratégicas",
    tipo: "fornecedores",
    icone: Building2,
    formato: ["PDF", "Excel"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
    categoria: 'estrategico',
    prioridade: 'alta',
    tempoEstimado: '1-2 min'
  }, {
    titulo: "Comparativo de Preços",
    descricao: "Variação de preços por produto, identificação de oportunidades e fornecedores mais competitivos",
    tipo: "comparativo",
    icone: BarChart3,
    formato: ["PDF", "Excel"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
    categoria: 'operacional',
    prioridade: 'alta',
    tempoEstimado: '1-2 min'
  }, {
    titulo: "Eficiência do Processo",
    descricao: "Taxa de conversão, tempo médio de cotação, ROI e indicadores de eficiência operacional",
    tipo: "eficiencia",
    icone: TrendingUp,
    formato: ["PDF", "Excel"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
    categoria: 'estrategico',
    prioridade: 'alta',
    tempoEstimado: '1-2 min'
  }], []);

  // Função otimizada para carregar estatísticas
  const loadStatistics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const startDateStr = startDate?.toISOString().split('T')[0];
      const endDateStr = endDate?.toISOString().split('T')[0];

      // Carregar dados em paralelo para melhor performance
      const [quotesResult, ordersResult, suppliersResult, productsResult] = await Promise.all([supabase.from("quotes").select("id, status, data_inicio, data_fim, quote_suppliers(valor_oferecido)").gte("data_inicio", startDateStr).lte("data_fim", endDateStr), supabase.from("orders").select("id, order_date, total_value, status").gte("order_date", startDateStr).lte("order_date", endDateStr), supabase.from("suppliers").select("id, name"), supabase.from("products").select("id, name, category")]);
      if (quotesResult.error) throw quotesResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (suppliersResult.error) throw suppliersResult.error;
      if (productsResult.error) throw productsResult.error;
      const quotes = quotesResult.data || [];
      const orders = ordersResult.data || [];
      const suppliers = suppliersResult.data || [];
      const products = productsResult.data || [];

      // Calcular métricas de forma otimizada - APENAS cotações finalizadas
      const quotesFinalizadas = quotes.filter((q: any) => 
        q.status === 'finalizada' || q.status === 'concluida'
      );
      
      const metricsData = quotesFinalizadas.reduce((acc, quote: any) => {
        if (quote.quote_suppliers && quote.quote_suppliers.length >= 2) {
          // Agrupar por fornecedor e calcular valor total de cada um
          const fornecedoresMap = new Map();
          
          quote.quote_suppliers.forEach((supplier: any) => {
            const supplierId = supplier.supplier_id;
            const valorTotal = supplier.valor_oferecido || 0;
            
            if (!fornecedoresMap.has(supplierId)) {
              fornecedoresMap.set(supplierId, 0);
            }
            fornecedoresMap.set(supplierId, fornecedoresMap.get(supplierId) + valorTotal);
          });
          
          // Calcular economia: diferença entre maior e menor valor total
          const valoresFornecedores = Array.from(fornecedoresMap.values()).filter(v => v > 0);
          if (valoresFornecedores.length >= 2) {
            const menorValorTotal = Math.min(...valoresFornecedores);
            const maiorValorTotal = Math.max(...valoresFornecedores);
            acc.economiaTotal += maiorValorTotal - menorValorTotal;
            acc.cotacoesComEconomia++;
          }
        }
        return acc;
      }, {
        economiaTotal: 0,
        cotacoesComEconomia: 0
      });
      const totalPedidos = orders.reduce((acc, order) => acc + Number(order.total_value || 0), 0);
      const economiaPercentual = totalPedidos > 0 ? metricsData.economiaTotal / totalPedidos * 100 : 0;
      setEstatisticasGerais({
        economiaTotal: `R$ ${metricsData.economiaTotal.toFixed(2).replace('.', ',')}`,
        economiaPercentual: `${economiaPercentual.toFixed(1)}%`,
        cotacoesRealizadas: quotes.length,
        fornecedoresAtivos: suppliers.length,
        produtosCotados: products.length,
        pedidosGerados: orders.length
      });
      if (isRefresh) {
        toast({
          title: "Dados atualizados",
          description: "Estatísticas carregadas com sucesso"
        });
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Tente novamente em alguns instantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate, toast]);
  useEffect(() => {
    if (user) {
      loadStatistics();
    }
  }, [user, loadStatistics]);

  // Funções otimizadas com useCallback
  const currentFilters = useMemo(() => ({
    startDate: startDate || new Date(),
    endDate: endDate || new Date(),
    fornecedores: selectedFornecedores,
    produtos: selectedProdutos,
    categorias: []
  }), [startDate, endDate, selectedFornecedores, selectedProdutos]);
  const handleDownloadReport = useCallback(async (reportType: string, format: 'pdf' | 'excel') => {
    if (!startDate || !endDate) {
      toast({
        title: "Período obrigatório",
        description: "Por favor, selecione um período válido.",
        variant: "destructive"
      });
      return;
    }
    try {
      await generateReport(reportType, currentFilters, format);
      toast({
        title: "Download iniciado",
        description: `Relatório ${reportType} será baixado em breve`
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível gerar o relatório",
        variant: "destructive"
      });
    }
  }, [startDate, endDate, currentFilters, generateReport, toast]);
  const handleExportAll = useCallback(async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Período obrigatório",
        description: "Por favor, selecione um período válido.",
        variant: "destructive"
      });
      return;
    }
    try {
      await generateAllReports(currentFilters);
      toast({
        title: "Exportação iniciada",
        description: "Todos os relatórios serão gerados"
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar todos os relatórios",
        variant: "destructive"
      });
    }
  }, [startDate, endDate, currentFilters, generateAllReports, toast]);
  const handlePreviewReport = useCallback(async (reportType: string) => {
    setPreviewReport({
      isOpen: true,
      type: reportType
    });
    setPreviewData(null);
    try {
      const data = await getReportData(currentFilters);
      setPreviewData(data);
    } catch (error) {
      toast({
        title: "Erro na visualização",
        description: "Não foi possível carregar a prévia do relatório",
        variant: "destructive"
      });
    }
  }, [currentFilters, getReportData, toast]);
  const handleResetFilters = useCallback(() => {
    setSelectedFornecedores([]);
    setSelectedProdutos([]);
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay);
    setEndDate(today);
  }, []);
  const handleRefresh = useCallback(() => {
    loadStatistics(true);
  }, [loadStatistics]);

  // Nova função para visualizar relatório com hooks personalizados
  const handleVisualizarRelatorio = useCallback(async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Período obrigatório",
        description: "Selecione um período válido",
        variant: "destructive"
      });
      return;
    }
    
    setLoadingPreview(true);
    setShowPreview(true);
    
    try {
      // Usar hook apropriado baseado no tipo de relatório
      switch (selectedReportType) {
        case 'economia':
          await reportEconomia.generateReport(startDate, endDate);
          setReportData(reportEconomia.data);
          break;
        case 'fornecedores':
          await reportFornecedores.generateReport(startDate, endDate);
          setReportData(reportFornecedores.data);
          break;
        case 'comparativo':
          await reportComparativo.generateReport(startDate, endDate);
          setReportData(reportComparativo.data);
          break;
        case 'eficiencia':
          await reportEficiencia.generateReport(startDate, endDate);
          setReportData(reportEficiencia.data);
          break;
        default:
          setReportData(null);
      }
      
      setLoadingPreview(false);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoadingPreview(false);
      setReportData(null);
      toast({
        title: "Erro ao carregar relatório",
        description: "Tente novamente",
        variant: "destructive"
      });
    }
  }, [startDate, endDate, selectedReportType, toast, reportEconomia, reportFornecedores, reportComparativo, reportEficiencia]);

  const applyDatePreset = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start);
    setEndDate(end);
    setIsPeriodDialogOpen(false);
  }, []);

  // Memoizar dados computados
  const hasFilters = useMemo(() => selectedFornecedores.length > 0 || selectedProdutos.length > 0, [selectedFornecedores.length, selectedProdutos.length]);
  const dateRangeText = useMemo(() => {
    if (!startDate || !endDate) return 'Selecionar período';
    return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
  }, [startDate, endDate]);
  const relatoriosPorCategoria = useMemo(() => {
    return relatoriosDisponiveis.reduce((acc, relatorio) => {
      if (!acc[relatorio.categoria]) {
        acc[relatorio.categoria] = [];
      }
      acc[relatorio.categoria].push(relatorio);
      return acc;
    }, {} as Record<string, ReportType[]>);
  }, [relatoriosDisponiveis]);

  // Componente de loading otimizado
  const LoadingSkeleton = () => <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({
            length: 6
          }).map((_, i) => <div key={i} className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>)}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({
        length: 6
      }).map((_, i) => <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full mb-4" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </CardContent>
          </Card>)}
      </div>
    </div>;
  if (loading) {
    return <LoadingSkeleton />;
  }
  return <div className="page-container">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
            {/* Botão Período - Sempre visível */}
            <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 flex items-center gap-2 text-gray-900 dark:text-white ${startDate && endDate ? 'ring-2 ring-purple-500 dark:ring-purple-400 bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600' : ''}`}>
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">{dateRangeText}</span>
                  <span className="sm:hidden">Período</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 flex flex-col">
                <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-purple-50/80 via-violet-50/60 to-purple-50/40 backdrop-blur-sm relative overflow-hidden">
                  {/* Efeitos decorativos de fundo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-purple-500/5"></div>
                  <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl translate-x-12 translate-y-12"></div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg ring-2 ring-purple-100/50">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-gray-900">Selecionar Período</DialogTitle>
                      <p className="text-sm text-gray-600 mt-0.5">Defina o intervalo de datas para os relatórios</p>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {/* Presets de Data */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Períodos Rápidos</h3>
                        <p className="text-xs text-gray-600">Selecione um período predefinido</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" size="sm" onClick={() => applyDatePreset(7)} className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300">
                        <span className="font-medium">7 dias</span>
                        <span className="text-xs text-gray-500">Última semana</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => applyDatePreset(30)} className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300">
                        <span className="font-medium">30 dias</span>
                        <span className="text-xs text-gray-500">Último mês</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => applyDatePreset(90)} className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300">
                        <span className="font-medium">90 dias</span>
                        <span className="text-xs text-gray-500">Último trimestre</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => applyDatePreset(365)} className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-purple-50 hover:border-purple-300">
                        <span className="font-medium">1 ano</span>
                        <span className="text-xs text-gray-500">Últimos 12 meses</span>
                      </Button>
                    </div>
                  </div>

                  {/* Seleção Personalizada */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Período Personalizado</h3>
                        <p className="text-xs text-gray-600">Escolha datas específicas</p>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <DateRangePicker startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} />
                    </div>
                  </div>

                  {/* Resumo do Período */}
                  {startDate && endDate && <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Período Selecionado</h3>
                          <p className="text-xs text-gray-600">Resumo do intervalo escolhido</p>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-purple-900">
                              {startDate.toLocaleDateString('pt-BR')} - {endDate.toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-purple-700">
                              {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} dias selecionados
                            </div>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white shadow-lg">
                            <Calendar className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    </div>}
                </div>
                
                <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {startDate && endDate ? <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Período definido
                      </span> : <span className="text-gray-500">Selecione um período</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsPeriodDialogOpen(false)} className="text-gray-600 hover:text-gray-800">
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsPeriodDialogOpen(false)} disabled={!startDate || !endDate} className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white disabled:opacity-50">
                      Aplicar período
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          
            {/* Botão Atualizar - Visível apenas no desktop */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={refreshing} 
              className="hidden sm:flex bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 items-center gap-2 text-gray-900 dark:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            {/* Dialog de Filtros - Visível apenas no desktop */}
            <Dialog open={isFiltersDialogOpen} onOpenChange={setIsFiltersDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className={`hidden sm:flex bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 items-center gap-2 text-gray-900 dark:text-white ${hasFilters ? 'ring-2 ring-purple-500 dark:ring-purple-400 bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600' : ''}`}>
                  <Filter className="h-4 w-4" />
                  Filtros
                  {hasFilters && <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                      {selectedFornecedores.length + selectedProdutos.length}
                    </Badge>}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 flex flex-col">
                <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-purple-50/80 via-violet-50/60 to-purple-50/40 backdrop-blur-sm relative overflow-hidden">
                  {/* Efeitos decorativos de fundo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-violet-500/5 to-purple-500/5"></div>
                  <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl translate-x-12 translate-y-12"></div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg ring-2 ring-purple-100/50">
                      <Filter className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-gray-900">Filtros Avançados</DialogTitle>
                      <p className="text-sm text-gray-600 mt-0.5">Personalize os dados dos seus relatórios</p>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <ReportFilters selectedFornecedores={selectedFornecedores} selectedProdutos={selectedProdutos} onFornecedoresChange={setSelectedFornecedores} onProdutosChange={setSelectedProdutos} onReset={handleResetFilters} />
                </div>
                
                <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {hasFilters ? <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {selectedFornecedores.length + selectedProdutos.length} filtro{selectedFornecedores.length + selectedProdutos.length > 1 ? 's' : ''} aplicado{selectedFornecedores.length + selectedProdutos.length > 1 ? 's' : ''}
                      </span> : <span className="text-gray-500">Nenhum filtro aplicado</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasFilters && <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-gray-600 hover:text-gray-800">
                        Limpar todos
                      </Button>}
                    <Button onClick={() => setIsFiltersDialogOpen(false)} className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
                      Aplicar filtros
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          
            {/* Botão Exportar Todos - Visível apenas no desktop */}
            <Button 
              size="sm" 
              onClick={handleExportAll} 
              disabled={isGenerating} 
              className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Gerando...' : 'Exportar Todos'}
            </Button>

            {/* Dropdown Menu Mobile - Consolidar ações */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="sm:hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 h-10 w-10 p-0"
                >
                  <MoreVertical className="h-4 w-4 text-gray-900 dark:text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border z-50 w-48 shadow-lg">
                <DropdownMenuLabel className="text-gray-600 dark:text-gray-400 font-medium">Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                  className="cursor-pointer"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Atualizar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setIsFiltersDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                  {hasFilters && (
                    <Badge variant="secondary" className="ml-auto px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                      {selectedFornecedores.length + selectedProdutos.length}
                    </Badge>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleExportAll} 
                  disabled={isGenerating}
                  className="cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGenerating ? 'Gerando...' : 'Exportar Todos'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

      {/* Progress Bar Melhorado */}
      {isGenerating && <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-blue-700 font-medium">Gerando relatórios...</span>
                  <span className="text-blue-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full h-2" />
              </div>
            </div>
          </CardContent>
        </Card>}

      {/* Statistics Cards - Inspiração Dashboard Statistics Card 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
        {/* Card 1: Economia */}
        <Card className="group relative overflow-hidden bg-emerald-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
          {/* Decoração SVG sutil */}
          <svg
            className="absolute right-0 top-0 h-full w-2/3 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
            viewBox="0 0 300 200"
            fill="none"
            style={{ zIndex: 0 }}
          >
            <circle cx="220" cy="100" r="90" fill="#fff" fillOpacity="0.08" />
            <circle cx="260" cy="60" r="60" fill="#fff" fillOpacity="0.10" />
            <circle cx="200" cy="160" r="50" fill="#fff" fillOpacity="0.07" />
            <circle cx="270" cy="150" r="30" fill="#fff" fillOpacity="0.12" />
          </svg>

          <CardHeader className="border-0 z-10 relative pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-white/70 dark:text-gray-400" />
              <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                Economia
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 z-10 relative">
            <div className="flex items-center gap-2.5">
              <span className="text-xl font-semibold tracking-tight text-white dark:text-white truncate">
                {estatisticasGerais.economiaTotal}
              </span>
              <Badge className="bg-white/20 text-white font-semibold border-0">
                <TrendingUp className="w-3 h-3" />
                +{estatisticasGerais.economiaPercentual}
              </Badge>
            </div>
            <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
              <div className="flex items-center justify-between">
                <span>Total gerada:</span>
                <span className="font-medium text-white dark:text-gray-300">
                  {estatisticasGerais.economiaTotal}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                <span>Percentual:</span>
                <span className="font-medium">{estatisticasGerais.economiaPercentual}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-white/70 dark:text-gray-500">
                <span>Meta: R$ 50.000</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Cotações */}
        <Card className="group relative overflow-hidden bg-purple-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
          {/* Decoração SVG sutil */}
          <svg
            className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
            viewBox="0 0 200 200"
            fill="none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <filter id="blur-cotacoes-relatorios" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
            </defs>
            <ellipse cx="170" cy="60" rx="40" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur-cotacoes-relatorios)" />
            <rect x="120" y="20" width="60" height="20" rx="8" fill="#fff" fillOpacity="0.10" />
            <polygon points="150,0 200,0 200,50" fill="#fff" fillOpacity="0.07" />
            <circle cx="180" cy="100" r="14" fill="#fff" fillOpacity="0.16" />
          </svg>

          <CardHeader className="border-0 z-10 relative pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-white/70 dark:text-gray-400" />
              <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                Cotações
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 z-10 relative">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                {estatisticasGerais.cotacoesRealizadas}
              </span>
              <Badge className="bg-white/20 text-white font-semibold border-0">
                +12%
              </Badge>
            </div>
            <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
              <div className="flex items-center justify-between">
                <span>Realizadas:</span>
                <span className="font-medium text-white dark:text-gray-300">
                  {estatisticasGerais.cotacoesRealizadas}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                <span>Crescimento:</span>
                <span className="font-medium">+12%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Fornecedores */}
        <Card className="group relative overflow-hidden bg-blue-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
          {/* Decoração SVG sutil */}
          <svg
            className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
            viewBox="0 0 200 200"
            fill="none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <filter id="blur-fornecedores-relatorios" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="12" />
              </filter>
            </defs>
            <rect x="120" y="0" width="70" height="70" rx="35" fill="#fff" fillOpacity="0.09" filter="url(#blur-fornecedores-relatorios)" />
            <ellipse cx="170" cy="80" rx="28" ry="12" fill="#fff" fillOpacity="0.12" />
            <polygon points="200,0 200,60 140,0" fill="#fff" fillOpacity="0.07" />
            <circle cx="150" cy="30" r="10" fill="#fff" fillOpacity="0.15" />
          </svg>

          <CardHeader className="border-0 z-10 relative pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-white/70 dark:text-gray-400" />
              <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                Fornecedores
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 z-10 relative">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                {estatisticasGerais.fornecedoresAtivos}
              </span>
              <Badge className="bg-white/20 text-white font-semibold border-0">
                +5
              </Badge>
            </div>
            <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
              <div className="flex items-center justify-between">
                <span>Ativos:</span>
                <span className="font-medium text-white dark:text-gray-300">
                  {estatisticasGerais.fornecedoresAtivos}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                <span>Taxa de atividade:</span>
                <span className="font-medium">90%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Produtos */}
        <Card className="group relative overflow-hidden bg-orange-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
          {/* Decoração SVG sutil */}
          <svg
            className="absolute right-0 top-0 w-48 h-48 pointer-events-none opacity-10 dark:opacity-5 group-hover:opacity-15 dark:group-hover:opacity-8 transition-opacity duration-300"
            viewBox="0 0 200 200"
            fill="none"
            style={{ zIndex: 0 }}
          >
            <defs>
              <filter id="blur-produtos-relatorios" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="16" />
              </filter>
            </defs>
            <polygon points="200,0 200,100 100,0" fill="#fff" fillOpacity="0.09" />
            <ellipse cx="170" cy="40" rx="30" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur-produtos-relatorios)" />
            <rect x="140" y="60" width="40" height="18" rx="8" fill="#fff" fillOpacity="0.10" />
            <circle cx="150" cy="30" r="14" fill="#fff" fillOpacity="0.18" />
            <line x1="120" y1="0" x2="200" y2="80" stroke="#fff" strokeOpacity="0.08" strokeWidth="6" />
          </svg>

          <CardHeader className="border-0 z-10 relative pb-3">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-white/70 dark:text-gray-400" />
              <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                Produtos
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 z-10 relative">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-semibold tracking-tight text-white dark:text-white">
                {estatisticasGerais.produtosCotados}
              </span>
              <Badge className="bg-white/20 text-white font-semibold border-0">
                +8%
              </Badge>
            </div>
            <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
              <div className="flex items-center justify-between">
                <span>Cotados:</span>
                <span className="font-medium text-white dark:text-gray-300">
                  {estatisticasGerais.produtosCotados}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                <span>Com economia:</span>
                <span className="font-medium">{Math.floor(estatisticasGerais.produtosCotados * 0.6)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de Configuração Unificado */}
      <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none mb-6">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
            Configurar Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5 p-3 sm:p-4">
          {/* Mobile: Layout Vertical Compacto */}
          <div className="sm:hidden space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Tipo de Relatório</Label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relatoriosDisponiveis.map(rel => (
                    <SelectItem key={rel.tipo} value={rel.tipo} className="text-sm">{rel.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium">Período</Label>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left font-normal h-9 text-sm"
                onClick={() => setIsPeriodDialogOpen(true)}
              >
                <Calendar className="h-3.5 w-3.5 mr-2" />
                <span className="truncate">{dateRangeText}</span>
              </Button>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700/30">
              <Button 
                onClick={handleVisualizarRelatorio}
                disabled={loadingPreview || !startDate || !endDate}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white h-10 text-sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                {loadingPreview ? "Carregando..." : "Visualizar"}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline"
                    disabled={isGenerating || !startDate || !endDate}
                    className="w-full justify-between h-10 text-sm border-gray-300 dark:border-gray-600"
                  >
                    <div className="flex items-center">
                      <Download className="h-4 w-4 mr-2" />
                      <span>Baixar Relatório</span>
                    </div>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Formato de Download</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDownloadReport(selectedReportType, 'pdf')}
                    disabled={isGenerating || !startDate || !endDate}
                    className="cursor-pointer"
                  >
                    <FileText className="h-4 w-4 mr-2 text-purple-600" />
                    Baixar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDownloadReport(selectedReportType, 'excel')}
                    disabled={isGenerating || !startDate || !endDate}
                    className="cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Baixar Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Desktop: Layout Original em Grid */}
          <div className="hidden sm:block space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo de Relatório</Label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {relatoriosDisponiveis.map(rel => (
                      <SelectItem key={rel.tipo} value={rel.tipo}>{rel.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {relatoriosDisponiveis.find(r => r.tipo === selectedReportType)?.descricao}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Período</Label>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-left font-normal"
                  onClick={() => setIsPeriodDialogOpen(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateRangeText}
                </Button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {startDate && endDate && `${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} dias selecionados`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-gray-700/30">
              <Button 
                onClick={handleVisualizarRelatorio}
                disabled={loadingPreview || !startDate || !endDate}
                className="flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                {loadingPreview ? "Carregando..." : "Visualizar"}
              </Button>
              
              <Button 
                onClick={() => handleDownloadReport(selectedReportType, 'pdf')}
                disabled={isGenerating || !startDate || !endDate}
                className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
              
              <Button 
                onClick={() => handleDownloadReport(selectedReportType, 'excel')}
                disabled={isGenerating || !startDate || !endDate}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Baixar Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área de Visualização do Relatório */}
      {showPreview && (
        <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Prévia do Relatório
              </span>
              <Badge variant="outline">{relatoriosDisponiveis.find(r => r.tipo === selectedReportType)?.titulo}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPreview ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : reportData ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/30">
                      {Object.keys(reportData[0] || {}).map(key => (
                        <TableHead key={key} className="font-semibold capitalize">
                          {key}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                        {Object.values(row).map((value: any, i: number) => (
                          <TableCell key={i} className="px-1 py-3">{value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>;
}