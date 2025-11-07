import { memo } from "react";
import { X } from "lucide-react";

interface MobileProductsFiltersProps {
  open: boolean;
  onClose: () => void;
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

/**
 * Filtros mobile - Bottom sheet simples
 */
export const MobileProductsFilters = memo(function MobileProductsFilters({
  open,
  onClose,
  categories,
  selected,
  onSelect,
}: MobileProductsFiltersProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-30"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-40 max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            aria-label="Fechar"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
              Categorias
            </div>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelect(cat)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm ${
                  selected === cat
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium"
                    : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {cat === "all" ? "Todas as categorias" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
});

