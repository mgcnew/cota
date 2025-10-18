import { useState, useMemo } from "react";
import { Check, ChevronDown, Filter, Search, Package, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

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

  // Filtrar e ordenar categorias
  const filteredCategories = useMemo(() => {
    const filtered = categories.filter(category => {
      if (category === "all") return true;
      return category.toLowerCase().includes(searchValue.toLowerCase());
    });

    // Ordenar: "all" primeiro, depois alfabeticamente
    return filtered.sort((a, b) => {
      if (a === "all") return -1;
      if (b === "all") return 1;
      return a.localeCompare(b);
    });
  }, [categories, searchValue]);

  const getCategoryLabel = (category: string) => {
    return category === "all" ? "Todas as categorias" : category;
  };

  const getCategoryCount = (category: string) => {
    return categoryStats.get(category) || 0;
  };

  const handleSelect = (category: string) => {
    onCategoryChange(category);
    setOpen(false);
    setSearchValue("");
  };

  const clearSelection = () => {
    onCategoryChange("all");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full sm:w-[280px] justify-between bg-gradient-to-r from-white via-orange-50/30 to-amber-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 hover:from-orange-100/50 hover:to-amber-100/50 dark:hover:from-gray-700 dark:hover:to-gray-700 border-orange-200/60 dark:border-gray-700 hover:border-orange-300/70 dark:hover:border-orange-600 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Filter className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                {getCategoryLabel(selectedCategory)}
              </span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="ml-auto flex-shrink-0 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700">
                  {getCategoryCount(selectedCategory)}
                </Badge>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-orange-600 dark:text-orange-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command className="bg-gradient-to-br from-white via-orange-50/20 to-amber-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
            <div className="flex items-center border-b border-orange-200/40 dark:border-gray-700 px-3 bg-gradient-to-r from-orange-50/30 to-amber-50/30 dark:from-gray-800 dark:to-gray-800">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50 text-orange-600 dark:text-orange-400" />
              <CommandInput
                placeholder="Buscar categoria..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-orange-600/70 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList className="max-h-[min(500px,80vh)] overflow-y-auto">
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Package className="h-8 w-8 text-orange-400" />
                  <div className="text-sm text-orange-600">
                    Nenhuma categoria encontrada
                  </div>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category}
                    value={category}
                    onSelect={() => handleSelect(category)}
                    className="flex items-center justify-between cursor-pointer hover:bg-gradient-to-r hover:from-orange-50/80 hover:to-amber-50/80 transition-all duration-200 py-3 px-4"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0 text-orange-600",
                          selectedCategory === category ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {category === "all" ? (
                          <Package className="h-4 w-4 text-orange-600 flex-shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 flex-shrink-0" />
                        )}
                        <span className="truncate text-sm font-medium text-gray-700">
                          {getCategoryLabel(category)}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-2 text-xs flex-shrink-0 font-medium",
                        category === "all"
                          ? "bg-orange-100 text-orange-700 border-orange-300"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      )}
                    >
                      {getCategoryCount(category)}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

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