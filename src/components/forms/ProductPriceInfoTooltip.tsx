import { Info, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProductPriceHistory } from "@/hooks/useProductPriceHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProductPriceInfoTooltipProps {
  productId: string;
  productName: string;
}

export function ProductPriceInfoTooltip({ productId, productName }: ProductPriceInfoTooltipProps) {
  const { data: priceHistory, isLoading } = useProductPriceHistory(productId);

  // Pegar os últimos 5 preços
  const recentPrices = priceHistory?.slice(0, 5) || [];

  const getTrendIcon = (currentPrice: number, previousPrice: number) => {
    if (currentPrice < previousPrice) {
      return <TrendingDown className="h-3 w-3 text-green-500" />;
    } else if (currentPrice > previousPrice) {
      return <TrendingUp className="h-3 w-3 text-red-500" />;
    }
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button 
            type="button"
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors ml-1.5 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="right" 
          align="start"
          className="w-72 p-0 bg-popover border shadow-lg"
        >
          <div className="p-3 border-b bg-muted/30">
            <p className="font-semibold text-sm text-foreground truncate" title={productName}>
              Histórico de Preços
            </p>
            <p className="text-xs text-muted-foreground truncate">{productName}</p>
          </div>
          
          <div className="p-2 max-h-[250px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                ))}
              </div>
            ) : recentPrices.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nenhum histórico de preços encontrado
              </div>
            ) : (
              <div className="space-y-1">
                {recentPrices.map((entry, index) => {
                  const previousPrice = recentPrices[index + 1]?.price;
                  return (
                    <div 
                      key={entry.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {previousPrice && getTrendIcon(entry.price, previousPrice)}
                        <span className="text-xs font-medium text-foreground w-14 text-right">
                          R$ {entry.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate" title={entry.supplier}>
                          {entry.supplier}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {format(new Date(entry.date), "dd/MM/yy", { locale: ptBR })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {recentPrices.length > 0 && (
            <div className="p-2 border-t bg-muted/30">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Menor preço:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  R$ {Math.min(...recentPrices.map(p => p.price)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
