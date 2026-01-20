import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useToast } from "@/hooks/use-toast";
import { ViewStockCountDialog } from "@/components/stock/ViewStockCountDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Hooks & Components
import { useContagemEstoque } from "@/hooks/useContagemEstoque";
import { StockCountListDesktop } from "@/components/stock/StockCountListDesktop";
import { CreateStockCountDialog } from "@/components/stock/CreateStockCountDialog";

// Status configuration for Mobile Cards
const statusConfig = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  },
  em_andamento: {
    label: "Em Andamento",
    icon: Activity,
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
  },
  finalizada: {
    label: "Finalizada",
    icon: CheckCircle,
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  },
  cancelada: {
    label: "Cancelada",
    icon: XCircle,
    badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800",
  },
};

const getStatusBadge = (status: string) => {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
  return (
    <Badge variant="outline" className={cn("gap-1", config.badge)}>
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

  // Handlers
  const handleCreateCount = async ({ orderId, notes }: { orderId?: string; notes?: string }) => {
    if (!orderId && !notes && orderId === undefined) {
      // Basic check, though logic handles "from_scratch" via undefined orderId
    }

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
      <div className="page-container space-y-4 sm:space-y-6">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 shadow-lg">
            <ClipboardList className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contagem de Estoque</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-white/20">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl lg:text-3xl font-bold tracking-tight">{stats.total}</p>
              <p className="text-sm font-medium text-white/90">Total</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-white/20">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl lg:text-3xl font-bold tracking-tight">{stats.pendentes}</p>
              <p className="text-sm font-medium text-white/90">Pendentes</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-white/20">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl lg:text-3xl font-bold tracking-tight">{stats.emAndamento}</p>
              <p className="text-sm font-medium text-white/90">Em Andamento</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-white/20">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-2xl lg:text-3xl font-bold tracking-tight">{stats.finalizadas}</p>
              <p className="text-sm font-medium text-white/90">Finalizadas</p>
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Contagem
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : filteredCounts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-8 sm:p-12">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center">
                <ClipboardList className="w-7 h-7 sm:w-8 sm:h-8 text-orange-500" />
              </div>
              <div>
                <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Nenhuma contagem encontrada
                </p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Crie uma nova contagem para começar
                </p>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-orange-600 to-amber-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Contagem
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Cards Mobile */}
            <div className="block lg:hidden space-y-3">
              {filteredCounts.map((count) => (
                <div
                  key={count.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center flex-shrink-0">
                        <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {(count as any).order?.supplier_name || "Contagem Livre"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(count.count_date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(count.status)}
                  </div>

                  {count.notes && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{count.notes}</p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        (count as any).order
                          ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300"
                          : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                      )}
                    >
                      {(count as any).order ? "Com Pedido" : "Livre"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewCount(count.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {count.status !== "finalizada" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFinalizeCount(count.id)}
                          className="h-8 w-8 p-0 text-emerald-600"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCount(count.id)}
                        className="h-8 w-8 p-0 text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
      </div>
    </PageWrapper>
  );
}
