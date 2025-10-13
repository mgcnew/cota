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
            className="w-full sm:w-[280px] justify-between bg-background hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {getCategoryLabel(selectedCategory)}
              </span>
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="ml-auto flex-shrink-0 text-xs">
                  {getCategoryCount(selectedCategory)}
                </Badge>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Buscar categoria..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
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
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Check
                        className={cn(
                          "h-4 w-4 flex-shrink-0",
                          selectedCategory === category ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {category === "all" ? (
                          <Package className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 flex-shrink-0" />
                        )}
                        <span className="truncate text-sm">
                          {getCategoryLabel(category)}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "ml-2 text-xs flex-shrink-0",
                        category === "all" 
                          ? "bg-orange-50 text-orange-700 border-orange-200" 
                          : "bg-muted text-muted-foreground"
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
          className="h-9 px-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Limpar filtro de categoria"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}