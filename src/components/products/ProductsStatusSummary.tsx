import { memo } from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ProductsStatusSummaryProps {
  ativos: number;
  cotados: number;
  pendentes: number;
  semCotacao: number;
  topCategoria: { nome: string; count: number } | null;
}

// Modo claro: cores vibrantes com bordas suaves | Modo escuro: fundo neutro escuro
const STATUS_STYLES = {
  emerald: {
    bg: 'bg-emerald-100 dark:bg-gray-800/60',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border border-emerald-200/70 dark:border-emerald-500/20',
  },
  blue: {
    bg: 'bg-blue-100 dark:bg-gray-800/60',
    icon: 'text-blue-600 dark:text-blue-400',
    border: 'border border-blue-200/70 dark:border-blue-500/20',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-gray-800/60',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border border-amber-200/70 dark:border-amber-500/20',
  },
  red: {
    bg: 'bg-red-100 dark:bg-gray-800/60',
    icon: 'text-red-600 dark:text-red-400',
    border: 'border border-red-200/70 dark:border-red-500/20',
  },
} as const;

type ColorKey = keyof typeof STATUS_STYLES;

export const ProductsStatusSummary = memo(function ProductsStatusSummary({
  ativos,
  cotados,
  pendentes,
  semCotacao,
  topCategoria,
}: ProductsStatusSummaryProps) {
  const total = ativos + cotados + pendentes + semCotacao;
  const healthScore = total > 0 ? Math.round(((ativos + cotados) / total) * 100) : 0;
  const isHealthy = healthScore >= 60;

  const statsData: Array<{
    key: string;
    label: string;
    value: number;
    icon: typeof Clock;
    color: ColorKey;
  }> = [
    { key: 'ativos', label: '3+ cotações', value: ativos, icon: CheckCircle2, color: 'emerald' },
    { key: 'cotados', label: '1-2 cotações', value: cotados, icon: Clock, color: 'blue' },
    { key: 'pendentes', label: 'Pendentes', value: pendentes, icon: AlertCircle, color: 'amber' },
    { key: 'semCotacao', label: 'Sem cotação', value: semCotacao, icon: XCircle, color: 'red' },
  ];

  return (
    <Card className="bg-orange-50/60 dark:bg-gray-900 border border-orange-200/70 dark:border-orange-500/20 shadow-md md:hover:shadow-lg md:transition-shadow md:duration-150">
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 bg-orange-600 dark:bg-orange-600 rounded-lg shadow-md flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-orange-800 dark:text-orange-400 truncate">
              Status dos Produtos
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold whitespace-nowrap flex-shrink-0",
            isHealthy 
              ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-500/30"
              : "bg-amber-200 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200/70 dark:border-amber-500/30"
          )}>
            <span>{healthScore}% saudável</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {statsData.map(({ key, label, value, icon: Icon, color }) => {
            const styles = STATUS_STYLES[color];
            return (
              <div key={key} className={cn("rounded-lg p-2 sm:p-3 text-center", styles.bg, styles.border)}>
                <Icon className={cn("w-4 h-4 mx-auto mb-1", styles.icon)} />
                <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100">{value}</p>
                <p className="text-[8px] sm:text-[10px] font-semibold text-gray-700 dark:text-gray-400 leading-tight">{label}</p>
              </div>
            );
          })}
        </div>

        {/* Top Categoria */}
        {topCategoria && (
          <div className="mt-3 pt-3 border-t border-orange-200/50 dark:border-orange-500/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-500">Categoria principal:</span>
              <span className="font-bold text-orange-700 dark:text-orange-400">
                {topCategoria.nome} ({topCategoria.count})
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
});
