import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DateRangePicker } from "@/components/reports/DateRangePicker";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { useReports } from "@/hooks/useReports";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useInsights } from "@/hooks/useInsights";
import { InsightsPanel } from "@/components/analytics/InsightsPanel";
import { PerformanceCharts } from "@/components/analytics/PerformanceCharts";
import { 
  BarChart3, TrendingUp, TrendingDown, Calendar, Filter, Download, 
  DollarSign, Package, Building2, Target, Loader2, RefreshCw, 
  CheckCircle, Clock, Users 
} from "lucide-react";

const menuItems = [
  {
    title: "Home",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Produtos",
    url: "/produtos",
    icon: Package,
  },
  {
    title: "Fornecedores",
    url: "/fornecedores",
    icon: Building2,
  },
  {
    title: "Cotações",
    url: "/cotacoes",
    icon: Target,
  },
];

export default function Analytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { generateReport, progress, isGenerating } = useReports();

  // Use the analytics hook with real data
  const { metricas, topProdutos, performanceFornecedores, tendenciasMensais, isLoading } = useAnalytics({
    startDate,
    endDate,
    selectedFornecedores,
    selectedProdutos
  });

  // Use insights hook
  const { insights, isGenerating: isGeneratingInsights, lastGenerated, generateInsights } = useInsights();

  // Handler para gerar insights
  const handleGenerateInsights = useCallback(() => {
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
  }, [metricas, topProdutos, performanceFornecedores, tendenciasMensais, generateInsights]);

  const handleExportAnalytics = useCallback(async () => {
    try {
      await generateReport('analytics', {
        startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate || new Date(),
        fornecedores: selectedFornecedores,
        produtos: selectedProdutos,
        categorias: []
      }, 'pdf');
    } catch (error) {
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o relatório",
        variant: "destructive"
      });
    }
  }, [startDate, endDate, selectedFornecedores, selectedProdutos, generateReport, toast]);

  const applyDatePreset = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start);
    setEndDate(end);
    setIsDateDialogOpen(false);
  }, []);

  const handleRefresh = useCallback(() => {
    toast({
      title: "Dados atualizados",
      description: "Analytics recarregado com sucesso",
    });
  }, [toast]);

  const hasFilters = useMemo(() => 
    selectedFornecedores.length > 0 || selectedProdutos.length > 0, 
    [selectedFornecedores.length, selectedProdutos.length]
  );

  const dateRangeText = useMemo(() => {
    if (!startDate || !endDate) return 'Últimos 30 dias';
    return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
  }, [startDate, endDate]);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="page-container bg-gray-50/50 dark:bg-transparent">
      {/* Filters */}
      {isGenerating && (
        <Card className="border-blue-200 dark:border-blue-700/30 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-blue-700 font-medium">Gerando relatório...</span>
                  <span className="text-blue-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
          <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400">
            <Target className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Métricas Principais - Inspiração Dashboard Statistics Card 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
            {metricas.map((metrica, index) => {
              const icons = [DollarSign, Clock, CheckCircle, Users];
              const Icon = icons[index] || DollarSign;
              const cardColors = [
                'bg-emerald-600',
                'bg-blue-600',
                'bg-purple-600',
                'bg-orange-600'
              ];
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
                        <Badge className={`bg-white/20 text-white font-semibold border-0`}>
                          {metrica.tipo === 'negativo' && <TrendingDown className="w-3 h-3" />}
                          {metrica.tipo !== 'negativo' && <TrendingUp className="w-3 h-3" />}
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
                      {metrica.variacao && (
                        <div className="flex items-center justify-between mt-1.5 text-white/70 dark:text-gray-500">
                          <span>Variação:</span>
                          <span className={`font-medium ${metrica.tipo === 'negativo' ? 'text-red-300' : 'text-green-300'}`}>
                            {metrica.variacao}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tendência e Fornecedores - Grid Profissional 2 Colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4 mb-6">
            {/* Tendência de Economia */}
            <Card className="bg-white dark:bg-[#1C1F26] border-l-2 border-purple-500/60 dark:border-purple-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none sm:hover:shadow-md sm:dark:hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Tendência Mensal</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                {tendenciasMensais.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-10 w-10 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-2.5">
                    {tendenciasMensais.map(item => (
                    <div key={item.mes} className="flex items-center justify-between py-2 sm:py-2.5 border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 w-10 sm:w-12 flex-shrink-0">{item.mes}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{item.cotacoes} cotações</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">R$ {item.valor.toLocaleString('pt-BR')}</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">{item.economia.toFixed(1)}%</span>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance de Fornecedores */}
            <Card className="bg-white dark:bg-[#1C1F26] border-l-2 border-indigo-500/60 dark:border-indigo-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none sm:hover:shadow-md sm:dark:hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 pt-3 sm:pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <CardTitle className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Top Fornecedores</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                {performanceFornecedores.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-10 w-10 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum fornecedor encontrado</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-2.5">
                    {performanceFornecedores.slice(0, 4).map((fornecedor, idx) => (
                    <div key={fornecedor.fornecedor} className="flex items-center justify-between py-2 sm:py-2.5 border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 w-5 sm:w-6 flex-shrink-0">#{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{fornecedor.fornecedor}</div>
                          <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{fornecedor.cotacoes} cotações</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">{fornecedor.economia}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Score {fornecedor.score}</div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Produtos - Grid Profissional 2 Colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4">
            {topProdutos.length === 0 ? (
              <Card className="col-span-full bg-white dark:bg-[#1C1F26] border border-gray-200/60 dark:border-gray-700/30 shadow-sm">
                <CardContent className="p-6 text-center">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum produto encontrado no período selecionado</p>
                </CardContent>
              </Card>
            ) : (
              topProdutos.slice(0, 6).map((produto, index) => (
              <Card key={produto.produto} className="bg-white dark:bg-[#1C1F26] border-l-2 border-orange-500/60 dark:border-orange-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none sm:hover:shadow-md sm:dark:hover:shadow-lg transition-all duration-200">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-400 dark:text-gray-500 w-5 sm:w-6 flex-shrink-0">#{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate mb-1">{produto.produto}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{produto.cotacoes} cotações</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-gray-100 dark:border-gray-800/50">
                    <div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Valor Total</div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                        R$ {produto.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Taxa de Economia</div>
                      <div className="text-sm sm:text-base font-semibold text-green-600 dark:text-green-400">
                        {produto.economia}
                      </div>
                      <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                        R$ {produto.economiaTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          <PerformanceCharts 
            performanceFornecedores={performanceFornecedores}
            tendenciasMensais={tendenciasMensais}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 mt-6">
          <InsightsPanel
            insights={insights}
            isGenerating={isGeneratingInsights}
            lastGenerated={lastGenerated}
            onGenerate={handleGenerateInsights}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}