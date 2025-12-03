/**
 * MetricsCarousel - Componente para exibir métricas em carousel (mobile)
 * 
 * Implementa carousel com navegação para métricas em dispositivos móveis.
 * Usa React.memo para evitar re-renders desnecessários.
 * 
 * @module components/reports/analytics/MetricsCarousel
 * Requirements: 2.2, 6.5
 */

import { useState, useCallback, memo } from "react";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, TrendingUp, Clock, Users, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetricsCarouselProps, Metric } from "@/types/reports";

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
 * MetricsCarousel - Exibe métricas em carousel para mobile
 * 
 * Componente memoizado para evitar re-renders desnecessários.
 * 
 * @param metrics - Array de métricas a serem exibidas
 * @param isLoading - Estado de carregamento
 */
export const MetricsCarousel = memo(function MetricsCarousel({ metrics, isLoading }: MetricsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Garante que sempre temos métricas para exibir
  const displayMetrics = metrics.slice(0, 4);
  const totalMetrics = displayMetrics.length || 4;

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? totalMetrics - 1 : prev - 1));
  }, [totalMetrics]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === totalMetrics - 1 ? 0 : prev + 1));
  }, [totalMetrics]);

  const handleDotClick = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  if (isLoading) {
    return (
      <div className="relative">
        <MetricSkeleton />
        {/* Indicadores de navegação skeleton */}
        <div className="flex justify-center gap-2 mt-4">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-2 w-2 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (displayMetrics.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhuma métrica disponível
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentMetric = displayMetrics[activeIndex];
  const Icon = currentMetric?.icon || DEFAULT_ICONS[activeIndex % DEFAULT_ICONS.length];
  const variant = currentMetric?.tipo 
    ? getVariantFromTipo(currentMetric.tipo)
    : DEFAULT_VARIANTS[activeIndex % DEFAULT_VARIANTS.length];

  return (
    <div className="relative">
      {/* Botões de navegação */}
      <div className="absolute inset-y-0 left-0 flex items-center z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          className="h-8 w-8 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md hover:bg-white dark:hover:bg-gray-800 -ml-2"
          aria-label="Métrica anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="h-8 w-8 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-md hover:bg-white dark:hover:bg-gray-800 -mr-2"
          aria-label="Próxima métrica"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Card da métrica atual */}
      <div className="px-6">
        <MetricCard
          title={currentMetric.titulo}
          value={currentMetric.valor}
          icon={Icon}
          variant={variant}
          trend={currentMetric.variacao ? {
            value: currentMetric.variacao,
            label: currentMetric.descricao,
            type: currentMetric.tipo === 'positivo' ? 'positive' 
                : currentMetric.tipo === 'negativo' ? 'negative' 
                : 'neutral'
          } : undefined}
        />
      </div>

      {/* Indicadores de navegação (dots) */}
      <div className="flex justify-center gap-2 mt-4">
        {displayMetrics.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-200",
              index === activeIndex
                ? "bg-primary w-4"
                : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            )}
            aria-label={`Ir para métrica ${index + 1}`}
            aria-current={index === activeIndex ? "true" : "false"}
          />
        ))}
      </div>

      {/* Contador de posição */}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
        {activeIndex + 1} de {displayMetrics.length}
      </p>
    </div>
  );
});

export default MetricsCarousel;
