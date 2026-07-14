import { memo } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye, Trash2, MoreVertical, CheckCircle2, Truck, Calendar, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingOrderDisplay } from "@/types/packaging";

interface MobilePackagingOrderCardProps {
  order: PackagingOrderDisplay;
  orderNumber: number;
  onViewDetails: (order: PackagingOrderDisplay) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onConfirmDelivery: (order: PackagingOrderDisplay) => void;
  onDelete: (orderId: string) => void;
}

const STATUS_ACCENT: Record<string, string> = {
  entregue:   "bg-emerald-500",
  confirmado: "bg-blue-500",
  pendente:   "bg-amber-400",
  cancelado:  "bg-red-400",
};

export const MobilePackagingOrderCard = memo(function MobilePackagingOrderCard({
  order,
  orderNumber,
  onViewDetails,
  onUpdateStatus,
  onConfirmDelivery,
  onDelete,
}: MobilePackagingOrderCardProps) {

  const isEntregue = order.status === "entregue";
  const isConfirmado = order.status === "confirmado";
  const isPendente = order.status === "pendente";

  const accent = STATUS_ACCENT[order.status] ?? "bg-zinc-400";

  const supplierLabel = order.supplierName;
  const itemsLabel = order.itens.length > 0
    ? order.itens.slice(0, 2).map(i => i.packagingName).join(", ") + (order.itens.length > 2 ? ` +${order.itens.length - 2}` : "")
    : "Sem itens";

  const ctaLabel = isEntregue
    ? "Ver Detalhes"
    : isConfirmado
      ? "Marcar Entregue"
      : "Confirmar Pedido";

  const ctaIcon = isEntregue
    ? <Eye className="h-3.5 w-3.5" />
    : isConfirmado
      ? <Truck className="h-3.5 w-3.5" />
      : <CheckCircle2 className="h-3.5 w-3.5" />;

  const handleCTA = () => {
    if (isEntregue) onViewDetails(order);
    else if (isConfirmado) onConfirmDelivery(order);
    else onUpdateStatus(order.id, "confirmado");
  };

  return (
    <div className="relative bg-card border border-border dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
      {/* Left accent */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", accent)} />

      <div className="pl-4 pr-3 py-3">
        {/* Top row: supplier name + total value + menu */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
              <CapitalizedText>{supplierLabel}</CapitalizedText>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              #{orderNumber.toString().padStart(4, "0")} · <CapitalizedText as="span">{itemsLabel}</CapitalizedText>
            </p>
          </div>

          <div className="text-right shrink-0 mr-1">
            <p className="text-[13px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(order.totalValue)}
            </p>
            <p className="text-[10px] text-muted-foreground/60">valor total</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all shrink-0 touch-manipulation">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onViewDetails(order)} className="gap-2">
                <Eye className="h-4 w-4" /> Ver Detalhes
              </DropdownMenuItem>
              {isPendente && (
                <DropdownMenuItem onClick={() => onUpdateStatus(order.id, "confirmado")} className="gap-2 text-blue-600">
                  <CheckCircle2 className="h-4 w-4" /> Confirmar Pedido
                </DropdownMenuItem>
              )}
              {(isPendente || isConfirmado) && (
                <DropdownMenuItem onClick={() => onConfirmDelivery(order)} className="gap-2 text-emerald-600">
                  <Truck className="h-4 w-4" /> Marcar Entregue
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(order.id)} className="gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30">
                <Trash2 className="h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border dark:border-white/5">
          <StatusBadge
            status={order.status}
            className="text-[10px] h-5 px-2 shrink-0"
          />
          <div className="flex items-center gap-3 ml-auto text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span className="font-medium">{order.itens.length} item(ns)</span>
            </span>
            {order.deliveryDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{order.deliveryDate}</span>
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <Button
          size="sm"
          onClick={handleCTA}
          className={cn(
            "w-full mt-2.5 h-9 rounded-lg font-semibold text-xs gap-1.5",
            isEntregue
              ? "bg-muted text-foreground hover:bg-muted/80"
              : isConfirmado
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-brand hover:bg-brand/90 text-white"
          )}
        >
          {ctaIcon}
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
});
