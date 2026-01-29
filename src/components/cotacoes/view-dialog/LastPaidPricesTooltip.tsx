import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProductPriceHistory } from "@/hooks/useProductPriceHistory";
import { cn } from "@/lib/utils";
import { designSystem } from "@/styles/design-system";

interface LastPaidPricesTooltipProps {
  productId: string;
}

export function LastPaidPricesTooltip({ productId }: LastPaidPricesTooltipProps) {
  const { data, isLoading } = useProductPriceHistory(productId);
  const orderHistory = (data as any)?.orderHistory || [];
  const entries = orderHistory.slice(0, 3);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR");

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center w-4 h-4 rounded-full ml-1.5 flex-shrink-0",
              "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            )}
            onClick={(e) => e.stopPropagation()}
            aria-label="Últimos valores pagos"
          >
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          align="start"
          className={cn(
            "w-64 p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl",
            designSystem.components.card.flat
          )}
        >
          <div className="space-y-2">
            <p className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Últimos valores pagos
            </p>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : entries.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem histórico de pedidos</p>
            ) : (
              <div className="space-y-2">
                {entries.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100 truncate flex-1">
                      {e.supplier}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formatDate(e.date)}
                    </span>
                    <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-50">
                      {formatCurrency(e.price)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
