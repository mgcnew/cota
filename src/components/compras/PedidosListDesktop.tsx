import { memo } from 'react';
import { ShoppingCart, Building2, CircleDot, DollarSign, Info, Truck, Package, MoreVertical, ClipboardCheck, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusSelect, ORDER_STATUS_OPTIONS } from "@/components/ui/status-select";
import { capitalize } from "@/lib/text-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { OrderData } from "@/hooks/usePedidosStats";

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
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead colSpan={7} className="px-1 pb-3 pt-0 border-none">
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
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => (
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
                      onChange={(newStatus) => onUpdateStatus(pedido.id, newStatus)}
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
                        <DropdownMenuItem onClick={() => onManage(pedido)} className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70"><ShoppingCart className="h-4 w-4 mr-2" />Gerenciar</DropdownMenuItem>
                        {pedido.status !== "entregue" && pedido.status !== "cancelado" && (
                          <DropdownMenuItem onClick={() => onRegisterDelivery(pedido)} className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30">
                            <ClipboardCheck className="h-4 w-4 mr-2" />Registrar Entrega
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-700" />
                        <DropdownMenuItem onClick={() => onDelete(pedido)} className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
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
