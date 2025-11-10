import { memo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileProductsFABProps {
  onClick: () => void;
  isEmpty?: boolean;
  tooltip?: string;
}

/**
 * FAB mobile v2 - Botão de ação flutuante
 * - Animação de entrada
 * - Pulsar quando lista vazia (sugerir ação)
 * - Efeito de hover e active
 * - Shadow elevada
 */
export const MobileProductsFAB = memo(function MobileProductsFAB({
  onClick,
  isEmpty = false,
  tooltip = "Adicionar produto",
}: MobileProductsFABProps) {
  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-2">
      {tooltip && isEmpty && (
        <div className="animate-fade-in bg-gray-900 dark:bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          {tooltip}
        </div>
      )}
      <button
        onClick={onClick}
        className={cn(
          "w-14 h-14 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 active:scale-95",
          isEmpty && "animate-pulse-slow"
        )}
        aria-label={tooltip}
      >
        <Plus className="h-6 w-6" />
        {isEmpty && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
        )}
      </button>
    </div>
  );
});

