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
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { generateReport, progress, isGenerating } = useReports();

  // Estados para dados
  const [metricas, setMetricas] = useState([
    {
      titulo: "Taxa de Economia",
      valor: "12.5%",
      variacao: "+2.3%",
      tipo: "positivo" as const,
      descricao: "vs mês anterior"
    },
    {
      titulo: "Tempo Médio de Cotação",
      valor: "3.2 dias",
      variacao: "-0.8 dias",
      tipo: "positivo" as const,
      descricao: "vs mês anterior"
    },
    {
      titulo: "Taxa de Resposta",
      valor: "87%",
      variacao: "+5%",
      tipo: "positivo" as const,
      descricao: "fornecedores respondendo"
    },
    {
      titulo: "Valor Médio por Pedido",
      valor: "R$ 2.450",
      variacao: "+12%",
      tipo: "positivo" as const,
      descricao: "vs mês anterior"
    }
  ]);

  const [topProdutos, setTopProdutos] = useState([
    { produto: "Frango Congelado", cotacoes: 15, economia: "18%", valor: "R$ 12.500" },
    { produto: "Carne Bovina", cotacoes: 12, economia: "15%", valor: "R$ 8.900" },
    { produto: "Suínos", cotacoes: 8, economia: "12%", valor: "R$ 6.200" },
    { produto: "Peixes", cotacoes: 6, economia: "10%", valor: "R$ 4.100" },
    { produto: "Aves", cotacoes: 4, economia: "8%", valor: "R$ 2.800" }
  ]);

  const [performanceFornecedores, setPerformanceFornecedores] = useState([
    { fornecedor: "Frigorífico ABC", score: 95, cotacoes: 20, economia: "15%", tempo: "2.1 dias" },
    { fornecedor: "Carnes XYZ", score: 88, cotacoes: 18, economia: "12%", tempo: "2.8 dias" },
    { fornecedor: "Distribuidora 123", score: 82, cotacoes: 15, economia: "10%", tempo: "3.2 dias" },
    { fornecedor: "Açougue Premium", score: 78, cotacoes: 12, economia: "8%", tempo: "3.8 dias" },
    { fornecedor: "Carnes do Sul", score: 72, cotacoes: 10, economia: "6%", tempo: "4.1 dias" }
  ]);

  const [tendenciasMensais, setTendenciasMensais] = useState([
    { mes: "Set", cotacoes: 45, economia: 8, valor: 125000 },
    { mes: "Out", cotacoes: 52, economia: 10, valor: 142000 },
    { mes: "Nov", cotacoes: 48, economia: 12, valor: 138000 },
    { mes: "Dez", cotacoes: 55, economia: 15, valor: 165000 }
  ]);

  // Funções otimizadas
  const loadAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const startDateStr = startDate?.toISOString().split('T')[0];
      const endDateStr = endDate?.toISOString().split('T')[0];

      // Simular carregamento para demo
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Aqui você pode adicionar a lógica real de carregamento dos dados
      // const [quotesResult, ordersResult] = await Promise.all([...]);

      toast({
        title: "Dados atualizados",
        description: "Analytics carregado com sucesso",
      });

    } catch (error) {
      console.error("Erro ao carregar analytics:", error);
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
    if (user && startDate && endDate) {
      loadAnalytics();
    }
  }, [user, loadAnalytics]);

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
    loadAnalytics(true);
  }, [loadAnalytics]);

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

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Analytics com Tema Verde */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-3xl bg-gradient-to-r from-green-900 to-emerald-700 bg-clip-text text-transparent">
                    Analytics
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    {refreshing && <Loader2 className="h-4 w-4 animate-spin text-green-600" />}
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 shadow-sm">
                      <BarChart3 className="h-3 w-3" />
                      Dados Analíticos
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Target className="h-4 w-4 text-green-600" />
                <span className="font-medium">Insights e Métricas Avançadas</span>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 bg-white/40 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Clock className="h-4 w-4 text-emerald-500" />
                <span>Atualizado em tempo real</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white/70 backdrop-blur-sm border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          
            <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/70 backdrop-blur-sm border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  {dateRangeText}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Selecionar Período</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => applyDatePreset(7)}>
                    7 dias
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyDatePreset(30)}>
                    30 dias
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyDatePreset(90)}>
                    90 dias
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => applyDatePreset(365)}>
                    1 ano
                  </Button>
                </div>
                <DateRangePicker 
                  startDate={startDate} 
                  endDate={endDate} 
                  onStartDateChange={setStartDate} 
                  onEndDateChange={setEndDate} 
                />
              </div>
            </DialogContent>
          </Dialog>
          
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="bg-white/70 backdrop-blur-sm border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {hasFilters && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs bg-green-100 text-green-700">
                      {selectedFornecedores.length + selectedProdutos.length}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Filtros Avançados</DialogTitle>
              </DialogHeader>
              <ReportFilters 
                selectedFornecedores={selectedFornecedores} 
                selectedProdutos={selectedProdutos} 
                onFornecedoresChange={setSelectedFornecedores} 
                onProdutosChange={setSelectedProdutos} 
                onReset={() => {
                  setSelectedFornecedores([]);
                  setSelectedProdutos([]);
                }} 
              />
            </DialogContent>
          </Dialog>
          
            <Button 
              size="sm" 
              onClick={handleExportAnalytics} 
              disabled={isGenerating}
              className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Exportando...' : 'Exportar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
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
          {/* Métricas Principais Melhoradas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <Card key={metrica.titulo} className={`hover:shadow-xl transition-all duration-300 border-l-4 ${config.borderColor} bg-gradient-to-br ${config.cardBg} backdrop-blur-sm`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${config.bgGradient} transition-all duration-300 hover:scale-110`}>
                            <Icon className={`h-5 w-5 ${config.iconColor}`} />
                          </div>
                          <span className="text-sm font-medium text-gray-600">{metrica.titulo}</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{metrica.valor}</div>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                        metrica.tipo === 'positivo' ? config.trendColor.positive : config.trendColor.negative
                      }`}>
                        {metrica.tipo === 'positivo' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>{metrica.variacao}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all duration-500 ${
                          metrica.tipo === 'positivo' ? config.progressColor.positive : config.progressColor.negative
                        }`} style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-xs text-gray-500">75%</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {metrica.descricao}
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