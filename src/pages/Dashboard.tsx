import { useState, useMemo, useCallback } from 'react';
import {
    BarChart3,
    DollarSign,
    Users,
    Target,
    LayoutDashboard,
    Calendar,
    Filter
} from 'lucide-react';

import { PageWrapper } from '@/components/layout/PageWrapper';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useDashboard } from '@/hooks/useDashboard';

import { EvolutionChart } from '@/components/dashboard/EvolutionChart';
import { EconomyChart } from '@/components/dashboard/EconomyChart';
import { useNavigate } from 'react-router-dom';

const DEFAULT_METRICS = {
    cotacoesAtivas: 0,
    fornecedores: 0,
    economiaGerada: 0,
    economiaPotencial: 0,
    eficienciaEconomia: 0,
    competitividadeMedia: 0,
    mediaFornecedoresParticipantes: 0,
    produtosCotados: 0,
    taxaAtividade: 0,
    taxaAprovacao: 0,
    taxaAprovacaoAnterior: 0,
    variacaoTaxaAprovacao: 0,
    aprovacoesTotal: 0,
    pendenciasTotal: 0,
    rejeicoesTotal: 0,
    crescimentoCotacoes: 0,
    crescimentoEconomia: 0,
    ultimos7DiasCotacoes: [0, 0, 0, 0, 0, 0, 0],
    economiaPorPeriodo: [] as Array<{ key: string; label: string; economiaRealizada: number; economiaPotencial: number; eficienciaEconomia: number; }>,
};

export default function DashboardRefactored() {
    const [selectedPeriod, setSelectedPeriod] = useState('6m');
    const [evolutionPeriod, setEvolutionPeriod] = useState('7d');
    const [economyPeriod, setEconomyPeriod] = useState('7d');
    const navigate = useNavigate();

    // Data Hooks
    const dashboardData = useDashboard();

    // Data Selection
    const metrics = dashboardData?.metrics ?? DEFAULT_METRICS;
    const monthlyData = dashboardData?.monthlyData ?? [];
    const dailyData = dashboardData?.dailyData ?? [];
    const isLoading = dashboardData?.isLoading ?? false;

    // Filter Logic
    const filterDataByPeriod = useCallback((period: string) => {
        if (period === '7d') {
            return dailyData;
        }
        const monthsMap: Record<string, number> = {
            '1m': 1,
            '3m': 3,
            '6m': 6,
            '1y': 12
        };
        const months = monthsMap[period] || 6;
        let filteredData = monthlyData.slice(-months);
        // For larger periods, filter to October onwards
        if (period === '1y') {
            filteredData = filteredData.filter((item: any) => {
                const monthIndex = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].indexOf(item.month);
                return monthIndex >= 9; // October is index 9
            });
        }
        return filteredData;
    }, [dailyData, monthlyData]);

    const evolutionData = useMemo(() => filterDataByPeriod(evolutionPeriod), [filterDataByPeriod, evolutionPeriod]);
    const economyData = useMemo(() => filterDataByPeriod(economyPeriod).map((item, index) => ({
        ...item,
        fill: ['#10b981', '#34d399', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'][index % 6]
    })), [filterDataByPeriod, economyPeriod]);

    // Formatters
    const formatCurrency = useCallback((value?: number) => {
        const safeValue = Number.isFinite(value) ? Number(value) : 0;
        return `R$ ${safeValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, []);

    // Filter Logic (Simplified for now)
    const handlePeriodChange = (value: string) => {
        setSelectedPeriod(value);
        // Implementar lógica de filtro real se necessário
    };

    return (
        <PageWrapper>
            <div className="page-container space-y-4 sm:space-y-6">
                {/* Header Responsivo */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                            <LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                                Dashboard
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                                Visão geral e métricas de desempenho
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                            <SelectTrigger className="w-full sm:w-[140px] h-10">
                                <Calendar className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">7 dias</SelectItem>
                                <SelectItem value="1m">1 mês</SelectItem>
                                <SelectItem value="3m">3 meses</SelectItem>
                                <SelectItem value="6m">6 meses</SelectItem>
                                <SelectItem value="1y">1 ano</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="h-10 w-10 flex-shrink-0">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Cards de Métricas - Responsivos */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                    <MetricCard
                        title="Cotações Ativas"
                        value={metrics.cotacoesAtivas}
                        icon={BarChart3}
                        variant="default"
                        trend={{
                            value: `${Math.abs(metrics.crescimentoCotacoes)}%`,
                            label: "vs mês anterior",
                            type: metrics.crescimentoCotacoes >= 0 ? "positive" : "negative"
                        }}
                    />

                    <MetricCard
                        title="Economia Gerada"
                        value={formatCurrency(metrics.economiaGerada)}
                        icon={DollarSign}
                        variant="success"
                        trend={{
                            value: `${Math.abs(metrics.crescimentoEconomia)}%`,
                            label: "vs mês anterior",
                            type: metrics.crescimentoEconomia >= 0 ? "positive" : "negative"
                        }}
                    />

                    <MetricCard
                        title="Fornecedores"
                        value={metrics.fornecedores}
                        icon={Users}
                        variant="info"
                        trend={{
                            value: `${metrics.taxaAtividade}%`,
                            label: "taxa de atividade",
                            type: "neutral"
                        }}
                    />

                    <MetricCard
                        title="Taxa Aprovação"
                        value={`${metrics.taxaAprovacao}%`}
                        icon={Target}
                        variant="info"
                        trend={{
                            value: `${Math.abs(metrics.variacaoTaxaAprovacao)}%`,
                            label: "vs mês anterior",
                            type: metrics.variacaoTaxaAprovacao >= 0 ? "positive" : "negative"
                        }}
                    />
                </div>

                {/* Gráficos - Responsivos */}
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
