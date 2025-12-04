import { useState, useMemo, useCallback, memo } from 'react';
import { LayoutDashboard, Calendar, BarChart3, Users, Target, FileText } from 'lucide-react';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { MetricCard } from '@/components/ui/metric-card';
import { ResponsiveGrid } from '@/components/responsive/ResponsiveGrid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboard } from '@/hooks/useDashboard';
import { EvolutionChart } from '@/components/dashboard/EvolutionChart';
import { EconomyChart } from '@/components/dashboard/EconomyChart';
import { EconomyHeroCard } from '@/components/dashboard/EconomyHeroCard';
import { ExecutiveSummary } from '@/components/dashboard/ExecutiveSummary';

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 dias' },
  { value: '1m', label: '1 mês' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '1y', label: '1 ano' },
] as const;

const MONTHS_MAP: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };
const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const CHART_COLORS = ['#10b981', '#34d399', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];

const DEFAULT_METRICS = {
  cotacoesAtivas: 0,
  fornecedores: 0,
  economiaGerada: 0,
  economiaPotencial: 0,
  eficienciaEconomia: 0,
  taxaAprovacao: 0,
  taxaAtividade: 0,
  crescimentoCotacoes: 0,
  crescimentoEconomia: 0,
  variacaoTaxaAprovacao: 0,
  aprovacoesTotal: 0,
  pendenciasTotal: 0,
  pendenciasAtrasadas: 0,
  taxaAprovacaoMeta: 75,
  produtosCotados: 0,
  competitividadeMedia: 0,
};

type TrendType = { value: string; label: string; type: 'positive' | 'negative' | 'neutral' };

const getTrend = (value: number, label: string): TrendType => ({
  value: `${Math.abs(value)}%`,
  label,
  type: value >= 0 ? 'positive' : 'negative',
});

// Skeleton para loading
const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Skeleton className="h-[220px] sm:h-[260px] rounded-xl" />
        <Skeleton className="h-[220px] sm:h-[260px] rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[100px] sm:h-[120px] rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <Skeleton className="h-[280px] sm:h-[340px] lg:col-span-2 rounded-xl" />
        <Skeleton className="h-[280px] sm:h-[340px] rounded-xl" />
      </div>
    </div>
  );
});

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [evolutionPeriod, setEvolutionPeriod] = useState('7d');
  const [economyPeriod, setEconomyPeriod] = useState('7d');

  const dashboardData = useDashboard();
  const metrics = dashboardData?.metrics ?? DEFAULT_METRICS;
  const monthlyData = dashboardData?.monthlyData ?? [];
  const dailyData = dashboardData?.dailyData ?? [];
  const isLoading = dashboardData?.isLoading ?? true;

  const filterDataByPeriod = useCallback((period: string) => {
    if (period === '7d') return dailyData;
    const months = MONTHS_MAP[period] || 6;
    let filtered = monthlyData.slice(-months);
    if (period === '1y') {
      filtered = filtered.filter((item: any) => MONTH_NAMES.indexOf(item.month) >= 9);
    }
    return filtered;
  }, [dailyData, monthlyData]);

  const evolutionData = useMemo(() => filterDataByPeriod(evolutionPeriod), [filterDataByPeriod, evolutionPeriod]);
  
  const economyData = useMemo(() => 
    filterDataByPeriod(economyPeriod).map((item, i) => ({ ...item, fill: CHART_COLORS[i % 6] })),
    [filterDataByPeriod, economyPeriod]
  );

  // Memoizar trends para evitar recálculos
  const trends = useMemo(() => ({
    cotacoes: getTrend(metrics.crescimentoCotacoes, 'vs mês anterior'),
    fornecedores: { value: `${metrics.taxaAtividade}%`, label: 'ativos', type: 'neutral' as const },
    produtos: { value: `${metrics.competitividadeMedia}%`, label: 'competitividade', type: 'neutral' as const },
    aprovacao: getTrend(metrics.variacaoTaxaAprovacao, 'vs mês anterior'),
  }), [metrics.crescimentoCotacoes, metrics.taxaAtividade, metrics.competitividadeMedia, metrics.variacaoTaxaAprovacao]);

  return (
    <PageWrapper>
      <div className="page-container space-y-4 sm:space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
              <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Dashboard Executivo</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Visão geral de desempenho e economia
              </p>
            </div>
          </div>
          
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-[140px] h-10 flex-shrink-0">
              <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Hero Section - Economy + Summary */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <EconomyHeroCard
                economiaGerada={metrics.economiaGerada}
                economiaPotencial={metrics.economiaPotencial}
                eficienciaEconomia={metrics.eficienciaEconomia}
                crescimentoEconomia={metrics.crescimentoEconomia}
              />
              <ExecutiveSummary
                cotacoesAtivas={metrics.cotacoesAtivas}
                aprovacoesTotal={metrics.aprovacoesTotal}
                pendenciasTotal={metrics.pendenciasTotal}
                pendenciasAtrasadas={metrics.pendenciasAtrasadas}
                taxaAprovacao={metrics.taxaAprovacao}
                taxaAprovacaoMeta={metrics.taxaAprovacaoMeta}
              />
            </section>

            {/* Secondary Metrics */}
            <section>
              <ResponsiveGrid gap="md" config={{ mobile: 2, tablet: 2, desktop: 4 }}>
                <MetricCard
                  title="Cotações Ativas"
                  value={metrics.cotacoesAtivas}
                  icon={FileText}
                  variant="default"
                  trend={trends.cotacoes}
                />
                <MetricCard
                  title="Fornecedores"
                  value={metrics.fornecedores}
                  icon={Users}
                  variant="info"
                  trend={trends.fornecedores}
                />
                <MetricCard
                  title="Produtos Cotados"
                  value={metrics.produtosCotados}
                  icon={BarChart3}
                  variant="warning"
                  trend={trends.produtos}
                />
                <MetricCard
                  title="Taxa Aprovação"
                  value={`${metrics.taxaAprovacao}%`}
                  icon={Target}
                  variant="success"
                  trend={trends.aprovacao}
                />
              </ResponsiveGrid>
            </section>

            {/* Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <EvolutionChart
                data={evolutionData}
                period={evolutionPeriod}
                onPeriodChange={setEvolutionPeriod}
                isLoading={false}
              />
              <EconomyChart
                data={economyData}
                period={economyPeriod}
                onPeriodChange={setEconomyPeriod}
                isLoading={false}
              />
            </section>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
