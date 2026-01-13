import { useState, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Loader2, Package, Truck, Eye
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
        <ExpandableSearch value={searchTerm} onChange={setSearchTerm} placeholder="Buscar..." accentColor="purple" expandedWidth="w-full sm:w-48" />
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
          <Button onClick={onCreateOrder} className="h-10 bg-purple-600 hover:bg-purple-700">
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
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-100 dark:bg-purple-900/30">
                      <ShoppingCart className="h-5 w-5 text-purple-600" />
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
        <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted dark:bg-accent/20 border-b border-border dark:border-primary/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="table-header py-4 px-6"><div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Pedido</div></TableHead>
                  <TableHead className="table-header py-4"><div className="flex items-center gap-2"><Building2 className="h-4 w-4" />Fornecedor</div></TableHead>
                  <TableHead className="hidden md:table-cell table-header py-4"><div className="flex items-center gap-2"><Package className="h-4 w-4" />Itens</div></TableHead>
                  <TableHead className="hidden lg:table-cell table-header py-4"><div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Entrega</div></TableHead>
                  <TableHead className="table-header py-4">Status</TableHead>
                  <TableHead className="text-right table-header py-4"><div className="flex items-center justify-end gap-2"><DollarSign className="h-4 w-4" />Valor</div></TableHead>
                  <TableHead className="text-right table-header py-4 px-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.items.map((order, index) => {
                  const numero = paginatedData.pagination.startIndex + index + 1;
                  return (
                    <TableRow key={order.id} className={cn("sm:hover:bg-accent/50 border-b border-border", index % 2 === 0 ? "bg-card" : "bg-muted/30")}>
                      <TableCell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20"><ShoppingCart className="h-4 w-4 text-primary" /></div>
                          <div className="min-w-0">
                            <div className="table-cell-primary font-mono truncate">#{numero.toString().padStart(4, '0')}</div>
                            <div className="table-cell-secondary mt-1 flex items-center gap-1"><Calendar className="h-3 w-3" />{order.orderDate}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="min-w-0">
                          <CapitalizedText className="table-cell-primary truncate block">{order.supplierName}</CapitalizedText>
                          <div className="table-cell-secondary mt-1"><span className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md"><Package className="h-3 w-3" />{order.itens.length} itens</span></div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-4">
                        <div className="min-w-0">
                          <div className="table-cell-primary truncate max-w-[200px]">{order.itens.slice(0, 2).map(i => i.packagingName).join(', ')}{order.itens.length > 2 && <span className="table-cell-secondary"> +{order.itens.length - 2} mais</span>}</div>
                          <div className="table-cell-secondary mt-1">{order.itens.reduce((sum, i) => sum + i.quantidade, 0)} unidades</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-4">
                        {order.deliveryDate ? (
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1 text-foreground"><Truck className="h-3 w-3 text-primary" />{order.deliveryDate}</div>
                            <div className="text-xs text-muted-foreground">Entrega prevista</div>
                          </div>
                        ) : <span className="text-muted-foreground text-sm">-</span>}
                      </TableCell>
                      <TableCell className="py-4">{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right py-4"><div className="font-bold text-success text-base">R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent"><MoreVertical className="h-4 w-4" /><span className="sr-only">Abrir menu</span></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleViewDetails(order)} className="cursor-pointer"><Eye className="h-4 w-4 mr-2 text-blue-600" /><span>Ver Detalhes</span></DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {order.status === "pendente" && <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'confirmado')} className="cursor-pointer"><CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" /><span>Confirmar</span></DropdownMenuItem>}
                              {(order.status === "pendente" || order.status === "confirmado") && <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'entregue')} className="cursor-pointer text-emerald-600"><Truck className="h-4 w-4 mr-2" /><span>Marcar Entregue</span></DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(order.id)} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="h-4 w-4 mr-2" /><span>Excluir</span></DropdownMenuItem>
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
        </div>
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
