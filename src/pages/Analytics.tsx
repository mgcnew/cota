/**
 * Analytics Page - Mobile Performance Optimized
 * 
 * Optimizations:
 * - Prioritizes key metrics rendering (Requirement 7.1)
 * - Swipeable carousel for insight cards on mobile (Requirement 7.2)
 * - Simplified charts for mobile (Requirement 7.3)
 * - MobileFilters for filter options (Requirement 7.4)
 * - Smooth data update animations < 300ms (Requirement 7.5)
 * 
 * @module pages/Analytics
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useReports } from "@/hooks/useReports";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useInsights } from "@/hooks/useInsights";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { MobileFilters, FilterConfig } from "@/components/responsive/MobileFilters";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { 
  BarChart3, TrendingUp, Download, 
  DollarSign, Package, Building2, Target, Loader2, RefreshCw, 
  CheckCircle, Clock, Users
} from "lucide-react";

// Lazy load heavy components for better initial load (Requirement 7.1)
const InsightsPanel = lazy(() => import("@/components/analytics/InsightsPanel").then(m => ({ default: m.InsightsPanel })));
const PerformanceCharts = lazy(() => import("@/components/analytics/PerformanceCharts").then(m => ({ default: m.PerformanceCharts })));

/**
 * CSS animation classes for smooth data updates (Requirement 7.5)
 * All animations use transform/opacity only for 60fps performance
 */
const ANIMATION_CLASSES = {
  fadeIn: "animate-in fade-in duration-200",
  slideUp: "animate-in slide-in-from-bottom-2 duration-200",
  scaleIn: "animate-in zoom-in-95 duration-150",
};

/**
 * Loading skeleton for charts section
 */
function ChartsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for insights section
 */
function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const { generateReport, progress, isGenerating } = useReports();
  
  // Filter state for MobileFilters (Requirement 7.4)
  const [filterValues, setFilterValues] = useState<Record<string, any>>({
    periodo: '30',
    categoria: '',
  });

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

  // Apply date preset (Requirement 7.4)
  const applyDatePreset = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleRefresh = useCallback(() => {
    toast({
      title: "Dados atualizados",
      description: "Analytics recarregado com sucesso",
    });
  }, [toast]);

  // MobileFilters configuration (Requirement 7.4)
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'periodo',
      label: 'Período',
      type: 'select',
      options: [
        { value: '7', label: 'Últimos 7 dias' },
        { value: '15', label: 'Últimos 15 dias' },
        { value: '30', label: 'Últimos 30 dias' },
        { value: '60', label: 'Últimos 60 dias' },
        { value: '90', label: 'Últimos 90 dias' },
      ],
    },
  ], []);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    const days = parseInt(filterValues.periodo || '30', 10);
    applyDatePreset(days);
    toast({
      title: "Filtros aplicados",
      description: `Exibindo dados dos últimos ${days} dias`,
    });
  }, [filterValues, applyDatePreset, toast]);

  const handleResetFilters = useCallback(() => {
    setFilterValues({ periodo: '30', categoria: '' });
    applyDatePreset(30);
  }, [applyDatePreset]);

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
    return <PageWrapper><LoadingSkeleton /></PageWrapper>;
  }

  return (
    <PageWrapper>
      <div className="page-container bg-gray-50/50 dark:bg-transparent">
      {/* Page Header with MobileFilters (Requirement 7.4) */}
      <PageHeader
        title="Analytics"
        description="Análise de desempenho e métricas do sistema"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-2">
            {/* MobileFilters - Bottom sheet on mobile (Requirement 7.4) */}
            <MobileFilters
              filters={filterConfigs}
              values={filterValues}
              onChange={handleFilterChange}
              onApply={handleApplyFilters}
              onReset={handleResetFilters}
              title="Filtros de Analytics"
              description="Selecione o período de análise"
            />
            <Button variant="outline" size="sm" onClick={handleRefresh} className="h-11 min-h-[44px]">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAnalytics} className="h-11 min-h-[44px]">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        }
      />

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

        <TabsContent value="overview" className={cn("space-y-6 mt-6", ANIMATION_CLASSES.fadeIn)}>
          {/* Métricas Principais - Prioritized rendering (Requirement 7.1) */}
          {/* Mobile: Swipeable carousel (Requirement 7.2), Desktop: Grid */}
          {isMobile ? (
            <div className="mb-6">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2">
                  {metricas.map((metrica, index) => {
                    const icons = [DollarSign, Clock, CheckCircle, Users];
                    const Icon = icons[index] || DollarSign;
                    const variants: Array<"success" | "info" | "default" | "warning"> = ['success', 'info', 'default', 'warning'];
                    const variant = variants[index] || 'default';
                    
                    return (
                      <CarouselItem key={metrica.titulo} className="pl-2 basis-[85%]">
                        <MetricCard
                          title={metrica.titulo}
                          value={metrica.valor}
                          icon={Icon}
                          variant={variant}
                          trend={metrica.variacao ? {
                            value: metrica.variacao,
                            label: metrica.descricao,
                            type: metrica.tipo === 'negativo' ? 'negative' : 'positive'
                          } : undefined}
                        />
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <div className="flex justify-center gap-2 mt-3">
                  <CarouselPrevious className="static translate-y-0 h-8 w-8" />
                  <CarouselNext className="static translate-y-0 h-8 w-8" />
                </div>
              </Carousel>
            </div>
          ) : (
            <ResponsiveGrid gap="md" config={{ mobile: 2, tablet: 2, desktop: 4 }} className="mb-6 overflow-visible">
              {metricas.map((metrica, index) => {
                const icons = [DollarSign, Clock, CheckCircle, Users];
                const Icon = icons[index] || DollarSign;
                const variants: Array<"success" | "info" | "default" | "warning"> = ['success', 'info', 'default', 'warning'];
                const variant = variants[index] || 'default';
                
                return (
                  <MetricCard
                    key={metrica.titulo}
                    title={metrica.titulo}
                    value={metrica.valor}
                    icon={Icon}
                    variant={variant}
                    trend={metrica.variacao ? {
                      value: metrica.variacao,
                      label: metrica.descricao,
                      type: metrica.tipo === 'negativo' ? 'negative' : 'positive'
                    } : undefined}
                  />
                );
              })}
            </ResponsiveGrid>
          )}

          {/* Tendência e Fornecedores - Grid Profissional 2 Colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 lg:gap-4 mb-6">
            {/* Tendência de Economia */}
            <Card className="bg-white dark:bg-[#1C1F26] border-l-2 border-purple-500/60 dark:border-purple-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none">
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
            <Card className="bg-white dark:bg-[#1C1F26] border-l-2 border-indigo-500/60 dark:border-indigo-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none">
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
                  <EmptyState 
                    icon={Building2} 
                    title="Nenhum fornecedor encontrado" 
                    variant="inline" 
                  />
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
              <div className="col-span-full">
                <EmptyState 
                  icon={Package} 
                  title="Nenhum produto encontrado" 
                  description="Nenhum produto encontrado no período selecionado"
                />
              </div>
            ) : (
              topProdutos.slice(0, 6).map((produto, index) => (
              <Card key={produto.produto} className="bg-white dark:bg-[#1C1F26] border-l-2 border-orange-500/60 dark:border-orange-400/60 border border-gray-200/60 dark:border-gray-700/30 shadow-sm dark:shadow-none">
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

        {/* Performance Tab - Lazy loaded charts (Requirement 7.3) */}
        <TabsContent value="performance" className={cn("space-y-6 mt-6", ANIMATION_CLASSES.slideUp)}>
          <Suspense fallback={<ChartsSkeleton />}>
            <PerformanceCharts 
              performanceFornecedores={performanceFornecedores}
              tendenciasMensais={tendenciasMensais}
            />
          </Suspense>
        </TabsContent>

        {/* Insights Tab - Lazy loaded with smooth animations (Requirement 7.5) */}
        <TabsContent value="insights" className={cn("space-y-6 mt-6", ANIMATION_CLASSES.slideUp)}>
          <Suspense fallback={<InsightsSkeleton />}>
            <InsightsPanel
              insights={insights}
              isGenerating={isGeneratingInsights}
              lastGenerated={lastGenerated}
              onGenerate={handleGenerateInsights}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
      </div>
    </PageWrapper>
  );
}