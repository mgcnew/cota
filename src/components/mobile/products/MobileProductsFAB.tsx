import { memo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileProductsFABProps {
  onClick: () => void;
  isEmpty?: boolean;
  tooltip?: string;
}

/**
 * FAB mobile v3 - Botão de ação flutuante fixo
 * - Fixo no canto inferior direito
 * - Permanece visível durante scroll
 * - Animação de entrada
 * - Pulsar quando lista vazia (sugerir ação)
 * - Efeito de hover e active
 * - Shadow elevada
 * - Z-index alto para ficar acima de tudo
 */
export const MobileProductsFAB = memo(function MobileProductsFAB({
  onClick,
  isEmpty = false,
  tooltip = "Adicionar produto",
}: MobileProductsFABProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {tooltip && isEmpty && (
        <div className="animate-fade-in bg-gray-900 dark:bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
          {tooltip}
        </div>
      )}
      <button
        onClick={onClick}
        className={cn(
          "w-14 h-14 rounded-full",
          "bg-gradient-to-br from-orange-500 to-orange-600",
          "hover:from-orange-600 hover:to-orange-700",
          "active:from-orange-700 active:to-orange-800",
          "text-white shadow-lg hover:shadow-xl",
          "flex items-center justify-center",
          "transition-all duration-200 active:scale-95",
          "border-2 border-white dark:border-gray-800",
          isEmpty && "animate-pulse"
        )}
        style={{
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
        aria-label={tooltip}
      >
        <Plus className="h-6 w-6" strokeWidth={3} />
        {isEmpty && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
        )}
      </button>
    </div>
  );
});

