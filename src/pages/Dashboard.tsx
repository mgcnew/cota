import { useState, useMemo, memo, lazy, Suspense } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users, 
  Package,
  Clock,
  ShoppingCart,
  ClipboardList
} from 'lucide-react';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDashboard } from '@/hooks/useDashboard';
import { usePedidos } from '@/hooks/usePedidos';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Lazy load charts
const EvolutionChart = lazy(() => import('@/components/dashboard/EvolutionChart').then(m => ({ default: m.EvolutionChart })));
const EconomyChart = lazy(() => import('@/components/dashboard/EconomyChart').then(m => ({ default: m.EconomyChart })));

// Skeleton
const ChartSkeleton = () => (
  <div className="h-[200px] sm:h-[320px] bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
);

function Dashboard() {
  const [activityOpen, setActivityOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('7d');
  
  const dashboardData = useDashboard();
  const { pedidos } = usePedidos();
  const metrics = dashboardData?.metrics;
  const recentQuotes = dashboardData?.recentQuotes ?? [];
  const dailyData = dashboardData?.dailyData ?? [];
  const isLoading = dashboardData?.isLoading ?? true;

  // Últimos pedidos formatados
  const recentOrders = useMemo(() => {
    return (pedidos || []).slice(0, 3).map(p => ({
      id: p.id.substring(0, 8),
      supplier: p.supplier_name,
      total: `R$ ${p.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      status: p.status,
      date: new Date(p.order_date).toLocaleDateString('pt-BR'),
      items: p.items?.length || 0
    }));
  }, [pedidos]);

  const economyData = useMemo(() => {
    return dailyData.map((item: any, i: number) => ({ 
      ...item, 
      fill: ['#10b981', '#34d399', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'][i % 6] 
    }));
  }, [dailyData]);

  if (isLoading || !metrics) {
    return (
      <PageWrapper>
        <div className="page-container space-y-4 animate-pulse">
          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />)}
          </div>
          <ChartSkeleton />
        </div>
      </PageWrapper>
    );
  }

  // 4 Cards principais
  const cards = [
    {
      title: 'Economia',
      value: formatCurrency(metrics.economiaGerada),
      icon: DollarSign,
      trend: metrics.crescimentoEconomia,
      color: 'emerald',
      sub: `Potencial: ${formatCurrency(metrics.economiaPotencial)}`
    },
    {
      title: 'Cotações',
      value: metrics.cotacoesAtivas,
      icon: FileText,
      trend: metrics.crescimentoCotacoes,
      color: 'blue',
      sub: `${metrics.aprovacoesTotal} aprovadas`
    },
    {
      title: 'Fornecedores',
      value: metrics.fornecedores,
      icon: Users,
      trend: metrics.taxaAtividade,
      color: 'purple',
      sub: `${metrics.taxaAtividade}% ativos`
    },
    {
      title: 'Produtos',
      value: metrics.produtosCotados,
      icon: Package,
      trend: metrics.competitividadeMedia,
      color: 'amber',
      sub: `${metrics.competitividadeMedia}% competitivos`
    }
  ];

  const colorMap: Record<string, { bg: string; icon: string; border: string }> = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', icon: 'bg-emerald-500', border: 'border-emerald-200/50 dark:border-emerald-800/30' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-950/30', icon: 'bg-blue-500', border: 'border-blue-200/50 dark:border-blue-800/30' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-950/30', icon: 'bg-purple-500', border: 'border-purple-200/50 dark:border-purple-800/30' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', icon: 'bg-amber-500', border: 'border-amber-200/50 dark:border-amber-800/30' },
  };

  const statusColors: Record<string, string> = {
    finalizada: 'bg-emerald-500',
    concluida: 'bg-emerald-500',
    entregue: 'bg-emerald-500',
    ativa: 'bg-blue-500',
    pendente: 'bg-amber-500',
    confirmado: 'bg-blue-500',
  };

  return (
    <PageWrapper>
      <div className="page-container space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <button 
            onClick={() => setActivityOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 active:scale-95 transition-transform"
          >
            <Clock className="w-3.5 h-3.5" />
            Atividades
          </button>
        </div>

        {/* 4 Cards Principais */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => {
            const colors = colorMap[card.color];
            const isPositive = card.trend >= 0;
            return (
              <div key={card.title} className={cn("p-3 rounded-xl border", colors.bg, colors.border)}>
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-1.5 rounded-lg", colors.icon)}>
                    <card.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className={cn("flex items-center gap-0.5 text-[10px] font-semibold", isPositive ? "text-emerald-600" : "text-red-600")}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(card.trend)}%
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{card.title}</p>
                <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Card de Últimas Atividades */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              Últimas Atividades
            </h2>
            <button 
              onClick={() => setActivityOpen(true)}
              className="text-xs text-purple-600 dark:text-purple-400 font-medium"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-2">
            {/* Últimas Cotações */}
            {recentQuotes.slice(0, 2).map((quote: any) => (
              <div key={`q-${quote.id}`} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/30">
                  <ClipboardList className="w-3.5 h-3.5 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{quote.product}</p>
                  <p className="text-[10px] text-gray-500 truncate">{quote.supplier} • {quote.bestPrice}</p>
                </div>
                <div className={cn("w-2 h-2 rounded-full", statusColors[quote.status] || 'bg-gray-400')} />
              </div>
            ))}

            {/* Últimos Pedidos */}
            {recentOrders.slice(0, 2).map((order) => (
              <div key={`o-${order.id}`} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <ShoppingCart className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{order.supplier}</p>
                  <p className="text-[10px] text-gray-500 truncate">{order.items} itens • {order.total}</p>
                </div>
                <div className={cn("w-2 h-2 rounded-full", statusColors[order.status] || 'bg-gray-400')} />
              </div>
            ))}

            {recentQuotes.length === 0 && recentOrders.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">Nenhuma atividade recente</p>
            )}
          </div>
        </div>

        {/* Gráficos */}
        <Suspense fallback={<ChartSkeleton />}>
          <EvolutionChart data={dailyData} period={chartPeriod} onPeriodChange={setChartPeriod} isLoading={false} />
        </Suspense>

        <Suspense fallback={<ChartSkeleton />}>
          <EconomyChart data={economyData} period={chartPeriod} onPeriodChange={setChartPeriod} isLoading={false} />
        </Suspense>

        {/* Modal de Atividades Completo */}
        <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Clock className="w-4 h-4 text-gray-500" />
                Todas as Atividades
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto py-3 space-y-4">
              {/* Cotações */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5" /> Cotações
                </h3>
                <div className="space-y-2">
                  {recentQuotes.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">Nenhuma cotação</p>
                  ) : (
                    recentQuotes.map((quote: any) => (
                      <div key={quote.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5", statusColors[quote.status] || 'bg-gray-400')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{quote.product}</p>
                          <p className="text-xs text-gray-500 truncate">{quote.supplier} • {quote.bestPrice}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{quote.date} • {quote.status}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pedidos */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5" /> Pedidos
                </h3>
                <div className="space-y-2">
                  {recentOrders.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">Nenhum pedido</p>
                  ) : (
                    recentOrders.map((order) => (
                      <div key={order.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className={cn("w-2 h-2 rounded-full mt-1.5", statusColors[order.status] || 'bg-gray-400')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{order.supplier}</p>
                          <p className="text-xs text-gray-500 truncate">{order.items} itens • {order.total}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{order.date} • {order.status}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
}

export default memo(Dashboard);
