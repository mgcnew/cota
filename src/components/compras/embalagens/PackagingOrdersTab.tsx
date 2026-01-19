import { useState, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { useIsMobile } from "@/hooks/use-mobile";
import { ExpandableSearch } from "@/components/ui/expandable-search";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataPagination } from "@/components/ui/data-pagination";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { PackagingOrderDetailsDialog } from "./PackagingOrderDetailsDialog";
import {
  ShoppingCart, Plus, Trash2, Calendar, DollarSign,
  Building2, MoreVertical, CheckCircle2, Clock,
  Loader2, Package, Truck, Eye, CircleDot
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { PackagingOrderDisplay } from "@/types/packaging";
import { PACKAGING_ORDER_STATUS } from "@/types/packaging";
import { cn } from "@/lib/utils";

interface Props {
  onCreateOrder: () => void;
}

function PackagingOrdersTab({ onCreateOrder }: Props) {
  const isMobile = useIsMobile();
  const { paginate } = usePagination<PackagingOrderDisplay>({ initialItemsPerPage: isMobile ? 8 : 10 });
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<PackagingOrderDisplay | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { orders, isLoading, updateOrderStatus, deleteOrder } = usePackagingOrders();

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.supplierName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        order.itens.some(i => i.packagingName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
      if (statusFilter === "all") return matchesSearch;
      return matchesSearch && order.status === statusFilter;
    });
  }, [orders, debouncedSearchTerm, statusFilter]);

  const paginatedData = paginate(filteredOrders);

  const stats = useMemo(() => {
    const pendentes = orders.filter(o => o.status === "pendente").length;
    const confirmados = orders.filter(o => o.status === "confirmado").length;
    const totalValue = orders.reduce((sum, o) => sum + o.totalValue, 0);
    return {
      total: orders.length,
      pendentes,
      confirmados,
      totalValue: `R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    };
  }, [orders]);

  const getStatusBadge = (status: string) => {
    const statusConfig = PACKAGING_ORDER_STATUS.find(s => s.value === status);
    const colorClasses: Record<string, string> = {
      amber: "bg-amber-100 text-amber-700 border-amber-200",
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      green: "bg-emerald-100 text-emerald-700 border-emerald-200",
      red: "bg-red-100 text-red-700 border-red-200",
    };
    const IconComponent = status === "pendente" ? Clock : status === "confirmado" ? CheckCircle2 : status === "entregue" ? Truck : Clock;
    return (
      <Badge variant="outline" className={cn("text-xs", colorClasses[statusConfig?.color || ""] || "")}>
        <IconComponent className="h-3 w-3 mr-1" />
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const handleUpdateStatus = (orderId: string, status: string) => {
    updateOrderStatus.mutate({ orderId, status });
  };

  const handleDelete = (orderId: string) => {
    deleteOrder.mutate(orderId);
  };

  const handleViewDetails = (order: PackagingOrderDisplay) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveGrid config={{ mobile: 2, tablet: 2, desktop: 4 }} gap="sm">
        <MetricCard title="Total" value={stats.total.toString()} icon={ShoppingCart} variant="default" />
        <MetricCard title="Pendentes" value={stats.pendentes.toString()} icon={Clock} variant="warning" />
        <MetricCard title="Confirmados" value={stats.confirmados.toString()} icon={CheckCircle2} variant="info" />
        <MetricCard title="Valor Total" value={stats.totalValue} icon={DollarSign} variant="success" />
      </ResponsiveGrid>

      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <ExpandableSearch value={searchTerm} onChange={setSearchTerm} placeholder="Buscar..." accentColor="gray" expandedWidth="w-full sm:w-48" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {PACKAGING_ORDER_STATUS.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto">
          <Button onClick={onCreateOrder} className="h-10 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-950 font-bold uppercase tracking-wider text-xs shadow-lg">
            <Plus className="h-4 w-4 mr-1" />Novo Pedido
          </Button>
        </div>
      </div>

      {paginatedData.items.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800/50 rounded-xl border">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">Nenhum pedido de embalagem encontrado</p>
          <Button variant="outline" className="mt-4" onClick={onCreateOrder}>
            <Plus className="h-4 w-4 mr-1" />Criar primeiro pedido
          </Button>
        </div>
      ) : isMobile ? (
        <div className="space-y-2">
          {paginatedData.items.map((order, index) => {
            const numero = paginatedData.pagination.startIndex + index + 1;
            return (
              <div key={order.id} className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800/50">
                      <ShoppingCart className="h-5 w-5 text-gray-900 dark:text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate"><CapitalizedText>{order.supplierName}</CapitalizedText></p>
                      <p className="text-xs text-muted-foreground">#{numero.toString().padStart(4, '0')} • {order.orderDate}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(order)}><Eye className="h-4 w-4 mr-2" />Ver Detalhes</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmado')}><CheckCircle2 className="h-4 w-4 mr-2" />Confirmar</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'entregue')}><Truck className="h-4 w-4 mr-2" />Marcar Entregue</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {order.itens.slice(0, 3).map(item => (<Badge key={item.id} variant="secondary" className="text-xs">{item.quantidade}x {item.packagingName}</Badge>))}
                  {order.itens.length > 3 && <Badge variant="outline" className="text-xs">+{order.itens.length - 3} mais</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {getStatusBadge(order.status)}
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><DollarSign className="h-3 w-3 mr-1" />R$ {order.totalValue.toFixed(2)}</Badge>
                  {order.deliveryDate && <Badge variant="outline" className="text-xs"><Calendar className="h-3 w-3 mr-1" />Entrega: {order.deliveryDate}</Badge>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <td colSpan={7} className="px-1 pb-3 pt-0 border-none">
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/60 rounded-lg shadow-sm px-4 py-3">
                  <div className="w-[14%] flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center text-gray-500">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <span className="uppercase text-[11px] font-semibold text-gray-700 dark:text-gray-300">Pedido</span>
                  </div>
                  <div className="w-[18%] pl-2 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    <span className="uppercase text-[11px] font-semibold text-gray-700 dark:text-gray-300">Fornecedor</span>
                  </div>
                  <div className="w-[20%] pl-2 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-gray-400" />
                    <span className="uppercase text-[11px] font-semibold text-gray-700 dark:text-gray-300">Itens</span>
                  </div>
                  <div className="w-[12%] pl-2 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className="uppercase text-[11px] font-semibold text-gray-700 dark:text-gray-300">Entrega</span>
                  </div>
                  <div className="w-[12%] pl-2 flex justify-center items-center gap-1.5">
                    <CircleDot className="h-3.5 w-3.5 text-gray-400" />
                    <span className="uppercase text-[11px] font-semibold text-gray-700 dark:text-gray-300">Status</span>
                  </div>
                  <div className="w-[12%] pl-2 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                    <span className="uppercase text-[11px] font-semibold text-gray-700 dark:text-gray-300">Valor</span>
                  </div>
                  <div className="w-[12%] pl-2 flex justify-end items-center gap-1.5">
                    <MoreVertical className="h-3.5 w-3.5 text-gray-400" />
                    <span className="uppercase text-[11px] font-semibold text-gray-700 dark:text-gray-300">Ações</span>
                  </div>
                </div>
              </td>
            </tr>
          </thead>
          <TableBody>
            {paginatedData.items.map((order, index) => {
              const numero = paginatedData.pagination.startIndex + index + 1;
              const isEntregue = order.status === "entregue";
              
              return (
                <TableRow key={order.id} className="group border-none">
                  <TableCell colSpan={7} className="px-1 py-2">
                    <div className={cn(
                      "flex items-center px-3 py-2.5 bg-white dark:bg-gray-800/50 rounded-lg border transition-colors",
                      isEntregue 
                        ? "border-emerald-300/50 hover:border-emerald-400/70 dark:border-emerald-700/50" 
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    )}>
                      {/* Pedido */}
                      <div className="w-[14%] flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center border",
                          isEntregue 
                            ? "bg-emerald-500/10 border-emerald-200/50" 
                            : "bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600/30"
                        )}>
                          {isEntregue ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ShoppingCart className="h-4 w-4 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-sm">#{numero.toString().padStart(4, '0')}</span>
                          <p className="text-xs text-muted-foreground">{order.orderDate}</p>
                        </div>
                      </div>

                      {/* Fornecedor */}
                      <div className="w-[18%] pl-2">
                        <CapitalizedText className="font-medium text-sm truncate block max-w-[140px]">
                          {order.supplierName}
                        </CapitalizedText>
                        <p className="text-xs text-muted-foreground">{order.itens.length} item(ns)</p>
                      </div>
                      
                      {/* Itens */}
                      <div className="w-[20%] pl-2">
                        <CapitalizedText className="font-medium text-sm truncate block max-w-[160px]">
                          {order.itens.slice(0, 2).map(i => i.packagingName).join(', ')}
                        </CapitalizedText>
                        {order.itens.length > 2 && (
                          <p className="text-xs text-muted-foreground">+{order.itens.length - 2} mais</p>
                        )}
                      </div>
                      
                      {/* Entrega */}
                      <div className="w-[12%] pl-2 text-sm text-muted-foreground">
                        {order.deliveryDate ? (
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-gray-400" />
                            <span>{order.deliveryDate}</span>
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="w-[12%] pl-2 flex justify-center">
                        {getStatusBadge(order.status)}
                      </div>
                      
                      {/* Valor */}
                      <div className="w-[12%] pl-2">
                        <span className="font-bold text-green-600">
                          R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      {/* Ações */}
                      <div className="w-[12%] pl-2 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                              <Eye className="h-4 w-4 mr-2" />Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {order.status === "pendente" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmado')}>
                                <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />Confirmar
                              </DropdownMenuItem>
                            )}
                            {(order.status === "pendente" || order.status === "confirmado") && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'entregue')} className="text-emerald-600">
                                <Truck className="h-4 w-4 mr-2" />Marcar Entregue
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(order.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {paginatedData.pagination.totalPages > 1 && (
        <DataPagination
          currentPage={paginatedData.pagination.currentPage}
          totalPages={paginatedData.pagination.totalPages}
          onPageChange={paginatedData.pagination.goToPage}
          totalItems={paginatedData.pagination.totalItems}
          itemsPerPage={paginatedData.pagination.itemsPerPage}
          onItemsPerPageChange={paginatedData.pagination.setItemsPerPage}
          startIndex={paginatedData.pagination.startIndex}
          endIndex={paginatedData.pagination.endIndex}
        />
      )}

      <PackagingOrderDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        order={selectedOrder}
      />
    </div>
  );
}

export default memo(PackagingOrdersTab);
