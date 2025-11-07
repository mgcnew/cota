import { memo } from "react";
import { Search, Filter, X } from "lucide-react";

interface MobileProductsSearchProps {
  value: string;
  onChange: (value: string) => void;
  onFiltersClick: () => void;
  activeCategory: string | null;
  onClearCategory: () => void;
}

/**
 * Busca mobile - Componente mínimo e performático
 */
export const MobileProductsSearch = memo(function MobileProductsSearch({
  value,
  onChange,
  onFiltersClick,
  activeCategory,
  onClearCategory,
}: MobileProductsSearchProps) {
  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full pl-9 pr-3 h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600"
            />
          </div>
          <button
            onClick={onFiltersClick}
            className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="Filtros"
          >
            <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        {activeCategory && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Categoria:</span>
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-medium">
              {activeCategory}
            </span>
            <button
              onClick={onClearCategory}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              aria-label="Limpar categoria"
            >
              <X className="h-3 w-3 text-gray-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

