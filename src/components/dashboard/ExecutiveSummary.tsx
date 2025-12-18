import { memo } from 'react';
import { CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ExecutiveSummaryProps {
  cotacoesAtivas: number;
  aprovacoesTotal: number;
  pendenciasTotal: number;
  pendenciasAtrasadas: number;
  taxaAprovacao: number;
  taxaAprovacaoMeta: number;
}

// Modo claro: cores vibrantes com bordas suaves | Modo escuro: fundo neutro escuro
const STAT_STYLES = {
  blue: {
    bg: 'bg-blue-100 dark:bg-gray-800/60',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border border-blue-200/70 dark:border-blue-500/20',
  },
  emerald: {
    bg: 'bg-emerald-100 dark:bg-gray-800/60',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border border-emerald-200/70 dark:border-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-gray-800/60',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border border-amber-200/70 dark:border-amber-500/20',
  },
} as const;

type ColorKey = keyof typeof STAT_STYLES;

export const ExecutiveSummary = memo(function ExecutiveSummary({
  cotacoesAtivas,
  aprovacoesTotal,
  pendenciasTotal,
  pendenciasAtrasadas,
  taxaAprovacao,
  taxaAprovacaoMeta,
}: ExecutiveSummaryProps) {
  const isAboveMeta = taxaAprovacao >= taxaAprovacaoMeta;
  
  const statsData: Array<{
    key: string;
    label: string;
    value: number;
    icon: typeof Clock;
    color: ColorKey;
    badge?: string;
  }> = [
    { key: 'andamento', label: 'Em andamento', value: cotacoesAtivas, icon: Clock, color: 'blue' },
    { key: 'aprovadas', label: 'Aprovadas', value: aprovacoesTotal, icon: CheckCircle2, color: 'emerald' },
    { 
      key: 'pendentes', 
      label: 'Pendentes', 
      value: pendenciasTotal, 
      icon: AlertCircle, 
      color: 'amber',
      badge: pendenciasAtrasadas > 0 ? `${pendenciasAtrasadas} atrasadas` : undefined,
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-blue-100 to-indigo-50 dark:from-gray-900 dark:to-gray-900 border border-blue-200/70 dark:border-blue-500/20 shadow-md md:hover:shadow-lg md:transition-shadow md:duration-150">
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 bg-blue-600 dark:bg-blue-600 rounded-lg shadow-md flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-blue-800 dark:text-blue-400 truncate">
              Resumo de Cotações
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap flex-shrink-0",
            isAboveMeta 
              ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-500/30"
              : "bg-amber-200 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200/70 dark:border-amber-500/30"
          )}>
            <span>{taxaAprovacao}%</span>
            <span className="hidden sm:inline opacity-80">/ meta {taxaAprovacaoMeta}%</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {statsData.map(({ key, label, value, icon: Icon, color, badge }) => {
            const styles = STAT_STYLES[color];
            return (
              <div key={key} className={cn("rounded-lg p-2 sm:p-3 text-center", styles.bg, styles.border)}>
                <Icon className={cn("w-4 h-4 mx-auto mb-1", styles.icon)} />
                <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100">{value}</p>
                <p className="text-[9px] sm:text-xs font-semibold text-gray-700 dark:text-gray-400 leading-tight">{label}</p>
                {badge && (
                  <span className="inline-block mt-1 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[9px] font-bold bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 rounded border border-amber-200/70 dark:border-amber-500/30">
                    {badge}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
});
