import { useState, useMemo, memo } from 'react';
import { LayoutDashboard } from 'lucide-react';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDashboard } from '@/hooks/useDashboard';
import { usePedidos } from '@/hooks/usePedidos';
import { useCotacoes } from '@/hooks/useCotacoes';
import { cn } from '@/lib/utils';
import { ResponsiveModal } from '@/components/responsive/ResponsiveModal';
import { designSystem as ds } from '@/styles/design-system';

import { DashboardActionRow } from '@/components/dashboard/DashboardActionRow';
import { DashboardOverviewChart } from '@/components/dashboard/DashboardOverviewChart';
import { DashboardOperationsBoard } from '@/components/dashboard/DashboardOperationsBoard';
import { DashboardIntelligenceBoard } from '@/components/dashboard/DashboardIntelligenceBoard';

// Cores para skeletons e status 
const STATUS_STYLES: Record<string, string> = {
  finalizada: ds.components.badge.success,
  concluida: ds.components.badge.success,
  entregue: ds.components.badge.success,
  ativa: ds.components.badge.active, // Neon Green
  pendente: ds.components.badge.secondary,
  confirmado: ds.components.badge.active,
};

function Dashboard() {
  const [activityOpen, setActivityOpen] = useState(false);

  const dashboardData = useDashboard();
  const { pedidos } = usePedidos();
  const { cotacoes } = useCotacoes();
  const metrics = dashboardData?.metrics;
  const recentQuotes = dashboardData?.recentQuotes ?? [];
  const topSuppliers = dashboardData?.topSuppliers ?? [];
  const isLoading = dashboardData?.isLoading ?? true;

  // 1. Cotações prontas para decisão e vencendo
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
      
      // Parse local sem offset UTC/ISO
      const [d, m, y] = c.dataFim.split('/').map(Number);
      const dataFim = new Date(y, m - 1, d);
      
      return dataFim <= em48h && dataFim >= hoje;
    });

    return { prontasParaDecisao, vencendo };
  }, [cotacoes]);

  // Série real dos últimos 3 meses de economia (2 meses atrás → mês anterior → mês atual)
  const economiaSparkline = useMemo(() => {
    const periodos = metrics?.economiaPorPeriodo;
    if (!periodos || periodos.length === 0) return undefined;
    return [...periodos].reverse().map((p: any) => p.economiaRealizada);
  }, [metrics?.economiaPorPeriodo]);

  // 2. Pedidos pendentes/em trânsito
  const pendingOrdersList = useMemo(() => {
    return (pedidos || [])
      .filter((p: any) => p.status === 'pendente' || p.status === 'confirmado' || p.status === 'em_transito')
      .slice(0, 5)
      .map((p: any) => ({
        id: p.id.substring(0, 8),
        supplier_name: p.supplier_name,
        total_value: p.total_value,
        status: p.status,
        order_date: p.order_date,
        items: p.items
      }));
  }, [pedidos]);

  // 3. Cotações Ativas
  const activeQuotesList = useMemo(() => {
    return cotacoes
      .filter((c: any) => c.statusReal === 'ativa' || c.status === 'pendente')
      .slice(0, 5)
      .map((c: any) => ({
        id: c.id,
        produtoResumo: c.produtoResumo,
        produto: c.produto,
        dataFim: c.dataFim,
        status: c.status,
        fornecedores: c.fornecedores,
        melhorPreco: c.melhorPreco,
        statusReal: c.statusReal
      }));
  }, [cotacoes]);

  if (isLoading || !metrics) {
    return (
      <PageWrapper>
        <div className={cn(ds.layout.container.page, "animate-pulse")}>
          <div className="h-12 w-1/3 bg-muted rounded mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-[140px] bg-muted/50 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-[500px] bg-muted/40 rounded-xl" />
            <div className="h-[500px] bg-muted/40 rounded-xl" />
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className={cn(ds.layout.container.page, "lg:flex lg:flex-col lg:min-h-[calc(100vh-3.5rem)]")}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 md:mb-6 pb-3 md:pb-5 md:border-b border-zinc-200/70 dark:border-zinc-800">
          <div className="hidden sm:flex p-2.5 rounded-xl border transition-all bg-card border-border">
            <LayoutDashboard className="h-5 w-5 text-brand" />
          </div>
          <div>
            <p className={cn(ds.colors.text.muted, "text-xs")}>
              Centro de operações
            </p>
          </div>
        </div>

        {/* Linha 1: Métricas de Ação */}
        <DashboardActionRow
          prontasParaDecisao={quotesStats.prontasParaDecisao}
          vencendo={quotesStats.vencendo}
          pedidosEmTransito={pendingOrdersList.length}
          economiaGerada={metrics.economiaGerada}
          economiaCrescimento={metrics.crescimentoEconomia}
          economiaSparkline={economiaSparkline}
        />

        {/* Linha 2: Visão Geral (gráfico) + Inteligência; Pátio de Operações abaixo do gráfico.
            flex-1 faz essa linha esticar até o fim do espaço disponível na viewport (como a
            sidebar), sem deixar vão vazio abaixo dos cards quando o conteúdo é curto. */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:flex-1 lg:min-h-0 lg:items-stretch">
          {/* Lado Esquerdo 65%: Gráfico + Pátio */}
          <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
            <DashboardOverviewChart data={dashboardData.monthlyData} />
            <DashboardOperationsBoard
              activeQuotes={activeQuotesList}
              pendingOrders={pendingOrdersList}
            />
          </div>

          {/* Lado Direito 35%: Inteligência Rápida */}
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <DashboardIntelligenceBoard
               topSuppliers={topSuppliers.length ? topSuppliers.slice(0,3) : []}
               recentQuotes={recentQuotes}
               onViewAllActivities={() => setActivityOpen(true)}
            />
          </div>
        </div>

        {/* Modal de Histórico Refinado (Mantido do anterior, apenas como fallback) */}
        <ResponsiveModal
          open={activityOpen}
          onOpenChange={setActivityOpen}
          title="Histórico Completo"
          desktopMaxWidth="md"
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
            {recentQuotes.map((quote: any) => (
              <div key={quote.id} className={cn("flex items-start gap-4 p-4 rounded-xl border bg-muted/10", ds.colors.border.subtle, "hover:border-primary/30 transition-colors")}>
                <div className={cn("w-3 h-3 rounded-full mt-1.5 flex-shrink-0", quote.status === 'ativa' ? "bg-blue-500" : quote.status === 'concluida' ? "bg-emerald-500" : "bg-zinc-400")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, "truncate")}>{quote.product}</p>
                    <span className={cn(ds.typography.size.xs, ds.colors.text.muted, "shrink-0")}>{quote.date}</span>
                  </div>
                  <p className={cn(ds.typography.size.xs, ds.colors.text.secondary)}>{quote.supplier} • {quote.bestPrice}</p>
                </div>
              </div>
            ))}
          </div>
        </ResponsiveModal>

      </div>
    </PageWrapper>
  );
}

export default memo(Dashboard);
