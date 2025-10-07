import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Legend, Tooltip, AreaChart, Area, BarChart, Bar } from "recharts";
import {
  Package, Building2, FileText, DollarSign, Calendar, ArrowUpRight,
  Loader2, TrendingUp, Users, RefreshCw, Filter, Eye, MoreHorizontal,
  Target, Clock, CheckCircle, AlertCircle, Star, Activity, Zap,
  ArrowUp, ArrowDown, Minus, ChevronRight, Bell, Settings, Pause, Play,
  Wifi, WifiOff, Download, Calendar as CalendarIcon, BarChart3
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";

// Tipos para melhor type safety
interface QuickAction {
  title: string;
  description: string;
  icon: any;
  color: string;
  action: () => void;
}

interface Alert {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  time: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { metrics, recentQuotes, topSuppliers, monthlyData, isLoading } = useDashboard();
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReportModal, setShowReportModal] = useState(false);
  const [dateFilter, setDateFilter] = useState("30");
  const [activeFilters, setActiveFilters] = useState({
    status: "all",
    supplier: "all",
    category: "all",
    value: "all"
  });
  const [clickedAction, setClickedAction] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Opções de filtro de data
  const dateFilterOptions = [
    { value: "7", label: "Últimos 7 dias", shortLabel: "7d" },
    { value: "15", label: "Últimos 15 dias", shortLabel: "15d" },
    { value: "30", label: "Últimos 30 dias", shortLabel: "30d" },
    { value: "60", label: "Últimos 60 dias", shortLabel: "60d" },
    { value: "90", label: "Últimos 90 dias", shortLabel: "90d" },
    { value: "180", label: "Últimos 6 meses", shortLabel: "6m" },
    { value: "365", label: "Último ano", shortLabel: "1a" }
  ];

  // Função para obter o texto do período selecionado
  const getSelectedPeriodText = useCallback(() => {
    const option = dateFilterOptions.find(opt => opt.value === dateFilter);
    return option || dateFilterOptions[2]; // Default para 30 dias
  }, [dateFilter]);

  // Opções de filtros avançados
  const filterOptions = {
    status: [
      { value: "all", label: "Todos os Status" },
      { value: "pending", label: "Pendentes" },
      { value: "approved", label: "Aprovadas" },
      { value: "rejected", label: "Rejeitadas" },
      { value: "expired", label: "Expiradas" }
    ],
    supplier: [
      { value: "all", label: "Todos os Fornecedores" },
      { value: "fornecedor-a", label: "Fornecedor A" },
      { value: "fornecedor-b", label: "Fornecedor B" },
      { value: "fornecedor-c", label: "Fornecedor C" },
      { value: "outros", label: "Outros" }
    ],
    category: [
      { value: "all", label: "Todas as Categorias" },
      { value: "materiais", label: "Materiais" },
      { value: "servicos", label: "Serviços" },
      { value: "equipamentos", label: "Equipamentos" },
      { value: "software", label: "Software" }
    ],
    value: [
      { value: "all", label: "Todos os Valores" },
      { value: "0-1000", label: "Até R$ 1.000" },
      { value: "1000-5000", label: "R$ 1.000 - R$ 5.000" },
      { value: "5000-10000", label: "R$ 5.000 - R$ 10.000" },
      { value: "10000+", label: "Acima de R$ 10.000" }
    ]
  };

  // Função para contar filtros ativos
  const getActiveFiltersCount = useCallback(() => {
    return Object.values(activeFilters).filter(value => value !== "all").length;
  }, [activeFilters]);

  // Função para resetar filtros
  const resetFilters = useCallback(() => {
    setActiveFilters({
      status: "all",
      supplier: "all",
      category: "all",
      value: "all"
    });
  }, []);

  // Efeito para simular atualização dos dados quando o filtro muda
  useEffect(() => {
    if (dateFilter) {
      setRefreshing(true);
      // Simula carregamento dos dados filtrados
      const timer = setTimeout(() => {
        setRefreshing(false);
        setLastUpdated(new Date());
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [dateFilter]);

  // Efeito para simular atualização quando filtros avançados mudam
  useEffect(() => {
    const hasActiveFilters = getActiveFiltersCount() > 0;
    if (hasActiveFilters) {
      setRefreshing(true);
      const timer = setTimeout(() => {
        setRefreshing(false);
        setLastUpdated(new Date());
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [activeFilters, getActiveFiltersCount]);

  // Dados mockados para demonstração
  const alerts: Alert[] = useMemo(() => [
    {
      id: '1',
      type: 'warning',
      title: 'Cotação Pendente',
      message: '3 cotações aguardando resposta há mais de 48h',
      time: '2h atrás'
    },
    {
      id: '2',
      type: 'success',
      title: 'Meta Atingida',
      message: 'Economia mensal superou a meta em 15%',
      time: '1 dia atrás'
    },
    {
      id: '3',
      type: 'info',
      title: 'Novo Fornecedor',
      message: '2 novos fornecedores cadastrados esta semana',
      time: '2 dias atrás'
    }
  ], []);

  const handleQuickAction = useCallback((action: () => void, index: number) => {
    setClickedAction(index);
    setTimeout(() => {
      action();
      setClickedAction(null);
    }, 150);
  }, []);

  const quickActions: QuickAction[] = useMemo(() => [
    {
      title: "Nova Cotação",
      description: "Criar cotação rápida",
      icon: FileText,
      color: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      action: () => navigate("/cotacoes")
    },
    {
      title: "Adicionar Fornecedor",
      description: "Cadastrar novo fornecedor",
      icon: Building2,
      color: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
      action: () => navigate("/fornecedores")
    },
    {
      title: "Relatório Rápido",
      description: "Gerar relatório do mês",
      icon: BarChart3,
      color: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
      action: () => navigate("/relatorios")
    },
    {
      title: "Análise de Preços",
      description: "Comparar preços atuais",
      icon: TrendingUp,
      color: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
      action: () => navigate("/analytics")
    }
  ], [navigate]);

  // Dados dos gráficos otimizados
  const pieChartData = useMemo(() =>
    topSuppliers.map((supplier, index) => ({
      name: supplier.name,
      value: supplier.quotes,
      fill: `hsl(${200 + index * 40}, 70%, 50%)`
    })), [topSuppliers]
  );

  const areaChartData = useMemo(() =>
    monthlyData.map(item => ({
      ...item,
      economiaAcumulada: item.economia * 1.2,
      meta: 15000
    })), [monthlyData]
  );

  // Auto-refresh em tempo real
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (autoRefresh && isOnline && !isLoading) {
      intervalRef.current = setInterval(() => {
        // Simular atualização dos dados em tempo real
        setLastUpdated(new Date());
        // Aqui você pode implementar a lógica real de refetch
        // Por exemplo: window.location.reload() ou chamar uma função de refetch
      }, 30000); // Atualiza a cada 30 segundos
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, isOnline, isLoading]);

  // Funções otimizadas
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Simular refresh - aqui você implementaria a lógica real
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  const getMetricTrend = useCallback((current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (change > 0) return { icon: ArrowUp, color: 'text-green-600', value: `+${change.toFixed(1)}%` };
    if (change < 0) return { icon: ArrowDown, color: 'text-red-600', value: `${change.toFixed(1)}%` };
    return { icon: Minus, color: 'text-gray-500', value: '0%' };
  }, []);

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
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
      {/* Header Aprimorado com Melhor Hierarquia */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 border border-blue-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl sm:text-2xl lg:text-3xl bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
                    Dashboard
                  </h1>
                  {/* Mobile: Layout compacto com indicadores */}
                  <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:hidden">
                    {refreshing && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shadow-sm ${isOnline ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                      {isOnline ? <Wifi className="h-2 w-2" /> : <WifiOff className="h-2 w-2" />}
                      <span>{isOnline ? 'Online' : 'Offline'}</span>
                    </div>

                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                      <BarChart3 className="h-2 w-2" />
                      <span>{getSelectedPeriodText().shortLabel}</span>
                    </div>

                    {getActiveFiltersCount() > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                        <Filter className="h-2 w-2" />
                        <span>{getActiveFiltersCount()}F</span>
                      </div>
                    )}
                  </div>

                  {/* Desktop: Layout original */}
                  <div className="hidden sm:flex items-center gap-2 mt-1">
                    {refreshing && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium shadow-sm ${isOnline ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                      {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                      <span>{isOnline ? 'Sistema Online' : 'Sistema Offline'}</span>
                    </div>

                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                      <BarChart3 className="h-3 w-3" />
                      <span>Período: {getSelectedPeriodText().label}</span>
                    </div>

                    {getActiveFiltersCount() > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                        <Filter className="h-3 w-3" />
                        <span>
                          {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile: Layout compacto */}
            <div className="flex items-center justify-between gap-2 text-xs sm:hidden">
              <div className="flex items-center gap-1 text-gray-700 bg-white/60 px-2 py-1 rounded-lg backdrop-blur-sm">
                <Calendar className="h-3 w-3 text-blue-600" />
                <span className="font-medium">
                  {new Date().toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-1 text-gray-600 bg-white/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                <Clock className="h-3 w-3 text-blue-500" />
                <span>
                  {lastUpdated.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>

            {/* Desktop: Layout original */}
            <div className="hidden sm:flex flex-row items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium truncate">
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-600 bg-white/40 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="truncate">
                  Última atualização: {lastUpdated.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
            {/* Controle de Auto-refresh Melhorado */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white/70 backdrop-blur-sm border border-blue-200 rounded-lg sm:rounded-xl shadow-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                {autoRefresh ? <Play className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" /> : <Pause className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />}
                <span className="text-xs sm:text-sm font-medium text-gray-700">Tempo Real</span>
              </div>
              <Switch
                checked={autoRefresh}
                onCheckedChange={toggleAutoRefresh}
                disabled={!isOnline}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || !isOnline}
              className="bg-white/70 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/70 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{getSelectedPeriodText().label}</span>
                  <span className="sm:hidden">{getSelectedPeriodText().shortLabel}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-sm font-semibold text-gray-900">
                    Período de análise
                  </div>
                  {dateFilterOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={dateFilter === option.value ? "default" : "ghost"}
                      size="sm"
                      className={`w-full justify-start text-sm ${dateFilter === option.value
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "hover:bg-gray-100"
                        }`}
                      onClick={() => setDateFilter(option.value)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`bg-white/70 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 ${getActiveFiltersCount() > 0 ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300' : ''
                    }`}
                >
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">
                    Filtros {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
                  </span>
                  <span className="sm:hidden">
                    {getActiveFiltersCount() > 0 ? `F(${getActiveFiltersCount()})` : 'F'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Filtros Avançados</h3>
                    {getActiveFiltersCount() > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetFilters}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Limpar todos
                      </Button>
                    )}
                  </div>

                  {/* Filtro por Status */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Status da Cotação</label>
                    <Select
                      value={activeFilters.status}
                      onValueChange={(value) => setActiveFilters(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions.status.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Fornecedor */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Fornecedor</label>
                    <Select
                      value={activeFilters.supplier}
                      onValueChange={(value) => setActiveFilters(prev => ({ ...prev, supplier: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions.supplier.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Categoria */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Categoria</label>
                    <Select
                      value={activeFilters.category}
                      onValueChange={(value) => setActiveFilters(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions.category.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro por Valor */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Faixa de Valor</label>
                    <Select
                      value={activeFilters.value}
                      onValueChange={(value) => setActiveFilters(prev => ({ ...prev, value: value }))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {filterOptions.value.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              size="sm"
              onClick={() => setShowReportModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-1 sm:gap-2 border-0 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Relatório</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status de Tempo Real */}
      {autoRefresh && isOnline && (
        <Card className="border-l-4 border-l-green-500 bg-green-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-green-900">Dados em Tempo Real Ativados</p>
                  <p className="text-sm text-green-700">
                    Dashboard atualiza automaticamente a cada 30 segundos
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAutoRefresh}
                className="text-green-700 hover:text-green-800"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!autoRefresh && isOnline && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Pause className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">Atualizações Pausadas</p>
                  <p className="text-sm text-yellow-700">
                    Clique em "Atualizar" ou ative o tempo real para dados atuais
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAutoRefresh}
                className="text-yellow-700 hover:text-yellow-800"
              >
                <Play className="h-4 w-4 mr-1" />
                Ativar Tempo Real
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isOnline && (
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <WifiOff className="h-4 w-4 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Sem Conexão</p>
                <p className="text-sm text-red-700">
                  Verifique sua conexão com a internet. Os dados podem estar desatualizados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas Importantes */}
      {alerts.length > 0 && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Alertas Importantes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 2).map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200">
                  <div className={`w-2 h-2 rounded-full mt-2 ${alert.type === 'success' ? 'bg-green-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' :
                      alert.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <span className="text-xs text-gray-500">{alert.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Principais com Indicadores de Tempo Real */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 ${autoRefresh && isOnline ? 'ring-1 ring-blue-200' : ''
          }`}>
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="p-1 sm:p-2 rounded-lg bg-blue-100 relative">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    {autoRefresh && isOnline && (
                      <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Cotações</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.cotacoesAtivas}</div>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full self-start sm:self-auto">
                <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="text-xs font-medium">+12%</span>
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                <div className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
              </div>
              <span className="text-xs text-gray-500">75%</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 ${autoRefresh && isOnline ? 'ring-1 ring-green-200' : ''
          }`}>
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="p-1 sm:p-2 rounded-lg bg-green-100 relative">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    {autoRefresh && isOnline && (
                      <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Economia</span>
                </div>
                <div className="text-sm sm:text-2xl font-bold text-gray-900">
                  R$ {(metrics.economiaGerada / 1000).toFixed(0)}k
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full self-start sm:self-auto">
                <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="text-xs font-medium">+8%</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-xs text-gray-500">
              Meta mensal: R$ 50.000 • Restam R$ 12.500
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500 ${autoRefresh && isOnline ? 'ring-1 ring-purple-200' : ''
          }`}>
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="p-1 sm:p-2 rounded-lg bg-purple-100 relative">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    {autoRefresh && isOnline && (
                      <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Fornecedores</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.fornecedores}</div>
              </div>
              <div className="flex items-center gap-1 text-blue-600 bg-blue-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full self-start sm:self-auto">
                <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="text-xs font-medium">+3</span>
              </div>
            </div>
            <div className="mt-2 sm:mt-4 text-xs text-gray-500">
              {Math.floor(metrics.fornecedores * 0.8)} ativos • {Math.floor(metrics.fornecedores * 0.2)} inativos
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500 ${autoRefresh && isOnline ? 'ring-1 ring-orange-200' : ''
          }`}>
          <CardContent className="p-3 sm:pt-6 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="p-1 sm:p-2 rounded-lg bg-orange-100 relative">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                    {autoRefresh && isOnline && (
                      <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Produtos</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{metrics.produtosCotados}</div>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full self-start sm:self-auto">
                <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="text-xs font-medium">+5%</span>
              </div>
            </div>
            <div className="mt-2 sm:mt-4 text-xs text-gray-500">
              {Math.floor(metrics.produtosCotados * 0.6)} cotados este mês
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card className="overflow-visible h-auto">
        <CardHeader className="pb-2 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible h-auto flex-shrink-0 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 overflow-visible">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action, index)}
                disabled={clickedAction === index}
                className={`flex flex-col items-center gap-1.5 sm:gap-3 p-2.5 sm:p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200 text-center group bg-white hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 disabled:opacity-75 ${
                  clickedAction === index ? 'scale-95 bg-blue-50' : 'hover:scale-105 active:scale-95'
                }`}
              >
                <div className={`p-1.5 sm:p-2.5 rounded-xl text-white ${action.color} group-hover:scale-110 transition-all duration-200 shadow-lg flex-shrink-0 ${
                  clickedAction === index ? 'animate-pulse' : ''
                }`}>
                  {clickedAction === index ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <action.icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="font-semibold text-gray-900 text-xs sm:text-base truncate group-hover:text-blue-900 transition-colors leading-tight">
                    {action.title}
                  </div>
                  <div className="text-xs text-gray-500 truncate group-hover:text-blue-600 transition-colors leading-tight hidden sm:block">
                    {action.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs para Organização */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
          <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Visão</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Performance</span>
            <span className="sm:hidden">Perf.</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Atividades</span>
            <span className="sm:hidden">Ativ.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
          {/* Gráficos Principais */}
          <div className="grid gap-3 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Gráfico de Área - Economia */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-2 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  <span className="truncate">Evolução da Economia</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="h-48 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={areaChartData}>
                      <defs>
                        <linearGradient id="economiaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        className="text-xs"
                        stroke="#6b7280"
                        tick={{ fontSize: 12 }}
                        tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="font-medium text-gray-900">{label}</p>
                                <p className="text-green-600">
                                  Economia: R$ {payload[0]?.value?.toLocaleString('pt-BR')}
                                </p>
                                <p className="text-blue-600">
                                  Meta: R$ {payload[1]?.value?.toLocaleString('pt-BR')}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="economia"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#economiaGradient)"
                      />
                      <Line
                        type="monotone"
                        dataKey="meta"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza - Fornecedores */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-2 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span className="truncate">Distribuição por Fornecedores</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
                <div className="h-48 sm:h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                                <p className="font-medium text-gray-900">{payload[0].name}</p>
                                <p className="text-blue-600">{payload[0].value} cotações</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
          {/* Top Fornecedores Melhorado */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-2 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <span className="truncate">Top Fornecedores do Mês</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-2 sm:space-y-4">
                {topSuppliers.map((supplier, index) => (
                  <div key={supplier.name} className="flex items-center justify-between p-2.5 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-base ${index === 0 ? "bg-yellow-500" :
                        index === 1 ? "bg-gray-400" :
                          index === 2 ? "bg-orange-500" : "bg-blue-500"
                        }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-xs sm:text-base truncate">{supplier.name}</div>
                        <div className="text-xs text-gray-500 truncate">{supplier.quotes} cotações</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm sm:text-lg font-bold text-green-600">-{supplier.savings}</div>
                      <div className="text-xs text-gray-500 hidden sm:block">economia gerada</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
          {/* Cotações Recentes Melhoradas */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-2 sm:pb-6 px-3 sm:px-6 pt-3 sm:pt-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span className="truncate">Atividades Recentes</span>
                </CardTitle>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
                  <span className="hidden sm:inline">Ver todas</span>
                  <span className="sm:hidden">Ver</span>
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="space-y-2 sm:space-y-4">
                {recentQuotes.map(quote => (
                  <div key={quote.id} className="flex items-center justify-between p-2.5 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <FileText className="h-3 w-3 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-xs sm:text-base truncate">{quote.product}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {quote.quantity} • {quote.supplier} • {quote.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                      <StatusBadge status={quote.status as any} />
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-xs sm:text-base">{quote.bestPrice}</div>
                        <div className="text-xs text-gray-500 hidden sm:block">melhor preço</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Relatório */}
      <ReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        metrics={metrics}
        monthlyData={monthlyData}
        topSuppliers={topSuppliers}
      />
    </div>
  );
}

// Funções de geração de relatórios
async function generatePDFReport(reportType: string, metrics: any, monthlyData: any[], topSuppliers: any[], fileName: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // Configurações do documento
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = margin;

  // Título do relatório
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Sistema de Cotações - Relatório', margin, yPosition);
  yPosition += 15;

  // Subtítulo
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const reportTitles = {
    mensal: 'Relatório Mensal',
    trimestral: 'Relatório Trimestral',
    anual: 'Relatório Anual',
    cotacoes: 'Relatório de Cotações',
    fornecedores: 'Relatório de Fornecedores',
    economia: 'Relatório de Economia'
  };
  doc.text(reportTitles[reportType as keyof typeof reportTitles] || 'Relatório Geral', margin, yPosition);
  yPosition += 10;

  // Data de geração
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, yPosition);
  yPosition += 20;

  // Métricas principais
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Métricas Principais', margin, yPosition);
  yPosition += 15;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cotações Ativas: ${metrics.cotacoesAtivas}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Economia Gerada: R$ ${metrics.economiaGerada?.toLocaleString('pt-BR')}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Fornecedores: ${metrics.fornecedores}`, margin, yPosition);
  yPosition += 8;
  doc.text(`Produtos Cotados: ${metrics.produtosCotados}`, margin, yPosition);
  yPosition += 20;

  // Top Fornecedores
  if (topSuppliers && topSuppliers.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Fornecedores', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    topSuppliers.slice(0, 5).forEach((supplier, index) => {
      doc.text(`${index + 1}. ${supplier.name} - ${supplier.quotes} cotações - Economia: ${supplier.savings}`, margin, yPosition);
      yPosition += 8;
    });
    yPosition += 15;
  }

  // Dados mensais
  if (monthlyData && monthlyData.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Evolução Mensal', margin, yPosition);
    yPosition += 15;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    monthlyData.forEach((data) => {
      doc.text(`${data.month}: R$ ${data.economia?.toLocaleString('pt-BR')} em economia`, margin, yPosition);
      yPosition += 8;
      if (yPosition > 270) { // Nova página se necessário
        doc.addPage();
        yPosition = margin;
      }
    });
  }

  // Rodapé
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 40, 285);
    doc.text('Sistema de Cotações - Relatório Confidencial', margin, 285);
  }

  // Download
  doc.save(`${fileName}.pdf`);
}

async function generateExcelReport(reportType: string, metrics: any, monthlyData: any[], topSuppliers: any[], fileName: string) {
  const XLSX = await import('xlsx');

  // Criar workbook
  const wb = XLSX.utils.book_new();

  // Aba 1: Resumo Executivo
  const resumoData = [
    ['SISTEMA DE COTAÇÕES - RELATÓRIO'],
    [''],
    ['Tipo:', reportType.charAt(0).toUpperCase() + reportType.slice(1)],
    ['Data de Geração:', new Date().toLocaleDateString('pt-BR')],
    ['Hora de Geração:', new Date().toLocaleTimeString('pt-BR')],
    [''],
    ['MÉTRICAS PRINCIPAIS'],
    ['Cotações Ativas', metrics.cotacoesAtivas],
    ['Economia Gerada', `R$ ${metrics.economiaGerada?.toLocaleString('pt-BR')}`],
    ['Fornecedores Cadastrados', metrics.fornecedores],
    ['Produtos Cotados', metrics.produtosCotados],
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);

  // Estilizar o cabeçalho
  wsResumo['A1'] = { v: 'SISTEMA DE COTAÇÕES - RELATÓRIO', t: 's', s: { font: { bold: true, sz: 16 } } };
  wsResumo['A7'] = { v: 'MÉTRICAS PRINCIPAIS', t: 's', s: { font: { bold: true, sz: 14 } } };

  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Executivo');

  // Aba 2: Top Fornecedores
  if (topSuppliers && topSuppliers.length > 0) {
    const fornecedoresData = [
      ['RANKING DE FORNECEDORES'],
      [''],
      ['Posição', 'Nome do Fornecedor', 'Cotações Realizadas', 'Economia Gerada'],
    ];

    topSuppliers.forEach((supplier, index) => {
      fornecedoresData.push([
        index + 1,
        supplier.name,
        supplier.quotes,
        supplier.savings
      ]);
    });

    const wsFornecedores = XLSX.utils.aoa_to_sheet(fornecedoresData);
    wsFornecedores['A1'] = { v: 'RANKING DE FORNECEDORES', t: 's', s: { font: { bold: true, sz: 14 } } };

    XLSX.utils.book_append_sheet(wb, wsFornecedores, 'Top Fornecedores');
  }

  // Aba 3: Evolução Mensal
  if (monthlyData && monthlyData.length > 0) {
    const mensalData = [
      ['EVOLUÇÃO MENSAL'],
      [''],
      ['Mês', 'Economia Gerada (R$)', 'Cotações Realizadas'],
    ];

    monthlyData.forEach((data) => {
      mensalData.push([
        data.month,
        data.economia || 0,
        data.quotes || 0
      ]);
    });

    const wsMensal = XLSX.utils.aoa_to_sheet(mensalData);
    wsMensal['A1'] = { v: 'EVOLUÇÃO MENSAL', t: 's', s: { font: { bold: true, sz: 14 } } };

    XLSX.utils.book_append_sheet(wb, wsMensal, 'Evolução Mensal');
  }

  // Download
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}

async function generateCSVReport(reportType: string, metrics: any, monthlyData: any[], topSuppliers: any[], fileName: string) {
  let csvContent = '';

  // Cabeçalho do relatório
  csvContent += 'SISTEMA DE COTAÇÕES - RELATÓRIO\n';
  csvContent += `Tipo do Relatório,${reportType.charAt(0).toUpperCase() + reportType.slice(1)}\n`;
  csvContent += `Data de Geração,${new Date().toLocaleDateString('pt-BR')}\n`;
  csvContent += `Hora de Geração,${new Date().toLocaleTimeString('pt-BR')}\n`;
  csvContent += '\n';

  // Métricas principais
  csvContent += 'MÉTRICAS PRINCIPAIS\n';
  csvContent += 'Métrica,Valor\n';
  csvContent += `Cotações Ativas,${metrics.cotacoesAtivas}\n`;
  csvContent += `Economia Gerada,R$ ${metrics.economiaGerada?.toLocaleString('pt-BR')}\n`;
  csvContent += `Fornecedores Cadastrados,${metrics.fornecedores}\n`;
  csvContent += `Produtos Cotados,${metrics.produtosCotados}\n`;
  csvContent += '\n';

  // Top Fornecedores
  if (topSuppliers && topSuppliers.length > 0) {
    csvContent += 'TOP FORNECEDORES\n';
    csvContent += 'Posição,Nome do Fornecedor,Cotações Realizadas,Economia Gerada\n';
    topSuppliers.forEach((supplier, index) => {
      csvContent += `${index + 1},"${supplier.name}",${supplier.quotes},"${supplier.savings}"\n`;
    });
    csvContent += '\n';
  }

  // Evolução Mensal
  if (monthlyData && monthlyData.length > 0) {
    csvContent += 'EVOLUÇÃO MENSAL\n';
    csvContent += 'Mês,Economia Gerada (R$),Cotações Realizadas\n';
    monthlyData.forEach((data) => {
      csvContent += `"${data.month}",${data.economia || 0},${data.quotes || 0}\n`;
    });
  }

  // Download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Componente do Modal de Relatório
function ReportModal({
  open,
  onOpenChange,
  metrics,
  monthlyData,
  topSuppliers
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: any;
  monthlyData: any[];
  topSuppliers: any[];
}) {
  const [reportType, setReportType] = useState("mensal");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    try {
      const currentDate = new Date().toLocaleDateString('pt-BR');
      const fileName = `relatorio-${reportType}-${new Date().toISOString().split('T')[0]}`;

      if (reportFormat === 'pdf') {
        await generatePDFReport(reportType, metrics, monthlyData, topSuppliers, fileName);
      } else if (reportFormat === 'excel') {
        await generateExcelReport(reportType, metrics, monthlyData, topSuppliers, fileName);
      } else if (reportFormat === 'csv') {
        await generateCSVReport(reportType, metrics, monthlyData, topSuppliers, fileName);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-hidden border-0 shadow-2xl rounded-xl sm:rounded-2xl p-0 flex flex-col">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100/60 bg-gradient-to-br from-purple-50/80 via-indigo-50/60 to-blue-50/40 backdrop-blur-sm relative overflow-hidden">
          {/* Efeitos decorativos de fundo */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-blue-500/5"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-indigo-400/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-400/10 to-purple-400/10 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10 flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-purple-500/25 ring-2 ring-white/20 backdrop-blur-sm flex-shrink-0">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 drop-shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800 bg-clip-text text-transparent">
                Gerar Relatório
              </DialogTitle>
              <p className="text-gray-600/80 text-sm font-medium mt-1">
                Exporte dados e análises do sistema
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Resumo dos Dados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 sm:p-4 border border-blue-100">
                <div className="text-xs sm:text-sm text-blue-600 font-medium">Cotações</div>
                <div className="text-lg sm:text-xl font-bold text-blue-900">{metrics.cotacoesAtivas}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 border border-green-100">
                <div className="text-xs sm:text-sm text-green-600 font-medium">Economia</div>
                <div className="text-sm sm:text-base font-bold text-green-900">R$ {metrics.economiaGerada?.toLocaleString('pt-BR')}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 sm:p-4 border border-purple-100">
                <div className="text-xs sm:text-sm text-purple-600 font-medium">Fornecedores</div>
                <div className="text-lg sm:text-xl font-bold text-purple-900">{metrics.fornecedores}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 sm:p-4 border border-orange-100">
                <div className="text-xs sm:text-sm text-orange-600 font-medium">Produtos</div>
                <div className="text-lg sm:text-xl font-bold text-orange-900">{metrics.produtosCotados}</div>
              </div>
            </div>

            {/* Configurações do Relatório */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-gray-200/60">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-md text-sm">
                  ⚙️
                </div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">Configurações do Relatório</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Tipo de Relatório</label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="rounded-xl border-gray-200 focus:border-purple-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensal">📊 Relatório Mensal</SelectItem>
                      <SelectItem value="trimestral">📈 Relatório Trimestral</SelectItem>
                      <SelectItem value="anual">📋 Relatório Anual</SelectItem>
                      <SelectItem value="cotacoes">💼 Relatório de Cotações</SelectItem>
                      <SelectItem value="fornecedores">🏢 Relatório de Fornecedores</SelectItem>
                      <SelectItem value="economia">💰 Relatório de Economia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Formato</label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger className="rounded-xl border-gray-200 focus:border-purple-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">📄 PDF</SelectItem>
                      <SelectItem value="excel">📊 Excel</SelectItem>
                      <SelectItem value="csv">📋 CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Prévia do Conteúdo */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/60 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                  📋
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900 mb-2">Conteúdo do Relatório</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Métricas principais e KPIs</li>
                    <li>• Gráficos de performance e tendências</li>
                    <li>• Análise de economia gerada</li>
                    <li>• Ranking de fornecedores</li>
                    <li>• Histórico de cotações</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer com botões */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100/60 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-gray-200 hover:bg-gray-50 text-sm"
                disabled={isGenerating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}