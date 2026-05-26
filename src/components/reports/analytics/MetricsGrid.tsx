/**
 * MetricsGrid - Componente para exibir mÃ©tricas em grid responsivo (desktop)
 * 
 * Renderiza 4 mÃ©tricas em um grid responsivo usando o MetricCard existente.
 * Usa React.memo para evitar re-renders desnecessÃ¡rios.
 * 
 * @module components/reports/analytics/MetricsGrid
 * Requirements: 2.1, 2.3, 6.5
 */

import { memo } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, Users, DollarSign } from "lucide-react";
import type { MetricsGridProps, Metric } from "@/types/reports";

/**
 * Mapeia o tipo de mÃ©trica para a variante do MetricCard
 */
const getVariantFromTipo = (tipo: Metric['tipo']): 'success' | 'error' | 'default' => {
  switch (tipo) {
    case 'positivo':
      return 'success';
    case 'negativo':
      return 'error';
    default:
      return 'default';
  }
};

/**
 * Ãcones padrÃ£o para cada posiÃ§Ã£o de mÃ©trica
 */
const DEFAULT_ICONS = [TrendingUp, Clock, Users, DollarSign];

/**
 * Variantes padrÃ£o para cada posiÃ§Ã£o de mÃ©trica
 */
const DEFAULT_VARIANTS: Array<'success' | 'info' | 'warning' | 'default'> = [
  'success',
  'info',
  'warning',
  'default'
];

/**
 * Componente de skeleton para loading state
 */
function MetricSkeleton() {
  return (
    <Card className="relative overflow-hidden border border-border dark:border-white/5 rounded-2xl bg-white dark:bg-zinc-900 shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800" />
          <Skeleton className="h-3 w-32 bg-zinc-50 dark:bg-zinc-900" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * MetricsGrid - Exibe mÃ©tricas em grid responsivo para desktop
 * 
 * Componente memoizado para evitar re-renders desnecessÃ¡rios.
 * 
 * @param metrics - Array de mÃ©tricas a serem exibidas (mÃ¡ximo 4)
 * @param isLoading - Estado de carregamento
 */
export const MetricsGrid = memo(function MetricsGrid({ metrics, isLoading }: MetricsGridProps) {
  // Garante que sempre temos exatamente 4 mÃ©tricas para o grid
  const displayMetrics = metrics.slice(0, 4);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((index) => (
          <MetricSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayMetrics.map((metric, index) => {
        const Icon = metric.icon || DEFAULT_ICONS[index % DEFAULT_ICONS.length];
        const variant = metric.tipo
          ? getVariantFromTipo(metric.tipo)
          : DEFAULT_VARIANTS[index % DEFAULT_VARIANTS.length];

        return (
          <MetricCard
            key={metric.id || `metric-${index}`}
            title={metric.titulo}
            value={metric.valor}
            icon={Icon}
            variant={variant}
            trend={metric.variacao ? {
              value: metric.variacao,
              label: metric.descricao,
              type: metric.tipo === 'positivo' ? 'positive'
                : metric.tipo === 'negativo' ? 'negative'
                  : 'neutral'
            } : undefined}
          />
        );
      })}
    </div>
  );
});

export default MetricsGrid;

