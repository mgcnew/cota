import { useState, useRef, useEffect } from "react";
import { 
  Check, 
  Tags, 
  Loader2, 
  Plus,
  X,
  ChevronDown,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CategorySelectFormProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  isLoading?: boolean;
  className?: string;
  onCategoryAdded?: (category: string) => void;
}

export function CategorySelectForm({ 
  value, 
  onChange, 
  categories, 
  isLoading, 
  className,
  onCategoryAdded 
}: CategorySelectFormProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar searchValue apenas quando abrir
  useEffect(() => {
    if (open) {
      setSearchValue(value ? value.toUpperCase() : "");
      // Pequeno delay para focar o input após a animação do popover
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, value]);

  const availableCategories = categories
    .filter(cat => cat && cat !== "all")
    .map(cat => cat.toUpperCase().trim());
  
  const uniqueCategories = Array.from(new Set(availableCategories)).sort();

  const filteredCategories = uniqueCategories.filter(cat => 
    cat.includes(searchValue.toUpperCase())
  );

  const handleCreate = () => {
    if (!searchValue.trim()) return;
    const newCat = searchValue.trim().toUpperCase();
    onCategoryAdded?.(newCat);
    onChange(newCat);
    setOpen(false);
  };

  const handleSelect = (category: string) => {
    const formattedCat = category.toUpperCase();
    onChange(formattedCat);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearchValue("");
    setOpen(true);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full h-11 justify-between bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-800 rounded-xl transition-all font-medium text-left shadow-sm",
              !value && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2 truncate text-xs">
              <Tags className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span className="truncate uppercase font-bold">
                {value ? value.toUpperCase() : "SELECIONAR CATEGORIA..."}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {value && (
                <div
                  role="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                </div>
              )}
              <ChevronDown className={cn("h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200", open && "rotate-180")} />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-gray-200 dark:border-gray-800 shadow-2xl bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl z-[100] overflow-visible" 
          align="start"
          sideOffset={6}
        >
          <Command className="bg-transparent" shouldFilter={false}>
            <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-3 h-11">
              <Search className="h-4 w-4 text-orange-600 mr-2 shrink-0" />
              <Input
                ref={inputRef}
                placeholder="PESQUISAR OU CRIAR NOVA..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value.toUpperCase())}
                className="h-9 border-none bg-transparent focus-visible:ring-0 px-0 uppercase text-xs font-bold"
              />
            </div>
            <CommandList className="max-h-[250px] overflow-y-auto overflow-x-hidden py-1 custom-scrollbar scroll-smooth">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                </div>
              ) : (
                <>
                  <CommandGroup heading="Categorias Existentes">
                    {uniqueCategories.length === 0 && filteredCategories.length === 0 && !searchValue && (
                      <div className="py-8 text-center text-[10px] text-gray-500 uppercase tracking-wider">
                        Nenhuma categoria cadastrada.
                      </div>
                    )}
                    
                    {filteredCategories.map((category) => (
                      <CommandItem
                        key={category}
                        value={category}
                        onSelect={() => handleSelect(category)}
                        className="flex items-center justify-between py-2.5 px-3 cursor-pointer rounded-lg mx-1 my-0.5 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Check
                            className={cn(
                              "h-4 w-4 text-orange-600 shrink-0",
                              (value || "").toUpperCase() === category.toUpperCase() ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="truncate font-bold text-[11px] uppercase tracking-tighter">{category}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {searchValue.trim().length > 0 && !uniqueCategories.some(c => c.toUpperCase() === searchValue.toUpperCase()) && (
                    <>
                      <CommandSeparator className="my-1 border-gray-100 dark:border-gray-800" />
                      <CommandGroup heading="Ação">
                        <CommandItem
                          onSelect={handleCreate}
                          className="flex items-center gap-2 py-3 px-3 cursor-pointer rounded-lg mx-1 my-0.5 text-orange-600 font-bold hover:bg-orange-50 dark:hover:bg-orange-950/20"
                        >
                          <Plus className="h-4 w-4 shrink-0" />
                          <span className="truncate uppercase text-[11px]">CRIAR CATEGORIA: "{searchValue.toUpperCase()}"</span>
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}

                  {searchValue.trim().length > 0 && filteredCategories.length === 0 && !uniqueCategories.some(c => c.toUpperCase() === searchValue.toUpperCase()) && (
                    <CommandEmpty className="p-8 text-center">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Categoria não encontrada</p>
                    </CommandEmpty>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
