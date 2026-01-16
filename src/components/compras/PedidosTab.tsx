import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { capitalize } from "@/lib/text-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatusSelect, ORDER_STATUS_OPTIONS } from "@/components/ui/status-select";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { Table, TableCell, TableRow } from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { ShoppingCart, Plus, Truck, Clock, Trash2, DollarSign, Package, MoreVertical, Building2, CircleDot, Info, TrendingDown, ClipboardCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

interface OrderData {
  id: string;
  fornecedor: string;
  total: string;
  status: string;
  dataPedido: string;
  dataEntrega: string;
  itens: number;
  produtos: string[];
  observacoes: string;
  detalhesItens: Array<{ produto: string; quantidade: number; valorUnitario: number }>;
  supplier_id: string | null;
  delivery_date: string | null;
  quote_id: string | null;
  economia_estimada: number;
  economia_real: number;
  _raw?: Pedido; // Referência ao pedido original
}

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

  const stats = useMemo(() => {
    const pedidosAtivos = pedidos.filter(p => p.status === "pendente" || p.status === "processando").length;
    const pedidosEntregues = pedidos.filter(p => p.status === "entregue").length;
    const pedidosValidos = pedidos.filter(p => p.status !== "cancelado");
    const totalValue = pedidosValidos.reduce((acc, p) => {
      const cleanValue = p.total.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
      return acc + (parseFloat(cleanValue) || 0);
    }, 0);
    
    // Economia real (pedidos entregues que vieram de cotação)
    const economiaReal = pedidos
      .filter(p => p.status === "entregue" && p.quote_id)
      .reduce((sum, p) => sum + (p.economia_real || 0), 0);
    
    return {
      pedidosAtivos,
      pedidosEntregues,
      totalValueFormatado: totalValue > 0 ? totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
      economiaReal,
      economiaRealFormatada: economiaReal > 0 ? `R$ ${economiaReal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : 'R$ 0'
    };
  }, [pedidos]);

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
      <div className="hidden md:block">
        <Table>
          <thead>
            <tr>
              <td colSpan={7} className="px-1 pb-3 pt-0 border-none">
                <div className="flex items-center bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 rounded-xl shadow-sm px-4 py-4">
                  <div className="w-[15%] flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Pedido</span>
                  </div>
                  <div className="w-[20%] pl-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Fornecedor</span>
                  </div>
                  <div className="w-[12%] pl-2 flex justify-center items-center gap-2">
                    <CircleDot className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Status</span>
                  </div>
                  <div className="w-[15%] pl-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Valor</span>
                  </div>
                  <div className="w-[12%] pl-2 flex items-center gap-2">
                    <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Itens</span>
                  </div>
                  <div className="w-[15%] pl-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Entrega</span>
                  </div>
                  <div className="w-[11%] pl-2 flex justify-end items-center">
                    <span className="uppercase tracking-wide text-xs font-semibold text-gray-700 dark:text-gray-300">Ações</span>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.map((pedido) => (
              <TableRow key={pedido.id} className="group border-none">
                <TableCell colSpan={7} className="px-1 py-1.5">
                  <div className="flex items-center px-4 py-3 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800/70">
                    <div className="w-[15%] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center border border-gray-200 dark:border-gray-600/30">
                        <ShoppingCart className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">#{pedido.id.substring(0, 8)}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{pedido.dataPedido}</p>
                      </div>
                    </div>
                    <div className="w-[20%] pl-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate block max-w-[150px]">{capitalize(pedido.fornecedor)}</span>
                    </div>
                    <div className="w-[12%] pl-2 flex justify-center">
                      <StatusSelect
                        value={pedido.status}
                        options={ORDER_STATUS_OPTIONS}
                        onChange={(newStatus) => updatePedidoStatus({ pedidoId: pedido.id, status: newStatus })}
                        isLoading={isUpdating}
                      />
                    </div>
                    <div className="w-[15%] pl-2">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{pedido.total}</span>
                    </div>
                    <div className="w-[12%] pl-2 flex items-center gap-1">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                        <Package className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                        <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs">{pedido.itens}</span>
                      </div>
                      {pedido.produtos && pedido.produtos.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[250px]">
                              <p className="font-semibold text-xs mb-1">Produtos do pedido:</p>
                              <ul className="text-xs space-y-0.5">
                                {pedido.detalhesItens.map((item, idx) => (
                                  <li key={idx}>• {item.produto} ({item.quantidade}x R$ {item.valorUnitario.toFixed(2)})</li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="w-[15%] pl-2 text-sm text-gray-500 dark:text-gray-400">
                      {pedido.dataEntrega || '-'}
                    </div>
                    <div className="w-[11%] pl-2 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/70 rounded-lg">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

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
