import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Package,
  Loader2,
  Activity,
  Eye,
  FileBox,
  Sparkles,
  Building2,
  ArrowRight,
  XCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useStockCounts } from "@/hooks/useStockCounts";
import { useToast } from "@/hooks/use-toast";
import { ViewStockCountDialog } from "@/components/stock/ViewStockCountDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

// Status configuration
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

export default function ContagemEstoque() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearch = useDebounce(searchTerm, 300);

  const { stockCounts, isLoading, createStockCount, updateStockCount, deleteStockCount } =
    useStockCounts();

  const [selectedCount, setSelectedCount] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [countType, setCountType] = useState<"from_order" | "from_scratch">("from_order");
  const [countNotes, setCountNotes] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Reset form on dialog close
  const handleCreateDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedOrderId("");
      setCountNotes("");
      setCountType("from_order");
    }
    setCreateDialogOpen(open);
  };

  // Load available orders
  useEffect(() => {
    if (!createDialogOpen || !user) return;

    const loadOrders = async () => {
      setLoadingOrders(true);
      try {
        const { data: orders, error } = await supabase
          .from("orders")
          .select("id, supplier_name, order_date, status")
          .order("order_date", { ascending: false })
          .limit(100);

        if (error) throw error;
        setAvailableOrders(orders || []);
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os pedidos.",
          variant: "destructive",
        });
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [createDialogOpen, user, toast]);

  // Filter counts
  const filteredCounts = useMemo(() => {
    return stockCounts.filter((count) => {
      const matchesSearch =
        (count as any).order?.supplier_name
          ?.toLowerCase()
          .includes(debouncedSearch.toLowerCase()) ||
        count.notes?.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesStatus = statusFilter === "all" || count.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [stockCounts, debouncedSearch, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = stockCounts.length;
    const pendentes = stockCounts.filter((c) => c.status === "pendente").length;
    const emAndamento = stockCounts.filter((c) => c.status === "em_andamento").length;
    const finalizadas = stockCounts.filter((c) => c.status === "finalizada").length;

    return { total, pendentes, emAndamento, finalizadas };
  }, [stockCounts]);

  // Handlers
  const handleCreateCount = async () => {
    if (countType === "from_order" && !selectedOrderId) {
      toast({
        title: "Selecione um pedido",
        description: "Por favor, selecione um pedido para criar a contagem.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newCount = await createStockCount.mutateAsync({
        order_id: countType === "from_order" ? selectedOrderId : undefined,
        notes: countNotes || undefined,
      });

      handleCreateDialogOpenChange(false);

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

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    return (
      <Badge variant="outline" className={cn("gap-1", config.badge)}>
        {config.label}
      </Badge>
    );
  };


  return (
    <PageWrapper>
      <div className="page-container space-y-4 sm:space-y-6">
        {/* Stats Cards - Compactos em mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-3 sm:p-4 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-white/80">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 sm:p-4 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.pendentes}</p>
                <p className="text-[10px] sm:text-xs text-white/80">Pendentes</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.emAndamento}</p>
                <p className="text-[10px] sm:text-xs text-white/80 truncate">Em Andamento</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 sm:p-4 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.finalizadas}</p>
                <p className="text-[10px] sm:text-xs text-white/80">Finalizadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header Responsivo */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                  Contagem de Estoque
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                  Gerencie suas contagens
                </p>
              </div>
            </div>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Contagem
            </Button>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2">
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
          </div>
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
            <div className="hidden lg:block rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900/50">
                    <TableHead className="font-semibold">Fornecedor</TableHead>
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Pedido</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Observações</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCounts.map((count) => (
                    <TableRow key={count.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center">
                            <ClipboardList className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span className="font-medium">
                            {(count as any).order?.supplier_name || "Contagem Livre"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {format(new Date(count.count_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            (count as any).order
                              ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300"
                              : "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400"
                          }
                        >
                          {(count as any).order ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(count.status)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-500">
                        {count.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewCount(count.id)}
                            className="h-8 w-8 p-0 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {count.status !== "finalizada" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFinalizeCount(count.id)}
                              className="h-8 w-8 p-0 hover:text-emerald-600 hover:bg-emerald-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCount(count.id)}
                            className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        {/* Create Dialog - Responsivo */}
        <Dialog open={createDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
          <DialogContent className="w-[95vw] max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh]">
            {/* Header Compacto */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4 sm:p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <DialogHeader className="p-0 space-y-0.5">
                    <DialogTitle className="text-lg sm:text-xl font-bold text-white">
                      Nova Contagem
                    </DialogTitle>
                    <DialogDescription className="text-orange-100 text-xs sm:text-sm">
                      Como deseja criar a contagem?
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>
            </div>

            <ScrollArea className="max-h-[60vh]">
              <div className="p-4 sm:p-5 space-y-4">
                {/* Type Selection - Cards Responsivos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCountType("from_order")}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-left transition-all",
                      countType === "from_order"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        countType === "from_order"
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      )}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-semibold text-sm",
                          countType === "from_order" ? "text-orange-700 dark:text-orange-300" : "text-gray-900 dark:text-gray-100"
                        )}>
                          A partir de Pedido
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Importa itens do pedido
                        </p>
                      </div>
                      {countType === "from_order" && (
                        <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCountType("from_scratch")}
                    className={cn(
                      "relative p-4 rounded-xl border-2 text-left transition-all",
                      countType === "from_scratch"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        countType === "from_scratch"
                          ? "bg-orange-500 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                      )}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn(
                          "font-semibold text-sm",
                          countType === "from_scratch" ? "text-orange-700 dark:text-orange-300" : "text-gray-900 dark:text-gray-100"
                        )}>
                          Contagem Livre
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Sem vínculo com pedido
                        </p>
                      </div>
                      {countType === "from_scratch" && (
                        <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Order Selection */}
                {countType === "from_order" && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-orange-500" />
                      Selecionar Pedido
                    </Label>
                    {loadingOrders ? (
                      <div className="flex items-center justify-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                        <Loader2 className="h-5 w-5 animate-spin text-orange-500 mr-2" />
                        <span className="text-sm text-gray-500">Carregando...</span>
                      </div>
                    ) : availableOrders.length === 0 ? (
                      <div className="flex flex-col items-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border text-center">
                        <FileBox className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">Nenhum pedido disponível</p>
                        <p className="text-xs text-gray-400">Use contagem livre</p>
                      </div>
                    ) : (
                      <div className="rounded-lg border max-h-[180px] overflow-auto">
                        <div className="p-1.5 space-y-1">
                          {availableOrders.map((order) => (
                            <button
                              key={order.id}
                              type="button"
                              onClick={() => setSelectedOrderId(order.id)}
                              className={cn(
                                "w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all",
                                selectedOrderId === order.id
                                  ? "bg-orange-100 dark:bg-orange-900/40 border border-orange-300"
                                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
                              )}
                            >
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                selectedOrderId === order.id
                                  ? "bg-orange-500 text-white"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                              )}>
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {order.supplier_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(order.order_date), "dd/MM/yyyy")}
                                </p>
                              </div>
                              {selectedOrderId === order.id && (
                                <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Observações (opcional)</Label>
                  <Textarea
                    placeholder="Adicione observações..."
                    value={countNotes}
                    onChange={(e) => setCountNotes(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              </div>
            </ScrollArea>

            {/* Footer Fixo */}
            <div className="p-3 sm:p-4 border-t bg-gray-50 dark:bg-gray-900/50 flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => handleCreateDialogOpenChange(false)}
                className="flex-1 h-10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCount}
                disabled={createStockCount.isPending || (countType === "from_order" && !selectedOrderId)}
                className="flex-1 h-10 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
              >
                {createStockCount.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-1.5" />
                    Criar
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
