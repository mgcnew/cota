/**
 * MetricsGrid - Componente para exibir métricas em grid responsivo (desktop)
 * 
 * Renderiza 4 métricas em um grid responsivo usando o MetricCard existente.
 * Usa React.memo para evitar re-renders desnecessários.
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
 * Mapeia o tipo de métrica para a variante do MetricCard
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
 * Ícones padrão para cada posição de métrica
 */
const DEFAULT_ICONS = [TrendingUp, Clock, Users, DollarSign];

/**
 * Variantes padrão para cada posição de métrica
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
    <Card className="relative overflow-hidden border-2 border-gray-200 dark:border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

/**
 * MetricsGrid - Exibe métricas em grid responsivo para desktop
 * 
 * Componente memoizado para evitar re-renders desnecessários.
 * 
 * @param metrics - Array de métricas a serem exibidas (máximo 4)
 * @param isLoading - Estado de carregamento
 */
export const MetricsGrid = memo(function MetricsGrid({ metrics, isLoading }: MetricsGridProps) {
  // Garante que sempre temos exatamente 4 métricas para o grid
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
