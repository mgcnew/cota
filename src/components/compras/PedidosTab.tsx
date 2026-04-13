import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { capitalize } from "@/lib/text-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusSelect, ORDER_STATUS_OPTIONS } from "@/components/ui/status-select";
import { SearchInput } from "@/components/ui/search-input";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { ShoppingCart, Plus, Truck, Clock, Trash2, DollarSign, Package, MoreVertical, ClipboardCheck, TrendingDown, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { designSystem as ds } from "@/styles/design-system";
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
import { ConfirmWhatsAppOrderDialog } from "@/components/forms/ConfirmWhatsAppOrderDialog";

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

  // States para o envio no WhatsApp
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [pedidoToWhatsApp, setPedidoToWhatsApp] = useState<OrderData | null>(null);

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
      dataPedido: (() => {
        const [y, m, d] = order.order_date.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
      })(),
      dataEntrega: order.delivery_date ? (() => {
        const [y, m, d] = order.delivery_date.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
      })() : '',
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
    const filtered = pedidos.filter(pedido => {
      const matchesSearch = pedido.fornecedor.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        pedido.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || pedido.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const aIsClosed = a.status === 'entregue' || a.status === 'cancelado';
      const bIsClosed = b.status === 'entregue' || b.status === 'cancelado';
      
      // Aberto vem antes de fechado
      if (aIsClosed !== bIsClosed) {
        return aIsClosed ? 1 : -1;
      }
      
      // Se têm o mesmo tipo de status, ordena pela data mais recente (created_at ou data do pedido)
      // Se têm o mesmo tipo de status, ordena pela data mais recente (created_at ou data do pedido)
      const [da, ma, ya] = a.dataPedido.split('/').map(Number);
      const aDate = (a._raw as any)?.created_at ? new Date((a._raw as any).created_at).getTime() : new Date(ya, ma - 1, da).getTime();
      const [db, mb, yb] = b.dataPedido.split('/').map(Number);
      const bDate = (b._raw as any)?.created_at ? new Date((b._raw as any).created_at).getTime() : new Date(yb, mb - 1, db).getTime();
      
      return bDate - aDate;
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
    if (status === 'enviado') {
      const pedidoInfo = pedidos.find(p => p.id === pedidoId);
      if (pedidoInfo) {
        setPedidoToWhatsApp(pedidoInfo);
        setWhatsAppDialogOpen(true);
        return;
      }
    }
    updatePedidoStatus({ pedidoId, status });
  }, [updatePedidoStatus, pedidos]);

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className={cn("h-8 w-8 animate-spin", designSystem.colors.text.primary)} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {/* Metrics */}
      <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 4 }}>
        <MetricCard title="Pendentes" value={stats.pedidosAtivos} icon={Clock} variant="warning" />
        <MetricCard title="Entregues" value={stats.pedidosEntregues} icon={Truck} variant="success" />
        <MetricCard title="Total Pedidos" value={stats.totalValueFormatado} icon={DollarSign} variant="info" />
        <MetricCard
          title="Economia Real"
          value={stats.economiaRealFormatada}
          icon={TrendingDown}
          variant="success"
          trend={{
            value: stats.variacaoFaturadoFormatada,
            label: stats.variacaoType === 'negative' ? 'furo de preço' : 'ganho extra',
            type: stats.variacaoType
          }}
        />
      </ResponsiveGrid>

      {/* Filters & Actions */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
          {/* Search Field */}
          <div className="flex-1 max-w-xl">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar pedido..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <div className="hidden md:block">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn("w-[180px] h-11 bg-white dark:bg-background border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/10 rounded-lg shadow-sm transition-all", ds.colors.text.primary)}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pendente">🟡 Pendentes</SelectItem>
                  <SelectItem value="enviado">🛫 Enviados</SelectItem>
                  <SelectItem value="confirmado">🟢 Confirmados</SelectItem>
                  <SelectItem value="entregue">🔵 Entregues</SelectItem>
                  <SelectItem value="cancelado">🔴 Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className={cn(designSystem.components.button.primary, "h-11 px-6 w-full sm:w-auto")}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Pedido
            </Button>
          </div>
        </div>
      </div>

        {/* Mobile Filter Chips */}
      <div className="md:hidden flex overflow-x-auto gap-2 pb-2 mb-4 -mx-1 px-1 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style dangerouslySetInnerHTML={{__html: `
          .md\\:hidden::-webkit-scrollbar { display: none; }
        `}} />
        {[
          { value: 'all', label: 'Todos' },
          { value: 'pendente', label: 'Pendentes' },
          { value: 'enviado', label: 'Enviados' },
          { value: 'confirmado', label: 'Confirmados' },
          { value: 'entregue', label: 'Entregues' },
          { value: 'cancelado', label: 'Cancelados' },
        ].map(status => (
          <button
            key={status.value}
            onClick={() => setStatusFilter(status.value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border touch-manipulation active:scale-95",
              statusFilter === status.value 
                ? "bg-brand text-white border-brand shadow-md" 
                : "bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800/40 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            )}
          >
            {status.label}
          </button>
        ))}
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
            onUpdateStatus={handleUpdateStatus}
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
      <ConfirmWhatsAppOrderDialog
        open={whatsAppDialogOpen}
        onOpenChange={setWhatsAppDialogOpen}
        pedido={pedidoToWhatsApp}
        onConfirm={() => {
          if (pedidoToWhatsApp) {
            updatePedidoStatus({ pedidoId: pedidoToWhatsApp.id, status: 'enviado' });
          }
        }}
      />
    </div>
  );
}

export default memo(PedidosTab);
