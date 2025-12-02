import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Calendar,
  X,
  Eye,
  MoreVertical,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
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
    icon: X,
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
      <div className="page-container space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-white/80">Total</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
                <p className="text-xs text-white/80">Pendentes</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.emAndamento}</p>
                <p className="text-xs text-white/80">Em Andamento</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.finalizadas}</p>
                <p className="text-xs text-white/80">Finalizadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <PageHeader
          title="Contagem de Estoque"
          description="Gerencie suas contagens de estoque"
          icon={ClipboardList}
          actions={
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-500/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Contagem
            </Button>
          }
        >
          {/* Search and Filters */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </PageHeader>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : filteredCounts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 p-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Nenhuma contagem encontrada
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Crie uma nova contagem para começar
                </p>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Contagem
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-800/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
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
                        <span className="font-medium text-gray-900 dark:text-gray-100">
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
                    <TableCell className="max-w-[200px] truncate text-gray-500 dark:text-gray-400">
                      {count.notes || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewCount(count.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {count.status !== "finalizada" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFinalizeCount(count.id)}
                            className="h-8 w-8 p-0 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCount(count.id)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
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
        )}

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={handleCreateDialogOpenChange}>
          <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-6 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <DialogHeader className="p-0 space-y-1">
                    <DialogTitle className="text-xl font-bold text-white">
                      Nova Contagem
                    </DialogTitle>
                    <DialogDescription className="text-orange-100">
                      Crie uma nova contagem de estoque
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de Contagem</Label>
                <RadioGroup
                  value={countType}
                  onValueChange={(v) => setCountType(v as "from_order" | "from_scratch")}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <RadioGroupItem value="from_order" id="from_order" />
                    <Label htmlFor="from_order" className="cursor-pointer flex-1">
                      <span className="font-medium">A partir de um pedido</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Importa os itens de um pedido existente
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                    <RadioGroupItem value="from_scratch" id="from_scratch" />
                    <Label htmlFor="from_scratch" className="cursor-pointer flex-1">
                      <span className="font-medium">Criar do zero</span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Contagem livre sem pedido vinculado
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {countType === "from_order" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Selecionar Pedido</Label>
                  {loadingOrders ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-orange-500 mr-2" />
                      <span className="text-sm text-gray-500">Carregando pedidos...</span>
                    </div>
                  ) : (
                    <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um pedido" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOrders.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Nenhum pedido disponível
                          </SelectItem>
                        ) : (
                          availableOrders.map((order) => (
                            <SelectItem key={order.id} value={order.id}>
                              {order.supplier_name} -{" "}
                              {format(new Date(order.order_date), "dd/MM/yyyy")}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Observações (opcional)</Label>
                <Textarea
                  placeholder="Adicione observações sobre esta contagem..."
                  value={countNotes}
                  onChange={(e) => setCountNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleCreateDialogOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateCount}
                disabled={
                  createStockCount.isPending ||
                  (countType === "from_order" && !selectedOrderId)
                }
                className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
              >
                {createStockCount.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Criar Contagem
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
