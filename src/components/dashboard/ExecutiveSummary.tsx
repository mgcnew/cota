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

interface StatItem {
  key: string;
  label: string;
  value: number;
  icon: typeof Clock;
  baseColor: string;
  hasWarning?: boolean;
  badge?: string;
}

export const ExecutiveSummary = memo(function ExecutiveSummary({
  cotacoesAtivas,
  aprovacoesTotal,
  pendenciasTotal,
  pendenciasAtrasadas,
  taxaAprovacao,
  taxaAprovacaoMeta,
}: ExecutiveSummaryProps) {
  const isAboveMeta = taxaAprovacao >= taxaAprovacaoMeta;
  
  const statsData: StatItem[] = [
    { key: 'andamento', label: 'Em andamento', value: cotacoesAtivas, icon: Clock, baseColor: 'blue' },
    { key: 'aprovadas', label: 'Aprovadas', value: aprovacoesTotal, icon: CheckCircle2, baseColor: 'emerald' },
    { 
      key: 'pendentes', 
      label: 'Pendentes', 
      value: pendenciasTotal, 
      icon: AlertCircle, 
      baseColor: 'amber',
      hasWarning: pendenciasAtrasadas > 0,
      badge: pendenciasAtrasadas > 0 ? `${pendenciasAtrasadas} atrasadas` : undefined,
    },
  ];

  return (
    <Card className="bg-card border-2 border-blue-200 dark:border-blue-800 shadow-md hover:shadow-lg shadow-blue-100 dark:shadow-blue-900/50 transition-all duration-200">
      <div className="p-4 sm:p-5">
        {/* Header with approval rate */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 bg-blue-600 dark:bg-blue-500 rounded-lg shadow-md flex-shrink-0">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 truncate">
              Resumo de Cotações
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap flex-shrink-0",
            isAboveMeta 
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
              : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
          )}>
            <span>{taxaAprovacao}%</span>
            <span className="hidden sm:inline opacity-70">/ meta {taxaAprovacaoMeta}%</span>
          </div>
        </div>

        {/* Stats Grid - Responsivo */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {statsData.map(({ key, label, value, icon: Icon, baseColor, hasWarning, badge }) => {
            const colorClass = hasWarning ? 'amber' : baseColor;
            return (
              <div 
                key={key} 
                className={cn(
                  "rounded-lg p-2 sm:p-3 text-center transition-colors",
                  `bg-${colorClass}-50 dark:bg-${colorClass}-950/30`
                )}
                style={{
                  backgroundColor: hasWarning 
                    ? 'rgb(255 251 235)' 
                    : colorClass === 'blue' 
                      ? 'rgb(239 246 255)' 
                      : 'rgb(236 253 245)',
                }}
              >
                <Icon className={cn(
                  "w-4 h-4 mx-auto mb-1",
                  hasWarning 
                    ? "text-amber-600 dark:text-amber-400" 
                    : colorClass === 'blue'
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-emerald-600 dark:text-emerald-400"
                )} />
                <p className="text-base sm:text-xl font-bold text-foreground">{value}</p>
                <p className="text-[9px] sm:text-xs text-muted-foreground leading-tight">{label}</p>
                {badge && (
                  <span className="inline-block mt-1 px-1 sm:px-1.5 py-0.5 text-[8px] sm:text-[9px] font-medium bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 rounded">
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
