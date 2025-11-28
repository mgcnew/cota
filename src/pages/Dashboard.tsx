import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useDashboard } from '@/hooks/useDashboard';

import { EvolutionChart } from '@/components/dashboard/EvolutionChart';
import { EconomyChart } from '@/components/dashboard/EconomyChart';

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
            <div className="page-container">
                {/* Cards de Métricas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                        title="Taxa de Aprovação"
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

                {/* Page Header */}
                <PageHeader
                    title="Dashboard"
                    description="Visão geral e métricas principais de desempenho."
                    icon={LayoutDashboard}
                    actions={
                        <div className="flex items-center gap-2">
                            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                                <SelectTrigger className="w-[140px]">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Período" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                                    <SelectItem value="1m">Último mês</SelectItem>
                                    <SelectItem value="3m">3 meses</SelectItem>
                                    <SelectItem value="6m">6 meses</SelectItem>
                                    <SelectItem value="1y">1 ano</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    }
                />

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
