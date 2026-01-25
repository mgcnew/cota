import { memo } from 'react';
import { DollarSign, FileText, Users, Package } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { MetricCard } from '@/components/ui/metric-card';

interface DashboardMetrics {
  economiaGerada: number;
  crescimentoEconomia: number;
  economiaPotencial: number;
  cotacoesAtivas: number;
  crescimentoCotacoes: number;
  aprovacoesTotal: number;
  fornecedores: number;
  taxaAtividade: number;
  produtosCotados: number;
  competitividadeMedia: number;
}

interface DashboardCardsProps {
  metrics: DashboardMetrics;
}

export const DashboardCards = memo(({ metrics }: DashboardCardsProps) => {
  const cards = [
    {
      title: 'Economia Gerada',
      value: formatCurrency(metrics.economiaGerada),
      icon: DollarSign,
      variant: 'success' as const,
      trend: {
        value: `${Math.abs(metrics.crescimentoEconomia).toFixed(1)}%`,
        type: (metrics.crescimentoEconomia >= 0 ? 'positive' : 'negative') as "positive" | "negative" | "neutral",
        label: `Potencial: ${formatCurrency(metrics.economiaPotencial)}`
      }
    },
    {
      title: 'Cotações Ativas',
      value: metrics.cotacoesAtivas,
      icon: FileText,
      variant: 'info' as const,
      trend: {
        value: `${Math.abs(metrics.crescimentoCotacoes).toFixed(1)}%`,
        type: (metrics.crescimentoCotacoes >= 0 ? 'positive' : 'negative') as "positive" | "negative" | "neutral",
        label: `${metrics.aprovacoesTotal} aprovadas no período`
      }
    },
    {
      title: 'Fornecedores',
      value: metrics.fornecedores,
      icon: Users,
      variant: 'default' as const,
      trend: {
        value: `${metrics.taxaAtividade}%`,
        type: (metrics.taxaAtividade >= 50 ? 'positive' : 'neutral') as "positive" | "negative" | "neutral",
        label: 'Participando ativamente'
      }
    },
    {
      title: 'Produtos Cotados',
      value: metrics.produtosCotados,
      icon: Package,
      variant: 'warning' as const,
      trend: {
        value: `${metrics.competitividadeMedia}%`,
        type: (metrics.competitividadeMedia >= 70 ? 'positive' : 'neutral') as "positive" | "negative" | "neutral",
        label: 'Boa competitividade'
      }
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <MetricCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          trend={card.trend}
          variant={card.variant}
        />
      ))}
    </div>
  );
});
