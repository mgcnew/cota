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
import { designSystem } from '@/styles/design-system';

import { DashboardCards } from '@/components/dashboard/DashboardCards';
import { DashboardAlerts } from '@/components/dashboard/DashboardAlerts';
import { DashboardActivities } from '@/components/dashboard/DashboardActivities';

// Lazy load charts
const EvolutionChart = lazy(() => import('@/components/dashboard/EvolutionChart').then(m => ({ default: m.EvolutionChart })));
const EconomyChart = lazy(() => import('@/components/dashboard/EconomyChart').then(m => ({ default: m.EconomyChart })));

// Skeleton
const ChartSkeleton = () => (
  <div className={cn("h-[320px] rounded-xl animate-pulse", designSystem.colors.surface.card)} />
);

// Mapeamento de status usando Design System
const STATUS_STYLES: Record<string, string> = {
  finalizada: designSystem.components.badge.success,
  concluida: designSystem.components.badge.success,
  entregue: designSystem.components.badge.success,
  ativa: designSystem.components.badge.active, // Neon Green
  pendente: designSystem.components.badge.secondary, // Amarelo/Laranja seria warning, mas secondary fica mais clean
  confirmado: designSystem.components.badge.active,
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

  // Cores do gráfico alinhadas ao tema
  const economyData = useMemo(() => {
    return dailyData.map((item: any, i: number) => ({
      ...item,
      fill: [designSystem.colors.brand.primary, '#ffffff', '#a1a1aa'][i % 3]
    }));
  }, [dailyData]);

  if (isLoading || !metrics) {
    return (
      <PageWrapper>
        <div className={cn(designSystem.layout.container.page, "animate-pulse")}>
          <div className="h-8 w-40 bg-muted rounded" />
          <div className={designSystem.layout.container.grid}>
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-muted rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      <div className={designSystem.layout.container.page}>
        {/* Header - Alinhado com Topbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl border border-border/50 bg-accent/10">
              <TrendingUp className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h1 className={cn(designSystem.typography.size["2xl"], designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
                Dashboard
              </h1>
              <p className={cn(designSystem.typography.size.sm, designSystem.colors.text.secondary)}>
                Visão geral das suas operações
              </p>
            </div>
          </div>
        </div>

        {/* Cards de Métricas */}
        <DashboardCards metrics={metrics} />

        {/* Alertas */}
        <DashboardAlerts
          prontasParaDecisao={quotesStats.prontasParaDecisao.map(q => ({ id: q.id, dataFim: q.dataFim }))}
          vencendo={quotesStats.vencendo.map(q => ({ id: q.id, dataFim: q.dataFim }))}
        />

        {/* Layout Principal Mobile/Desktop */}
        {isMobile ? (
          <div className={designSystem.layout.container.section}>
            {/* Ações Rápidas Mobile */}
            <Card className={designSystem.components.card.root}>
              <div className={designSystem.components.card.header}>
                <h2 className={cn(designSystem.typography.size.sm, designSystem.typography.weight.semibold, "flex items-center gap-2")}>
                  <Bell className="w-4 h-4 text-brand" />
                  Ações Rápidas
                </h2>
              </div>
              <div className={designSystem.components.card.body}>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className={cn(designSystem.components.button.secondary, "h-auto py-3 flex-col gap-2 font-normal")}
                    onClick={() => navigate('/dashboard/compras?tab=cotacoes')}
                  >
                    <ClipboardList className="h-5 w-5 text-brand" />
                    <span>Nova Cotação</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(designSystem.components.button.secondary, "h-auto py-3 flex-col gap-2 font-normal")}
                    onClick={() => navigate('/dashboard/compras?tab=pedidos')}
                  >
                    <ShoppingCart className="h-5 w-5 text-zinc-500" />
                    <span>Novo Pedido</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(designSystem.components.button.secondary, "h-auto py-3 flex-col gap-2 font-normal")}
                    onClick={() => navigate('/dashboard/produtos')}
                  >
                    <Package className="h-5 w-5 text-zinc-500" />
                    <span>Produtos</span>
                  </Button>
                  <Button
                    variant="outline"
                    className={cn(designSystem.components.button.secondary, "h-auto py-3 flex-col gap-2 font-normal")}
                    onClick={() => navigate('/dashboard/fornecedores')}
                  >
                    <Users className="h-5 w-5 text-zinc-500" />
                    <span>Fornecedores</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Atividades Recentes Mobile */}
            <Card className={designSystem.components.card.root}>
              <div className={designSystem.components.card.header}>
                <h2 className={cn(designSystem.typography.size.sm, designSystem.typography.weight.semibold, "flex items-center gap-2")}>
                  <Clock className="w-4 h-4 text-zinc-500" />
                  Atividades Recentes
                </h2>
                <button
                  onClick={() => setActivityOpen(true)}
                  className={cn(designSystem.typography.size.xs, "text-brand font-medium hover:underline")}
                >
                  Ver todas
                </button>
              </div>

              <div className="p-3 space-y-2">
                {/* Cotações Recentes */}
                {recentQuotes.slice(0, 3).map((quote: any) => (
                  <div key={`q-${quote.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="p-2 rounded-lg bg-brand/10">
                      <ClipboardList className="w-3.5 h-3.5 text-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(designSystem.typography.size.sm, designSystem.typography.weight.medium, "truncate")}>{quote.product}</p>
                      <p className={cn(designSystem.typography.size.xs, designSystem.colors.text.secondary, "truncate")}>{quote.supplier} • {quote.bestPrice}</p>
                    </div>
                    {/* Status Dot */}
                    <div className={cn("w-2 h-2 rounded-full", quote.status === 'ativa' ? "bg-brand" : "bg-muted-foreground/30")} />
                  </div>
                ))}

                {recentQuotes.length === 0 && (
                  <p className={cn(designSystem.typography.size.sm, designSystem.colors.text.muted, "text-center py-4")}>Nenhuma atividade recente</p>
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

        {/* Modal Completamente Refatorado */}
        <ResponsiveModal
          open={activityOpen}
          onOpenChange={setActivityOpen}
          title="Todas as Atividades"
          desktopMaxWidth="lg"
        >
          <div className="space-y-6">
            {/* Seção Cotações */}
            <div className={designSystem.layout.container.section}>
              <h3 className={cn(designSystem.typography.size.xs, designSystem.typography.weight.bold, designSystem.colors.text.secondary, "uppercase tracking-wider mb-4 flex items-center gap-2")}>
                <ClipboardList className="w-4 h-4" /> Cotações Recentes
              </h3>
              <div className="space-y-2">
                {recentQuotes.map((quote: any) => (
                  <div key={quote.id} className={cn("flex items-start gap-3 p-3 rounded-lg border", designSystem.colors.border.subtle, "hover:border-brand/30 transition-colors")}>
                    <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0", quote.status === 'ativa' ? "bg-brand" : "bg-muted-foreground/30")} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(designSystem.typography.size.sm, designSystem.typography.weight.medium)}>{quote.product}</p>
                      <p className={cn(designSystem.typography.size.xs, designSystem.colors.text.secondary)}>{quote.supplier} • {quote.bestPrice}</p>
                      <p className={cn(designSystem.typography.size.xs, designSystem.colors.text.muted, "mt-1")}>{quote.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ResponsiveModal>
      </div>
    </PageWrapper>
  );
}

export default memo(Dashboard);
