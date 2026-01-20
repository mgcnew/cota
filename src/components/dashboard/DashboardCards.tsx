import { memo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileText, Users, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';

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

const COLOR_MAP: Record<string, { bg: string; iconBg: string }> = {
  emerald: { 
    bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600', 
    iconBg: 'bg-white/20'
  },
  blue: { 
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600', 
    iconBg: 'bg-white/20'
  },
  purple: { 
    bg: 'bg-gradient-to-br from-purple-500 to-purple-600', 
    iconBg: 'bg-white/20'
  },
  amber: { 
    bg: 'bg-gradient-to-br from-amber-500 to-amber-600', 
    iconBg: 'bg-white/20'
  },
};

export const DashboardCards = memo(({ metrics }: DashboardCardsProps) => {
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

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const colors = COLOR_MAP[card.color];
        const isPositive = card.trend >= 0;
        return (
          <div 
            key={card.title} 
            className={cn(
              "relative overflow-hidden rounded-xl p-4 text-white",
              "transition-smooth hover:scale-[1.02] hover:shadow-lg", // Added smooth transition and scale
              colors.bg
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn("p-2.5 rounded-xl", colors.iconBg)}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                isPositive 
                  ? "bg-white/20" 
                  : "bg-red-400/30"
              )}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(card.trend).toFixed(1)}%
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl lg:text-3xl font-bold tracking-tight">{card.value}</p>
              <p className="text-sm font-medium text-white/90">{card.title}</p>
              <p className="text-xs text-white/70">{card.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
});
