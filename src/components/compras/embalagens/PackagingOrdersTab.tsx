import { useState, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow, TableHeader } from "@/components/ui/table";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataPagination } from "@/components/ui/data-pagination";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { PackagingOrderDetailsDialog } from "./PackagingOrderDetailsDialog";
import { ConfirmPackagingDeliveryDialog } from "./ConfirmPackagingDeliveryDialog";
import { MobilePackagingOrderCard } from "./MobilePackagingOrderCard";
import { MobileMetricRibbon } from "@/components/dashboard/MobileMetricRibbon";
import { MobileMetricCard } from "@/components/dashboard/MobileMetricCard";
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
import { formatCurrency } from "@/utils/formatters";
import { designSystem as ds } from "@/styles/design-system";

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
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);

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
      totalValue: formatCurrency(totalValue)
    };
  }, [orders]);

  const getStatusBadge = (status: string) => {
    const statusConfig = PACKAGING_ORDER_STATUS.find(s => s.value === status);
    
    let badgeClass: string = ds.components.badge.outline as string;
    if (status === "confirmado") badgeClass = ds.components.badge.active as string;
    if (status === "entregue") badgeClass = ds.components.badge.success as string;
    if (status === "cancelado") badgeClass = ds.components.badge.destructive as string;

    const IconComponent = status === "pendente" ? Clock : status === "confirmado" ? CheckCircle2 : status === "entregue" ? Truck : Clock;
    
    return (
      <Badge className={cn(badgeClass, "gap-1.5")}>
        <IconComponent className="h-3 w-3" />
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

  const handleConfirmDelivery = (order: PackagingOrderDisplay) => {
    setSelectedOrder(order);
    setDeliveryDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isMobile ? (
        <MobileMetricRibbon>
          <MobileMetricCard title="Total" value={stats.total.toString()} icon={ShoppingCart} variant="default" />
          <MobileMetricCard title="Pendentes" value={stats.pendentes.toString()} icon={Clock} variant="warning" />
          <MobileMetricCard title="Confirmados" value={stats.confirmados.toString()} icon={CheckCircle2} variant="info" />
          <MobileMetricCard title="Valor Total" value={stats.totalValue} icon={DollarSign} variant="success" />
        </MobileMetricRibbon>
      ) : (
        <ResponsiveGrid config={{ mobile: 2, tablet: 2, desktop: 4 }} gap="sm">
          <MetricCard title="Total" value={stats.total.toString()} icon={ShoppingCart} variant="default" />
          <MetricCard title="Pendentes" value={stats.pendentes.toString()} icon={Clock} variant="warning" />
          <MetricCard title="Confirmados" value={stats.confirmados.toString()} icon={CheckCircle2} variant="info" />
          <MetricCard title="Valor Total" value={stats.totalValue} icon={DollarSign} variant="success" />
        </ResponsiveGrid>
      )}

      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full">
          {/* Search Field */}
          <div className="flex-1 max-w-xl">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar pedidos..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:ml-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-11 bg-white dark:bg-background border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/10 rounded-lg shadow-sm text-zinc-900 dark:text-zinc-100 transition-all">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {PACKAGING_ORDER_STATUS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={onCreateOrder} 
              className={cn(ds.components.button.primary, "h-11 px-6 w-full sm:w-auto")}
            >
              <Plus className="h-4 w-4 mr-2" />Novo Pedido
            </Button>
          </div>
        </div>
      </div>

      {paginatedData.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <ShoppingCart className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-6" />
          <p className="text-zinc-500 font-medium">Nenhum pedido de embalagem encontrado</p>
          <Button variant="outline" className="mt-6 rounded-xl" onClick={onCreateOrder}>
            <Plus className="h-4 w-4 mr-2" />Criar Primeiro Pedido
          </Button>
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {paginatedData.items.map((order, index) => {
            const numero = paginatedData.pagination.startIndex + index + 1;
            return (
              <MobilePackagingOrderCard
                key={order.id}
                order={order}
                orderNumber={numero}
                onViewDetails={handleViewDetails}
                onUpdateStatus={handleUpdateStatus}
                onConfirmDelivery={handleConfirmDelivery}
                onDelete={handleDelete}
              />
            );
          })}
        </div>
      ) : (
        <Table className={ds.components.table.root}>
          <TableHeader className={ds.components.table.header}>
            <TableRow className="border-none hover:bg-transparent">
              <TableCell colSpan={7} className="px-1 pb-0 pt-0 border-none">
                <div className={cn(ds.components.table.headerWrapper, ds.components.table.accents.brand.bg, ds.components.table.accents.brand.border)}>
                  <div className="w-[14%] flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", ds.components.table.accents.brand.bg)}>
                      <ShoppingCart className={cn("h-4 w-4", ds.components.table.accents.brand.icon)} />
                    </div>
                    <span className={cn(ds.components.table.headerLabel, ds.components.table.accents.brand.text)}>Pedido</span>
                  </div>
                  <div className="w-[18%] pl-2 flex items-center gap-2">
                    <span className={ds.components.table.headerLabel}>Fornecedor</span>
                  </div>
                  <div className="w-[20%] pl-2 flex items-center gap-2">
                    <span className={ds.components.table.headerLabel}>Itens</span>
                  </div>
                  <div className="w-[12%] pl-2 flex items-center gap-2">
                    <span className={ds.components.table.headerLabel}>Entrega</span>
                  </div>
                  <div className="w-[12%] pl-2 flex justify-center items-center gap-2">
                    <span className={ds.components.table.headerLabel}>Status</span>
                  </div>
                  <div className="w-[12%] pl-2 flex items-center gap-2">
                    <span className={ds.components.table.headerLabel}>Valor</span>
                  </div>
                  <div className="w-[12%] flex justify-end items-center px-2">
                    <span className={ds.components.table.headerLabel}>Ações</span>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.items.map((order, index) => {
              const numero = paginatedData.pagination.startIndex + index + 1;
              const isEntregue = order.status === "entregue";
              
              return (
                <TableRow key={order.id} className="group border-none hover:bg-transparent">
                  <TableCell colSpan={7} className={ds.components.table.cell}>
                    <div className={cn(
                      ds.components.table.row,
                      ds.components.table.rowWrapper,
                      isEntregue && ds.components.table.rowActive
                    )}>
                      {/* Pedido */}
                      <div className="w-[14%] flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center border transition-colors",
                          isEntregue 
                            ? "bg-brand/10 border-brand/20" 
                            : "bg-muted/50 border-border/50"
                        )}>
                          {isEntregue ? (
                            <CheckCircle2 className="h-4 w-4 text-brand" />
                          ) : (
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <span className={cn("font-bold text-sm", ds.colors.text.primary)}>#{numero.toString().padStart(4, '0')}</span>
                          <p className={cn("text-[11px]", ds.colors.text.muted)}>{order.orderDate}</p>
                        </div>
                      </div>

                      {/* Fornecedor */}
                      <div className="w-[18%] pl-2">
                        <CapitalizedText className={cn("font-bold text-sm truncate block max-w-[140px]", ds.colors.text.primary)}>
                          {order.supplierName}
                        </CapitalizedText>
                        <p className={cn("text-[11px]", ds.colors.text.muted)}>{order.itens.length} item(ns)</p>
                      </div>
                      
                      {/* Itens */}
                      <div className="w-[20%] pl-2">
                        <CapitalizedText className={cn("font-bold text-sm truncate block max-w-[160px]", ds.colors.text.primary)}>
                          {order.itens.slice(0, 2).map(i => i.packagingName).join(', ')}
                        </CapitalizedText>
                        {order.itens.length > 2 && (
                          <p className={cn("text-[11px]", ds.colors.text.muted)}>+{order.itens.length - 2} mais</p>
                        )}
                      </div>
                      
                      {/* Entrega */}
                      <div className={cn("w-[12%] pl-2 text-xs", ds.colors.text.secondary)}>
                        {order.deliveryDate ? (
                          <div className="flex items-center gap-1.5">
                            <Truck className="h-3.5 w-3.5 opacity-50" />
                            <span>{order.deliveryDate}</span>
                          </div>
                        ) : (
                          <span className="opacity-50">-</span>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="w-[12%] pl-2 flex justify-center">
                        {getStatusBadge(order.status)}
                      </div>
                      
                      {/* Valor */}
                      <div className="w-[12%] pl-2">
                        <span className="font-bold text-sm text-brand">
                          {formatCurrency(order.totalValue)}
                        </span>
                      </div>
                      
                      {/* Ações */}
                      <div className="w-[12%] pl-2 flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={ds.components.button.size.icon}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className={cn(ds.components.card.root, "p-1 min-w-[160px]")}>
                            <DropdownMenuItem onClick={() => handleViewDetails(order)} className="rounded-lg gap-2">
                              <Eye className="h-4 w-4" />Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className={ds.components.separator.horizontal} />
                            {order.status === "pendente" && (
                              <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmado')} className="rounded-lg gap-2 text-brand">
                                <CheckCircle2 className="h-4 w-4" />Confirmar
                              </DropdownMenuItem>
                            )}
                            {(order.status === "pendente" || order.status === "confirmado") && (
                              <DropdownMenuItem onClick={() => handleConfirmDelivery(order)} className="rounded-lg gap-2 text-brand">
                                <Truck className="h-4 w-4" />Marcar Entregue
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className={ds.components.separator.horizontal} />
                            <DropdownMenuItem onClick={() => handleDelete(order.id)} className="rounded-lg gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                              <Trash2 className="h-4 w-4" />Excluir
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

      <ConfirmPackagingDeliveryDialog
        open={deliveryDialogOpen}
        onOpenChange={setDeliveryDialogOpen}
        order={selectedOrder}
      />
    </div>
  );
}

export default memo(PackagingOrdersTab);
