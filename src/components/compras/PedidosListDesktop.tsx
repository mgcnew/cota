import { memo } from 'react';
import { ShoppingCart, Building2, CircleDot, DollarSign, Info, Truck, Package, MoreVertical, ClipboardCheck, Trash2, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusSelect, ORDER_STATUS_OPTIONS } from "@/components/ui/status-select";
import { capitalize } from "@/lib/text-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { OrderData } from "@/hooks/usePedidosStats";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";

interface PedidosListDesktopProps {
  pedidos: OrderData[];
  onUpdateStatus: (pedidoId: string, status: string) => void;
  onManage: (pedido: OrderData) => void;
  onRegisterDelivery: (pedido: OrderData) => void;
  onDelete: (pedido: OrderData) => void;
  isUpdating: boolean;
}

export const PedidosListDesktop = memo(({
  pedidos,
  onUpdateStatus,
  onManage,
  onRegisterDelivery,
  onDelete,
  isUpdating
}: PedidosListDesktopProps) => {
  return (
    <div className="hidden md:block overflow-x-auto w-full custom-scrollbar">
      <Table className={designSystem.components.table.root}>
        <TableHeader className={designSystem.components.table.header}>
          <TableRow className="hover:bg-transparent border-none">
            <TableCell colSpan={7} className="px-1 pb-3 pt-0 border-none">
              <div className={cn("flex items-center shadow-sm px-4 py-4 border", designSystem.components.card.flat, designSystem.colors.border.subtle)}>
                <div className="w-[15%] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/50 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                  </div>
                  <span className="uppercase tracking-wide text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Pedido</span>
                </div>
                <div className="w-[20%] pl-2 flex items-center gap-2">
                  <span className="uppercase tracking-wide text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Fornecedor</span>
                </div>
                <div className="w-[12%] pl-2 flex justify-center items-center gap-2">
                  <span className="uppercase tracking-wide text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Status</span>
                </div>
                <div className="w-[15%] pl-2 flex items-center gap-2">
                  <span className="uppercase tracking-wide text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Valor Total</span>
                </div>
                <div className="w-[12%] pl-2 flex items-center gap-2">
                  <span className="uppercase tracking-wide text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Itens</span>
                </div>
                <div className="w-[15%] pl-2 flex items-center gap-2">
                  <span className="uppercase tracking-wide text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Previsão Entrega</span>
                </div>
                <div className="w-[11%] flex justify-end items-center gap-2 px-2">
                  <span className="uppercase tracking-wide text-[10px] font-bold text-zinc-500 dark:text-zinc-400">Ações</span>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => (
            <TableRow key={pedido.id} className="group border-none hover:bg-transparent">
              <TableCell colSpan={7} className={designSystem.components.table.cell}>
                <div className={cn(
                  "flex items-center px-4 py-3 mb-1",
                  designSystem.components.table.row
                )}>
                  <div className="w-[15%] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-border/40">
                      <ShoppingCart className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <span className={cn("font-bold text-sm block", designSystem.colors.text.primary)}>
                        #{pedido.id.substring(0, 8)}
                      </span>
                      <p className={cn("text-[10px] opacity-60", designSystem.colors.text.secondary)}>
                        {pedido.dataPedido}
                      </p>
                    </div>
                  </div>
                  <div className="w-[20%] pl-2 min-w-0">
                    <span className={cn("font-bold text-sm truncate block", designSystem.colors.text.primary)}>
                      {capitalize(pedido.fornecedor)}
                    </span>
                  </div>
                  <div className="w-[12%] pl-2 flex justify-center">
                    <StatusSelect
                      value={pedido.status}
                      options={ORDER_STATUS_OPTIONS}
                      onChange={(newStatus) => onUpdateStatus(pedido.id, newStatus)}
                      isLoading={isUpdating}
                      disabled={pedido.status === 'entregue' || pedido.status === 'cancelado'}
                    />
                  </div>
                  <div className="w-[15%] pl-2">
                    <span className={cn("font-bold text-sm text-brand")}>{pedido.total}</span>
                  </div>
                  <div className="w-[12%] pl-2 flex items-center gap-1.5">
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <Package className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">{pedido.itens}</span>
                    </div>
                    {pedido.produtos && pedido.produtos.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-zinc-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className={designSystem.components.tooltip.content}>
                            <p className="font-bold mb-1">Itens do pedido:</p>
                            <ul className="space-y-0.5">
                              {pedido.detalhesItens.map((item, idx) => (
                                <li key={idx}>• {item.produto} ({item.quantidade}x)</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className={cn("w-[15%] pl-2 text-xs font-medium", designSystem.colors.text.secondary)}>
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 opacity-50" />
                      {pedido.dataEntrega || '-'}
                    </div>
                  </div>
                  <div className="w-[11%] flex justify-end items-center px-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn(designSystem.components.button.size.icon, designSystem.components.button.ghost)}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 overflow-hidden rounded-xl">
                        <DropdownMenuItem onClick={() => onManage(pedido)} className="gap-2">
                          <ShoppingCart className="h-4 w-4 text-blue-500" />
                          Gerenciar Itens
                        </DropdownMenuItem>
                        {pedido.status !== "entregue" && pedido.status !== "cancelado" && (
                          <DropdownMenuItem onClick={() => onRegisterDelivery(pedido)} className="gap-2">
                            <ClipboardCheck className="h-4 w-4 text-emerald-500" />
                            Registrar Entrega
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(pedido)} className="gap-2 text-red-500 focus:text-red-500">
                          <Trash2 className="h-4 w-4" />
                          Excluir Pedido
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
