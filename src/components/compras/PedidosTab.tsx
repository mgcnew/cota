import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { capitalize } from "@/lib/text-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/ui/search-input";
import { usePagination } from "@/hooks/usePagination";
import { ShoppingCart, Plus, Truck, Clock, Trash2, DollarSign, Package, MoreVertical, ClipboardCheck, TrendingDown, Loader2, PackageCheck, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import PedidoDialog from "@/components/forms/PedidoDialog";
import DeletePedidoDialog from "@/components/forms/DeletePedidoDialog";
import { RegistrarEntregaDialog } from "@/components/forms/RegistrarEntregaDialog";
import { usePedidos, type Pedido } from "@/hooks/usePedidos";
import { useDebounce } from "@/hooks/useDebounce";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { StatCard } from "@/components/ui/stat-card";
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
  
  const [initialSupplierId, setInitialSupplierId] = useState<string | null>(null);

  // Interceptar URL param para abrir modal de novo pedido
  useEffect(() => {
    const isNew = searchParams.get("open") === "new";
    const supplierId = searchParams.get("supplierId");
    
    if (isNew) {
      if (supplierId) {
        setInitialSupplierId(supplierId);
      }
      setTimeout(() => {
        setAddDialogOpen(true);
        setSearchParams(prev => {
          prev.delete("open");
          prev.delete("supplierId");
          return prev;
        }, { replace: true });
      }, 100);
    }
  }, [searchParams, setSearchParams]);

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
        valorUnitario: Number(item.unit_price),
        unidade: item.unit || undefined,
        valorUnitarioCotado: item.valor_unitario_cotado != null ? Number(item.valor_unitario_cotado) : null,
        maiorValorCotado: item.maior_valor_cotado != null ? Number(item.maior_valor_cotado) : null,
        totalItem: item.total_price != null ? Number(item.total_price) : null,
        quantidadeEntregue: item.quantidade_entregue != null ? Number(item.quantidade_entregue) : null,
        unidadeEntregue: item.unidade_entregue || null,
      })) || [],
      supplier_id: order.supplier_id || null,
      delivery_date: order.delivery_date,
      quote_id: order.quote_id || null,
      economia_estimada: order.economia_estimada || 0,
      economia_real: order.economia_real || 0,
      _raw: order,
    }));
  }, [pedidosDataArray]);

  const pedidosPendentesEntrega = useMemo(() =>
    pedidosDataArray.filter(p => p.status === 'confirmado' || p.status === 'enviado'),
    [pedidosDataArray]
  );

  const filteredPedidos = useMemo(() => {
    const filtered = pedidos.filter(pedido => {
      const term = debouncedSearchTerm.toLowerCase();
      const matchesSearch = !term ||
        pedido.fornecedor.toLowerCase().includes(term) ||
        pedido.id.toLowerCase().includes(term) ||
        (pedido.produtos as string[] ?? []).some((p: string) => p.toLowerCase().includes(term));
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

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className={cn("h-8 w-8 animate-spin", ds.colors.text.primary)} /></div>;

  return (
    <div className="space-y-6">
      {/* Metrics — ocultas no mobile por performance */}
      {!isMobile && (
        <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 4 }}>
          <StatCard title="Pendentes" value={stats.pedidosAtivos} icon={Clock} variant="warning" />
          <StatCard
            title="Aguardando Entrega"
            value={stats.pedidosAguardando}
            icon={PackageCheck}
            variant="info"
            popoverContent={
              stats.pedidosAguardandoList.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Nenhum pedido aguardando entrega</div>
              ) : (
                <div>
                  <div className="px-3 py-2 border-b border-border bg-muted/40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aguardando Entrega</p>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-border">
                    {stats.pedidosAguardandoList.map((p) => (
                      <div key={p.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{p.fornecedor}</p>
                          <p className="text-[10px] text-muted-foreground">{p.dataPedido}</p>
                        </div>
                        <span className="text-xs font-bold text-foreground shrink-0">{p.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          />
          <StatCard title="Total Pedidos" value={stats.totalValueFormatado} icon={DollarSign} variant="info" />
          <StatCard
            title="Economia Real"
            value={stats.economiaRealFormatada}
            icon={TrendingDown}
            variant="success"
            trend={{
              value: `Estimativa pendentes: ${stats.economiaNegociadaFormatada}`,
              label: "nos pedidos a entregar",
              type: "positive"
            }}
            popoverContent={
              stats.pedidosEntreguesComEconomia.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Nenhuma entrega com economia registrada</div>
              ) : (
                <div>
                  <div className="px-3 py-2 border-b border-border bg-muted/40">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Economia Confirmada</p>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-border">
                    {stats.pedidosEntreguesComEconomia.map((p) => (
                      <div key={p.id} className="px-3 py-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{p.fornecedor}</p>
                          <p className="text-[10px] text-muted-foreground">{p.dataPedido}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          R$ {(p.economia_real || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          />
        </ResponsiveGrid>
      )}

      {/* Unified Container for Search, Table and Mobile Cards */}
      <div className="w-full bg-white dark:bg-card border border-border dark:border-white/5 rounded-xl overflow-hidden shadow-sm mb-8">
        {/* Header / Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5 border-b border-border dark:border-white/5 bg-zinc-50/50 dark:bg-muted/30">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-full sm:w-56">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Pesquisar..."
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5 text-sm">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Status</span>
                  {statusFilter !== 'all' && (
                    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold bg-brand text-white rounded-full">1</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1.5" align="start">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">Filtrar por status</p>
                {[
                  { value: 'all',       label: 'Todos os Status' },
                  { value: 'pendente',  label: 'Pendentes' },
                  { value: 'enviado',   label: 'Enviados' },
                  { value: 'confirmado',label: 'Confirmados' },
                  { value: 'entregue',  label: 'Entregues' },
                  { value: 'cancelado', label: 'Cancelados' },
                ].map(item => (
                  <button
                    key={item.value}
                    onClick={() => setStatusFilter(item.value)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors",
                      statusFilter === item.value
                        ? "bg-brand text-white font-medium"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={() => setAddDialogOpen(true)}
              className={cn(ds.components.button.primary, "h-9 px-4")}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Novo Pedido</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

<div className="w-full">
          {paginatedData.items.length === 0 && !isLoading ? (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <ShoppingCart className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">Nenhum pedido encontrado</h3>
              <p className="text-zinc-500 max-w-sm mx-auto mb-6">Tente ajustar os filtros ou crie um novo pedido.</p>
              <Button onClick={() => setAddDialogOpen(true)} className={cn(ds.components.button.primary)}>
                <Plus className="h-4 w-4 mr-2" /> Novo Pedido
              </Button>
            </div>
          ) : (
            <>
              {/* Só monta uma das views (evita cards + tabela no DOM ao mesmo tempo) */}
              {isMobile ? (
                <div className="space-y-2 p-3 pb-4">
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
              ) : (
                <PedidosListDesktop
                  pedidos={paginatedData.items}
                  onUpdateStatus={handleUpdateStatus}
                  onManage={handleManagePedido}
                  onRegisterDelivery={handleRegistrarEntrega}
                  onDelete={handleDeletePedidoClick}
                  isUpdating={isUpdating}
                />
              )}

              {/* Pagination */}
              <div className="px-3.5 py-2 border-t border-border dark:border-white/5 bg-zinc-50/50 dark:bg-muted/30">
                <Pagination className="w-full max-w-xs mx-0">
                  <PaginationContent className="w-full justify-between">
                    <PaginationItem>
                      <PaginationLink
                        size="icon"
                        aria-label="Página anterior"
                        onClick={() => paginatedData.pagination.goToPage(paginatedData.pagination.currentPage - 1)}
                        className={cn(paginatedData.pagination.currentPage <= 1 && "pointer-events-none opacity-40")}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <span className="text-muted-foreground text-xs">
                        Página <span className="text-foreground font-medium">{paginatedData.pagination.currentPage}</span> de{" "}
                        <span className="text-foreground font-medium">{paginatedData.pagination.totalPages || 1}</span>
                      </span>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        size="icon"
                        aria-label="Próxima página"
                        onClick={() => paginatedData.pagination.goToPage(paginatedData.pagination.currentPage + 1)}
                        className={cn(paginatedData.pagination.currentPage >= paginatedData.pagination.totalPages && "pointer-events-none opacity-40")}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </PaginationLink>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AddPedidoDialog 
        open={addDialogOpen} 
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setInitialSupplierId(null);
        }} 
        onAdd={() => { refetch(); setAddDialogOpen(false); setInitialSupplierId(null); }} 
        defaultSupplierId={initialSupplierId}
      />
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
        pedidosPendentes={pedidosPendentesEntrega}
        onSelectNext={(pedido) => setSelectedPedidoRaw(pedido)}
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

