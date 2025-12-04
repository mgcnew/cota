/**
 * Relatorios Page - Página principal de Relatórios
 * 
 * Página refatorada que orquestra os componentes modulares de relatórios.
 * Utiliza componentes extraídos para melhor manutenibilidade.
 * 
 * @module pages/Relatorios
 * Requirements: 1.1, 1.2
 */

import React, { useState, useCallback, useMemo, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, FileText, History, Loader2, DollarSign, Building2, Package } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useReports } from "@/hooks/useReports";
import { useDatePeriod } from "@/hooks/useDatePeriod";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";

// Layout components
import { ReportsHeader, PeriodDialog, FiltersDialog } from "@/components/reports/layout";

// Tab components - Lazy loaded for better performance (Requirement 6.2)
const AnalyticsTab = lazy(() => 
  import("@/components/reports/analytics/AnalyticsTab").then(mod => ({ default: mod.AnalyticsTab }))
);
const ReportsTab = lazy(() => 
  import("@/components/reports/tabs/ReportsTab").then(mod => ({ default: mod.ReportsTab }))
);
const HistoryTab = lazy(() => 
  import("@/components/reports/tabs/HistoryTab").then(mod => ({ default: mod.HistoryTab }))
);

import type { Estatisticas } from "@/types/reports";

/**
 * Loading skeleton for tabs
 */
function TabSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the entire page
 */
function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function Relatorios() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isGenerating, progress, generateAllReports } = useReports();

  // Custom hook for date period management (Requirement 1.3, 7.5)
  const {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    applyPreset,
    dateRangeText,
    estatisticas,
    loading,
    refreshing,
    refresh
  } = useDatePeriod();

  // Filter states
  const [selectedFornecedores, setSelectedFornecedores] = useState<string[]>([]);
  const [selectedProdutos, setSelectedProdutos] = useState<string[]>([]);
  
  // Dialog states
  const [isPeriodDialogOpen, setIsPeriodDialogOpen] = useState(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);

  // Active tab state - reads from query string
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromQuery = searchParams.get('tab');
    return tabFromQuery && ['analytics', 'relatorios', 'historico'].includes(tabFromQuery) 
      ? tabFromQuery 
      : 'analytics';
  });

  // Tab change handler - updates query string
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  }, [setSearchParams]);

  // Reset filters handler
  const handleResetFilters = useCallback(() => {
    setSelectedFornecedores([]);
    setSelectedProdutos([]);
  }, []);

  // Export all reports handler
  const handleExportAll = useCallback(async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Período obrigatório",
        description: "Por favor, selecione um período válido.",
        variant: "destructive"
      });
      return;
    }
    try {
      await generateAllReports({
        startDate,
        endDate,
        fornecedores: selectedFornecedores,
        produtos: selectedProdutos,
        categorias: []
      });
      toast({
        title: "Exportação iniciada",
        description: "Todos os relatórios serão gerados"
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar todos os relatórios",
        variant: "destructive"
      });
    }
  }, [startDate, endDate, selectedFornecedores, selectedProdutos, generateAllReports, toast]);

  // Apply date preset handler
  const handleApplyPreset = useCallback((days: number) => {
    applyPreset(days);
    setIsPeriodDialogOpen(false);
  }, [applyPreset]);

  // Memoized callback for opening period dialog
  const handleOpenPeriodDialog = useCallback(() => {
    setIsPeriodDialogOpen(true);
  }, []);

  // Memoized metric card trends to prevent unnecessary re-renders (Requirement 6.5)
  const economiaCardTrend = useMemo(() => ({
    value: estatisticas.economiaPercentual,
    label: "do total",
    type: "positive" as const
  }), [estatisticas.economiaPercentual]);

  const cotacoesCardTrend = useMemo(() => ({
    value: `${estatisticas.pedidosGerados}`,
    label: "pedidos gerados",
    type: "neutral" as const
  }), [estatisticas.pedidosGerados]);

  const fornecedoresCardTrend = useMemo(() => ({
    value: `${estatisticas.fornecedoresAtivos}`,
    label: "ativos no período",
    type: "neutral" as const
  }), [estatisticas.fornecedoresAtivos]);

  const produtosCardTrend = useMemo(() => ({
    value: `${estatisticas.produtosCotados}`,
    label: "cotados no período",
    type: "neutral" as const
  }), [estatisticas.produtosCotados]);

  // Memoized check for history tab active state
  const isHistoryTabActive = useMemo(() => activeTab === "historico", [activeTab]);

  if (loading) {
    return <PageWrapper><PageSkeleton /></PageWrapper>;
  }

  return (
    <PageWrapper>
      <div className="page-container">
        {/* Metric Cards com ResponsiveGrid */}
        <ResponsiveGrid gap="md" config={{ mobile: 2, tablet: 2, desktop: 4 }} className="mb-6 overflow-visible">
          <MetricCard
            title="Economia Total"
            value={estatisticas.economiaTotal}
            icon={DollarSign}
            variant="success"
            trend={economiaCardTrend}
          />
          <MetricCard
            title="Cotações"
            value={estatisticas.cotacoesRealizadas}
            icon={FileText}
            variant="info"
            trend={cotacoesCardTrend}
          />
          <MetricCard
            title="Fornecedores"
            value={estatisticas.fornecedoresAtivos}
            icon={Building2}
            variant="default"
            trend={fornecedoresCardTrend}
          />
          <MetricCard
            title="Produtos"
            value={estatisticas.produtosCotados}
            icon={Package}
            variant="warning"
            trend={produtosCardTrend}
          />
        </ResponsiveGrid>

        {/* Page Header with Actions */}
        <PageHeader
          title="Relatórios"
          description="Geração e análise de relatórios do sistema"
          icon={FileText}
          actions={
            <ReportsHeader
              dateRangeText={dateRangeText}
              onOpenPeriodDialog={handleOpenPeriodDialog}
              onRefresh={refresh}
              onExportAll={handleExportAll}
              isRefreshing={refreshing}
              isExporting={isGenerating}
            />
          }
        />

        {/* Period Dialog */}
        <PeriodDialog
          isOpen={isPeriodDialogOpen}
          onOpenChange={setIsPeriodDialogOpen}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onApplyPreset={handleApplyPreset}
        />

        {/* Filters Dialog */}
        <FiltersDialog
          isOpen={isFiltersDialogOpen}
          onOpenChange={setIsFiltersDialogOpen}
          selectedFornecedores={selectedFornecedores}
          selectedProdutos={selectedProdutos}
          onFornecedoresChange={setSelectedFornecedores}
          onProdutosChange={setSelectedProdutos}
          onReset={handleResetFilters}
        />

        {/* Progress Bar */}
        {isGenerating && (
          <Card className="border-blue-200 bg-blue-50 mb-6">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-blue-700 font-medium">Gerando relatórios...</span>
                    <span className="text-blue-600">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs with smooth transitions (Requirement 5.2) */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 dark:bg-gray-800 h-auto p-1.5 rounded-xl">
            <TabsTrigger 
              value="analytics" 
              className="tab-trigger-enhanced flex items-center gap-2 rounded-lg py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <BarChart3 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="font-medium">Analytics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="relatorios" 
              className="tab-trigger-enhanced flex items-center gap-2 rounded-lg py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <FileText className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="font-medium">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger 
              value="historico" 
              className="tab-trigger-enhanced flex items-center gap-2 rounded-lg py-3 px-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <History className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
              <span className="font-medium">Histórico</span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab - Lazy loaded with smooth transition */}
          <TabsContent value="analytics" className="space-y-6 mt-0 tab-content-animated">
            <Suspense fallback={<TabSkeleton />}>
              <AnalyticsTab
                startDate={startDate}
                endDate={endDate}
                selectedFornecedores={selectedFornecedores}
                selectedProdutos={selectedProdutos}
              />
            </Suspense>
          </TabsContent>

          {/* Reports Tab - Lazy loaded with smooth transition */}
          <TabsContent value="relatorios" className="mt-0 tab-content-animated">
            <Suspense fallback={<TabSkeleton />}>
              <ReportsTab
                startDate={startDate}
                endDate={endDate}
                onOpenPeriodDialog={handleOpenPeriodDialog}
              />
            </Suspense>
          </TabsContent>

          {/* History Tab - Lazy loaded with smooth transition */}
          <TabsContent value="historico" className="mt-0 tab-content-animated">
            <Suspense fallback={<TabSkeleton />}>
              <HistoryTab isActive={isHistoryTabActive} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}
