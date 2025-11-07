import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MobileProductsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFiltersOpen: () => void;
  selectedCategory: string;
  onCategoryRemove: () => void;
}

/**
 * Header mobile otimizado com busca e filtros
 */
export function MobileProductsHeader({
  searchQuery,
  onSearchChange,
  onFiltersOpen,
  selectedCategory,
  onCategoryRemove,
}: MobileProductsHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" style={{ willChange: 'auto' }}>
      <div className="p-4 space-y-3">
        {/* Título */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Produtos
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={onFiltersOpen}
            className="h-10 w-10 border-gray-300 dark:border-gray-700"
          >
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>
        </div>

        {/* Barra de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-12 text-base bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
          />
        </div>

        {/* Badge de categoria ativa */}
        {selectedCategory !== "all" && (
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 text-sm font-medium"
            >
              {selectedCategory}
              <button
                onClick={onCategoryRemove}
                className="ml-2 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

