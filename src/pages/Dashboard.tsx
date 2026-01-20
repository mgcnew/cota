import { useState, useMemo, memo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ClipboardList, ShoppingCart, Bell, Package, Users, Clock } from 'lucide-react';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDashboard } from '@/hooks/useDashboard';
import { usePedidos } from '@/hooks/usePedidos';
import { useCotacoes } from '@/hooks/useCotacoes';
import { formatCurrency } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { ResponsiveModal } from '@/components/responsive/ResponsiveModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts';
import { DashboardActivities } from '@/components/dashboard/DashboardActivities';

// Lazy load charts
const EvolutionChart = lazy(() => import('@/components/dashboard/EvolutionChart').then(m => ({ default: m.EvolutionChart })));
const EconomyChart = lazy(() => import('@/components/dashboard/EconomyChart').then(m => ({ default: m.EconomyChart })));

// Skeleton
const ChartSkeleton = () => (
  <div className="h-[320px] bg-muted rounded-xl animate-pulse" />
);

const STATUS_COLORS: Record<string, string> = {
  finalizada: 'bg-emerald-500',
  concluida: 'bg-emerald-500',
  entregue: 'bg-emerald-500',
  ativa: 'bg-blue-500',
  pendente: 'bg-amber-500',
  confirmado: 'bg-blue-500',
};

function Dashboard() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activityOpen, setActivityOpen] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('7d');
  
  const dashboardData = useDashboard();
  const { pedidos } = usePedidos();
  const { cotacoes } = useCotacoes();
  const metrics = dashboardData?.metrics;
  const recentQuotes = dashboardData?.recentQuotes ?? [];
  const dailyData = dashboardData?.dailyData ?? [];
  const isLoading = dashboardData?.isLoading ?? true;

  // Cotações prontas para decisão e vencendo
  const quotesStats = useMemo(() => {
    const hoje = new Date();
    const em48h = new Date(hoje.getTime() + 48 * 60 * 60 * 1000);
    
    const prontasParaDecisao = cotacoes.filter(c => {
      if (c.statusReal !== "ativa") return false;
      const fornecedoresRespondidos = c.fornecedoresParticipantes?.filter(f => f.status === "respondido").length || 0;
      const totalFornecedores = c.fornecedoresParticipantes?.length || 0;
      return totalFornecedores > 0 && fornecedoresRespondidos === totalFornecedores;
    });
    
    const vencendo = cotacoes.filter(c => {
      if (c.statusReal !== "ativa") return false;
      const dataFim = new Date(c.dataFim.split('/').reverse().join('-'));
      return dataFim <= em48h && dataFim >= hoje;
    });
    
    return { prontasParaDecisao, vencendo };
  }, [cotacoes]);

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

  return (
    <PageWrapper>
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg transition-smooth hover:shadow-xl hover:scale-105">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Visão geral das suas operações</p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <DashboardCards metrics={metrics} />

        {/* Alertas */}
        <DashboardAlerts 
          prontasParaDecisao={quotesStats.prontasParaDecisao.map(q => ({ id: q.id, dataFim: q.dataFim }))} 
          vencendo={quotesStats.vencendo.map(q => ({ id: q.id, dataFim: q.dataFim }))} 
        />

        {/* Layout Principal */}
        {isMobile ? (
          <div className="space-y-4">
            {/* Ações Rápidas Mobile */}
            <Card className="p-4 border border-border bg-card">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs hover:bg-muted/50 transition-smooth"
                  onClick={() => navigate('/dashboard/compras?tab=cotacoes')}
                >
                  <ClipboardList className="h-5 w-5 text-teal-600" />
                  <span>Nova Cotação</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs hover:bg-muted/50 transition-smooth"
                  onClick={() => navigate('/dashboard/compras?tab=pedidos')}
                >
                  <ShoppingCart className="h-5 w-5 text-orange-600" />
                  <span>Novo Pedido</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs hover:bg-muted/50 transition-smooth"
                  onClick={() => navigate('/dashboard/produtos')}
                >
                  <Package className="h-5 w-5 text-amber-600" />
                  <span>Produtos</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs hover:bg-muted/50 transition-smooth"
                  onClick={() => navigate('/dashboard/fornecedores')}
                >
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>Fornecedores</span>
                </Button>
              </div>
            </Card>

            {/* Atividades Recentes Mobile */}
            <Card className="border border-border bg-card">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-600" />
                    Atividades Recentes
                  </h2>
                  <button 
                    onClick={() => setActivityOpen(true)}
                    className="text-xs text-primary font-medium"
                  >
                    Ver todas
                  </button>
                </div>
              </div>

              <div className="p-3 space-y-2">
                {/* Cotações Recentes */}
                {recentQuotes.slice(0, 3).map((quote: any) => (
                  <div key={`q-${quote.id}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 active:bg-muted transition-smooth">
                    <div className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/40">
                      <ClipboardList className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{quote.product}</p>
                      <p className="text-xs text-muted-foreground truncate">{quote.supplier} • {quote.bestPrice}</p>
                    </div>
                    <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[quote.status] || 'bg-muted-foreground')} />
                  </div>
                ))}

                {/* Pedidos Recentes */}
                {recentOrders.slice(0, 3).map((order) => (
                  <div key={`o-${order.id}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 active:bg-muted transition-smooth">
                    <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                      <ShoppingCart className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{order.supplier}</p>
                      <p className="text-xs text-muted-foreground truncate">{order.items} itens • {order.total}</p>
                    </div>
                    <div className={cn("w-2 h-2 rounded-full", STATUS_COLORS[order.status] || 'bg-muted-foreground')} />
                  </div>
                ))}

                {recentQuotes.length === 0 && recentOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente</p>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna dos Gráficos */}
            <div className="lg:col-span-2 space-y-6">
              <Suspense fallback={<ChartSkeleton />}>
                <EvolutionChart data={dailyData} period={chartPeriod} onPeriodChange={setChartPeriod} isLoading={false} />
              </Suspense>

              <Suspense fallback={<ChartSkeleton />}>
                <EconomyChart data={economyData} period={chartPeriod} onPeriodChange={setChartPeriod} isLoading={false} />
              </Suspense>
            </div>

            {/* Coluna de Atividades */}
            <div className="lg:col-span-1">
              <DashboardActivities 
                recentQuotes={recentQuotes} 
                recentOrders={recentOrders} 
                onViewAll={() => setActivityOpen(true)} 
              />
            </div>
          </div>
        )}

        {/* Modal de Atividades Completo */}
        <ResponsiveModal 
          open={activityOpen} 
          onOpenChange={setActivityOpen}
          title="Todas as Atividades"
          desktopMaxWidth="lg"
        >
          <div className="space-y-6">
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
                    <div key={quote.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 active:bg-muted transition-colors">
                      <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", STATUS_COLORS[quote.status] || 'bg-muted-foreground')} />
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
                    <div key={order.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 active:bg-muted transition-colors">
                      <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", STATUS_COLORS[order.status] || 'bg-muted-foreground')} />
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
        </ResponsiveModal>
      </div>
    </PageWrapper>
  );
}

export default memo(Dashboard);
