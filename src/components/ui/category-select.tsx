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
    return category === "all" ? "Categorias" : capitalize(category);
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
        <SelectTrigger className="w-full sm:w-[280px] h-11 bg-white dark:bg-background border border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/10 rounded-lg shadow-sm text-zinc-900 dark:text-zinc-100 transition-all">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-brand" />
            <SelectValue placeholder="Categorias" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              <span>{getCategoryLabel(category)}</span>
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
          className="h-11 px-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Limpar filtro de categoria"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}