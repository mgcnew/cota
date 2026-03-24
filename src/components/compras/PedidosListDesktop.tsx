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
import { StatusBadge } from '@/components/ui/status-badge';

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
            <TableCell colSpan={7} className="px-1 pb-0 pt-0 border-none">
              <div className={cn(designSystem.components.table.headerWrapper, designSystem.components.table.accents.brand.bg, designSystem.components.table.accents.brand.border)}>
                <div className="w-[15%] flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", designSystem.components.table.accents.brand.bg)}>
                    <ShoppingCart className={cn("h-4 w-4", designSystem.components.table.accents.brand.icon)} />
                  </div>
                  <span className={cn(designSystem.components.table.headerLabel, designSystem.components.table.accents.brand.text)}>Pedido</span>
                </div>
                <div className="w-[20%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Fornecedor</span>
                </div>
                <div className="w-[12%] pl-2 flex justify-center items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Status</span>
                </div>
                <div className="w-[15%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Valor Total</span>
                </div>
                <div className="w-[12%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Itens</span>
                </div>
                <div className="w-[15%] pl-2 flex items-center gap-2">
                  <span className={designSystem.components.table.headerLabel}>Previsão Entrega</span>
                </div>
                <div className="w-[11%] flex justify-end items-center gap-2 px-2">
                  <span className={designSystem.components.table.headerLabel}>Ações</span>
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
                  designSystem.components.table.row,
                  designSystem.components.table.rowWrapper
                )}>
                  {/* Pedido # */}
                  <div className="w-[15%] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-border/40">
                      <ShoppingCart className="h-4 w-4 text-brand" />
                    </div>
                    <div>
                      <span className={designSystem.components.dataDisplay.code}>
                        #{pedido.id.substring(0, 8)}
                      </span>
                      <p className={designSystem.components.dataDisplay.secondary}>
                        {pedido.dataPedido}
                      </p>
                    </div>
                  </div>

                  {/* Fornecedor */}
                  <div className="w-[20%] pl-2 min-w-0 flex flex-col">
                    <span className={designSystem.components.dataDisplay.highlight}>{capitalize(pedido.fornecedor)}</span>
                    <span className={designSystem.components.dataDisplay.secondary}>#{pedido.id.substring(0, 4)}</span>
                  </div>

                  {/* Status Select */}
                  <div className="w-[12%] pl-2 flex justify-center">
                    <StatusSelect
                      value={pedido.status}
                      options={ORDER_STATUS_OPTIONS}
                      onChange={(newStatus) => onUpdateStatus(pedido.id, newStatus)}
                      isLoading={isUpdating}
                      disabled={pedido.status === 'entregue' || pedido.status === 'cancelado'}
                    />
                  </div>

                  {/* Valor Total */}
                  <div className="w-[15%] pl-2">
                    <div className="flex flex-col">
                      <span className={designSystem.components.dataDisplay.money}>
                        {pedido.total}
                      </span>
                      <span className={designSystem.components.dataDisplay.secondary}>Data: {pedido.dataPedido}</span>
                    </div>
                  </div>

                  {/* Itens Tooltip */}
                  <div className="w-[12%] pl-2 flex items-center gap-1.5">
                    <span className={designSystem.components.dataDisplay.highlight}>{pedido.itens}</span>
                    <span className={designSystem.components.dataDisplay.secondary}>prod.</span>
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

                  {/* Entrega */}
                  <div className="w-[15%] pl-2">
                    <div className={cn("flex items-center gap-1.5", designSystem.components.dataDisplay.secondary)}>
                      <Truck className="h-3.5 w-3.5 opacity-50" />
                      {pedido.dataEntrega || '-'}
                    </div>
                  </div>

                  {/* Ações */}
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
