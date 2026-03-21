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
import { BarChart3, FileText, History, Loader2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useReports } from "@/hooks/useReports";
import { useDatePeriod } from "@/hooks/useDatePeriod";

import { PageWrapper } from "@/components/layout/PageWrapper";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";

// Layout components
import { ReportsHeader, PeriodDialog, FiltersDialog } from "@/components/reports/layout";

// Tab components - Lazy loaded for better performance (Requirement 6.2)
const AnalyticsTab = lazy(() => 
  import("@/components/reports/analytics/AnalyticsTab").then(mod => ({ default: mod.AnalyticsTab }))
);
const HistoryTab = lazy(() => 
  import("@/components/reports/tabs/HistoryTab").then(mod => ({ default: mod.HistoryTab }))
);

/**
 * Loading skeleton for tabs
 */
function TabSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the entire page
 */
function PageSkeleton() {
  return (
    <div className={cn("p-6 space-y-8 animate-pulse", ds.layout.container.page)}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex justify-center">
          <Skeleton className="h-12 w-64 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
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
    return tabFromQuery && ['analytics', 'historico'].includes(tabFromQuery) 
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

  // Memoized check for history tab active state
  const isHistoryTabActive = useMemo(() => activeTab === "historico", [activeTab]);

  if (loading) {
    return <PageWrapper><PageSkeleton /></PageWrapper>;
  }

  return (
    <PageWrapper>
      <div className={cn(ds.layout.container.page, "pt-8 md:pt-12 animate-in fade-in zoom-in-95 duration-500")}>
        {/* Page Header */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20">
                <FileText className="h-6 w-6 text-brand" />
              </div>
              <div>
                <h1 className={cn(ds.typography.size["2xl"], "font-bold text-foreground")}>
                  Relatórios
                </h1>
                <p className={cn(ds.colors.text.secondary, "text-sm mt-0.5")}>
                  Geração e análise estratégica de performance e economia do sistema
                </p>
              </div>
            </div>

            <ReportsHeader
              dateRangeText={dateRangeText}
              onOpenPeriodDialog={handleOpenPeriodDialog}
              onRefresh={refresh}
              onExportAll={handleExportAll}
              isRefreshing={refreshing}
              isExporting={isGenerating}
            />
          </div>
        </div>

        {/* Progress Bar */}
        {isGenerating && (
          <Card className="overflow-hidden border-brand/20 bg-brand/[0.02] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-brand/10 text-brand">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={cn("text-sm font-black uppercase tracking-widest", ds.colors.text.primary)}>
                      Processando Inteligência de Dados
                    </span>
                    <span className="text-brand font-black text-sm italic">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-brand/10" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Premium */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-8">
          <div className="flex items-center justify-center">
            <TabsList className={cn(ds.components.tabs.list, "h-14 p-1.5 bg-muted/50 backdrop-blur-md border-border/40")}>
              <TabsTrigger 
                value="analytics" 
                className={cn(
                  ds.components.tabs.trigger,
                  "h-11 px-8 gap-2.5 rounded-lg transition-all duration-300",
                  "data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-xl"
                )}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="font-black uppercase tracking-widest text-[11px]">Analytics</span>
              </TabsTrigger>
              <TabsTrigger 
                value="historico" 
                className={cn(
                  ds.components.tabs.trigger,
                  "h-11 px-8 gap-2.5 rounded-lg transition-all duration-300",
                  "data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-xl"
                )}
              >
                <History className="h-4 w-4" />
                <span className="font-black uppercase tracking-widest text-[11px]">Histórico</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TabsContent value="analytics" className="m-0 outline-none">
              <Suspense fallback={<TabSkeleton />}>
                <AnalyticsTab
                  startDate={startDate}
                  endDate={endDate}
                  selectedFornecedores={selectedFornecedores}
                  selectedProdutos={selectedProdutos}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="historico" className="m-0 outline-none">
              <Suspense fallback={<TabSkeleton />}>
                <HistoryTab isActive={isHistoryTabActive} />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>
      </div>

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
    </PageWrapper>
  );
}
