import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { capitalize } from "@/lib/text-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ShoppingCart, Trash2, Package, Clock, AlertCircle, MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrderData {
  id: string;
  fornecedor: string;
  total: string;
  status: string;
  dataPedido: string;
  dataEntrega: string;
  itens: number;
  produtos: string[];
  observacoes: string;
  detalhesItens: Array<{
    produto: string;
    quantidade: number;
    valorUnitario: number;
  }>;
  supplier_id: string | null;
  delivery_date: string;
}

export interface MobileOrderCardProps {
  pedido: OrderData;
  onManage: (pedido: OrderData) => void;
  onDelete: (pedido: OrderData) => void;
  onUpdateStatus?: (pedidoId: string, status: string) => void;
  className?: string;
}

const STATUS_ACCENT: Record<string, string> = {
  pendente:   "bg-amber-400",
  enviado:    "bg-blue-500",
  confirmado: "bg-emerald-500",
  entregue:   "bg-zinc-400",
  cancelado:  "bg-zinc-400",
};

export const MobileOrderCard = memo(function MobileOrderCard({
  pedido,
  onManage,
  onDelete,
}: MobileOrderCardProps) {

  const isDelayed = useMemo(() => {
    if (pedido.status === 'entregue' || pedido.status === 'cancelado') return false;
    if (!pedido.delivery_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delivery = new Date(pedido.delivery_date + 'T00:00:00');
    return delivery < today;
  }, [pedido.status, pedido.delivery_date]);

  const isClosed = pedido.status === 'entregue' || pedido.status === 'cancelado';
  const accent = isDelayed ? "bg-red-500" : (STATUS_ACCENT[pedido.status] ?? "bg-zinc-400");

  return (
    <div className="relative bg-card border border-border dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
      {/* Left accent border by status */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", accent)} />

      {/* Pulse dot for delayed orders */}
      {isDelayed && (
        <div className="absolute top-3 right-10 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}

      <div className="pl-4 pr-3 py-3">
        {/* Top row: supplier name + total + menu */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
              {capitalize(pedido.fornecedor)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              #{pedido.id.substring(0, 7)}
            </p>
          </div>

          <div className="text-right shrink-0 mr-1">
            <p className="text-[13px] font-bold text-foreground tabular-nums">
              {pedido.total}
            </p>
            <p className="text-[10px] text-muted-foreground/60">{pedido.dataPedido}</p>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all shrink-0 touch-manipulation">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onManage(pedido)} className="gap-2">
                <ShoppingCart className="h-4 w-4" /> Gerenciar
              </DropdownMenuItem>
              {!isClosed && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(pedido)}
                    className="gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Info row: status + items + delivery */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border dark:border-white/5">
          <StatusBadge status={pedido.status} className="text-[10px] h-5 px-2 shrink-0" />
          <div className="flex items-center gap-3 ml-auto text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span className="font-medium">{pedido.itens} {pedido.itens === 1 ? 'item' : 'itens'}</span>
            </span>
            <span className={cn(
              "flex items-center gap-1",
              isDelayed && "text-red-500 font-semibold"
            )}>
              {isDelayed
                ? <AlertCircle className="h-3 w-3" />
                : <Clock className="h-3 w-3" />
              }
              <span>{isDelayed ? 'Atrasado' : (pedido.dataEntrega || '—')}</span>
            </span>
          </div>
        </div>

        {/* Primary CTA */}
        <Button
          size="sm"
          onClick={() => onManage(pedido)}
          className={cn(
            "w-full mt-2.5 h-9 rounded-lg font-semibold text-xs gap-1.5",
            isDelayed
              ? "bg-red-500 hover:bg-red-600 text-white"
              : isClosed
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "bg-brand hover:bg-brand/90 text-white dark:text-zinc-950"
          )}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          {isClosed ? "Ver Pedido" : "Gerenciar Pedido"}
        </Button>
      </div>
    </div>
  );
}, (prevProps, nextProps) =>
  prevProps.pedido.id            === nextProps.pedido.id            &&
  prevProps.pedido.status        === nextProps.pedido.status        &&
  prevProps.pedido.total         === nextProps.pedido.total         &&
  prevProps.pedido.itens         === nextProps.pedido.itens         &&
  prevProps.pedido.dataEntrega   === nextProps.pedido.dataEntrega   &&
  prevProps.pedido.fornecedor    === nextProps.pedido.fornecedor    &&
  prevProps.pedido.delivery_date === nextProps.pedido.delivery_date
);

export default MobileOrderCard;
