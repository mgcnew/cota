import { useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Plus, ShoppingCart } from 'lucide-react';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { useDashboard } from '@/hooks/useDashboard';
import { usePedidos } from '@/hooks/usePedidos';
import { useCotacoes } from '@/hooks/useCotacoes';
import { cn } from '@/lib/utils';
import { ResponsiveModal } from '@/components/responsive/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { designSystem } from '@/styles/design-system';

import { DashboardActionRow } from '@/components/dashboard/DashboardActionRow';
import { DashboardOperationsBoard } from '@/components/dashboard/DashboardOperationsBoard';
import { DashboardIntelligenceBoard } from '@/components/dashboard/DashboardIntelligenceBoard';

// Cores para skeletons e status 
const STATUS_STYLES: Record<string, string> = {
  finalizada: designSystem.components.badge.success,
  concluida: designSystem.components.badge.success,
  entregue: designSystem.components.badge.success,
  ativa: designSystem.components.badge.active, // Neon Green
  pendente: designSystem.components.badge.secondary,
  confirmado: designSystem.components.badge.active,
};

function Dashboard() {
  const navigate = useNavigate();
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
      const dataFim = new Date(c.dataFim.split('/').reverse().join('-'));
      return dataFim <= em48h && dataFim >= hoje;
    });

    return { prontasParaDecisao, vencendo };
  }, [cotacoes]);

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
        <div className={cn(designSystem.layout.container.page, "animate-pulse")}>
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
      <div className={cn(designSystem.layout.container.page, "animate-in fade-in zoom-in-95 duration-500")}>
        
        {/* Header - Command Center Style */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20">
              <TrendingUp className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h1 className={cn(designSystem.typography.size["2xl"], "font-bold text-foreground")}>
                Resumo de Hoje
              </h1>
              <p className={cn(designSystem.colors.text.secondary, "text-sm mt-0.5")}>
                Bem-vindo ao seu centro de operações.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Button 
              onClick={() => navigate('/dashboard/compras?tab=cotacoes')}
              className={cn(designSystem.components.button.primary, "font-bold text-white dark:text-zinc-950")}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nova Cotação
            </Button>
            <Button 
              onClick={() => navigate('/dashboard/compras?tab=pedidos')}
              variant="outline"
              className="flex-1 sm:flex-none border-border"
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Novo Pedido
            </Button>
          </div>
        </div>

        {/* Linha 1: Prioridades de Ação Focadas no "Agora" */}
        <DashboardActionRow 
          prontasParaDecisao={quotesStats.prontasParaDecisao}
          vencendo={quotesStats.vencendo}
          pedidosEmTransito={pendingOrdersList.length}
          economiaGerada={metrics.economiaGerada}
        />

        {/* Linha 2: Pátio de Operações e Inteligência */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
          {/* Lado Esquerdo 65%: O Pátio */}
          <div className="lg:col-span-2 flex flex-col h-full">
            <DashboardOperationsBoard 
              activeQuotes={activeQuotesList}
              pendingOrders={pendingOrdersList}
            />
          </div>
          
          {/* Lado Direito 35%: Inteligência Rápida */}
          <div className="lg:col-span-1 flex flex-col h-full">
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
              <div key={quote.id} className={cn("flex items-start gap-4 p-4 rounded-xl border bg-muted/10", designSystem.colors.border.subtle, "hover:border-primary/30 transition-colors")}>
                <div className={cn("w-3 h-3 rounded-full mt-1.5 flex-shrink-0", quote.status === 'ativa' ? "bg-blue-500" : quote.status === 'finalizada' ? "bg-emerald-500" : "bg-zinc-400")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={cn(designSystem.typography.size.sm, designSystem.typography.weight.bold, "truncate")}>{quote.product}</p>
                    <span className={cn(designSystem.typography.size.xs, designSystem.colors.text.muted, "shrink-0")}>{quote.date}</span>
                  </div>
                  <p className={cn(designSystem.typography.size.xs, designSystem.colors.text.secondary)}>{quote.supplier} • {quote.bestPrice}</p>
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
