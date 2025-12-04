import { useState, useMemo, useCallback } from 'react';
import { LayoutDashboard, Calendar, Filter, BarChart3, DollarSign, Users, Target } from 'lucide-react';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { MetricCard } from '@/components/ui/metric-card';
import { ResponsiveGrid } from '@/components/responsive/ResponsiveGrid';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboard } from '@/hooks/useDashboard';
import { EvolutionChart } from '@/components/dashboard/EvolutionChart';
import { EconomyChart } from '@/components/dashboard/EconomyChart';

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 dias' },
  { value: '1m', label: '1 mês' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '1y', label: '1 ano' },
] as const;

const MONTHS_MAP: Record<string, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 };

const DEFAULT_METRICS = {
  cotacoesAtivas: 0,
  fornecedores: 0,
  economiaGerada: 0,
  taxaAprovacao: 0,
  taxaAtividade: 0,
  crescimentoCotacoes: 0,
  crescimentoEconomia: 0,
  variacaoTaxaAprovacao: 0,
};

export default function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('6m');
  const [evolutionPeriod, setEvolutionPeriod] = useState('7d');
  const [economyPeriod, setEconomyPeriod] = useState('7d');

  const { metrics = DEFAULT_METRICS, monthlyData = [], dailyData = [], isLoading = false } = useDashboard() ?? {};

  const filterDataByPeriod = useCallback((period: string) => {
    if (period === '7d') return dailyData;
    
    const months = MONTHS_MAP[period] || 6;
    let filtered = monthlyData.slice(-months);
    
    if (period === '1y') {
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      filtered = filtered.filter((item: any) => monthNames.indexOf(item.month) >= 9);
    }
    
    return filtered;
  }, [dailyData, monthlyData]);

  const evolutionData = useMemo(() => filterDataByPeriod(evolutionPeriod), [filterDataByPeriod, evolutionPeriod]);
  
  const economyData = useMemo(() => {
    const colors = ['#10b981', '#34d399', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];
    return filterDataByPeriod(economyPeriod).map((item, i) => ({ ...item, fill: colors[i % 6] }));
  }, [filterDataByPeriod, economyPeriod]);

  const formatCurrency = useCallback((value?: number) => {
    const safe = Number.isFinite(value) ? Number(value) : 0;
    return `R$ ${safe.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const getTrend = (value: number, label: string): { value: string; label: string; type: 'positive' | 'negative' | 'neutral' } => ({
    value: `${Math.abs(value)}%`,
    label,
    type: value >= 0 ? 'positive' : 'negative',
  });

  return (
    <PageWrapper>
      <div className="page-container space-y-4 sm:space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                Visão geral e métricas de desempenho
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-full sm:w-[140px] h-10">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Metric Cards */}
        <ResponsiveGrid gap="md" config={{ mobile: 2, tablet: 2, desktop: 4 }}>
          <MetricCard
            title="Cotações Ativas"
            value={metrics.cotacoesAtivas}
            icon={BarChart3}
            variant="default"
            trend={getTrend(metrics.crescimentoCotacoes, 'vs mês anterior')}
          />
          <MetricCard
            title="Economia Gerada"
            value={formatCurrency(metrics.economiaGerada)}
            icon={DollarSign}
            variant="success"
            trend={getTrend(metrics.crescimentoEconomia, 'vs mês anterior')}
          />
          <MetricCard
            title="Fornecedores"
            value={metrics.fornecedores}
            icon={Users}
            variant="info"
            trend={{ value: `${metrics.taxaAtividade}%`, label: 'taxa de atividade', type: 'neutral' }}
          />
          <MetricCard
            title="Taxa Aprovação"
            value={`${metrics.taxaAprovacao}%`}
            icon={Target}
            variant="info"
            trend={getTrend(metrics.variacaoTaxaAprovacao, 'vs mês anterior')}
          />
        </ResponsiveGrid>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <EvolutionChart
            data={evolutionData}
            period={evolutionPeriod}
            onPeriodChange={setEvolutionPeriod}
            isLoading={isLoading}
          />
          <EconomyChart
            data={economyData}
            period={economyPeriod}
            onPeriodChange={setEconomyPeriod}
            isLoading={isLoading}
          />
        </div>
      </div>
    </PageWrapper>
  );
}
