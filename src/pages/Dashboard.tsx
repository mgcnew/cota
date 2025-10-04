import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Legend, Tooltip, AreaChart, Area, BarChart, Bar } from "recharts";
import {
  Package, Building2, FileText, DollarSign, Calendar, ArrowUpRight,
  Loader2, TrendingUp, Users, RefreshCw, Filter, Eye, MoreHorizontal,
  Target, Clock, CheckCircle, AlertCircle, Star, Activity, Zap,
  ArrowUp, ArrowDown, Minus, ChevronRight, Bell, Settings, Pause, Play,
  Wifi, WifiOff
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
  const { metrics, recentQuotes, topSuppliers, monthlyData, isLoading } = useDashboard();
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const quickActions: QuickAction[] = useMemo(() => [
    {
      title: "Nova Cotação",
      description: "Criar cotação rápida",
      icon: FileText,
      color: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700",
      action: () => console.log("Nova cotação")
    },
    {
      title: "Adicionar Fornecedor",
      description: "Cadastrar novo fornecedor",
      icon: Building2,
      color: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
      action: () => console.log("Novo fornecedor")
    },
    {
      title: "Relatório Rápido",
      description: "Gerar relatório do mês",
      icon: BarChart,
      color: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700",
      action: () => console.log("Relatório")
    },
    {
      title: "Análise de Preços",
      description: "Comparar preços atuais",
      icon: TrendingUp,
      color: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700",
      action: () => console.log("Análise")
    }
  ], []);

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
    <div className="p-2 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 max-w-7xl mx-auto">
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
                  <div className="flex items-center gap-1 sm:gap-2 mt-1">
                    {refreshing && <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-blue-600" />}
                    <div className={`flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium shadow-sm ${isOnline ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                      {isOnline ? <Wifi className="h-2 w-2 sm:h-3 sm:w-3" /> : <WifiOff className="h-2 w-2 sm:h-3 sm:w-3" />}
                      <span className="hidden sm:inline">{isOnline ? 'Sistema Online' : 'Sistema Offline'}</span>
                      <span className="sm:hidden">{isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2 text-gray-700 bg-white/60 px-2 sm:px-3 py-1 sm:py-2 rounded-lg backdrop-blur-sm">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                <span className="font-medium truncate">
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 text-gray-600 bg-white/40 px-2 sm:px-3 py-1 sm:py-2 rounded-lg backdrop-blur-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                <span className="truncate">
                  <span className="hidden sm:inline">Última atualização: </span>
                  {lastUpdated.toLocaleTimeString('pt-BR', {
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

            <Button
              variant="outline"
              size="sm"
              className="bg-white/70 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Últimos 30 dias</span>
              <span className="sm:hidden">30d</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-white/70 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </Button>

            <Button
              size="sm"
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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 ${autoRefresh && isOnline ? 'ring-1 ring-blue-200' : ''
          }`}>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 relative">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    {autoRefresh && isOnline && (
                      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Cotações Ativas</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.cotacoesAtivas}</div>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-1.5 sm:px-2 py-1 rounded-full">
                <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="text-xs font-medium">+12%</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                <div className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
              </div>
              <span className="text-xs text-gray-500">75%</span>
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 ${autoRefresh && isOnline ? 'ring-1 ring-green-200' : ''
          }`}>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 relative">
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                    {autoRefresh && isOnline && (
                      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Economia Gerada</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-900">
                  R$ {metrics.economiaGerada.toLocaleString('pt-BR')}
                </div>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-1.5 sm:px-2 py-1 rounded-full">
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
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 relative">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                    {autoRefresh && isOnline && (
                      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Fornecedores</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.fornecedores}</div>
              </div>
              <div className="flex items-center gap-1 text-blue-600 bg-blue-100 px-1.5 sm:px-2 py-1 rounded-full">
                <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="text-xs font-medium">+3</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-xs text-gray-500">
              {Math.floor(metrics.fornecedores * 0.8)} ativos • {Math.floor(metrics.fornecedores * 0.2)} inativos
            </div>
          </CardContent>
        </Card>

        <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500 ${autoRefresh && isOnline ? 'ring-1 ring-orange-200' : ''
          }`}>
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-orange-100 relative">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                    {autoRefresh && isOnline && (
                      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-600 truncate">Produtos</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-gray-900">{metrics.produtosCotados}</div>
              </div>
              <div className="flex items-center gap-1 text-green-600 bg-green-100 px-1.5 sm:px-2 py-1 rounded-full">
                <ArrowUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="text-xs font-medium">+5%</span>
              </div>
            </div>
            <div className="mt-3 sm:mt-4 text-xs text-gray-500">
              {Math.floor(metrics.produtosCotados * 0.6)} cotados este mês
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
              >
                <div className={`p-1.5 sm:p-2 rounded-lg text-white ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-3 w-3 sm:h-4 sm:w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{action.title}</div>
                  <div className="text-xs text-gray-500 truncate">{action.description}</div>
                </div>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 ml-auto group-hover:text-blue-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs para Organização */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Visão</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Performance</span>
            <span className="sm:hidden">Perf.</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Atividades</span>
            <span className="sm:hidden">Ativ.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Gráficos Principais */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Gráfico de Área - Economia */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  <span className="truncate">Evolução da Economia</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80 w-full">
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
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span className="truncate">Distribuição por Fornecedores</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80 w-full">
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

        <TabsContent value="performance" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Top Fornecedores Melhorado */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                <span className="truncate">Top Fornecedores do Mês</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {topSuppliers.map((supplier, index) => (
                  <div key={supplier.name} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base ${index === 0 ? "bg-yellow-500" :
                        index === 1 ? "bg-gray-400" :
                          index === 2 ? "bg-orange-500" : "bg-blue-500"
                        }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{supplier.name}</div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">{supplier.quotes} cotações realizadas</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-base sm:text-lg font-bold text-green-600">-{supplier.savings}</div>
                      <div className="text-xs text-gray-500">economia gerada</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {/* Cotações Recentes Melhoradas */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span className="truncate">Atividades Recentes</span>
                </CardTitle>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs sm:text-sm">
                  <span className="hidden sm:inline">Ver todas</span>
                  <span className="sm:hidden">Ver</span>
                  <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {recentQuotes.map(quote => (
                  <div key={quote.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{quote.product}</div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">
                          {quote.quantity} • {quote.supplier} • {quote.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <StatusBadge status={quote.status as any} />
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-sm sm:text-base">{quote.bestPrice}</div>
                        <div className="text-xs text-gray-500">melhor preço</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}