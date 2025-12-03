/**
 * AnalyticsTab - Componente principal da aba Analytics
 * 
 * Orquestra MetricsGrid/Carousel, PerformanceCharts e InsightsPanel.
 * Implementa lazy loading para charts.
 * 
 * @module components/reports/analytics/AnalyticsTab
 * Requirements: 2.4, 2.5
 */

import { lazy, Suspense } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useInsights } from "@/hooks/useInsights";
import { MetricsGrid } from "./MetricsGrid";
import { MetricsCarousel } from "./MetricsCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { AnalyticsTabProps } from "@/types/reports";

// Lazy load dos componentes pesados para melhor performance
const PerformanceCharts = lazy(() => 
  import("@/components/analytics/PerformanceCharts").then(mod => ({ default: mod.PerformanceCharts }))
);

const InsightsPanel = lazy(() => 
  import("@/components/analytics/InsightsPanel").then(mod => ({ default: mod.InsightsPanel }))
);


/**
 * Componente de fallback para loading dos charts
 */
function ChartsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((index) => (
          <Card key={index} className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-[250px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * Componente de fallback para loading dos insights
 */
function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * AnalyticsTab - Aba de Analytics com métricas, gráficos e insights
 * 
 * @param startDate - Data inicial do período
 * @param endDate - Data final do período
 * @param selectedFornecedores - Fornecedores selecionados para filtro
 * @param selectedProdutos - Produtos selecionados para filtro
 */
export function AnalyticsTab({
  startDate,
  endDate,
  selectedFornecedores,
  selectedProdutos
}: AnalyticsTabProps) {
  const isMobile = useIsMobile();
  
  // Hook de analytics com filtros
  const { 
    metricas, 
    topProdutos,
    performanceFornecedores, 
    tendenciasMensais, 
    isLoading: isLoadingAnalytics 
  } = useAnalytics({
    startDate,
    endDate,
    selectedFornecedores,
    selectedProdutos
  });

  // Hook de insights
  const { 
    insights, 
    isGenerating: isGeneratingInsights, 
    lastGenerated, 
    generateInsights 
  } = useInsights();

  /**
   * Handler para gerar insights - prepara os dados de analytics
   * e chama a função generateInsights do hook
   */
  const handleGenerateInsights = () => {
    // Preparar dados de analytics no formato esperado pelo hook
    const analyticsData = {
      metricas: {
        taxaEconomia: parseFloat(metricas[0]?.valor?.replace('%', '') || '0'),
        tempoMedioCotacao: parseFloat(metricas[1]?.valor?.replace(' dias', '') || '0'),
        taxaResposta: parseFloat(metricas[2]?.valor?.replace('%', '') || '0'),
        valorMedioPedido: parseFloat(metricas[3]?.valor?.replace(/[R$\s.]/g, '').replace(',', '.') || '0'),
      },
      topProdutos: topProdutos.map(p => ({
        nome: p.produto,
        economia: p.economiaTotal || 0,
        cotacoes: p.cotacoes,
      })),
      performanceFornecedores: performanceFornecedores.map(f => ({
        nome: f.fornecedor,
        score: f.score,
        cotacoes: f.cotacoes,
        taxaResposta: parseFloat(f.taxaResposta?.replace('%', '') || '0'),
      })),
      tendenciasMensais: tendenciasMensais.map(t => ({
        mes: t.mes,
        cotacoes: t.cotacoes,
        economia: t.economia,
      })),
    };
    
    generateInsights(analyticsData);
  };

  return (
    <div className="space-y-6">
      {/* Seção de Métricas */}
      <section aria-label="Métricas de performance">
        {isMobile ? (
          <MetricsCarousel 
            metrics={metricas} 
            isLoading={isLoadingAnalytics} 
          />
        ) : (
          <MetricsGrid 
            metrics={metricas} 
            isLoading={isLoadingAnalytics} 
          />
        )}
      </section>

      {/* Seção de Gráficos - Lazy loaded */}
      <section aria-label="Gráficos de performance">
        <Suspense fallback={<ChartsSkeleton />}>
          <PerformanceCharts
            performanceFornecedores={performanceFornecedores}
            tendenciasMensais={tendenciasMensais}
          />
        </Suspense>
      </section>

      {/* Seção de Insights - Lazy loaded */}
      <section aria-label="Insights com IA">
        <Suspense fallback={<InsightsSkeleton />}>
          <InsightsPanel
            insights={insights}
            isGenerating={isGeneratingInsights}
            lastGenerated={lastGenerated}
            onGenerate={handleGenerateInsights}
          />
        </Suspense>
      </section>
    </div>
  );
}

export default AnalyticsTab;
