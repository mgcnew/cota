import { memo } from "react";
import { Plus } from "lucide-react";

interface MobileProductsFABProps {
  onClick: () => void;
}

/**
 * FAB mobile - Botão de ação flutuante mínimo
 */
export const MobileProductsFAB = memo(function MobileProductsFAB({
  onClick,
}: MobileProductsFABProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg flex items-center justify-center z-30"
      aria-label="Adicionar produto"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
});

