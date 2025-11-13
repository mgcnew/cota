import { memo } from "react";
import { Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileSearchWithActionProps {
  value: string;
  onChange: (value: string) => void;
  onActionClick: () => void;
  placeholder?: string;
  actionIcon?: React.ReactNode;
  actionLabel?: string;
  resultsCount?: number;
  showFilters?: boolean;
  onFiltersClick?: () => void;
  activeFilters?: string[];
  onClearFilters?: () => void;
  isSearching?: boolean;
}

/**
 * Componente de busca mobile com botão de ação integrado
 * 
 * Características:
 * - Barra de busca responsiva
 * - Botão de ação (criar) integrado ao lado da busca
 * - Ícone de filtros opcional
 * - Contador de resultados
 * - Indicadores de filtros ativos
 * - Design consistente em todas as páginas
 * - Performance otimizada (memoizado)
 */
export const MobileSearchWithAction = memo(function MobileSearchWithAction({
  value,
  onChange,
  onActionClick,
  placeholder = "Buscar...",
  actionIcon,
  actionLabel = "Criar",
  resultsCount,
  showFilters = false,
  onFiltersClick,
  activeFilters = [],
  onClearFilters,
  isSearching = false,
}: MobileSearchWithActionProps) {
  const handleClear = () => onChange('');
  
  return (
    <div className="sticky top-0 z-20 bg-background border-b border-border">
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "w-full pl-9 pr-10 h-10",
                "bg-secondary/50 border border-input rounded-lg",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                "transition-all"
              )}
            />
            {value && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {/* Filtros (opcional) */}
          {showFilters && onFiltersClick && (
            <button
              onClick={onFiltersClick}
              className={cn(
                "h-10 w-10 flex items-center justify-center",
                "border border-input rounded-lg bg-background",
                "hover:bg-accent transition-colors",
                activeFilters.length > 0 && "bg-orange-100 dark:bg-orange-900/30 border-orange-500"
              )}
              aria-label="Filtros"
            >
              <Filter className={cn(
                "h-4 w-4",
                activeFilters.length > 0 ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
              )} />
              {activeFilters.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>
          )}
          
          {/* BOTÃO CRIAR - INTEGRADO! */}
          <button
            onClick={onActionClick}
            className={cn(
              "h-10 px-4 rounded-lg flex items-center gap-2",
              "bg-gradient-to-r from-orange-600 to-orange-700",
              "hover:from-orange-700 hover:to-orange-800",
              "text-white font-medium",
              "transition-all duration-200 active:scale-95",
              "shadow-sm"
            )}
            aria-label={actionLabel}
          >
            {actionIcon}
            <span className="hidden sm:inline text-sm">{actionLabel}</span>
          </button>
        </div>
        
        {/* Feedback visual: filtros ativos e contador de resultados */}
        <div className="flex items-center justify-between gap-2 min-h-[20px]">
          {/* Filtros ativos */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.map((filter, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md text-xs font-medium"
                >
                  {filter}
                </span>
              ))}
              {onClearFilters && (
                <button
                  onClick={onClearFilters}
                  className="px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>
          )}
          
          {/* Contador de resultados */}
          {resultsCount !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
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
      </div>
    </div>
  );
});
