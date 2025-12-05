import { useMemo } from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { capitalize } from "@/lib/text-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectProps {
  categories: string[];
  products: Array<{ category?: string }>;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  className?: string;
}

export function CategorySelect({
  categories,
  products,
  selectedCategory,
  onCategoryChange,
  className
}: CategorySelectProps) {
  // Calcular contagem de produtos por categoria
  const categoryStats = useMemo(() => {
    const stats = new Map<string, number>();

    // Contar produtos por categoria
    products.forEach(product => {
      const category = (product.category || '').trim();
      if (category) {
        stats.set(category, (stats.get(category) || 0) + 1);
      }
    });

    // Adicionar "all" com total de produtos
    stats.set("all", products.length);

    return stats;
  }, [products]);

  const getCategoryLabel = (category: string) => {
    return category === "all" ? "Todas as Categorias" : capitalize(category);
  };

  const getCategoryCount = (category: string) => {
    return categoryStats.get(category) || 0;
  };

  const clearSelection = () => {
    onCategoryChange("all");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-[280px] h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-200/60 dark:border-gray-700/60 sm:hover:border-orange-300/70 sm:dark:hover:border-orange-600/70 focus:border-orange-400 dark:focus:border-orange-500 focus:ring-2 focus:ring-orange-200/50 dark:focus:ring-orange-800/50 rounded-xl shadow-sm text-gray-900 dark:text-white">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <SelectValue placeholder="Selecione uma categoria" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              <div className="flex items-center justify-between w-full gap-4">
                <span>{getCategoryLabel(category)}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    category === "all"
                      ? "bg-orange-100 text-orange-700 border-orange-300"
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  )}
                >
                  {getCategoryCount(category)}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Botão para limpar filtro quando uma categoria específica está selecionada */}
      {selectedCategory !== "all" && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSelection}
          className="h-9 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100/50 transition-colors"
          title="Limpar filtro de categoria"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}