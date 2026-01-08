import { useState, useMemo, useCallback, memo } from "react";
import { capitalize } from "@/lib/text-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { Table, TableCell, TableRow } from "@/components/ui/table";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { ShoppingCart, Plus, Truck, Clock, Trash2, DollarSign, Package, MoreVertical, Building2, CircleDot } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import PedidoDialog from "@/components/forms/PedidoDialog";
import DeletePedidoDialog from "@/components/forms/DeletePedidoDialog";
import { usePedidos } from "@/hooks/usePedidos";
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
}

function PedidosTab() {
  const { isMobile } = useBreakpoint();
  const { paginate } = usePagination<OrderData>({ initialItemsPerPage: isMobile ? 8 : 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { pedidos: pedidosDataArray, isLoading, refetch } = usePedidos();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pedidoDialogOpen, setPedidoDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<OrderData | null>(null);

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
      delivery_date: order.delivery_date
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
    return {
      pedidosAtivos,
      pedidosEntregues,
      totalValueFormatado: totalValue > 0 ? totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'
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

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 2, desktop: 3 }}>
        <MetricCard title="Ativos" value={stats.pedidosAtivos} icon={Clock} variant="warning" />
        <MetricCard title="Entregues" value={stats.pedidosEntregues} icon={Truck} variant="success" />
        <MetricCard title="Total" value={stats.totalValueFormatado} icon={DollarSign} variant="info" className="hidden md:block" />
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
        <Button onClick={() => setAddDialogOpen(true)} className="h-10 ml-auto bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-1" />Novo
        </Button>
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-2">
        {paginatedData.items.map((pedido) => (
          <div key={pedido.id} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{capitalize(pedido.fornecedor)}</p>
                  <p className="text-xs text-muted-foreground">#{pedido.id.substring(0, 8)}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleManagePedido(pedido)}><ShoppingCart className="h-4 w-4 mr-2" />Gerenciar</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDeletePedidoClick(pedido)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={pedido.status} />
              <Badge variant="outline" className="text-xs"><Package className="h-3 w-3 mr-1" />{pedido.itens} itens</Badge>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total: <span className="font-semibold text-green-600">{pedido.total}</span></span>
              <span className="text-muted-foreground">Entrega: {pedido.dataEntrega || '-'}</span>
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
                <div className="flex items-center bg-card/95 border border-orange-200/60 dark:border-orange-900/40 rounded-lg shadow-sm px-4 py-3">
                  <div className="w-[15%] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <span className="uppercase text-[11px] font-semibold text-orange-900 dark:text-orange-100">Pedido</span>
                  </div>
                  <div className="w-[20%] pl-2 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-orange-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-orange-900 dark:text-orange-100">Fornecedor</span>
                  </div>
                  <div className="w-[12%] pl-2 flex justify-center items-center gap-1.5">
                    <CircleDot className="h-3.5 w-3.5 text-orange-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-orange-900 dark:text-orange-100">Status</span>
                  </div>
                  <div className="w-[15%] pl-2 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-orange-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-orange-900 dark:text-orange-100">Valor</span>
                  </div>
                  <div className="w-[12%] pl-2 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-orange-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-orange-900 dark:text-orange-100">Itens</span>
                  </div>
                  <div className="w-[15%] pl-2 flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-orange-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-orange-900 dark:text-orange-100">Entrega</span>
                  </div>
                  <div className="w-[11%] pl-2 flex justify-end items-center gap-1.5">
                    <MoreVertical className="h-3.5 w-3.5 text-orange-600/70" />
                    <span className="uppercase text-[11px] font-semibold text-orange-900 dark:text-orange-100">Ações</span>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            {paginatedData.items.map((pedido) => (
              <TableRow key={pedido.id} className="group border-none">
                <TableCell colSpan={7} className="px-1 py-2">
                  <div className="flex items-center px-3 py-2.5 bg-card/90 rounded-lg border border-border hover:border-orange-300/50 transition-colors">
                    <div className="w-[15%] flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-200/50">
                        <ShoppingCart className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm font-mono">#{pedido.id.substring(0, 8)}</span>
                        <p className="text-xs text-muted-foreground">{pedido.dataPedido}</p>
                      </div>
                    </div>
                    <div className="w-[20%] pl-2">
                      <span className="font-medium text-sm truncate block max-w-[150px]">{capitalize(pedido.fornecedor)}</span>
                    </div>
                    <div className="w-[12%] pl-2 flex justify-center">
                      <StatusBadge status={pedido.status} />
                    </div>
                    <div className="w-[15%] pl-2">
                      <span className="font-bold text-green-600">{pedido.total}</span>
                    </div>
                    <div className="w-[12%] pl-2">
                      <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200">
                        <Package className="h-3 w-3 mr-1" />{pedido.itens}
                      </Badge>
                    </div>
                    <div className="w-[15%] pl-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5 text-orange-600" />
                        {pedido.dataEntrega || '-'}
                      </div>
                    </div>
                    <div className="w-[11%] pl-2 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleManagePedido(pedido)}><ShoppingCart className="h-4 w-4 mr-2" />Gerenciar</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeletePedidoClick(pedido)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
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
    </div>
  );
}

export default memo(PedidosTab);
