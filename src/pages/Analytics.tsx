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
    <div className="page-container">
      {/* Filters */}
      {isGenerating && (
        <Card className="border-blue-200 bg-blue-50">
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Métricas Principais - Estilo Apple */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6 overflow-visible">
            {metricas.map((metrica, index) => {
              const iconConfigs = [
                { 
                  icon: DollarSign, 
                  bgGradient: 'from-green-500/10 to-emerald-500/10', 
                  iconColor: 'text-green-600', 
                  borderColor: 'border-l-green-500',
                  cardBg: 'from-green-50/50 to-emerald-50/30',
                  trendColor: { positive: 'text-green-700 bg-green-100 hover:bg-green-200', negative: 'text-red-700 bg-red-100 hover:bg-red-200' },
                  progressColor: { positive: 'bg-green-600', negative: 'bg-red-600' }
                },
                { 
                  icon: Clock, 
                  bgGradient: 'from-blue-500/10 to-indigo-500/10', 
                  iconColor: 'text-blue-600', 
                  borderColor: 'border-l-blue-500',
                  cardBg: 'from-blue-50/50 to-indigo-50/30',
                  trendColor: { positive: 'text-blue-700 bg-blue-100 hover:bg-blue-200', negative: 'text-red-700 bg-red-100 hover:bg-red-200' },
                  progressColor: { positive: 'bg-blue-600', negative: 'bg-red-600' }
                },
                { 
                  icon: CheckCircle, 
                  bgGradient: 'from-emerald-500/10 to-teal-500/10', 
                  iconColor: 'text-emerald-600', 
                  borderColor: 'border-l-emerald-500',
                  cardBg: 'from-emerald-50/50 to-teal-50/30',
                  trendColor: { positive: 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200', negative: 'text-red-700 bg-red-100 hover:bg-red-200' },
                  progressColor: { positive: 'bg-emerald-600', negative: 'bg-red-600' }
                },
                { 
                  icon: Users, 
                  bgGradient: 'from-purple-500/10 to-pink-500/10', 
                  iconColor: 'text-purple-600', 
                  borderColor: 'border-l-purple-500',
                  cardBg: 'from-purple-50/50 to-pink-50/30',
                  trendColor: { positive: 'text-purple-700 bg-purple-100 hover:bg-purple-200', negative: 'text-red-700 bg-red-100 hover:bg-red-200' },
                  progressColor: { positive: 'bg-purple-600', negative: 'bg-red-600' }
                }
              ];
              const config = iconConfigs[index] || iconConfigs[0];
              const Icon = config.icon;
              
              return (
                <Card key={metrica.titulo} className="group relative overflow-hidden bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-700/50 md:shadow-[0_1px_3px_rgba(0,0,0,0.05)] md:hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-500 hover:scale-[1.02]">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.bgGradient} flex items-center justify-center`}>
                          <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{metrica.titulo}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${
                        metrica.tipo === 'positivo' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                      }`}>
                        {metrica.tipo === 'positivo' ? (
                          <TrendingUp className={`h-2.5 w-2.5 ${metrica.tipo === 'positivo' ? 'text-green-600' : 'text-red-600'}`} />
                        ) : (
                          <TrendingDown className={`h-2.5 w-2.5 ${metrica.tipo === 'positivo' ? 'text-green-600' : 'text-red-600'}`} />
                        )}
                        <span className={`text-xs font-semibold ${metrica.tipo === 'positivo' ? 'text-green-600' : 'text-red-600'}`}>{metrica.variacao}</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{metrica.valor}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{metrica.descricao}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          metrica.tipo === 'positivo' ? config.progressColor.positive : config.progressColor.negative
                        }`} style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-600">75%</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Tendência de Economia */}
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Tendência de Economia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tendenciasMensais.map(item => (
                    <div key={item.mes} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                          {item.mes}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.cotacoes} cotações</div>
                          <div className="text-sm text-gray-600">
                            R$ {item.valor.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">{item.economia}%</div>
                        <div className="text-xs text-gray-500">economia</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance de Fornecedores */}
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Top Fornecedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performanceFornecedores.slice(0, 4).map(fornecedor => (
                    <div key={fornecedor.fornecedor} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                          fornecedor.score >= 90 ? 'bg-green-500' : 
                          fornecedor.score >= 80 ? 'bg-blue-500' : 'bg-gray-500'
                        }`}>
                          {fornecedor.score}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{fornecedor.fornecedor}</div>
                          <div className="text-sm text-gray-600">
                            {fornecedor.cotacoes} cotações • {fornecedor.tempo}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">-{fornecedor.economia}</div>
                        <div className="text-xs text-gray-500">economia</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Produtos */}
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Top Produtos por Economia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProdutos.map((produto, index) => (
                  <div key={produto.produto} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{produto.produto}</div>
                        <div className="text-sm text-gray-600">{produto.cotacoes} cotações realizadas</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{produto.valor}</div>
                        <div className="text-xs text-gray-500">valor total</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">-{produto.economia}</div>
                        <div className="text-xs text-gray-500">economia</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Performance Detalhada</h3>
            <p className="text-gray-600">Análises detalhadas de performance em desenvolvimento</p>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6 mt-6">
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Insights Avançados</h3>
            <p className="text-gray-600">Insights e recomendações inteligentes em desenvolvimento</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}