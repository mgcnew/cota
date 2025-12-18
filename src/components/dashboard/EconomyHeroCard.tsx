import { memo } from 'react';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import { formatPercentage } from '@/utils/reportData';

interface EconomyHeroCardProps {
  economiaGerada: number;
  economiaPotencial: number;
  eficienciaEconomia: number;
  crescimentoEconomia: number;
  meta?: number;
}

export const EconomyHeroCard = memo(function EconomyHeroCard({
  economiaGerada,
  economiaPotencial,
  eficienciaEconomia,
  crescimentoEconomia,
  meta = 50000,
}: EconomyHeroCardProps) {
  const progressPercent = meta > 0 ? Math.min((economiaGerada / meta) * 100, 100) : 0;
  const isPositiveGrowth = crescimentoEconomia >= 0;

  return (
    <Card className="relative overflow-hidden border border-emerald-200/70 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-gray-900 dark:to-gray-900 shadow-md md:hover:shadow-lg md:transition-shadow md:duration-150">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 dark:bg-emerald-600 rounded-lg shadow-md">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Economia Total</span>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
            isPositiveGrowth 
              ? "bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-500/30" 
              : "bg-red-200 dark:bg-red-500/20 text-red-800 dark:text-red-400 border border-red-200/70 dark:border-red-500/30"
          )}>
            {isPositiveGrowth ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {formatPercentage(Math.abs(crescimentoEconomia))}
          </div>
        </div>

        {/* Main Value - Destaque máximo */}
        <div className="mb-4">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            {formatCurrency(economiaGerada)}
          </div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-1">
            economizados em cotações
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-700 dark:text-gray-400">Meta mensal</span>
            <span className="font-bold text-gray-900 dark:text-gray-200">{formatPercentage(progressPercent)}</span>
          </div>
          <div className="h-3 bg-emerald-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-500 dark:to-emerald-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-600 dark:text-gray-500">R$ 0</span>
            <span className="font-semibold text-gray-700 dark:text-gray-400">{formatCurrency(meta)}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-500/10">
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 mb-0.5">Potencial</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(economiaPotencial)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 mb-0.5">Eficiência</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatPercentage(eficienciaEconomia)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
});
