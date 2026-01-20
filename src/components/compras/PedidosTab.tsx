import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { capitalize } from "@/lib/text-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusSelect, ORDER_STATUS_OPTIONS } from "@/components/ui/status-select";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { ShoppingCart, Plus, Truck, Clock, Trash2, DollarSign, Package, MoreVertical, ClipboardCheck, TrendingDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

function PedidosTab() {
  const { isMobile } = useBreakpoint();
  const { paginate } = usePagination<OrderData>({ initialItemsPerPage: isMobile ? 8 : 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
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

  const handleUpdateStatus = useCallback((pedidoId: string, status: string) => {
    updatePedidoStatus({ pedidoId, status });
  }, [updatePedidoStatus]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 4 }}>
        <MetricCard title="Ativos" value={stats.pedidosAtivos} icon={Clock} variant="warning" />
        <MetricCard title="Entregues" value={stats.pedidosEntregues} icon={Truck} variant="success" />
        <MetricCard title="Total" value={stats.totalValueFormatado} icon={DollarSign} variant="info" className="hidden md:block" />
        <MetricCard title="Economia Real" value={stats.economiaRealFormatada} icon={TrendingDown} variant="success" className="hidden md:block" />
      </ResponsiveGrid>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <ExpandableSearch value={searchTerm} onChange={setSearchTerm} placeholder="Buscar..." accentColor="orange" expandedWidth="w-full sm:w-48" />
        <select 
          value={statusFilter} 
          onChange={e => setStatusFilter(e.target.value)} 
          className="h-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 text-sm"
        >
          <option value="all">Todos</option>
          <option value="pendente">Pendentes</option>
          <option value="confirmado">Confirmados</option>
          <option value="entregue">Entregues</option>
        </select>
        <Button onClick={() => setAddDialogOpen(true)} className="h-10 ml-auto bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700">
          <Plus className="h-4 w-4 mr-1" />Novo
        </Button>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-2">
        {paginatedData.items.map((pedido) => (
          <div key={pedido.id} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-600/30">
                  <ShoppingCart className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{capitalize(pedido.fornecedor)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">#{pedido.id.substring(0, 8)}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                  <DropdownMenuItem onClick={() => handleManagePedido(pedido)} className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70"><ShoppingCart className="h-4 w-4 mr-2" />Gerenciar</DropdownMenuItem>
                  {pedido.status !== "entregue" && pedido.status !== "cancelado" && (
                    <DropdownMenuItem onClick={() => handleRegistrarEntrega(pedido)} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                      <ClipboardCheck className="h-4 w-4 mr-2" />Registrar Entrega
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                  <DropdownMenuItem onClick={() => handleDeletePedidoClick(pedido)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <StatusSelect
                value={pedido.status}
                options={ORDER_STATUS_OPTIONS}
                onChange={(newStatus) => updatePedidoStatus({ pedidoId: pedido.id, status: newStatus })}
                isLoading={isUpdating}
              />
              <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"><Package className="h-3 w-3 mr-1" />{pedido.itens} itens</Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Total: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{pedido.total}</span></span>
              <span className="text-gray-500 dark:text-gray-400">Entrega: {pedido.dataEntrega || '-'}</span>
            </div>
          </div>
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

      {/* Pagination */}
      {paginatedData.pagination.totalPages > 1 && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-3">
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
        </div>
      )}

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
