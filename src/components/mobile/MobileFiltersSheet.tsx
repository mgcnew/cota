import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { capitalize } from '@/lib/text-utils';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MobileFiltersSheetProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

/**
 * Bottom Sheet para filtros mobile
 * - Padrão mobile nativo (bottom sheet)
 * - Fácil acesso com gestos
 * - UX otimizada para toque
 */
export function MobileFiltersSheet({
  categories,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onSearchChange,
}: MobileFiltersSheetProps) {
  const activeCategoriesCount = selectedCategory !== 'all' ? 1 : 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-12 justify-start bg-gradient-to-r from-white to-orange-50/50 dark:from-gray-800 dark:to-orange-900/10 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl font-semibold"
        >
          <div className="p-1.5 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg mr-3">
            <Filter className="h-4 w-4 text-white" />
          </div>
          <span className="flex-1 text-left text-gray-700 dark:text-gray-300">Filtros</span>
          {activeCategoriesCount > 0 && (
            <Badge className="ml-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white border-0 shadow-sm">
              {activeCategoriesCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] max-h-[600px]">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">Filtrar Produtos</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Categorias */}
          <div>
            <label className="text-sm font-semibold mb-3 block text-gray-900 dark:text-white">
              Categoria
            </label>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      onCategorySelect(cat);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-4 rounded-xl border-2 transition-all duration-200",
                      "flex items-center justify-between font-medium",
                      isSelected
                        ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-500 shadow-lg scale-[1.02]"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-700"
                    )}
                  >
                    <span className="font-medium">
                      {cat === 'all' ? 'Todas as categorias' : capitalize(cat)}
                    </span>
                    {isSelected && (
                      <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botão limpar filtros */}
          {selectedCategory !== 'all' && (
            <Button
              variant="outline"
              className="w-full h-11"
              onClick={() => onCategorySelect('all')}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

