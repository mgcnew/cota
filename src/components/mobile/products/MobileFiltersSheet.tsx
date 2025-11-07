import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { capitalize } from "@/lib/text-utils";

interface MobileFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

/**
 * Bottom Sheet de filtros mobile
 * 
 * UX:
 * - Abre de baixo para cima
 * - Fácil de fechar com swipe down
 * - Visual claro e organizado
 */
export function MobileFiltersSheet({
  open,
  onOpenChange,
  categories,
  selectedCategory,
  onCategorySelect,
}: MobileFiltersSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Categorias */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Categorias
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    onCategorySelect(category);
                    onOpenChange(false);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-orange-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {category === "all" ? "Todas" : capitalize(category)}
                </button>
              ))}
            </div>
          </div>

          {/* Botão de limpar filtros */}
          {selectedCategory !== "all" && (
            <Button
              variant="outline"
              onClick={() => {
                onCategorySelect("all");
                onOpenChange(false);
              }}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

