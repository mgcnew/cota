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
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 shadow-sm">
                      <BarChart3 className="h-3 w-3" />
                      Dados Analíticos
                    </div>

                    {startDate && endDate && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                        <Calendar className="h-3 w-3" />
                        <span className="hidden sm:inline">
                          Período: {startDate.toLocaleDateString('pt-BR')} - {endDate.toLocaleDateString('pt-BR')}
                        </span>
                        <span className="sm:hidden">
                          {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}d
                        </span>
                      </div>
                    )}

                    {hasFilters && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                        <Filter className="h-3 w-3" />
                        <span className="hidden sm:inline">
                          {selectedFornecedores.length + selectedProdutos.length} filtro{selectedFornecedores.length + selectedProdutos.length > 1 ? 's' : ''} ativo{selectedFornecedores.length + selectedProdutos.length > 1 ? 's' : ''}
                        </span>
                        <span className="sm:hidden">{selectedFornecedores.length + selectedProdutos.length}F</span>
                      </div>
                    )}
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
              className="bg-white/70 backdrop-blur-sm border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          
            <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`bg-white/70 backdrop-blur-sm border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 flex items-center gap-2 ${
                    startDate && endDate ? 'ring-2 ring-green-500 bg-green-50 border-green-300' : ''
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  {dateRangeText}
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 flex flex-col">
                <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-green-50/40 backdrop-blur-sm relative overflow-hidden">
                  {/* Efeitos decorativos de fundo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-green-500/5"></div>
                  <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl translate-x-12 translate-y-12"></div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg ring-2 ring-green-100/50">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-gray-900">Selecionar Período</DialogTitle>
                      <p className="text-sm text-gray-600 mt-0.5">Defina o intervalo para análise dos dados</p>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyDatePreset(7)}
                        className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-green-50 hover:border-green-300"
                      >
                        <span className="font-medium">7 dias</span>
                        <span className="text-xs text-gray-500">Última semana</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyDatePreset(30)}
                        className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-green-50 hover:border-green-300"
                      >
                        <span className="font-medium">30 dias</span>
                        <span className="text-xs text-gray-500">Último mês</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyDatePreset(90)}
                        className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-green-50 hover:border-green-300"
                      >
                        <span className="font-medium">90 dias</span>
                        <span className="text-xs text-gray-500">Último trimestre</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => applyDatePreset(365)}
                        className="h-12 flex flex-col items-center justify-center gap-1 hover:bg-green-50 hover:border-green-300"
                      >
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
                      <DateRangePicker 
                        startDate={startDate} 
                        endDate={endDate} 
                        onStartDateChange={setStartDate} 
                        onEndDateChange={setEndDate} 
                      />
                    </div>
                  </div>

                  {/* Resumo do Período */}
                  {startDate && endDate && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">Período Selecionado</h3>
                          <p className="text-xs text-gray-600">Resumo do intervalo escolhido</p>
                        </div>
                      </div>
                      
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-green-900">
                              {startDate.toLocaleDateString('pt-BR')} - {endDate.toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-green-700">
                              {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} dias selecionados
                            </div>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                            <Calendar className="h-6 w-6" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {startDate && endDate ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Período definido
                      </span>
                    ) : (
                      <span className="text-gray-500">Selecione um período</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDateDialogOpen(false)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => setIsDateDialogOpen(false)}
                      disabled={!startDate || !endDate}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white disabled:opacity-50"
                    >
                      Aplicar período
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          
            <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`bg-white/70 backdrop-blur-sm border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200 flex items-center gap-2 ${
                    hasFilters ? 'ring-2 ring-green-500 bg-green-50 border-green-300' : ''
                  }`}
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
              <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 flex flex-col">
                <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-green-50/80 via-emerald-50/60 to-green-50/40 backdrop-blur-sm relative overflow-hidden">
                  {/* Efeitos decorativos de fundo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-green-500/5"></div>
                  <div className="absolute top-0 left-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -translate-x-16 -translate-y-16"></div>
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl translate-x-12 translate-y-12"></div>
                  
                  <div className="relative z-10 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg ring-2 ring-green-100/50">
                      <Filter className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-gray-900">Filtros Avançados</DialogTitle>
                      <p className="text-sm text-gray-600 mt-0.5">Personalize os dados das suas análises</p>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                </div>
                
                <div className="flex-shrink-0 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {hasFilters ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {selectedFornecedores.length + selectedProdutos.length} filtro{selectedFornecedores.length + selectedProdutos.length > 1 ? 's' : ''} aplicado{selectedFornecedores.length + selectedProdutos.length > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-gray-500">Nenhum filtro aplicado</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFornecedores([]);
                          setSelectedProdutos([]);
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Limpar todos
                      </Button>
                    )}
                    <Button
                      onClick={() => setIsFilterDialogOpen(false)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    >
                      Aplicar filtros
                    </Button>
                  </div>
                </div>
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