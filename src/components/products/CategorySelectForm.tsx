import { useState, useRef, useEffect } from "react";
import { 
  Check, 
  Tags, 
  Loader2, 
  Plus,
  X
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
  PopoverAnchor,
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
  const [searchValue, setSearchValue] = useState(value ? value.toUpperCase() : "");
  const inputRef = useRef<HTMLInputElement>(null);

  const availableCategories = categories.filter(cat => cat !== "all");

  const filteredCategories = availableCategories.filter(cat => 
    cat.toUpperCase().includes(searchValue.toUpperCase())
  );

  useEffect(() => {
    if (value) {
      setSearchValue(value.toUpperCase());
    } else {
      setSearchValue("");
    }
  }, [value]);

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
    setSearchValue(formattedCat);
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setSearchValue("");
    inputRef.current?.focus();
    setOpen(true);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative group">
            <Tags className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 z-10" />
            <Input
              ref={inputRef}
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value.toUpperCase());
                if (!open) setOpen(true);
              }}
              onFocus={() => {
                if (!open) setOpen(true);
              }}
              onClick={() => {
                if (!open) setOpen(true);
              }}
              placeholder="PESQUISAR OU CRIAR CATEGORIA..."
              className="pl-10 pr-10 h-11 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-800 rounded-xl transition-all focus:ring-orange-400/20 uppercase font-medium"
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl z-[100]" 
          align="start"
          sideOffset={5}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command className="bg-transparent h-full max-h-[300px]" shouldFilter={false}>
            <CommandList className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              {isLoading ? (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                </div>
              ) : (
                <>
                  {filteredCategories.length === 0 ? (
                    <CommandEmpty className="p-0">
                      <div className="p-4 text-center">
                        <p className="text-xs text-gray-500 mb-3">Nenhuma categoria encontrada</p>
                        {searchValue.trim().length > 0 && (
                          <Button 
                            size="sm" 
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 rounded-lg shadow-md"
                            onClick={handleCreate}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            CRIAR "{searchValue.toUpperCase()}"
                          </Button>
                        )}
                      </div>
                    </CommandEmpty>
                  ) : (
                    <>
                      <CommandGroup heading="Categorias Existentes">
                        {filteredCategories.map((category) => (
                          <CommandItem
                            key={category}
                            value={category}
                            onSelect={() => handleSelect(category)}
                            className="flex items-center justify-between py-2.5 cursor-pointer rounded-lg mx-1 my-0.5"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Check
                                className={cn(
                                  "h-4 w-4 text-orange-600 shrink-0",
                                  (value || "").toUpperCase() === category.toUpperCase() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span className="truncate font-bold text-xs uppercase">{category}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>

                      {searchValue.trim().length > 0 && !availableCategories.some(c => c.toUpperCase() === searchValue.toUpperCase()) && (
                        <>
                          <CommandSeparator />
                          <CommandGroup heading="Ação">
                            <CommandItem
                              onSelect={handleCreate}
                              className="flex items-center gap-2 py-3 cursor-pointer rounded-lg mx-1 my-0.5 text-orange-600 font-bold"
                            >
                              <Plus className="h-4 w-4" />
                              <span>CRIAR NOVA: "{searchValue.toUpperCase()}"</span>
                            </CommandItem>
                          </CommandGroup>
                        </>
                      )}
                    </>
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
