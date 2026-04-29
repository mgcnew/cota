import { memo, useState, useCallback } from 'react';
import { ShoppingCart, Truck, Info, MoreVertical, ClipboardCheck, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { StatusSelect, ORDER_STATUS_OPTIONS } from "@/components/ui/status-select";
import { capitalize } from "@/lib/text-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { OrderData } from "@/hooks/usePedidosStats";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";

interface PedidosListDesktopProps {
  pedidos: OrderData[];
  startIndex: number;
  onUpdateStatus: (pedidoId: string, status: string) => void;
  onManage: (pedido: OrderData) => void;
  onRegisterDelivery: (pedido: OrderData) => void;
  onDelete: (pedido: OrderData) => void;
  isUpdating: boolean;
}

type SortKey = 'id' | 'fornecedor' | 'status' | 'valorTotal' | 'itens' | 'dataEntrega';
type SortDir = 'asc' | 'desc';

const extractPrice = (priceStr: string): number => {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

export const PedidosListDesktop = memo(({
  pedidos,
  startIndex,
  onUpdateStatus,
  onManage,
  onRegisterDelivery,
  onDelete,
  isUpdating
}: PedidosListDesktopProps) => {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }, [sortKey]);

  const sortedPedidos = (() => {
    if (!sortKey) return pedidos;
    return [...pedidos].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'id':
          cmp = (a.id || '').localeCompare(b.id || '', 'pt-BR');
          break;
        case 'fornecedor':
          cmp = (a.fornecedor || '').localeCompare(b.fornecedor || '', 'pt-BR');
          break;
        case 'status':
          cmp = (a.status || '').localeCompare(b.status || '', 'pt-BR');
          break;
        case 'valorTotal':
          cmp = extractPrice(a.total || '') - extractPrice(b.total || '');
          break;
        case 'itens':
          cmp = (a.itens || 0) - (b.itens || 0);
          break;
        case 'dataEntrega':
          const parseDate = (dStr: string) => {
            if (!dStr) return 0;
            const parts = dStr.split('/');
            if (parts.length === 3) {
              return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
            }
            return 0;
          };
          cmp = parseDate(a.dataEntrega || '') - parseDate(b.dataEntrega || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  })();

  const SortHeader = ({ label, sortId, className }: { label: string; sortId: SortKey; className?: string }) => {
    const isActive = sortKey === sortId;
    return (
      <th
        className={cn(
          "h-11 px-4 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer select-none transition-colors group/th",
          "hover:text-zinc-800 dark:hover:text-zinc-200",
          isActive && "text-zinc-900 dark:text-zinc-100 font-semibold",
          className
        )}
        onClick={() => handleSort(sortId)}
      >
        <div className="flex items-center gap-1.5">
          {label}
          <div className="flex flex-col items-center justify-center w-3 h-3 text-zinc-300 dark:text-zinc-600 transition-colors">
            {isActive ? (
              sortDir === 'asc' ? (
                <ChevronUp className="w-3 h-3 text-brand" />
              ) : (
                <ChevronDown className="w-3 h-3 text-brand" />
              )
            ) : (
              <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </th>
    );
  };

  return (
    <div className="w-full overflow-x-auto custom-scrollbar">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/20">
            <SortHeader label="Pedido" sortId="id" className="w-[15%]" />
            <SortHeader label="Fornecedor" sortId="fornecedor" className="w-[20%]" />
            <SortHeader label="Status" sortId="status" className="w-[15%]" />
            <SortHeader label="Valor Total" sortId="valorTotal" className="w-[15%]" />
            <SortHeader label="Itens" sortId="itens" className="w-[10%]" />
            <SortHeader label="Previsão Entrega" sortId="dataEntrega" className="w-[15%]" />
            <th className="h-11 px-4 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 w-[10%]">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {sortedPedidos.map((pedido, index) => {
            const originalIndex = pedidos.findIndex(p => p.id === pedido.id);
            const pedidoNumero = startIndex + originalIndex + 1;
            
            return (
              <tr 
                key={pedido.id} 
                className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                {/* Pedido # */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700/50 flex-shrink-0 group-hover:bg-white dark:group-hover:bg-zinc-700 transition-colors">
                      <ShoppingCart className="h-4 w-4 text-brand" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-mono text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        #{pedido.id.substring(0, 8)}
                      </span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {pedido.dataPedido}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Fornecedor */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]" title={pedido.fornecedor}>
                      {capitalize(pedido.fornecedor)}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      #{pedido.id.substring(0, 4)}
                    </span>
                  </div>
                </td>

                {/* Status Select */}
                <td className="px-4 py-3 align-middle">
                  <div className="w-full max-w-[140px]">
                    <StatusSelect
                      value={pedido.status}
                      options={ORDER_STATUS_OPTIONS}
                      onChange={(newStatus) => onUpdateStatus(pedido.id, newStatus)}
                      isLoading={isUpdating}
                      disabled={pedido.status === 'entregue' || pedido.status === 'cancelado'}
                    />
                  </div>
                </td>

                {/* Valor Total */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex flex-col">
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {pedido.total}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Data: {pedido.dataPedido}
                    </span>
                  </div>
                </td>

                {/* Itens Tooltip */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{pedido.itens}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">prod.</span>
                    {pedido.produtos && pedido.produtos.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 cursor-help transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className={ds.components.tooltip.content}>
                            <p className="font-bold mb-1 text-sm">Itens do pedido:</p>
                            <ul className="space-y-1 text-xs">
                              {pedido.detalhesItens.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand/50" />
                                  <span>{item.produto}</span>
                                  <span className="font-mono text-zinc-500">({item.quantidade}x)</span>
                                </li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </td>

                {/* Entrega */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                    <Truck className="h-4 w-4 text-zinc-400" />
                    <span>{pedido.dataEntrega || '-'}</span>
                  </div>
                </td>

                {/* Ações */}
                <td className="px-4 py-3 align-middle text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 overflow-hidden rounded-xl">
                      <DropdownMenuItem onClick={() => onManage(pedido)} className="gap-2 cursor-pointer">
                        <ShoppingCart className="h-4 w-4 text-blue-500" />
                        Gerenciar Itens
                      </DropdownMenuItem>
                      {pedido.status !== "entregue" && pedido.status !== "cancelado" && (
                        <DropdownMenuItem onClick={() => onRegisterDelivery(pedido)} className="gap-2 cursor-pointer">
                          <ClipboardCheck className="h-4 w-4 text-emerald-500" />
                          Registrar Entrega
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onDelete(pedido)} className="gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                        Excluir Pedido
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
