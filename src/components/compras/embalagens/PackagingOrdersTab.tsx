import { useState, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePackagingOrders } from "@/hooks/usePackagingOrders";
import { useDebounce } from "@/hooks/useDebounce";
import { usePagination } from "@/hooks/usePagination";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchInput } from "@/components/ui/search-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataPagination } from "@/components/ui/data-pagination";
import { StatCard } from "@/components/ui/stat-card";
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
  Loader2, Package, Truck, Eye, CircleDot, SlidersHorizontal
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

    const config: Record<string, { cls: string; Icon: typeof Clock }> = {
      pendente:   { cls: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30", Icon: Clock },
      confirmado: { cls: ds.components.badge.active as string,       Icon: CheckCircle2 },
      entregue:   { cls: ds.components.badge.success as string,      Icon: Truck },
      cancelado:  { cls: ds.components.badge.destructive as string,  Icon: CircleDot },
    };

    const { cls, Icon } = config[status] ?? { cls: ds.components.badge.outline as string, Icon: Clock };

    return (
      <Badge className={cn(cls, "gap-1.5")}>
        <Icon className="h-3 w-3" />
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
    <div className="space-y-4">
      {/* Métricas — desktop only */}
      {!isMobile && (
        <ResponsiveGrid config={{ mobile: 2, tablet: 2, desktop: 4 }} gap="sm">
          <StatCard title="Total" value={stats.total.toString()} icon={ShoppingCart} variant="default" />
          <StatCard title="Pendentes" value={stats.pendentes.toString()} icon={Clock} variant="warning" />
          <StatCard title="Confirmados" value={stats.confirmados.toString()} icon={CheckCircle2} variant="info" />
          <StatCard title="Valor Total" value={stats.totalValue} icon={DollarSign} variant="success" />
        </ResponsiveGrid>
      )}

      {/* Unified Container */}
      <div className="w-full bg-white dark:bg-card border border-border dark:border-white/5 sm:rounded-xl overflow-hidden shadow-sm">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2.5 px-3.5 py-2.5 border-b border-border dark:border-white/5 bg-zinc-50/50 dark:bg-muted/30">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Pesquisar..." />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5 text-sm">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Status</span>
                  {statusFilter !== "all" && (
                    <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold bg-brand text-white rounded-full">1</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-1.5" align="start">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">Filtrar por status</p>
                {[{ value: "all", label: "Todos os Status" }, ...PACKAGING_ORDER_STATUS].map(item => (
                  <button
                    key={item.value}
                    onClick={() => setStatusFilter(item.value)}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 text-sm rounded-md transition-colors",
                      statusFilter === item.value ? "bg-brand text-white font-medium" : "text-foreground hover:bg-muted"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button onClick={onCreateOrder} className={cn(ds.components.button.primary, "h-9 px-4")}>
              <Plus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Novo Pedido</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="w-full">
          {paginatedData.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground/30 mb-6" />
              <p className="text-muted-foreground font-medium">Nenhum pedido de embalagem encontrado</p>
              <Button variant="outline" className="mt-6 rounded-xl" onClick={onCreateOrder}>
                <Plus className="h-4 w-4 mr-2" />Criar Primeiro Pedido
              </Button>
            </div>
          ) : (
            <>
              {/* Só monta a view do dispositivo atual (evita cards + tabela juntos no DOM) */}
              {isMobile ? (
                <div className="space-y-3 p-2 pb-24">
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
                <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[16%]">Pedido</TableHead>
                  <TableHead className="w-[18%]">Fornecedor</TableHead>
                  <TableHead className="w-[22%]">Itens</TableHead>
                  <TableHead className="w-[12%]">Entrega</TableHead>
                  <TableHead className="w-[12%]">Status</TableHead>
                  <TableHead className="w-[12%]">Valor</TableHead>
                  <TableHead className="text-right w-[8%] pr-4">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.items.map((order, index) => {
                  const numero = paginatedData.pagination.startIndex + index + 1;
                  const isEntregue = order.status === "entregue";

                  return (
                    <TableRow key={order.id} className="group">
                      {/* Pedido # */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                            {isEntregue
                              ? <CheckCircle2 className="h-4 w-4 text-brand" />
                              : <ShoppingCart className="h-4 w-4 text-brand" />}
                          </div>
                          <div>
                            <span className="font-bold text-[11px] text-brand tabular-nums">
                              #{numero.toString().padStart(4, "0")}
                            </span>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{order.orderDate}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Fornecedor */}
                      <TableCell>
                        <CapitalizedText className="font-medium text-foreground truncate block max-w-[150px]">
                          {order.supplierName}
                        </CapitalizedText>
                        <span className="text-[11px] text-muted-foreground">{order.itens.length} item(ns)</span>
                      </TableCell>

                      {/* Itens */}
                      <TableCell>
                        <CapitalizedText className="font-medium text-foreground truncate block max-w-[180px]">
                          {order.itens.slice(0, 2).map(i => i.packagingName).join(", ")}
                        </CapitalizedText>
                        {order.itens.length > 2 && (
                          <span className="text-[11px] text-muted-foreground">+{order.itens.length - 2} mais</span>
                        )}
                      </TableCell>

                      {/* Entrega */}
                      <TableCell>
                        {order.deliveryDate ? (
                          <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground whitespace-nowrap">
                            <Truck className="h-3 w-3 opacity-50" />{order.deliveryDate}
                          </span>
                        ) : (
                          <span className="text-[12px] text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(order.status)}</TableCell>

                      {/* Valor */}
                      <TableCell>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400 tracking-tight">
                          {formatCurrency(order.totalValue)}
                        </span>
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="pr-4">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-accent data-[state=open]:bg-accent transition-colors">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52 overflow-hidden rounded-xl">
                              <DropdownMenuItem onClick={() => handleViewDetails(order)} className="gap-2 py-2 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20">
                                <Eye className="h-4 w-4 text-blue-500" />Ver Detalhes
                              </DropdownMenuItem>
                              {order.status === "pendente" && (
                                <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, "confirmado")} className="gap-2 py-2 cursor-pointer focus:bg-emerald-50 dark:focus:bg-emerald-900/20">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />Confirmar Pedido
                                </DropdownMenuItem>
                              )}
                              {(order.status === "pendente" || order.status === "confirmado") && (
                                <DropdownMenuItem onClick={() => handleConfirmDelivery(order)} className="gap-2 py-2 cursor-pointer focus:bg-brand/10">
                                  <Truck className="h-4 w-4 text-brand" />Marcar Entregue
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(order.id)} className="gap-2 py-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                                <Trash2 className="h-4 w-4" />Excluir Pedido
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
              </div>
              )}
            </>
          )}
        </div>

        {/* Pagination Section */}
        {paginatedData.pagination.totalPages > 1 && (
          <div className={cn("mt-2", !isMobile && "pt-6 border-t border-border dark:border-white/5")}>
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
          </div>
        )}
      </div>

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

