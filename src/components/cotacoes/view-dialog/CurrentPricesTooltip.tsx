import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
    <Popover modal={false}>
      <PopoverTrigger asChild>
        <button 
          type="button"
          className={cn(
            "relative flex items-center justify-center -m-2 p-2 rounded-full focus:outline-none",
            "text-zinc-400 hover:text-brand transition-colors"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ring-1 ring-zinc-200 dark:ring-zinc-700">
            <Info className="h-3 w-3" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="end"
        className={cn(
          "p-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl rounded-xl min-w-[200px] z-[100]",
          designSystem.components.card.flat
        )}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
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
      </PopoverContent>
    </Popover>
  );
}
