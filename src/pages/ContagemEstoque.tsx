import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle,
  Clock,
  Trash2,
  Loader2,
  Activity,
  Eye,
  XCircle,
  FileText,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useToast } from "@/hooks/use-toast";
import { ViewStockCountDialog } from "@/components/stock/ViewStockCountDialog";
import { ConsolidatedReportDialog } from "@/components/stock/ConsolidatedReportDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { designSystem as ds } from "@/styles/design-system";

// Hooks & Components
import { useContagemEstoque } from "@/hooks/useContagemEstoque";
import { StockCountListDesktop } from "@/components/stock/StockCountListDesktop";
import { CreateStockCountDialog } from "@/components/stock/CreateStockCountDialog";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { MetricCard } from "@/components/ui/metric-card";

// Status configuration using Design System tokens
const statusConfig = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  },
  em_andamento: {
    label: "Em Andamento",
    icon: Activity,
    badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  finalizada: {
    label: "Finalizada",
    icon: CheckCircle,
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  },
  cancelada: {
    label: "Cancelada",
    icon: XCircle,
    badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  },
};

const getStatusBadge = (status: string) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1.5 px-2.5 py-0.5", config.badge)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
};

export default function ContagemEstoque() {
  const { toast } = useToast();
  
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredCounts,
    stats,
    isLoading,
    createStockCount,
    updateStockCount,
    deleteStockCount,
    availableOrders,
    loadingOrders,
    loadOrders
  } = useContagemEstoque();

  const [selectedCount, setSelectedCount] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Handlers
  const handleCreateCount = async ({ orderId, notes }: { orderId?: string; notes?: string }) => {
    try {
      const newCount = await createStockCount.mutateAsync({
        order_id: orderId,
        notes: notes,
      });

      setCreateDialogOpen(false);

      if (newCount) {
        setSelectedCount(newCount.id);
        setViewDialogOpen(true);
      }
    } catch (error) {
      console.error("Erro ao criar contagem:", error);
    }
  };

  const handleViewCount = useCallback((countId: string) => {
    setSelectedCount(countId);
    setViewDialogOpen(true);
  }, []);

  const handleFinalizeCount = useCallback(
    async (countId: string) => {
      try {
        await updateStockCount.mutateAsync({ id: countId, status: "finalizada" });
      } catch (error) {
        console.error("Erro ao finalizar contagem:", error);
      }
    },
    [updateStockCount]
  );

  const handleDeleteCount = useCallback(
    async (countId: string) => {
      if (confirm("Tem certeza que deseja excluir esta contagem?")) {
        try {
          await deleteStockCount.mutateAsync(countId);
        } catch (error) {
          console.error("Erro ao excluir contagem:", error);
        }
      }
    },
    [deleteStockCount]
  );

  return (
    <PageWrapper>
      <div className={cn(ds.layout.container.page, "animate-in fade-in zoom-in-95 duration-500")}>
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20">
              <ClipboardList className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h1 className={cn(ds.typography.size["2xl"], "font-bold text-foreground")}>
                Contagem de Estoque
              </h1>
              <p className={cn(ds.colors.text.secondary, "text-sm mt-0.5")}>
                Gerencie conferências de entrada e contagens avulsas
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <ResponsiveGrid gap="sm" config={{ mobile: 1, tablet: 2, desktop: 4 }} className="mb-4">
          {/* Total */}
          <MetricCard
            title="Total"
            value={stats.total}
            icon={ClipboardList}
            trend={{ value: "Registros", label: "totais", type: "neutral" }}
            variant="info"
            className="hover:scale-[1.02] transition-transform w-full"
          />

          {/* Pendentes */}
          <MetricCard
            title="Pendentes"
            value={stats.pendentes}
            icon={Clock}
            trend={{ value: "Aguardando", label: "início", type: "neutral" }}
            variant="warning"
            className="hover:scale-[1.02] transition-transform w-full"
          />

          {/* Em Andamento */}
          <MetricCard
            title="Em Andamento"
            value={stats.emAndamento}
            icon={Activity}
            trend={{ value: "Sendo", label: "conferidas", type: "neutral" }}
            variant="default"
            className="hover:scale-[1.02] transition-transform w-full"
          />

          {/* Finalizadas */}
          <MetricCard
            title="Finalizadas"
            value={stats.finalizadas}
            icon={CheckCircle}
            trend={{ value: "Concluídas", label: "com sucesso", type: "positive" }}
            variant="success"
            className="hover:scale-[1.02] transition-transform w-full"
          />
        </ResponsiveGrid>

        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-1">
          <div className="flex-1">
            <SearchInput
              placeholder="Buscar por fornecedor, data ou observação..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 bg-card">
              <SelectValue placeholder="Filtrar por Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setReportDialogOpen(true)}
            variant="outline"
            className="w-full sm:w-auto h-11 border-brand/20 hover:bg-brand/5 dark:border-brand/30 dark:hover:bg-brand/10 text-brand"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Relatório</span>
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className={cn(ds.components.button.primary, "w-full sm:w-auto h-11")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Contagem
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-brand mb-4" />
            <p className="text-muted-foreground animate-pulse">Carregando contagens...</p>
          </div>
        ) : filteredCounts.length === 0 ? (
          <div className={cn(ds.components.card.root, "p-12 border-dashed")}>
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center ring-8 ring-zinc-50/50 dark:ring-zinc-900/30">
                <ClipboardList className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Nenhuma contagem encontrada
                </h3>
                <p className="text-sm text-muted-foreground">
                  Não encontramos registros com os filtros atuais. Tente alterar a busca ou crie uma nova contagem.
                </p>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Contagem
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Cards Mobile */}
            <div className="block lg:hidden space-y-4">
              {filteredCounts.map((count) => (
                <div
                  key={count.id}
                  className={cn(ds.components.card.root, "p-4 active:scale-[0.99] transition-transform")}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-200 dark:border-zinc-700">
                        <ClipboardList className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {(count as any).order?.supplier_name || "Contagem Livre"}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(count.count_date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(count.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Setor / Tipo</span>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-medium truncate">{(count as any).sector?.name || "Geral"}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                            {(count as any).order ? "Pedido" : "Avulso"}
                          </Badge>
                          {(count as any).is_monthly_balance && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-emerald-50 text-emerald-700">
                              Mensal
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {(count as any).counter_name && (
                      <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-0.5">Respondente</span>
                        <span className="text-xs font-medium truncate block">{(count as any).counter_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewCount(count.id)}
                      className="flex-1 h-9"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                    
                    {count.status !== "finalizada" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleFinalizeCount(count.id)}
                        className="h-9 w-9 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCount(count.id)}
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tabela Desktop */}
            <StockCountListDesktop 
              counts={filteredCounts} 
              onView={handleViewCount} 
              onFinalize={handleFinalizeCount} 
              onDelete={handleDeleteCount} 
            />
          </>
        )}

        {/* Create Dialog */}
        <CreateStockCountDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreate={handleCreateCount}
          isLoading={createStockCount.isPending}
          availableOrders={availableOrders}
          loadingOrders={loadingOrders}
          loadOrders={loadOrders}
        />

        {/* View Dialog */}
        <ViewStockCountDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          stockCountId={selectedCount}
        />

        {/* Report Dialog */}
        <ConsolidatedReportDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
        />
      </div>
    </PageWrapper>
  );
}

