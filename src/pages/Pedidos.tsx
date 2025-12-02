import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { capitalize } from "@/lib/text-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { Table, TableCell, TableRow } from "@/components/ui/table";
import { ViewToggle } from "@/components/ui/view-toggle";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/usePagination";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { 
  ShoppingCart, Plus, Truck, CheckCircle, Clock, XCircle, Trash2, 
  Loader2, DollarSign, Package, Building2, Calendar, MoreVertical, CircleDot 
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import PedidoDialog from "@/components/forms/PedidoDialog";
import DeletePedidoDialog from "@/components/forms/DeletePedidoDialog";
import { usePedidos } from "@/hooks/usePedidos";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";

export default function Pedidos() {
  const { viewMode, setViewMode } = useResponsiveViewMode();
  const { paginate } = usePagination<any>({ initialItemsPerPage: 10 });

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<"all" | "pendente" | "processando" | "confirmado" | "entregue" | "cancelado">("all");

  const { pedidos: pedidosDataArray, isLoading, refetch } = usePedidos();

  const hasLoadedOnce = useRef(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      hasLoadedOnce.current = true;
      setShowLoading(false);
    }
  }, [isLoading]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [pedidoDialogOpen, setPedidoDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<any>(null);

  // Formatar os pedidos
  const pedidos = useMemo(() => {
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

  const abbreviateSupplierName = (name: string, maxLength: number = 20) => {
    if (name.length <= maxLength) return name;
    const words = name.split(' ');
    if (words.length === 1) return name.substring(0, maxLength - 3) + '...';
    if (words.length >= 2) {
      const abbreviated = `${words[0]} ... ${words[words.length - 1]}`;
      if (abbreviated.length <= maxLength) return abbreviated;
    }
    return name.substring(0, maxLength - 3) + '...';
  };

  const handleAddPedido = () => refetch();
  const handleEditPedido = () => refetch();
  const handleDeletePedido = () => refetch();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: { className: "border-warning/30 bg-warning/10 text-warning", label: "Pendente" },
      processando: { className: "border-primary/30 bg-primary/10 text-primary", label: "Processando" },
      confirmado: { className: "border-primary/30 bg-primary/10 text-primary", label: "Confirmado" },
      entregue: { className: "border-success/30 bg-success/10 text-success", label: "Entregue" },
      cancelado: { className: "border-destructive/30 bg-destructive/10 text-destructive", label: "Cancelado" }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    return <Badge variant="outline" className={cn("font-medium", config.className)}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    const icons = { pendente: Clock, processando: Clock, confirmado: CheckCircle, entregue: Truck, cancelado: XCircle };
    const Icon = icons[status as keyof typeof icons] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  const filteredPedidos = useMemo(() => {
    return pedidos.filter(pedido => {
      const matchesSearch = pedido.fornecedor.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
        pedido.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || 
        pedido.produtos.some(p => p.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "all" || pedido.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [pedidos, debouncedSearchTerm, statusFilter]);

  const paginatedData = paginate(filteredPedidos);

  // Estatísticas
  const stats = useMemo(() => {
    const pedidosAtivos = pedidos.filter(p => p.status === "pendente" || p.status === "processando");
    const pedidosEntregues = pedidos.filter(p => p.status === "entregue");
    const pedidosValidos = pedidos.filter(p => p.status !== "cancelado");

    const totalValue = pedidosValidos.reduce((acc, p) => {
      const cleanValue = p.total.replace("R$ ", "").replace(/\./g, "").replace(",", ".");
      return acc + (parseFloat(cleanValue) || 0);
    }, 0);

    const valorMedioPorPedido = pedidosValidos.length > 0 ? totalValue / pedidosValidos.length : 0;
    const totalItens = pedidos.reduce((acc, p) => acc + (p.itens || 0), 0);
    const percentualAtivos = pedidos.length > 0 ? Math.round((pedidosAtivos.length / pedidos.length) * 100) : 0;
    const taxaEntrega = pedidos.length > 0 ? Math.round((pedidosEntregues.length / pedidos.length) * 100) : 0;

    return {
      pedidosAtivos: pedidosAtivos.length,
      pedidosEntregues: pedidosEntregues.length,
      totalValueFormatado: totalValue > 0 ? totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
      valorMedioFormatado: valorMedioPorPedido > 0 ? valorMedioPorPedido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00',
      totalItens,
      percentualAtivos,
      taxaEntrega,
      totalPedidos: pedidos.length,
      pedidosPendentes: pedidos.filter(p => p.status === "pendente").length,
      pedidosProcessando: pedidos.filter(p => p.status === "processando").length
    };
  }, [pedidos]);


  return (
    <PageWrapper>
      <div className="page-container">
        {/* MetricCards padronizados */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-6 overflow-visible">
          <MetricCard
            title="Pedidos Ativos"
            value={stats.pedidosAtivos}
            icon={Clock}
            variant="warning"
            trend={{
              value: `${stats.percentualAtivos}%`,
              label: "do total",
              type: stats.percentualAtivos > 50 ? "positive" : "neutral"
            }}
          />
          <MetricCard
            title="Entregues"
            value={stats.pedidosEntregues}
            icon={Truck}
            variant="success"
            trend={{
              value: `${stats.taxaEntrega}%`,
              label: "taxa de entrega",
              type: stats.taxaEntrega > 70 ? "positive" : "neutral"
            }}
          />
          <MetricCard
            title="Valor Total"
            value={stats.totalValueFormatado}
            icon={DollarSign}
            variant="info"
            trend={{
              value: stats.valorMedioFormatado,
              label: "média por pedido",
              type: "neutral"
            }}
          />
          <MetricCard
            title="Total de Itens"
            value={stats.totalItens}
            icon={Package}
            variant="default"
            trend={{
              value: `${stats.totalPedidos}`,
              label: "pedidos",
              type: "neutral"
            }}
          />
        </div>

        {/* PageHeader */}
        <PageHeader
          title="Pedidos"
          description="Gerencie seus pedidos de compra"
          icon={ShoppingCart}
          actions={
            <div className="flex items-center gap-2">
              <ViewToggle view={viewMode} onViewChange={setViewMode} />
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0 h-10 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Pedido
              </Button>
            </div>
          }
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
            <div className="flex-shrink-0">
              <ExpandableSearch
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar pedidos..."
                accentColor="orange"
                expandedWidth="w-64"
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value as any)} 
              className="h-10 bg-white/85 dark:bg-gray-900/60 border-2 border-gray-200/60 dark:border-gray-700/70 hover:border-orange-300/70 focus:border-orange-400 rounded-xl px-3 text-gray-900 dark:text-gray-100"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="processando">Processando</option>
              <option value="confirmado">Confirmados</option>
              <option value="entregue">Entregues</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </PageHeader>

        {showLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {viewMode === "table" ? (
              <Card className="border-0 bg-transparent">
                <CardContent className="p-0">
                  <div className="overflow-hidden">
                    <Table>
                      <thead>
                        <tr>
                          <td colSpan={7} className="px-1 pb-3 pt-0 border-none">
                            <div className="flex items-center bg-white/95 dark:bg-gray-800/70 border border-orange-300/60 dark:border-orange-900/60 rounded-xl shadow-md backdrop-blur-sm px-4 py-3">
                              <div className="w-[15%] flex items-center gap-2 pr-4">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/15 to-amber-500/15 flex items-center justify-center text-orange-600">
                                  <ShoppingCart className="h-4 w-4" />
                                </div>
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Pedido</span>
                              </div>
                              <div className="w-[18%] flex items-center gap-1.5 px-2">
                                <Building2 className="h-3.5 w-3.5 text-orange-600/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Fornecedor</span>
                              </div>
                              <div className="hidden md:flex w-[18%] px-2 items-center gap-1.5">
                                <Package className="h-3.5 w-3.5 text-orange-600/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Produtos</span>
                              </div>
                              <div className="hidden lg:flex w-[15%] px-2 items-center gap-1.5">
                                <Truck className="h-3.5 w-3.5 text-orange-600/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Entrega</span>
                              </div>
                              <div className="flex w-[12%] px-2 justify-center items-center gap-1.5">
                                <CircleDot className="h-3.5 w-3.5 text-orange-600/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Status</span>
                              </div>
                              <div className="flex w-[12%] px-2 justify-center items-center gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-orange-600/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Valor</span>
                              </div>
                              <div className="w-[10%] pl-4 flex justify-end items-center gap-1.5">
                                <MoreVertical className="h-3.5 w-3.5 text-orange-600/70" />
                                <span className="uppercase tracking-wide text-[11px] font-semibold text-orange-900 dark:text-orange-100">Ações</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.items.map((pedido) => (
                          <TableRow key={pedido.id} className="group border-none">
                            <TableCell colSpan={7} className="px-1 py-3">
                              <div className="flex items-center p-3 bg-white/90 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300/70 dark:border-gray-700/30 hover:shadow-md hover:border-orange-300/60 transition-all duration-200">
                                <div className="w-[15%] flex items-center gap-3 pr-4">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center border border-orange-200/50">
                                    <ShoppingCart className="h-4 w-4 text-orange-600" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold font-mono text-sm truncate">#{pedido.id.substring(0, 8)}</div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {pedido.dataPedido}
                                    </div>
                                  </div>
                                </div>
                                <div className="w-[18%] px-2">
                                  <div className="font-medium truncate" title={pedido.fornecedor}>{capitalize(abbreviateSupplierName(pedido.fornecedor))}</div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md">
                                      <Package className="h-3 w-3" />{pedido.itens} itens
                                    </span>
                                  </div>
                                </div>
                                <div className="hidden md:block w-[18%] px-2">
                                  <div className="text-sm truncate max-w-[150px]">
                                    {capitalize(pedido.produtos[0])}
                                    {pedido.produtos.length > 1 && <span className="text-muted-foreground"> +{pedido.produtos.length - 1}</span>}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">{pedido.produtos.length} produto{pedido.produtos.length !== 1 ? 's' : ''}</div>
                                </div>
                                <div className="hidden lg:block w-[15%] px-2">
                                  <div className="flex items-center gap-1 text-sm">
                                    <Truck className="h-3 w-3 text-orange-600" />
                                    {pedido.dataEntrega || '-'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Entrega prevista</div>
                                </div>
                                <div className="w-[12%] px-2 flex justify-center">{getStatusBadge(pedido.status)}</div>
                                <div className="w-[12%] px-2 text-center">
                                  <div className="font-bold text-emerald-600 text-base">{pedido.total}</div>
                                </div>
                                <div className="w-[10%] pl-4 flex justify-end">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 group-hover:scale-110"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-40">
                                      <DropdownMenuItem onClick={() => { setSelectedPedido(pedido); setPedidoDialogOpen(true); }} className="cursor-pointer">
                                        <ShoppingCart className="h-4 w-4 mr-2" />
                                        Gerenciar Pedido
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { setSelectedPedido(pedido); setDeleteDialogOpen(true); }} className="cursor-pointer text-destructive">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir
                                      </DropdownMenuItem>
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
                  <div className="border-t border-orange-100/80 dark:border-gray-700/30 bg-gradient-to-r from-orange-50/30 to-amber-50/30 px-6 py-4">
                    <DataPagination
                      currentPage={paginatedData.pagination.currentPage}
                      totalPages={paginatedData.pagination.totalPages}
                      itemsPerPage={paginatedData.pagination.itemsPerPage || 10}
                      totalItems={paginatedData.pagination.totalItems}
                      onPageChange={paginatedData.pagination.goToPage}
                      onItemsPerPageChange={paginatedData.pagination.setItemsPerPage || (() => {})}
                      startIndex={paginatedData.pagination.startIndex || 0}
                      endIndex={paginatedData.pagination.endIndex || 0}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {paginatedData.items.map((pedido) => {
                  const getStatusColors = (status: string) => {
                    const colors = {
                      entregue: { border: "border-green-300/60", bg: "from-white to-green-50/30", iconColor: "text-green-600" },
                      confirmado: { border: "border-blue-300/60", bg: "from-white to-blue-50/30", iconColor: "text-blue-600" },
                      processando: { border: "border-amber-300/60", bg: "from-white to-amber-50/30", iconColor: "text-amber-600" },
                      cancelado: { border: "border-red-300/60", bg: "from-white to-red-50/30", iconColor: "text-red-600" },
                      pendente: { border: "border-gray-300/60", bg: "from-white to-gray-50/30", iconColor: "text-gray-600" }
                    };
                    return colors[status as keyof typeof colors] || colors.pendente;
                  };
                  const colors = getStatusColors(pedido.status);
                  
                  return (
                    <Card key={pedido.id} className={cn("group border bg-gradient-to-br", colors.bg, "hover:shadow-xl transition-shadow duration-200")}>
                      <CardHeader className="pb-3 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={cn("p-2 rounded-xl", colors.iconColor)}>
                              {getStatusIcon(pedido.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-sm font-bold truncate" title={pedido.fornecedor}>
                                {capitalize(abbreviateSupplierName(pedido.fornecedor, 25))}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">{getStatusBadge(pedido.status)}</div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedPedido(pedido); setPedidoDialogOpen(true); }}>
                                <ShoppingCart className="h-4 w-4 mr-2" />Gerenciar Pedido
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedPedido(pedido); setDeleteDialogOpen(true); }} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 p-4 pt-0">
                        <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/60">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <ShoppingCart className="h-3 w-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-600">Pedido</span>
                              </div>
                              <p className="text-sm font-bold">#{pedido.id.substring(0, 8)}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Package className="h-3 w-3 text-orange-600" />
                                <span className="text-xs font-medium text-orange-700">Itens</span>
                              </div>
                              <p className="text-sm font-bold text-orange-800">{pedido.itens}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200/60">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">Entrega</span>
                          </div>
                          <p className="text-xs font-semibold text-blue-800">{pedido.dataEntrega || 'Não definida'}</p>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-muted-foreground">Valor Total</p>
                              <p className="text-lg font-bold text-emerald-600">{pedido.total}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Dialogs */}
        <AddPedidoDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={handleAddPedido} />
        {selectedPedido && (
          <PedidoDialog open={pedidoDialogOpen} onOpenChange={setPedidoDialogOpen} pedido={selectedPedido} onEdit={handleEditPedido} />
        )}
        <DeletePedidoDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} pedido={selectedPedido} onDelete={handleDeletePedido} />
      </div>
    </PageWrapper>
  );
}
