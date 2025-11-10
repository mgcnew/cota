import { memo } from "react";
import { Search, Filter, X } from "lucide-react";

interface MobileProductsSearchProps {
  value: string;
  onChange: (value: string) => void;
  onFiltersClick: () => void;
  activeCategory: string | null;
  onClearCategory: () => void;
  resultsCount?: number;
  isSearching?: boolean;
}

/**
 * Busca mobile v2 - Componente mínimo e performático
 * - Contador de resultados
 * - Botão limpar busca
 * - Indicador de busca ativa
 */
export const MobileProductsSearch = memo(function MobileProductsSearch({
  value,
  onChange,
  onFiltersClick,
  activeCategory,
  onClearCategory,
  resultsCount,
  isSearching = false,
}: MobileProductsSearchProps) {
  const handleClear = () => onChange('');
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
              className="w-full pl-9 pr-10 h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600 transition-all"
            />
            {value && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
          <button
            onClick={onFiltersClick}
            className="h-10 w-10 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label="Filtros"
          >
            <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        {/* Feedback visual: categoria e contador de resultados */}
        {(activeCategory || (value && resultsCount !== undefined)) && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {activeCategory && (
                <>
                  <span className="text-xs text-gray-600 dark:text-gray-400">Categoria:</span>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md text-xs font-medium">
                    {activeCategory}
                  </span>
                  <button
                    onClick={onClearCategory}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                    aria-label="Limpar categoria"
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                </>
              )}
            </div>
            {value && resultsCount !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                {isSearching ? (
                  <>
                    <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <span className="font-medium">
                    {resultsCount} {resultsCount === 1 ? 'resultado' : 'resultados'}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

