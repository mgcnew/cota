import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { designSystem } from "@/styles/design-system";

interface PriceInfo {
  nome: string;
  value: number;
}

interface CurrentPricesTooltipProps {
  prices: PriceInfo[];
}

export function CurrentPricesTooltip({ prices }: CurrentPricesTooltipProps) {
  if (!prices || prices.length === 0) return null;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            type="button"
            className={cn(
              "inline-flex items-center justify-center w-4 h-4 rounded-full ml-1 flex-shrink-0",
              "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-400 hover:text-brand transition-colors"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="end"
          className={cn(
            "p-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl rounded-xl min-w-[200px]",
            designSystem.components.card.flat
          )}
        >
          <div className="space-y-2">
            <p className="font-black text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              Cotações Atuais
            </p>
            <div className="space-y-1.5">
              {prices.map((price, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 truncate max-w-[120px]">
                    {price.nome}
                  </span>
                  <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                    R$ {price.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
