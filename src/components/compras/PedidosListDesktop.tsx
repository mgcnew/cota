import { memo, useState, useCallback } from 'react';
import { PackageOpen, Truck, Info, MoreVertical, ClipboardCheck, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { StatusSelect, ORDER_STATUS_OPTIONS } from "@/components/ui/status-select";
import { capitalize } from "@/lib/text-utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OrderData } from "@/hooks/usePedidosStats";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";

interface PedidosListDesktopProps {
  pedidos: OrderData[];
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

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getDeliveryUrgency = (dateStr: string, status: string): 'expired' | 'urgent' | 'normal' | null => {
  if (!dateStr || status === 'entregue' || status === 'cancelado') return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const delivery = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((delivery.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 2) return 'urgent';
  return 'normal';
};

export const PedidosListDesktop = memo(({
  pedidos,
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
        case 'id':         cmp = (a.id || '').localeCompare(b.id || '', 'pt-BR'); break;
        case 'fornecedor': cmp = (a.fornecedor || '').localeCompare(b.fornecedor || '', 'pt-BR'); break;
        case 'status':     cmp = (a.status || '').localeCompare(b.status || '', 'pt-BR'); break;
        case 'valorTotal': cmp = extractPrice(a.total || '') - extractPrice(b.total || ''); break;
        case 'itens':      cmp = (a.itens || 0) - (b.itens || 0); break;
        case 'dataEntrega': {
          const parseDate = (dStr: string) => {
            if (!dStr) return 0;
            const parts = dStr.split('/');
            return parts.length === 3 ? new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime() : 0;
          };
          cmp = parseDate(a.dataEntrega || '') - parseDate(b.dataEntrega || '');
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  })();

  const SortHeader = ({ label, sortId, className }: { label: string; sortId: SortKey; className?: string }) => {
    const isActive = sortKey === sortId;
    return (
      <TableHead
        className={cn("cursor-pointer select-none group/th", isActive && "text-foreground font-semibold", className)}
        onClick={() => handleSort(sortId)}
      >
        <div className="flex items-center gap-1.5">
          {label}
          <div className="w-3 h-3 text-muted-foreground/30 transition-colors">
            {isActive ? (
              sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-brand" /> : <ChevronDown className="w-3 h-3 text-brand" />
            ) : (
              <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </TableHead>
    );
  };

  return (
    <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Fornecedor" sortId="fornecedor" className="w-[25%]" />
              <SortHeader label="Status" sortId="status" className="w-[18%]" />
              <SortHeader label="Valor Total" sortId="valorTotal" className="w-[18%]" />
              <SortHeader label="Itens" sortId="itens" className="w-[12%]" />
              <SortHeader label="Previsão Entrega" sortId="dataEntrega" className="w-[17%]" />
              <TableHead className="text-right w-[10%]">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedPedidos.map((pedido) => {
              const deliveryUrgency = getDeliveryUrgency(pedido.dataEntrega || '', pedido.status);

              return (
                <TableRow key={pedido.id} className="group border-b border-border/60 dark:border-white/5">
                  {/* Fornecedor */}
                  <TableCell>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-black text-brand">{initials(pedido.fornecedor)}</span>
                      </div>
                      <span className="font-medium text-foreground truncate max-w-[160px]" title={pedido.fornecedor}>
                        {capitalize(pedido.fornecedor)}
                      </span>
                    </div>
                  </TableCell>

                  {/* Status Select */}
                  <TableCell>
                    <div className="w-full max-w-[140px]">
                      <StatusSelect
                        value={pedido.status}
                        options={ORDER_STATUS_OPTIONS}
                        onChange={(newStatus) => onUpdateStatus(pedido.id, newStatus)}
                        isLoading={isUpdating}
                        disabled={pedido.status === 'entregue' || pedido.status === 'cancelado'}
                      />
                    </div>
                  </TableCell>

                  {/* Valor Total */}
                  <TableCell>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400 tracking-tight">
                      {pedido.total}
                    </span>
                  </TableCell>

                  {/* Itens */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-foreground">{pedido.itens}</span>
                      <span className="text-xs text-muted-foreground">prod.</span>
                      {pedido.produtos && pedido.produtos.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className={ds.components.tooltip.content}>
                              <p className="font-bold mb-1 text-sm">Itens do pedido:</p>
                              <ul className="space-y-1 text-xs">
                                {pedido.detalhesItens.map((item, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand/50" />
                                    <span>{item.produto}</span>
                                    <span className="font-mono text-muted-foreground">({item.quantidade}x)</span>
                                  </li>
                                ))}
                              </ul>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>

                  {/* Entrega */}
                  <TableCell>
                    <div className={cn(
                      "flex items-center gap-2 text-sm",
                      deliveryUrgency === 'expired' ? "text-red-500 dark:text-red-400" :
                      deliveryUrgency === 'urgent' ? "text-amber-500 dark:text-amber-400" :
                      "text-muted-foreground"
                    )}>
                      <Truck className="h-4 w-4 opacity-70" />
                      <span>{pedido.dataEntrega || '-'}</span>
                    </div>
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent transition-colors">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 overflow-hidden rounded-xl">
                        <DropdownMenuItem onClick={() => onManage(pedido)} className="gap-2 cursor-pointer">
                          <PackageOpen className="h-4 w-4 text-blue-500" />
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
    </Table>
  );
});
