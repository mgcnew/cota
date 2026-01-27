import { useMemo } from "react";
import { Info, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProductPriceHistory } from "@/hooks/useProductPriceHistory";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";

interface ProductPriceInfoTooltipProps {
  productId: string;
  productName: string;
}

export function ProductPriceInfoTooltip({ productId, productName }: ProductPriceInfoTooltipProps) {
  const { data, isLoading } = useProductPriceHistory(productId);
  const { orderHistory = [] } = (data as any) || {};

  // Encontrar o MENOR preço entre todos os pedidos confirmados
  const bestOrderEntry = useMemo(() => {
    if (!orderHistory || orderHistory.length === 0) return null;
    return orderHistory.reduce((min: any, current: any) => 
      current.price < min.price ? current : min
    , orderHistory[0]);
  }, [orderHistory]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

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
          className="w-64 p-0 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl overflow-hidden"
        >
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <p className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
              Melhor Preço Fechado
            </p>
          </div>
          
          <div className="p-4">
            {isLoading ? (
              <div className="flex flex-col items-center py-4 gap-2">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : !bestOrderEntry ? (
              <div className="text-center py-6">
                <p className="text-xs font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                  Sem pedidos finalizados
                </p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                {/* Preço Principal */}
                <div className="text-center">
                  <p className={cn("text-2xl font-black tracking-tighter", designSystem.colors.text.price)}>
                    {formatCurrency(bestOrderEntry.price)}
                  </p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Menor valor validado
                  </p>
                </div>

                {/* Detalhes */}
                <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Fornecedor</span>
                    <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100 truncate flex-1 text-right">
                      {bestOrderEntry.supplier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Data</span>
                    <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100">
                      {format(new Date(bestOrderEntry.date), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Origem</span>
                    <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 font-black uppercase tracking-tighter">
                      {bestOrderEntry.quotationId ? 'Cotação Convertida' : 'Pedido Direto'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {bestOrderEntry && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-800 bg-emerald-50/30 dark:bg-emerald-900/10 text-center">
              <p className="text-[8px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.1em]">
                Preço final de última linha
              </p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
