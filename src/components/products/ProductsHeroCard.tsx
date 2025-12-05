import { memo } from 'react';
import { TrendingUp, TrendingDown, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';

interface ProductsHeroCardProps {
  totalProducts: number;
  productsWithPrice: number;
  averagePrice: number;
  economyPotential: number;
  percentWithQuotes: number;
}

export const ProductsHeroCard = memo(function ProductsHeroCard({
  totalProducts,
  productsWithPrice,
  averagePrice,
  economyPotential,
  percentWithQuotes,
}: ProductsHeroCardProps) {
  const progressPercent = totalProducts > 0 ? Math.min((productsWithPrice / totalProducts) * 100, 100) : 0;
  const hasGoodCoverage = percentWithQuotes >= 70;

  return (
    <Card className="relative overflow-hidden border border-orange-200/70 dark:border-orange-500/20 bg-gradient-to-br from-orange-100 to-amber-50 dark:from-gray-900 dark:to-gray-900 shadow-md sm:hover:shadow-lg sm:transition-shadow sm:duration-150">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-600 dark:bg-orange-600 rounded-lg shadow-md">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-sm font-bold text-orange-800 dark:text-orange-400">Catálogo de Produtos</span>
          </div>
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
            hasGoodCoverage 
              ? "bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-500/30" 
              : "bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-200/70 dark:border-amber-500/30"
          )}>
            {hasGoodCoverage ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {percentWithQuotes}% cotados
          </div>
        </div>

        {/* Main Value */}
        <div className="mb-4">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
            {totalProducts.toLocaleString('pt-BR')}
          </div>
          <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mt-1">
            produtos cadastrados
          </p>
        </div>

        {/* Progress Bar - Cobertura de Preços */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-700 dark:text-gray-400">Cobertura de preços</span>
            <span className="font-bold text-gray-900 dark:text-gray-200">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-orange-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-600 to-amber-500 dark:from-orange-500 dark:to-orange-400 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-600 dark:text-gray-500">0</span>
            <span className="font-semibold text-gray-700 dark:text-gray-400">{totalProducts} produtos</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-orange-200/50 dark:border-orange-500/10">
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 mb-0.5">Preço Médio</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(averagePrice)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 mb-0.5">Economia Potencial</p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(economyPotential)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
});
