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
          {/* Métricas Principais - Minimalista */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {metricas.map((metrica, index) => {
              const icons = [DollarSign, Clock, CheckCircle, Users];
              const Icon = icons[index] || DollarSign;
              
              return (
                <Card key={metrica.titulo} className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm hover:shadow-md dark:shadow-none hover:border-gray-300 dark:hover:border-gray-600/40 transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center shadow-sm dark:shadow-none">
                          <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{metrica.titulo}</span>
                      </div>
                      {metrica.variacao && (
                        <span className={`text-xs font-medium ${
                          metrica.tipo === 'positivo' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {metrica.tipo === 'positivo' ? '↑' : '↓'} {metrica.variacao}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">{metrica.valor}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{metrica.descricao}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tendência e Fornecedores - Minimalista */}
          <div className="grid gap-5 lg:grid-cols-2 mb-6">
            {/* Tendência de Economia */}
            <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Tendência Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {tendenciasMensais.map(item => (
                    <div key={item.mes} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-8">{item.mes}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.cotacoes} cotações</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">R$ {item.valor.toLocaleString('pt-BR')}</div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">{item.economia}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance de Fornecedores */}
            <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Top Fornecedores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {performanceFornecedores.slice(0, 4).map((fornecedor, idx) => (
                    <div key={fornecedor.fornecedor} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-6">#{idx + 1}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{fornecedor.fornecedor}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{fornecedor.cotacoes} cotações</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">-{fornecedor.economia}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Score {fornecedor.score}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Produtos */}
          <Card className="bg-white dark:bg-[#1C1F26] border border-gray-300/80 dark:border-gray-700/30 shadow-sm dark:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Top Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {topProdutos.map((produto, index) => (
                  <div key={produto.produto} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-400 dark:text-gray-500 w-6">#{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{produto.produto}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{produto.cotacoes} cotações</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{produto.valor}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">total</div>
                      </div>
                      <div className="text-right min-w-[60px]">
                        <div className="text-sm font-semibold text-green-600 dark:text-green-400">-{produto.economia}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">economia</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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