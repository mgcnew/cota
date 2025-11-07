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
    <div className="sticky top-0 z-10 bg-background border-b border-gray-200 dark:border-gray-800">
      <div className="p-4 space-y-3">
        {/* Título */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Produtos
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={onFiltersOpen}
            className="h-10 w-10 rounded-full border-orange-200 dark:border-orange-800 hover:bg-orange-50 dark:hover:bg-orange-950"
          >
            <Filter className="h-5 w-5 text-orange-600 dark:text-orange-400" />
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
            className="pl-10 h-12 text-base bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>

        {/* Badge de categoria ativa */}
        {selectedCategory !== "all" && (
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1.5 text-sm font-medium"
            >
              {selectedCategory}
              <button
                onClick={onCategoryRemove}
                className="ml-2 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
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

