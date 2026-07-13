import { Info, History, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProductPriceHistory } from "@/hooks/useProductPriceHistory";
import { cn } from "@/lib/utils";

interface LastPaidPricesTooltipProps {
  productId: string;
  /** Preço unitário atual em negociação — quando informado, mostra o delta vs. a última compra. */
  currentPrice?: number;
  /** "inline" = badge visível com valor e delta (padrão); "icon" = só o ícone (i). */
  variant?: "inline" | "icon";
  className?: string;
}

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

/**
 * Referência de decisão: último preço PAGO pelo produto (pedidos anteriores).
 * Trigger visível com o valor e o delta vs. a oferta atual — clicável (funciona
 * no touch) para abrir o histórico das últimas compras.
 */
export function LastPaidPricesTooltip({ productId, currentPrice, variant = "inline", className }: LastPaidPricesTooltipProps) {
  const { data, isLoading } = useProductPriceHistory(productId);
  const orderHistory = (data as any)?.orderHistory || [];
  const entries = orderHistory.slice(0, 3);
  const last = entries[0];

  const deltaPct = last?.price > 0 && currentPrice && currentPrice > 0
    ? ((currentPrice - last.price) / last.price) * 100
    : null;

  const trigger = variant === "inline" && last?.price > 0 ? (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      aria-label="Histórico de valores pagos"
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-1 rounded-md border border-border/60 bg-muted/40",
        "hover:bg-muted/70 transition-colors cursor-pointer min-h-[28px]",
        className
      )}
      title="Última compra deste item — clique para ver o histórico"
    >
      <History className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">
        Últ: <span className="font-semibold text-foreground">{formatCurrency(last.price)}</span>
      </span>
      {deltaPct !== null && Math.abs(deltaPct) >= 0.5 && (
        <span className={cn(
          "inline-flex items-center text-[10px] font-semibold tabular-nums",
          deltaPct < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
        )}>
          {deltaPct < 0
            ? <ArrowDownRight className="h-2.5 w-2.5" />
            : <ArrowUpRight className="h-2.5 w-2.5" />}
          {Math.abs(deltaPct).toFixed(0)}%
        </span>
      )}
    </button>
  ) : (
    <button
      type="button"
      className={cn(
        "relative flex items-center justify-center -m-2 p-2 rounded-full focus:outline-none",
        "text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      aria-label="Últimos valores pagos"
    >
      <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center ring-1 ring-zinc-200 dark:ring-zinc-800">
        <Info className="h-3 w-3" />
      </div>
    </button>
  );

  return (
    <Popover modal={false}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        className="w-72 p-3 bg-popover border border-border shadow-xl rounded-xl z-[100]"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Últimos valores pagos
            </p>
          </div>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando...</p>
          ) : entries.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem histórico de pedidos para este item.</p>
          ) : (
            <div className="space-y-1.5">
              {entries.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between gap-3 py-1 border-b border-border/40 last:border-0">
                  <span className="text-xs font-medium text-foreground truncate flex-1" title={e.supplier}>
                    {e.supplier}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatDate(e.date)}
                  </span>
                  <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
                    {formatCurrency(e.price)}
                  </span>
                </div>
              ))}
              {deltaPct !== null && Math.abs(deltaPct) >= 0.5 && (
                <p className={cn(
                  "text-[11px] pt-1",
                  deltaPct < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"
                )}>
                  Oferta atual está {Math.abs(deltaPct).toFixed(0)}% {deltaPct < 0 ? "abaixo" : "acima"} da última compra.
                </p>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
