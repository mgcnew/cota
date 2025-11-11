import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load de componentes pesados de gráficos
const PerformanceCharts = lazy(() => 
  import('@/components/analytics/PerformanceCharts').then(m => ({ default: m.PerformanceCharts }))
);
const InsightsPanel = lazy(() => 
  import('@/components/analytics/InsightsPanel').then(m => ({ default: m.InsightsPanel }))
);

interface PerformanceChartsLazyProps {
  metricas: any;
  topProdutos: any[];
  performanceFornecedores: any[];
  tendenciasMensais: any[];
}

interface InsightsPanelLazyProps {
  insights: any[];
  isGenerating: boolean;
  lastGenerated: Date | null;
  onGenerate: () => void;
}

export function PerformanceChartsLazy(props: PerformanceChartsLazyProps) {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <PerformanceCharts {...props} />
    </Suspense>
  );
}

export function InsightsPanelLazy(props: InsightsPanelLazyProps) {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
      </div>
    }>
      <InsightsPanel {...props} />
    </Suspense>
  );
}
