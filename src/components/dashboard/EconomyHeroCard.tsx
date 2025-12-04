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
    <Card className="relative overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 shadow-md hover:shadow-lg shadow-emerald-100 dark:shadow-emerald-900/50 transition-all duration-200">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 dark:bg-emerald-500 rounded-lg shadow-md">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Economia Total</span>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
            isPositiveGrowth 
              ? "bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300" 
              : "bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300"
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
          <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {formatCurrency(economiaGerada)}
          </div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mt-1">
            economizados em cotações
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-gray-600 dark:text-gray-400">Meta mensal</span>
            <span className="font-bold text-gray-900 dark:text-white">{formatPercentage(progressPercent)}</span>
          </div>
          <div className="h-2.5 bg-emerald-200 dark:bg-emerald-800/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-500 dark:text-gray-500">R$ 0</span>
            <span className="font-medium text-gray-600 dark:text-gray-400">{formatCurrency(meta)}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/50">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Potencial</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(economiaPotencial)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Eficiência</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPercentage(eficienciaEconomia)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
});
