import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { capitalize } from "@/lib/text-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusSelect, ORDER_STATUS_OPTIONS } from "@/components/ui/status-select";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { ShoppingCart, Plus, Truck, Clock, Trash2, DollarSign, Package, MoreVertical, ClipboardCheck, TrendingDown, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import PedidoDialog from "@/components/forms/PedidoDialog";
import DeletePedidoDialog from "@/components/forms/DeletePedidoDialog";
import { RegistrarEntregaDialog } from "@/components/forms/RegistrarEntregaDialog";
import { usePedidos, type Pedido } from "@/hooks/usePedidos";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { usePedidosStats, OrderData } from "@/hooks/usePedidosStats";
import { PedidosListDesktop } from "./PedidosListDesktop";
import { MobileOrderCard } from "@/components/pedidos/MobileOrderCard";

function PedidosTab() {
  const { isMobile } = useBreakpoint();
  const { paginate } = usePagination<OrderData>({ initialItemsPerPage: isMobile ? 8 : 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { pedidos: pedidosDataArray, isLoading, refetch, updatePedidoStatus, isUpdating } = usePedidos();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pedidoDialogOpen, setPedidoDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entregaDialogOpen, setEntregaDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<OrderData | null>(null);
  const [selectedPedidoRaw, setSelectedPedidoRaw] = useState<Pedido | null>(null);

  // Ouvir evento de atalho de teclado para novo pedido
  useEffect(() => {
    const handleNovaEvent = (e: CustomEvent) => {
      if (e.detail?.tab === 'pedidos') {
        setAddDialogOpen(true);
      }
    };
    window.addEventListener('compras:nova', handleNovaEvent as EventListener);
    return () => window.removeEventListener('compras:nova', handleNovaEvent as EventListener);
  }, []);

  const pedidos = useMemo((): OrderData[] => {
    return pedidosDataArray.map(order => ({
      id: order.id,
      fornecedor: order.supplier_name,
      total: `R$ ${Number(order.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      status: order.status,
      dataPedido: new Date(order.order_date).toLocaleDateString('pt-BR'),
      dataEntrega: order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('pt-BR') : '',
      itens: order.items?.length || 0,
      produtos: order.items?.map((item: any) => item.product_name) || [],
      observacoes: order.observations || "",
      detalhesItens: order.items?.map((item: any) => ({
        produto: item.product_name,
        quantidade: item.quantity,
        valorUnitario: Number(item.unit_price)
      })) || [],
      supplier_id: order.supplier_id || null,
      delivery_date: order.delivery_date,
      quote_id: order.quote_id || null,
      economia_estimada: order.economia_estimada || 0,
      economia_real: order.economia_real || 0,
      _raw: order,
    }));
  }, [pedidosDataArray]);

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(pedido => {
      const matchesSearch = pedido.fornecedor.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        pedido.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || pedido.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pedidos, debouncedSearchTerm, statusFilter]);

  const paginatedData = paginate(filteredPedidos);

  const stats = usePedidosStats(pedidos);

  const handleManagePedido = useCallback((pedido: OrderData) => {
    setSelectedPedido(pedido);
    setPedidoDialogOpen(true);
  }, []);

  const handleDeletePedidoClick = useCallback((pedido: OrderData) => {
    setSelectedPedido(pedido);
    setDeleteDialogOpen(true);
  }, []);

  const handleRegistrarEntrega = useCallback((pedido: OrderData) => {
    setSelectedPedido(pedido);
    setSelectedPedidoRaw(pedido._raw || null);
    setEntregaDialogOpen(true);
  }, []);

  // Interceptar URL param para abrir modal de registrar recebimento automaticamente
  useEffect(() => {
    const receiveOrderId = searchParams.get("receiveOrder");
    if (receiveOrderId && pedidos.length > 0) {
      const orderToReceive = pedidos.find(p => p.id?.toString() === receiveOrderId.toString());
      if (orderToReceive) {
        // Usa setTimeout para garantir que a renderização inicial não atropele o estado do dialog
        setTimeout(() => {
          handleRegistrarEntrega(orderToReceive);
          // Limpar o parâmetro da URL
          setSearchParams(prev => {
            prev.delete("receiveOrder");
            return prev;
          }, { replace: true });
        }, 100);
      }
    }
  }, [searchParams, pedidos, handleRegistrarEntrega, setSearchParams]);

  const handleUpdateStatus = useCallback((pedidoId: string, status: string) => {
    updatePedidoStatus({ pedidoId, status });
  }, [updatePedidoStatus]);

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className={cn("h-8 w-8 animate-spin", designSystem.colors.text.primary)} /></div>;

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 4 }}>
        <MetricCard title="Pendentes" value={stats.pedidosAtivos} icon={Clock} variant="warning" />
        <MetricCard title="Entregues" value={stats.pedidosEntregues} icon={Truck} variant="success" />
        <MetricCard title="Total Pedidos" value={stats.totalValueFormatado} icon={DollarSign} variant="info" />
        <MetricCard title="Economia Real" value={stats.economiaRealFormatada} icon={TrendingDown} variant="success" />
      </ResponsiveGrid>

      {/* Filters & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1 flex flex-col sm:flex-row gap-2">
          <ExpandableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar pedido..."
            accentColor="brand"
            expandedWidth="w-full sm:w-64"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={cn("w-[180px] rounded-xl h-10", designSystem.components.input.root)}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pendente">🟡 Pendentes</SelectItem>
              <SelectItem value="confirmado">🟢 Confirmados</SelectItem>
              <SelectItem value="entregue">🔵 Entregues</SelectItem>
              <SelectItem value="cancelado">🔴 Cancelados</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className={designSystem.components.button.primary}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Pedido
          </Button>
        </div>
      </div>

      {/* Desktop Table View */}
      <PedidosListDesktop
        pedidos={paginatedData.items}
        onUpdateStatus={handleUpdateStatus}
        onManage={handleManagePedido}
        onRegisterDelivery={handleRegistrarEntrega}
        onDelete={handleDeletePedidoClick}
        isUpdating={isUpdating}
      />

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-3">
        {paginatedData.items.map((pedido) => (
          <MobileOrderCard
            key={pedido.id}
            pedido={pedido}
            onManage={handleManagePedido}
            onDelete={handleDeletePedidoClick}
          />
        ))}
      </div>

      {/* Pagination */}
      <DataPagination
        currentPage={paginatedData.pagination.currentPage}
        totalPages={paginatedData.pagination.totalPages}
        itemsPerPage={paginatedData.pagination.itemsPerPage}
        totalItems={paginatedData.pagination.totalItems}
        onPageChange={paginatedData.pagination.goToPage}
        onItemsPerPageChange={paginatedData.pagination.setItemsPerPage}
        startIndex={paginatedData.pagination.startIndex}
        endIndex={paginatedData.pagination.endIndex}
      />

      {/* Dialogs */}
      <AddPedidoDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={() => { refetch(); setAddDialogOpen(false); }} />
      {selectedPedido && (
        <>
          <PedidoDialog open={pedidoDialogOpen} onOpenChange={setPedidoDialogOpen} pedido={selectedPedido} onEdit={() => refetch()} />
          <DeletePedidoDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} pedido={selectedPedido} onDelete={() => { refetch(); setDeleteDialogOpen(false); }} />
        </>
      )}
      <RegistrarEntregaDialog
        open={entregaDialogOpen}
        onOpenChange={setEntregaDialogOpen}
        pedido={selectedPedidoRaw}
      />
    </div>
  );
}

export default memo(PedidosTab);
