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
import { Card } from '@/components/ui/card';

// Lazy load charts
const EvolutionChart = lazy(() => import('@/components/dashboard/EvolutionChart').then(m => ({ default: m.EvolutionChart })));
const EconomyChart = lazy(() => import('@/components/dashboard/EconomyChart').then(m => ({ default: m.EconomyChart })));

// Skeleton
const ChartSkeleton = () => (
  <div className="h-[320px] bg-muted rounded-xl animate-pulse" />
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
    return (pedidos || []).slice(0, 5).map(p => ({
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
        <div className="page-container space-y-6 animate-pulse">
          <div className="h-8 w-40 bg-muted rounded" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
            <div className="h-[680px] bg-muted rounded-xl" />
          </div>
        </div>
      </PageWrapper>
    );
  }

  // 4 Cards principais
  const cards = [
    {
      title: 'Economia Gerada',
      value: formatCurrency(metrics.economiaGerada),
      icon: DollarSign,
      trend: metrics.crescimentoEconomia,
      color: 'emerald',
      sub: `Potencial: ${formatCurrency(metrics.economiaPotencial)}`
    },
    {
      title: 'Cotações Ativas',
      value: metrics.cotacoesAtivas,
      icon: FileText,
      trend: metrics.crescimentoCotacoes,
      color: 'blue',
      sub: `${metrics.aprovacoesTotal} aprovadas no período`
    },
    {
      title: 'Fornecedores',
      value: metrics.fornecedores,
      icon: Users,
      trend: metrics.taxaAtividade,
      color: 'purple',
      sub: `${metrics.taxaAtividade}% participando ativamente`
    },
    {
      title: 'Produtos Cotados',
      value: metrics.produtosCotados,
      icon: Package,
      trend: metrics.competitividadeMedia,
      color: 'amber',
      sub: `${metrics.competitividadeMedia}% com boa competitividade`
    }
  ];

  const colorMap: Record<string, { bg: string; iconBg: string; iconText: string; border: string; trendUp: string; trendDown: string }> = {
    emerald: { 
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30', 
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600', 
      iconText: 'text-white',
      border: 'border-emerald-200/60 dark:border-emerald-800/40',
      trendUp: 'text-emerald-600 dark:text-emerald-400',
      trendDown: 'text-red-600 dark:text-red-400'
    },
    blue: { 
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30', 
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600', 
      iconText: 'text-white',
      border: 'border-blue-200/60 dark:border-blue-800/40',
      trendUp: 'text-emerald-600 dark:text-emerald-400',
      trendDown: 'text-red-600 dark:text-red-400'
    },
    purple: { 
      bg: 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/40 dark:to-violet-950/30', 
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600', 
      iconText: 'text-white',
      border: 'border-purple-200/60 dark:border-purple-800/40',
      trendUp: 'text-emerald-600 dark:text-emerald-400',
      trendDown: 'text-red-600 dark:text-red-400'
    },
    amber: { 
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30', 
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600', 
      iconText: 'text-white',
      border: 'border-amber-200/60 dark:border-amber-800/40',
      trendUp: 'text-emerald-600 dark:text-emerald-400',
      trendDown: 'text-red-600 dark:text-red-400'
    },
  };

  const statusColors: Record<string, string> = {
    finalizada: 'bg-emerald-500',
    concluida: 'bg-emerald-500',
    entregue: 'bg-emerald-500',
    ativa: 'bg-blue-500',
    pendente: 'bg-amber-500',
    confirmado: 'bg-blue-500',
  };

  const allActivities = [
    ...recentQuotes.slice(0, 5).map((q: any) => ({ type: 'quote', data: q })),
    ...recentOrders.slice(0, 5).map((o: any) => ({ type: 'order', data: o }))
  ];

  return (
    <PageWrapper>
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Visão geral das suas operações</p>
          </div>
        </div>

        {/* 4 Cards Lado a Lado */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const colors = colorMap[card.color];
            const isPositive = card.trend >= 0;
            return (
              <Card 
                key={card.title} 
                className={cn(
                  "relative overflow-hidden p-4 border shadow-sm hover:shadow-md transition-shadow",
                  colors.bg, 
                  colors.border
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("p-2.5 rounded-xl shadow-sm", colors.iconBg)}>
                    <card.icon className={cn("w-5 h-5", colors.iconText)} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                    isPositive 
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  )}>
                    {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(card.trend).toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{card.value}</p>
                  <p className="text-sm font-medium text-foreground/80">{card.title}</p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Layout Principal: Gráficos + Atividades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna dos Gráficos (2/3 da largura) */}
          <div className="lg:col-span-2 space-y-6">
            <Suspense fallback={<ChartSkeleton />}>
              <EvolutionChart data={dailyData} period={chartPeriod} onPeriodChange={setChartPeriod} isLoading={false} />
            </Suspense>

            <Suspense fallback={<ChartSkeleton />}>
              <EconomyChart data={economyData} period={chartPeriod} onPeriodChange={setChartPeriod} isLoading={false} />
            </Suspense>
          </div>

          {/* Card de Últimas Atividades (1/3 da largura) */}
          <div className="lg:col-span-1">
            <Card className="h-full border border-border bg-card shadow-sm">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-sm">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    Últimas Atividades
                  </h2>
                  <button 
                    onClick={() => setActivityOpen(true)}
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Ver todas
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                {/* Seção de Cotações */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Cotações Recentes
                  </h3>
                  <div className="space-y-2">
                    {recentQuotes.slice(0, 4).map((quote: any) => (
                      <div key={`q-${quote.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40">
                          <ClipboardList className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{quote.product}</p>
                          <p className="text-xs text-muted-foreground truncate">{quote.supplier} • {quote.bestPrice}</p>
                        </div>
                        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", statusColors[quote.status] || 'bg-muted-foreground')} />
                      </div>
                    ))}
                    {recentQuotes.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">Nenhuma cotação recente</p>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border my-3" />

                {/* Seção de Pedidos */}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" /> Pedidos Recentes
                  </h3>
                  <div className="space-y-2">
                    {recentOrders.slice(0, 4).map((order) => (
                      <div key={`o-${order.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                          <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{order.supplier}</p>
                          <p className="text-xs text-muted-foreground truncate">{order.items} itens • {order.total}</p>
                        </div>
                        <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", statusColors[order.status] || 'bg-muted-foreground')} />
                      </div>
                    ))}
                    {recentOrders.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-3">Nenhum pedido recente</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Modal de Atividades Completo */}
        <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-3 border-b border-border">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                Todas as Atividades
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-6">
              {/* Cotações */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> Cotações
                </h3>
                <div className="space-y-2">
                  {recentQuotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3 text-center">Nenhuma cotação</p>
                  ) : (
                    recentQuotes.map((quote: any) => (
                      <div key={quote.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", statusColors[quote.status] || 'bg-muted-foreground')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{quote.product}</p>
                          <p className="text-xs text-muted-foreground">{quote.supplier} • {quote.bestPrice}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">{quote.date} • {quote.status}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pedidos */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Pedidos
                </h3>
                <div className="space-y-2">
                  {recentOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3 text-center">Nenhum pedido</p>
                  ) : (
                    recentOrders.map((order) => (
                      <div key={order.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", statusColors[order.status] || 'bg-muted-foreground')} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{order.supplier}</p>
                          <p className="text-xs text-muted-foreground">{order.items} itens • {order.total}</p>
                          <p className="text-xs text-muted-foreground/70 mt-1">{order.date} • {order.status}</p>
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
