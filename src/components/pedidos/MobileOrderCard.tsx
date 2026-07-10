import { memo, useMemo } from "react";
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

// Acento como BORDA-esquerda do card (sem elemento absoluto + overflow-hidden,
// que criava camada de máscara e corrompia em GPU Mali).
const ACCENT_BORDER: Record<string, string> = {
  pendente:   "border-l-amber-400",
  enviado:    "border-l-blue-500",
  confirmado: "border-l-emerald-500",
  entregue:   "border-l-zinc-300 dark:border-l-zinc-700",
  cancelado:  "border-l-zinc-300 dark:border-l-zinc-700",
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
  const accentBorder = isDelayed ? "border-l-red-500" : (ACCENT_BORDER[pedido.status] ?? "border-l-zinc-300 dark:border-l-zinc-700");

  const ctaStyle = isDelayed
    ? "bg-red-500 hover:bg-red-600 text-white"
    : isClosed
      ? "bg-muted/60 hover:bg-muted text-foreground"
      : "bg-brand/10 hover:bg-brand/20 text-brand";

  return (
    <div className={cn(
      "rounded-xl border border-border dark:border-white/10 border-l-[3px] bg-card p-3.5",
      accentBorder
    )}>
      {/* Header: fornecedor + total + menu */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-snug">
            {capitalize(pedido.fornecedor)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            #{pedido.id.substring(0, 7)}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-foreground tabular-nums leading-none">
            {pedido.total}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">{pedido.dataPedido}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="-mr-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-colors shrink-0 touch-manipulation">
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

      {/* Meta: status + itens + entrega */}
      <div className="flex items-center gap-2 mt-3">
        <StatusBadge status={pedido.status} className="text-[10px] h-5 px-2 shrink-0" />
        <div className="flex items-center gap-3 ml-auto text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span className="font-medium tabular-nums">{pedido.itens} {pedido.itens === 1 ? 'item' : 'itens'}</span>
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

      {/* CTA */}
      <button
        onClick={() => onManage(pedido)}
        className={cn(
          "w-full mt-3 h-9 rounded-lg font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors touch-manipulation active:scale-[0.99]",
          ctaStyle
        )}
      >
        <ShoppingCart className="h-3.5 w-3.5" />
        {isClosed ? "Ver Pedido" : "Gerenciar Pedido"}
      </button>
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
