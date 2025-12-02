import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { DataPagination } from "@/components/ui/data-pagination";
import { TrendingUp, TrendingDown, FileText, Download, Calendar, BarChart3, DollarSign, Package, Building2, Eye, Loader2, RefreshCw, FileSpreadsheet, PieChart, Filter, CheckCircle, Clock, MoreVertical, History, Activity, ShoppingCart, X, Search, Users, Timer, Target, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
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
import { useReportPedidos } from "@/hooks/useReportPedidos";
import { useReportProdutos } from "@/hooks/useReportProdutos";
import { useReportTempoResposta } from "@/hooks/useReportTempoResposta";
import { useReportConversao } from "@/hooks/useReportConversao";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useInsights } from "@/hooks/useInsights";
import { InsightsPanel } from "@/components/analytics/InsightsPanel";
import { PerformanceCharts } from "@/components/analytics/PerformanceCharts";
import ViewHistoricoDialog from "@/components/forms/ViewHistoricoDialog";
import { usePagination } from "@/hooks/usePagination";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";

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
  const [searchParams, setSearchParams] = useSearchParams();
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
  const reportPedidos = useReportPedidos();
  const reportProdutos = useReportProdutos();
  const reportTempoResposta = useReportTempoResposta();
  const reportConversao = useReportConversao();

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
  
  // Estado para aba ativa na página unificada - lê da query string ou usa padrão
  const [activeUnifiedTab, setActiveUnifiedTab] = useState(() => {
    const tabFromQuery = searchParams.get('tab');
    return tabFromQuery && ['analytics', 'relatorios', 'historico'].includes(tabFromQuery) 
      ? tabFromQuery 
      : 'analytics';
  });
  
  // Atualizar aba quando mudar na query string
  useEffect(() => {
    const tabFromQuery = searchParams.get('tab');
    if (tabFromQuery && ['analytics', 'relatorios', 'historico'].includes(tabFromQuery)) {
      setActiveUnifiedTab(tabFromQuery);
    }
  }, [searchParams]);
  
  // Atualizar query string quando mudar a aba
  const handleTabChange = useCallback((value: string) => {
    setActiveUnifiedTab(value);
    setSearchParams({ tab: value }, { replace: true });
  }, [setSearchParams]);
  
  // Hooks para Analytics
  const { metricas, topProdutos, performanceFornecedores, tendenciasMensais, isLoading: isLoadingAnalytics } = useAnalytics({
    startDate,
    endDate,
    selectedFornecedores,
    selectedProdutos
  });
  const { insights, isGenerating: isGeneratingInsights, lastGenerated, generateInsights } = useInsights();
  
  // Estados para Histórico
  const [historicoSearchTerm, setHistoricoSearchTerm] = useState("");
  const [historicoTipoFilter, setHistoricoTipoFilter] = useState("all");
  const [historicoUsuarioFilter, setHistoricoUsuarioFilter] = useState("all");
  const [historicoValorMin, setHistoricoValorMin] = useState("");
  const [historicoValorMax, setHistoricoValorMax] = useState("");
  const [historicoEconomiaMin, setHistoricoEconomiaMin] = useState("");
  const [historicoDataInicio, setHistoricoDataInicio] = useState<Date>();
  const [historicoDataFim, setHistoricoDataFim] = useState<Date>();
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const { paginate: paginateHistorico } = usePagination<any>({ initialItemsPerPage: 10 });

  // Detecção de mobile usando hook centralizado
  const isMobile = useIsMobile();
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Callbacks memoizados para navegação do carousel
  const handlePrevCard = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCardIndex((prev) => (prev === 0 ? 3 : prev - 1));
  }, []);

  const handleNextCard = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveCardIndex((prev) => (prev === 3 ? 0 : prev + 1));
  }, []);

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
  }, {
    titulo: "Análise de Pedidos",
    descricao: "Volume de pedidos, valores, status e taxa de entrega por período para gestão operacional",
    tipo: "pedidos",
    icone: ShoppingCart,
    formato: ["PDF", "Excel"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
    categoria: 'operacional',
    prioridade: 'alta',
    tempoEstimado: '1-2 min'
  }, {
    titulo: "Análise de Produtos",
    descricao: "Produtos mais cotados, variação de preços, tendências e economia potencial por produto",
    tipo: "produtos",
    icone: Package,
    formato: ["PDF", "Excel"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
    categoria: 'operacional',
    prioridade: 'media',
    tempoEstimado: '1-2 min'
  }, {
    titulo: "Tempo de Resposta",
    descricao: "Performance dos fornecedores em tempo de resposta às cotações para otimização do processo",
    tipo: "tempo-resposta",
    icone: Timer,
    formato: ["PDF", "Excel"],
    periodo: "Mensal",
    ultimaAtualizacao: new Date().toLocaleDateString('pt-BR'),
    categoria: 'operacional',
    prioridade: 'media',
    tempoEstimado: '1-2 min'
  }, {
    titulo: "Taxa de Conversão",
    descricao: "Análise da conversão de cotações em pedidos, ROI e eficácia do processo de compras",
    tipo: "conversao",
    icone: Target,
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
      const [quotesResult, ordersResult, suppliersResult, productsResult] = await Promise.all([
        supabase.from("quotes")
          .select("id, status, data_inicio, data_fim, quote_suppliers(valor_oferecido, supplier_id), quote_items(product_id)")
          .gte("data_inicio", startDateStr)
          .lte("data_fim", endDateStr),
        supabase.from("orders")
          .select("id, order_date, total_value, status")
          .gte("order_date", startDateStr)
          .lte("order_date", endDateStr),
        supabase.from("suppliers").select("id, name"),
        supabase.from("products").select("id, name, category")
      ]);
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
      
      // Calcular valores totais e médios
      const totalPedidos = orders.reduce((acc, order) => acc + Number(order.total_value || 0), 0);
      const valorMedioPedido = orders.length > 0 ? totalPedidos / orders.length : 0;
      const economiaPercentual = totalPedidos > 0 ? metricsData.economiaTotal / totalPedidos * 100 : 0;
      
      // Filtrar fornecedores que participaram de cotações no período
      const fornecedoresIdsNasQuotes = new Set<string>();
      quotes.forEach((q: any) => {
        if (q.quote_suppliers) {
          q.quote_suppliers.forEach((qs: any) => {
            if (qs.supplier_id) {
              fornecedoresIdsNasQuotes.add(qs.supplier_id);
            }
          });
        }
      });
      const fornecedoresAtivosNoPeriodo = Array.from(fornecedoresIdsNasQuotes).length;
      
      // Filtrar produtos que foram cotados no período
      const produtosIdsNasQuotes = new Set<string>();
      quotes.forEach((q: any) => {
        if (q.quote_items) {
          q.quote_items.forEach((qi: any) => {
            if (qi.product_id) {
              produtosIdsNasQuotes.add(qi.product_id);
            }
          });
        }
      });
      const produtosCotadosNoPeriodo = Array.from(produtosIdsNasQuotes).length;
      
      // Formatar valores com moeda brasileira
      const economiaTotalFormatada = metricsData.economiaTotal > 0
        ? metricsData.economiaTotal.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        : 'R$ 0,00';
      
      setEstatisticasGerais({
        economiaTotal: economiaTotalFormatada,
        economiaPercentual: `${economiaPercentual.toFixed(1)}%`,
        cotacoesRealizadas: quotes.length,
        fornecedoresAtivos: fornecedoresAtivosNoPeriodo,
        produtosCotados: produtosCotadosNoPeriodo,
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
  
  // Carregar estatísticas apenas na primeira montagem ou quando as datas mudarem
  const hasLoadedStatistics = useRef(false);
  const lastStartDate = useRef<Date | undefined>();
  const lastEndDate = useRef<Date | undefined>();
  useEffect(() => {
    if (user) {
      // Verificar se as datas mudaram
      const datesChanged = 
        lastStartDate.current?.getTime() !== startDate?.getTime() ||
        lastEndDate.current?.getTime() !== endDate?.getTime();
      
      if (!hasLoadedStatistics.current || datesChanged) {
        loadStatistics();
        hasLoadedStatistics.current = true;
        lastStartDate.current = startDate;
        lastEndDate.current = endDate;
      }
    }
  }, [user, startDate, endDate]); // Removido loadStatistics das dependências para evitar re-execuções

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
      let dataToExport: any[] = [];
      
      // Gerar dados usando hooks específicos (mesmo método da visualização)
      switch (reportType) {
        case 'economia':
          dataToExport = await reportEconomia.generateReport(startDate, endDate);
          break;
        case 'fornecedores':
          dataToExport = await reportFornecedores.generateReport(startDate, endDate);
          break;
        case 'comparativo':
          dataToExport = await reportComparativo.generateReport(startDate, endDate);
          break;
        case 'eficiencia':
          dataToExport = await reportEficiencia.generateReport(startDate, endDate);
          break;
        case 'pedidos':
          dataToExport = await reportPedidos.generateReport(startDate, endDate);
          break;
        case 'produtos':
          dataToExport = await reportProdutos.generateReport(startDate, endDate);
          break;
        case 'tempo-resposta':
          dataToExport = await reportTempoResposta.generateReport(startDate, endDate);
          break;
        case 'conversao':
          dataToExport = await reportConversao.generateReport(startDate, endDate);
          break;
        default:
          toast({
            title: "Tipo de relatório inválido",
            description: "Selecione um tipo de relatório válido",
            variant: "destructive"
          });
          return;
      }
      
      if (!dataToExport || dataToExport.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há dados para o período selecionado",
          variant: "destructive"
        });
        return;
      }
      
      const timestamp = new Date().toISOString().slice(0, 10);
      const reportTitle = relatoriosDisponiveis.find(r => r.tipo === reportType)?.titulo || reportType;
      const baseFilename = `relatorio_${reportType}_${timestamp}`;
      
      // Função helper para formatar nome da coluna (usando mesmo mapeamento da função principal)
      const formatHeaderName = (key: string): string => {
        const columnMap: Record<string, string> = {
          periodo: 'Período',
          totalCotacoes: 'Total de Cotações',
          economiaGerada: 'Economia Gerada',
          economiaPercentual: 'Economia (%)',
          melhorFornecedor: 'Melhor Fornecedor',
          maiorEconomia: 'Maior Economia',
          nome: 'Nome',
          cotacoesVencidas: 'Cotações Vencidas',
          taxaVitoria: 'Taxa de Vitória',
          valorMedioOfertas: 'Valor Médio',
          tempoMedioResposta: 'Tempo Médio Resposta',
          score: 'Score',
          produto: 'Produto',
          categoria: 'Categoria',
          cotacoes: 'Cotações',
          menorPreco: 'Menor Preço',
          maiorPreco: 'Maior Preço',
          precoMedio: 'Preço Médio',
          variacao: 'Variação (%)',
          economiaMedia: 'Economia Média',
          fornecedorMaisBarato: 'Fornecedor Mais Barato',
          cotacoesIniciadas: 'Cotações Iniciadas',
          cotacoesFinalizadas: 'Cotações Finalizadas',
          taxaConversao: 'Taxa de Conversão (%)',
          tempoMedioCotacao: 'Tempo Médio (dias)',
          fornecedoresPorCotacao: 'Fornecedores/Cotação',
          economiaTotal: 'Economia Total',
          roi: 'ROI (%)',
          // Novos campos para relatório de pedidos
          totalPedidos: 'Total de Pedidos',
          pedidosEntregues: 'Pedidos Entregues',
          pedidosPendentes: 'Pedidos Pendentes',
          pedidosCancelados: 'Pedidos Cancelados',
          taxaEntrega: 'Taxa de Entrega (%)',
          fornecedorFrequente: 'Fornecedor Mais Frequente',
          // Novos campos para relatório de produtos
          valorMinimo: 'Valor Mínimo',
          valorMaximo: 'Valor Máximo',
          variacaoPreco: 'Variação de Preço (%)',
          economiaPotencial: 'Economia Potencial',
          tendencia: 'Tendência',
          // Novos campos para relatório de tempo de resposta
          fornecedor: 'Fornecedor',
          respostasRecebidas: 'Respostas Recebidas',
          tempoMinimo: 'Tempo Mínimo (dias)',
          tempoMaximo: 'Tempo Máximo (dias)',
          taxaResposta: 'Taxa de Resposta (%)',
          status: 'Status',
          // Novos campos para relatório de conversão
          pedidosGerados: 'Pedidos Gerados',
          valorCotacoes: 'Valor das Cotações',
          valorPedidos: 'Valor dos Pedidos'
        };
        return columnMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
      };
      
      // Obter headers e preparar dados
      const headers = Object.keys(dataToExport[0] || {});
      
      if (format === 'pdf') {
        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();
        
        // Cabeçalho
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(reportTitle, 20, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
        
        // Preparar tabela
        let y = 45;
        const margin = 20;
        const colWidth = (170) / headers.length;
        const rowHeight = 8;
        
        // Headers da tabela
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, 170, rowHeight, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        headers.forEach((header, index) => {
          const headerText = formatHeaderName(header);
          doc.text(headerText.substring(0, 25), margin + 2 + (index * colWidth), y + 5);
        });
        
        // Linhas de dados
        doc.setFont('helvetica', 'normal');
        y += rowHeight;
        
        dataToExport.forEach((row) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          headers.forEach((header, index) => {
            const value = row[header];
            let cellValue = '-';
            if (value !== null && value !== undefined && value !== '') {
              cellValue = String(value);
            }
            doc.text(cellValue.substring(0, 25), margin + 2 + (index * colWidth), y + 5);
          });
          y += 6;
        });
        
        doc.save(`${baseFilename}.pdf`);
        
      } else if (format === 'excel') {
        const XLSX = await import('xlsx');
        const { saveAs } = await import('file-saver');
        
        // Criar workbook
        const workbook = XLSX.utils.book_new();
        
        // Converter dados para worksheet com formatação
        const worksheetData = [
          headers.map(h => formatHeaderName(h)), // Header row
          ...dataToExport.map(row => 
            headers.map(header => {
              const value = row[header];
              if (value === null || value === undefined || value === '') return '-';
              // Formatar valores numéricos e monetários se necessário
              if (typeof value === 'number') {
                return value;
              }
              return String(value);
            })
          )
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        XLSX.utils.book_append_sheet(workbook, worksheet, reportTitle.substring(0, 31));
        
        // Salvar arquivo
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${baseFilename}.xlsx`);
      }
      
      toast({
        title: "Download concluído",
        description: `Relatório ${reportTitle} baixado com sucesso`
      });
      
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível gerar o relatório. Verifique o console para mais detalhes.",
        variant: "destructive"
      });
    }
  }, [startDate, endDate, selectedReportType, reportEconomia, reportFornecedores, reportComparativo, reportEficiencia, reportPedidos, reportProdutos, reportTempoResposta, reportConversao, relatoriosDisponiveis, toast]);
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
          const economiaData = await reportEconomia.generateReport(startDate, endDate);
          setReportData(economiaData);
          break;
        case 'fornecedores':
          const fornecedoresData = await reportFornecedores.generateReport(startDate, endDate);
          setReportData(fornecedoresData);
          break;
        case 'comparativo':
          const comparativoData = await reportComparativo.generateReport(startDate, endDate);
          setReportData(comparativoData);
          break;
        case 'eficiencia':
          const eficienciaData = await reportEficiencia.generateReport(startDate, endDate);
          setReportData(eficienciaData);
          break;
        case 'pedidos':
          const pedidosData = await reportPedidos.generateReport(startDate, endDate);
          setReportData(pedidosData);
          break;
        case 'produtos':
          const produtosData = await reportProdutos.generateReport(startDate, endDate);
          setReportData(produtosData);
          break;
        case 'tempo-resposta':
          const tempoRespostaData = await reportTempoResposta.generateReport(startDate, endDate);
          setReportData(tempoRespostaData);
          break;
        case 'conversao':
          const conversaoData = await reportConversao.generateReport(startDate, endDate);
          setReportData(conversaoData);
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
  }, [startDate, endDate, selectedReportType, toast, reportEconomia, reportFornecedores, reportComparativo, reportEficiencia, reportPedidos, reportProdutos, reportTempoResposta, reportConversao]);

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

  // Funções de formatação para visualização dos relatórios
  const formatColumnName = useCallback((key: string): string => {
    const columnMap: Record<string, string> = {
      periodo: 'Período',
      totalCotacoes: 'Total de Cotações',
      economiaGerada: 'Economia Gerada',
      economiaPercentual: 'Economia (%)',
      melhorFornecedor: 'Melhor Fornecedor',
      maiorEconomia: 'Maior Economia',
      nome: 'Nome',
      cotacoesVencidas: 'Cotações Vencidas',
      taxaVitoria: 'Taxa de Vitória',
      valorMedioOfertas: 'Valor Médio',
      tempoMedioResposta: 'Tempo Médio Resposta',
      score: 'Score',
      produto: 'Produto',
      categoria: 'Categoria',
      cotacoes: 'Cotações',
      menorPreco: 'Menor Preço',
      maiorPreco: 'Maior Preço',
      precoMedio: 'Preço Médio',
      variacao: 'Variação (%)',
      economiaMedia: 'Economia Média',
      fornecedorMaisBarato: 'Fornecedor Mais Barato',
      cotacoesIniciadas: 'Cotações Iniciadas',
      cotacoesFinalizadas: 'Cotações Finalizadas',
      taxaConversao: 'Taxa de Conversão (%)',
      tempoMedioCotacao: 'Tempo Médio (dias)',
      fornecedoresPorCotacao: 'Fornecedores/Cotação',
      economiaTotal: 'Economia Total',
      roi: 'ROI (%)',
      // Novos campos para relatório de pedidos
      totalPedidos: 'Total de Pedidos',
      valorTotal: 'Valor Total',
      valorMedio: 'Valor Médio',
      pedidosEntregues: 'Pedidos Entregues',
      pedidosPendentes: 'Pedidos Pendentes',
      pedidosCancelados: 'Pedidos Cancelados',
      taxaEntrega: 'Taxa de Entrega (%)',
      fornecedorFrequente: 'Fornecedor Mais Frequente',
      // Novos campos para relatório de produtos
      valorMinimo: 'Valor Mínimo',
      valorMaximo: 'Valor Máximo',
      variacaoPreco: 'Variação de Preço (%)',
      economiaPotencial: 'Economia Potencial',
      tendencia: 'Tendência',
      // Novos campos para relatório de tempo de resposta
      fornecedor: 'Fornecedor',
      respostasRecebidas: 'Respostas Recebidas',
      tempoMinimo: 'Tempo Mínimo (dias)',
      tempoMaximo: 'Tempo Máximo (dias)',
      taxaResposta: 'Taxa de Resposta (%)',
      status: 'Status',
      // Novos campos para relatório de conversão
      pedidosGerados: 'Pedidos Gerados',
      valorCotacoes: 'Valor das Cotações',
      valorPedidos: 'Valor dos Pedidos'
    };
    return columnMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
  }, []);

  const formatCellValue = useCallback((key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">-</span>;
    }

    // Formatação para valores monetários
    if (key.includes('valor') || key.includes('preco') || key.includes('economia') || key.includes('oferta')) {
      if (typeof value === 'number') {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }

    // Formatação para porcentagens
    if (key.includes('percentual') || key.includes('taxa') || key.includes('variacao') || key.includes('roi') || key.includes('conversao')) {
      if (typeof value === 'number') {
        return `${value.toFixed(1)}%`;
      }
      if (typeof value === 'string' && value.includes('%')) {
        return value;
      }
    }

    // Formatação para números inteiros
    if (key.includes('total') || key.includes('cotacoes') || key.includes('score') || key === 'cotacoesVencidas') {
      if (typeof value === 'number') {
        return value.toLocaleString('pt-BR');
      }
    }

    // Formatação para números decimais (dias, etc)
    if (key.includes('tempo') || (key.includes('medio') && !key.includes('preco') && !key.includes('valor'))) {
      if (typeof value === 'number') {
        return `${value.toFixed(1)} dias`;
      }
      if (typeof value === 'string' && (value.includes('dias') || value.includes('dia'))) {
        return value;
      }
    }
    
    // Formatação para fornecedoresPorCotacao
    if (key.includes('fornecedoresPorCotacao')) {
      if (typeof value === 'number') {
        return value.toFixed(1);
      }
    }

    // Formatação para tendência
    if (key === 'tendencia') {
      const tendenciaLabels: Record<string, string> = {
        'alta': '⬆️ Alta',
        'baixa': '⬇️ Baixa',
        'estavel': '➡️ Estável'
      };
      return tendenciaLabels[value] || value;
    }

    // Formatação para status
    if (key === 'status') {
      const statusLabels: Record<string, string> = {
        'excelente': '✅ Excelente',
        'bom': '👍 Bom',
        'regular': '⚡ Regular',
        'ruim': '❌ Ruim'
      };
      return statusLabels[value] || value;
    }

    // Retornar string formatada
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR');
    }

    return String(value);
  }, []);

  // Função para carregar histórico
  const loadHistorico = useCallback(async () => {
    try {
      setLoadingHistorico(true);
      if (!user?.id) {
        setHistorico([]);
        setLoadingHistorico(false);
        return;
      }

      const { data: companyData, error: companyError } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (companyError || !companyData?.company_id) {
        console.error("Erro ao buscar empresa:", companyError);
        setHistorico([]);
        setLoadingHistorico(false);
        return;
      }

      // Buscar dados do activity_log
      const { data: activityData, error: activityError } = await supabase
        .from("activity_log")
        .select("*")
        .eq("company_id", companyData.company_id)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (activityError) {
        console.error("Erro ao buscar activity_log:", activityError);
      }

      let formattedData: any[] = [];
      
      // Se há dados no activity_log, usar eles
      if (activityData && activityData.length > 0) {
        formattedData = activityData.map(item => ({
          id: item.id,
          tipo: item.tipo,
          acao: item.acao,
          detalhes: item.detalhes,
          data: format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
          usuario: user?.email || "Usuário",
          valor: item.valor ? `R$ ${parseFloat(item.valor.toString()).toFixed(2).replace(".", ",")}` : "",
          economia: item.economia ? `${parseFloat(item.economia.toString()).toFixed(2)}%` : "",
          created_at: item.created_at
        }));
      } else {
        // Se não há dados no activity_log, buscar dados históricos de outras tabelas
        console.log("Nenhum dado no activity_log, buscando dados históricos de outras tabelas...");
        
        // Buscar cotações recentes
        const { data: quotesData } = await supabase
          .from("quotes")
          .select("id, status, data_inicio, created_at, company_id")
          .eq("company_id", companyData.company_id)
          .order("data_inicio", { ascending: false })
          .limit(100);

        // Buscar pedidos recentes
        const { data: ordersData } = await supabase
          .from("orders")
          .select("id, status, supplier_name, total_value, created_at, company_id")
          .eq("company_id", companyData.company_id)
          .order("created_at", { ascending: false })
          .limit(100);

        // Buscar produtos recentes
        const { data: productsData } = await supabase
          .from("products")
          .select("id, name, created_at, company_id")
          .eq("company_id", companyData.company_id)
          .order("created_at", { ascending: false })
          .limit(50);

        // Buscar fornecedores recentes
        const { data: suppliersData } = await supabase
          .from("suppliers")
          .select("id, name, created_at, company_id")
          .eq("company_id", companyData.company_id)
          .order("created_at", { ascending: false })
          .limit(50);

        // Combinar todos os dados históricos
        const allHistoricalData: any[] = [];

        // Adicionar cotações
        if (quotesData) {
          quotesData.forEach(quote => {
            const dateToUse = quote.data_inicio || quote.created_at;
            allHistoricalData.push({
              id: quote.id,
              tipo: "cotacao",
              acao: `Cotação ${quote.status === "concluida" || quote.status === "finalizada" ? "finalizada" : quote.status === "ativa" ? "criada" : quote.status}`,
              detalhes: `Cotação ${quote.status === "concluida" || quote.status === "finalizada" ? "finalizada" : quote.status === "ativa" ? "criada" : quote.status}`,
              data: format(new Date(dateToUse), "dd/MM/yyyy HH:mm", { locale: ptBR }),
              usuario: user?.email || "Usuário",
              valor: "",
              economia: "",
              created_at: dateToUse
            });
          });
        }

        // Adicionar pedidos
        if (ordersData) {
          ordersData.forEach(order => {
            allHistoricalData.push({
              id: order.id,
              tipo: "pedido",
              acao: `Pedido ${order.status === "pendente" ? "criado" : order.status}`,
              detalhes: `Pedido para ${order.supplier_name || "Fornecedor"} - ${order.status}`,
              data: format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
              usuario: user?.email || "Usuário",
              valor: order.total_value ? `R$ ${parseFloat(order.total_value.toString()).toFixed(2).replace(".", ",")}` : "",
              economia: "",
              created_at: order.created_at
            });
          });
        }

        // Adicionar produtos
        if (productsData) {
          productsData.forEach(product => {
            allHistoricalData.push({
              id: product.id,
              tipo: "produto",
              acao: "Produto criado",
              detalhes: `Produto "${product.name}" adicionado ao catálogo`,
              data: format(new Date(product.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
              usuario: user?.email || "Usuário",
              valor: "",
              economia: "",
              created_at: product.created_at
            });
          });
        }

        // Adicionar fornecedores
        if (suppliersData) {
          suppliersData.forEach(supplier => {
            allHistoricalData.push({
              id: supplier.id,
              tipo: "fornecedor",
              acao: "Fornecedor criado",
              detalhes: `Fornecedor "${supplier.name}" adicionado`,
              data: format(new Date(supplier.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
              usuario: user?.email || "Usuário",
              valor: "",
              economia: "",
              created_at: supplier.created_at
            });
          });
        }

        // Ordenar por data mais recente
        formattedData = allHistoricalData.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      
      setHistorico(formattedData);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar o histórico de atividades.",
        variant: "destructive"
      });
      setHistorico([]);
    } finally {
      setLoadingHistorico(false);
    }
  }, [user, toast]);

  // Carregar histórico apenas quando a aba de histórico for ativada pela primeira vez
  const hasLoadedHistorico = useRef(false);
  const lastHistoricoTab = useRef<string | null>(null);
  useEffect(() => {
    if (user && activeUnifiedTab === "historico") {
      // Só carregar se ainda não carregou ou se mudou de aba
      if (!hasLoadedHistorico.current || lastHistoricoTab.current !== activeUnifiedTab) {
        loadHistorico();
        hasLoadedHistorico.current = true;
        lastHistoricoTab.current = activeUnifiedTab;
      }
    } else {
      // Resetar quando sair da aba de histórico
      lastHistoricoTab.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeUnifiedTab]); // Removido loadHistorico das dependências para evitar re-execuções

  // Helper functions para renderizar Cards Relatórios (memoizadas inline)
  const renderRelatoriosCard1 = useMemo(() => (
    <Card className="bg-emerald-600 dark:bg-[#1C1F26] border border-emerald-500/30 dark:border-gray-800 rounded-lg hover:border-emerald-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-700/50 dark:bg-gray-800">
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
            {estatisticasGerais.economiaTotal}
          </span>
          {estatisticasGerais.economiaPercentual !== "0%" && (
            <Badge className="bg-emerald-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
              <TrendingUp className="w-3 h-3" />
              {estatisticasGerais.economiaPercentual}
            </Badge>
          )}
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Total economizado:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {estatisticasGerais.economiaTotal}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>Percentual:</span>
            <span className="font-medium">{estatisticasGerais.economiaPercentual}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [estatisticasGerais]);

  const renderRelatoriosCard2 = useMemo(() => (
    <Card className="bg-purple-600 dark:bg-[#1C1F26] border border-purple-500/30 dark:border-gray-800 rounded-lg hover:border-purple-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-purple-700/50 dark:bg-gray-800">
            <FileText className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Cotações
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {estatisticasGerais.cotacoesRealizadas}
          </span>
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Total de cotações:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {estatisticasGerais.cotacoesRealizadas}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>Pedidos gerados:</span>
            <span className="font-medium">{estatisticasGerais.pedidosGerados}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [estatisticasGerais]);

  const renderRelatoriosCard3 = useMemo(() => (
    <Card className="bg-blue-600 dark:bg-[#1C1F26] border border-blue-500/30 dark:border-gray-800 rounded-lg hover:border-blue-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-700/50 dark:bg-gray-800">
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
            {estatisticasGerais.fornecedoresAtivos}
          </span>
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Ativos no período:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {estatisticasGerais.fornecedoresAtivos}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>Participaram de cotações</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [estatisticasGerais]);

  const renderRelatoriosCard4 = useMemo(() => (
    <Card className="bg-orange-600 dark:bg-[#1C1F26] border border-orange-500/30 dark:border-gray-800 rounded-lg hover:border-orange-400 dark:hover:border-gray-700 transition-colors duration-200">
      <CardHeader className="pb-3 border-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-orange-700/50 dark:bg-gray-800">
            <Package className="h-4 w-4 text-white dark:text-gray-400" />
          </div>
          <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
            Produtos
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-bold tracking-tight text-white dark:text-white">
            {estatisticasGerais.produtosCotados}
          </span>
        </div>
        <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
          <div className="flex items-center justify-between">
            <span>Cotados no período:</span>
            <span className="font-medium text-white dark:text-gray-300">
              {estatisticasGerais.produtosCotados}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
            <span>Produtos únicos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  ), [estatisticasGerais]);

  // Helper functions para renderizar Cards Analytics (memoizadas inline)
  const renderAnalyticsCard1 = useMemo(() => {
    if (!metricas[0]) return null;
    const metrica = metricas[0];
    return (
      <Card className="bg-emerald-600 dark:bg-[#1C1F26] border border-emerald-500/30 dark:border-gray-800 rounded-lg hover:border-emerald-400 dark:hover:border-gray-700 transition-colors duration-200">
        <CardHeader className="pb-3 border-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-700/50 dark:bg-gray-800">
              <DollarSign className="h-4 w-4 text-white dark:text-gray-400" />
            </div>
            <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
              {metrica.titulo}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-0">
          <div className="flex items-baseline gap-2.5">
            <span className="text-xl font-bold tracking-tight text-white dark:text-white truncate">
              {metrica.valor}
            </span>
            {metrica.variacao && (
              <Badge className="bg-emerald-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
                {metrica.tipo === 'negativo' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {metrica.variacao}
              </Badge>
            )}
          </div>
          <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <span>{metrica.descricao}:</span>
              <span className="font-medium text-white dark:text-gray-300">
                {metrica.valor}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [metricas]);

  const renderAnalyticsCard2 = useMemo(() => {
    if (!metricas[1]) return null;
    const metrica = metricas[1];
    return (
      <Card className="bg-blue-600 dark:bg-[#1C1F26] border border-blue-500/30 dark:border-gray-800 rounded-lg hover:border-blue-400 dark:hover:border-gray-700 transition-colors duration-200">
        <CardHeader className="pb-3 border-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-700/50 dark:bg-gray-800">
              <Clock className="h-4 w-4 text-white dark:text-gray-400" />
            </div>
            <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
              {metrica.titulo}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-0">
          <div className="flex items-baseline gap-2.5">
            <span className="text-xl font-bold tracking-tight text-white dark:text-white truncate">
              {metrica.valor}
            </span>
            {metrica.variacao && (
              <Badge className="bg-blue-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
                {metrica.tipo === 'negativo' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {metrica.variacao}
              </Badge>
            )}
          </div>
          <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <span>{metrica.descricao}:</span>
              <span className="font-medium text-white dark:text-gray-300">
                {metrica.valor}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [metricas]);

  const renderAnalyticsCard3 = useMemo(() => {
    if (!metricas[2]) return null;
    const metrica = metricas[2];
    return (
      <Card className="bg-purple-600 dark:bg-[#1C1F26] border border-purple-500/30 dark:border-gray-800 rounded-lg hover:border-purple-400 dark:hover:border-gray-700 transition-colors duration-200">
        <CardHeader className="pb-3 border-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-700/50 dark:bg-gray-800">
              <CheckCircle className="h-4 w-4 text-white dark:text-gray-400" />
            </div>
            <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
              {metrica.titulo}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-0">
          <div className="flex items-baseline gap-2.5">
            <span className="text-xl font-bold tracking-tight text-white dark:text-white truncate">
              {metrica.valor}
            </span>
            {metrica.variacao && (
              <Badge className="bg-purple-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
                {metrica.tipo === 'negativo' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {metrica.variacao}
              </Badge>
            )}
          </div>
          <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <span>{metrica.descricao}:</span>
              <span className="font-medium text-white dark:text-gray-300">
                {metrica.valor}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [metricas]);

  const renderAnalyticsCard4 = useMemo(() => {
    if (!metricas[3]) return null;
    const metrica = metricas[3];
    return (
      <Card className="bg-orange-600 dark:bg-[#1C1F26] border border-orange-500/30 dark:border-gray-800 rounded-lg hover:border-orange-400 dark:hover:border-gray-700 transition-colors duration-200">
        <CardHeader className="pb-3 border-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-700/50 dark:bg-gray-800">
              <Users className="h-4 w-4 text-white dark:text-gray-400" />
            </div>
            <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
              {metrica.titulo}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 pt-0">
          <div className="flex items-baseline gap-2.5">
            <span className="text-xl font-bold tracking-tight text-white dark:text-white truncate">
              {metrica.valor}
            </span>
            {metrica.variacao && (
              <Badge className="bg-orange-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
                {metrica.tipo === 'negativo' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                {metrica.variacao}
              </Badge>
            )}
          </div>
          <div className="text-xs text-white/80 dark:text-gray-400 mt-2.5 pt-2.5 border-t border-white/10 dark:border-gray-700/30">
            <div className="flex items-center justify-between">
              <span>{metrica.descricao}:</span>
              <span className="font-medium text-white dark:text-gray-300">
                {metrica.valor}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }, [metricas]);

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
    return <PageWrapper><LoadingSkeleton /></PageWrapper>;
  }
  return (
    <PageWrapper>
      <div className="page-container">
      {/* MetricCards padronizados */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
        <MetricCard
          title="Economia Total"
          value={estatisticasGerais.economiaTotal}
          icon={DollarSign}
          variant="success"
          trend={{
            value: estatisticasGerais.economiaPercentual,
            label: "do total",
            type: "positive"
          }}
        />
        <MetricCard
          title="Cotações"
          value={estatisticasGerais.cotacoesRealizadas}
          icon={FileText}
          variant="info"
          trend={{
            value: `${estatisticasGerais.pedidosGerados}`,
            label: "pedidos gerados",
            type: "neutral"
          }}
        />
        <MetricCard
          title="Fornecedores"
          value={estatisticasGerais.fornecedoresAtivos}
          icon={Building2}
          variant="default"
          trend={{
            value: `${estatisticasGerais.fornecedoresAtivos}`,
            label: "ativos no período",
            type: "neutral"
          }}
        />
        <MetricCard
          title="Produtos"
          value={estatisticasGerais.produtosCotados}
          icon={Package}
          variant="warning"
          trend={{
            value: `${estatisticasGerais.produtosCotados}`,
            label: "cotados no período",
            type: "neutral"
          }}
        />
      </div>

      {/* PageHeader */}
      <PageHeader
        title="Relatórios"
        description="Geração e análise de relatórios do sistema"
        icon={FileText}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPeriodDialogOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{dateRangeText}</span>
              <span className="sm:hidden">Período</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="hidden sm:flex">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button size="sm" onClick={handleExportAll} disabled={isGenerating} className="hidden sm:flex bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Exportar'}
            </Button>
          </div>
        }
      />

      {/* Dialog de Período */}
      <Dialog open={isPeriodDialogOpen} onOpenChange={setIsPeriodDialogOpen}>
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
          
      {/* Dialog de Filtros */}
      <Dialog open={isFiltersDialogOpen} onOpenChange={setIsFiltersDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-purple-50/80 via-violet-50/60 to-purple-50/40 backdrop-blur-sm relative overflow-hidden">
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

      {/* Progress Bar Melhorado */}
      {isGenerating && <Card className="border-blue-200 bg-blue-50 mb-6">
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

      {/* Tabs Unificadas - Analytics, Relatórios e Histórico */}
             <Tabs value={activeUnifiedTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800 h-auto">
          <TabsTrigger 
            value="analytics" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400 py-3"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
            <span className="sm:hidden">Analytics</span>
          </TabsTrigger>
          <TabsTrigger 
            value="relatorios" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400 py-3"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger 
            value="historico" 
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400 py-3"
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Histórico</span>
            <span className="sm:hidden">Histórico</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba Analytics */}
        <TabsContent value="analytics" className="space-y-6 mt-0">
          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <>
          {/* Métricas Principais */}
          {/* Desktop: Grid 2x2 ou 4 colunas | Mobile: Carousel com navegação integrada */}
          {isMobile ? (
            <div className="mb-8">
              {/* Card wrapper com navegação integrada no topo */}
              <div className="relative">
                {/* Navegação integrada no topo do card (parece ser parte do card) */}
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

                {/* Container do carousel */}
                <div className="relative overflow-hidden rounded-xl" style={{ minHeight: '180px' }}>
                  <div 
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ 
                      transform: `translateX(-${activeCardIndex * 100}%)`,
                    }}
                  >
                    <div className="w-full flex-shrink-0">
                      {renderAnalyticsCard1}
                    </div>
                    <div className="w-full flex-shrink-0">
                      {renderAnalyticsCard2}
                    </div>
                    <div className="w-full flex-shrink-0">
                      {renderAnalyticsCard3}
                    </div>
                    <div className="w-full flex-shrink-0">
                      {renderAnalyticsCard4}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
              {metricas.map((metrica, index) => {
                const icons = [DollarSign, Clock, CheckCircle, Users];
                const Icon = icons[index] || DollarSign;
                const cardColors = ['bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-orange-600'];
                const bgColor = cardColors[index] || cardColors[0];
                
                return (
                  <Card key={metrica.titulo} className={`group relative overflow-hidden ${bgColor} dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300`}>
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
                        <Icon className="h-4 w-4 text-white/70 dark:text-gray-400" />
                        <CardTitle className="text-white/90 dark:text-gray-300 text-sm font-medium">
                          {metrica.titulo}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2.5 z-10 relative">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl font-semibold tracking-tight text-white dark:text-white truncate">
                          {metrica.valor}
                        </span>
                        {metrica.variacao && (
                          <Badge className="bg-white/20 text-white font-semibold border-0">
                            {metrica.tipo === 'negativo' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                            {metrica.variacao}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                        <div className="flex items-center justify-between">
                          <span>{metrica.descricao}:</span>
                          <span className="font-medium text-white dark:text-gray-300">
                            {metrica.valor}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

      {/* Performance Charts */}
      <PerformanceCharts 
        performanceFornecedores={performanceFornecedores}
        tendenciasMensais={tendenciasMensais}
      />

      {/* Insights Panel */}
      <InsightsPanel
        insights={insights}
        isGenerating={isGeneratingInsights}
        lastGenerated={lastGenerated}
        onGenerate={() => {
          const analyticsData = {
            metricas: {
              taxaEconomia: parseFloat(metricas[0]?.valor.replace('%', '') || '0'),
              tempoMedioCotacao: parseFloat(metricas[1]?.valor.replace(' dias', '') || '0'),
              taxaResposta: parseFloat(metricas[2]?.valor.replace('%', '') || '0'),
              valorMedioPedido: parseFloat(metricas[3]?.valor.replace(/[^\d,]/g, '').replace(',', '.') || '0'),
            },
            topProdutos: topProdutos.map(p => ({
              nome: p.produto,
              economia: parseFloat(p.economia.replace('%', '') || '0'),
              cotacoes: parseInt(p.cotacoes.toString()),
            })),
            performanceFornecedores: performanceFornecedores.map(f => ({
              nome: f.fornecedor,
              score: f.score,
              cotacoes: f.cotacoes,
              taxaResposta: parseFloat(f.tempo.replace(/[^\d,]/g, '').replace(',', '.') || '0'),
            })),
            tendenciasMensais: tendenciasMensais.map(t => ({
              mes: t.mes,
              cotacoes: t.cotacoes,
              economia: parseFloat(t.economia.toString()),
            })),
          };
          generateInsights(analyticsData);
        }}
      />
            </>
          )}
        </TabsContent>

        {/* Aba Relatórios */}
        <TabsContent value="relatorios" className="space-y-6 mt-0">
          {/* Statistics Cards - Inspiração Dashboard Statistics Card 2 */}
          {/* Desktop: Grid 2x2 ou 4 colunas | Mobile: Carousel com navegação integrada */}
          {isMobile ? (
            <div className="mb-8">
              {/* Card wrapper com navegação integrada no topo */}
              <div className="relative">
                {/* Navegação integrada no topo do card (parece ser parte do card) */}
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

                {/* Container do carousel */}
                <div className="relative overflow-hidden rounded-xl" style={{ minHeight: '180px' }}>
                  <div 
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ 
                      transform: `translateX(-${activeCardIndex * 100}%)`,
                    }}
                  >
                    <div className="w-full flex-shrink-0">
                      {renderRelatoriosCard1}
                    </div>
                    <div className="w-full flex-shrink-0">
                      {renderRelatoriosCard2}
                    </div>
                    <div className="w-full flex-shrink-0">
                      {renderRelatoriosCard3}
                    </div>
                    <div className="w-full flex-shrink-0">
                      {renderRelatoriosCard4}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
              {/* Card 1: Economia */}
              <Card className="group relative overflow-hidden bg-emerald-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
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
                    {estatisticasGerais.economiaPercentual !== "0%" && (
                      <Badge className="bg-white/20 text-white font-semibold border-0">
                        <TrendingUp className="w-3 h-3" />
                        {estatisticasGerais.economiaPercentual}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span>Total economizado:</span>
                      <span className="font-medium text-white dark:text-gray-300">
                        {estatisticasGerais.economiaTotal}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                      <span>Percentual:</span>
                      <span className="font-medium">{estatisticasGerais.economiaPercentual}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Cotações */}
              <Card className="group relative overflow-hidden bg-purple-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
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
                  </div>
                  <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span>Total de cotações:</span>
                      <span className="font-medium text-white dark:text-gray-300">
                        {estatisticasGerais.cotacoesRealizadas}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                      <span>Pedidos gerados:</span>
                      <span className="font-medium">{estatisticasGerais.pedidosGerados}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Fornecedores */}
              <Card className="group relative overflow-hidden bg-blue-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
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
                  </div>
                  <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span>Ativos no período:</span>
                      <span className="font-medium text-white dark:text-gray-300">
                        {estatisticasGerais.fornecedoresAtivos}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                      <span>Participaram de cotações</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Produtos */}
              <Card className="group relative overflow-hidden bg-orange-600 dark:bg-[#1C1F26] border-0 shadow-lg dark:shadow-xl hover:shadow-2xl dark:hover:shadow-2xl rounded-xl transition-shadow duration-300">
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
                  </div>
                  <div className="text-xs text-white/80 dark:text-gray-400 mt-2 border-t border-white/20 dark:border-gray-700/30 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span>Cotados no período:</span>
                      <span className="font-medium text-white dark:text-gray-300">
                        {estatisticasGerais.produtosCotados}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                      <span>Produtos únicos</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

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
            ) : reportData && reportData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 dark:bg-gray-800/30">
                      {Object.keys(reportData[0] || {}).map(key => (
                        <TableHead key={key} className="font-semibold">
                          {formatColumnName(key)}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                        {Object.keys(row).map((key: string, i: number) => (
                          <TableCell key={i} className="px-4 py-3">
                            {formatCellValue(key, row[key])}
                          </TableCell>
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
        </TabsContent>

        {/* Aba Histórico */}
        <TabsContent value="historico" className="space-y-6 mt-0">
          {loadingHistorico ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Histórico de Atividades
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historico.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">Nenhuma atividade encontrada</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Buscar no histórico..."
                        value={historicoSearchTerm}
                        onChange={(e) => setHistoricoSearchTerm(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                    <div className="space-y-2">
                      {historico
                        .filter(item => 
                          item.acao?.toLowerCase().includes(historicoSearchTerm.toLowerCase()) ||
                          item.detalhes?.toLowerCase().includes(historicoSearchTerm.toLowerCase())
                        )
                        .slice(0, 50)
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => {
                              setSelectedItem(item);
                              setViewDialogOpen(true);
                            }}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Activity className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {item.acao}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {item.detalhes}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  {item.data}
                                </p>
                              </div>
                            </div>
                            {item.valor && (
                              <Badge variant="outline" className="ml-2 flex-shrink-0">
                                {item.valor}
                              </Badge>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ViewHistoricoDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        item={selectedItem}
      />
      </div>
    </PageWrapper>
  );
}