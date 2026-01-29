import { useState, useRef, useEffect } from "react";
import { 
  Check, 
  Tag, 
  Star, 
  Loader2, 
  Plus,
  Search,
  X
} from "lucide-react";
import { useBrands } from "@/hooks/useBrands";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { capitalize } from "@/lib/text-utils";

interface BrandSelectProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function BrandSelect({ value, onChange, className }: BrandSelectProps) {
  const isMobile = useIsMobile();
  const { brands, isLoading, createBrand } = useBrands();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedBrand = brands.find((brand) => brand.id === value);

  useEffect(() => {
    if (selectedBrand) {
      setSearchValue(capitalize(selectedBrand.name));
    } else if (!value && !open) {
      setSearchValue("");
    }
  }, [selectedBrand, value, open]);

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleCreate = async () => {
    if (!searchValue.trim()) return;
    setIsCreating(true);
    try {
      const brand = await createBrand(searchValue.trim());
      onChange(brand.id);
      setOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelect = (brandId: string, brandName: string) => {
    onChange(brandId);
    setSearchValue(capitalize(brandName));
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setSearchValue("");
    if (!isMobile) {
      inputRef.current?.focus();
    }
  };

  const renderCommandList = () => (
    <Command className="bg-transparent" shouldFilter={false}>
      {isMobile && (
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar ou criar marca..."
              className="pl-10 h-12 bg-muted/50 border-none rounded-xl"
              autoFocus
            />
          </div>
        </div>
      )}
      <CommandList className={cn("max-h-[300px]", isMobile && "max-h-[50vh]")}>
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
          </div>
        ) : (
          <>
            {filteredBrands.length === 0 ? (
              <CommandEmpty className="p-0">
                <div className="p-4 text-center">
                  <p className="text-xs text-gray-500 mb-3">Nenhuma marca encontrada</p>
                  <Button 
                    size="sm" 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2 rounded-lg shadow-md"
                    onClick={handleCreate}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Criar "{searchValue}"
                  </Button>
                </div>
              </CommandEmpty>
            ) : (
              <>
                <CommandGroup heading="Resultados">
                  {filteredBrands.map((brand) => (
                    <CommandItem
                      key={brand.id}
                      value={brand.name}
                      onSelect={() => handleSelect(brand.id, brand.name)}
                      className="flex items-center justify-between py-3 cursor-pointer rounded-lg mx-1 my-0.5"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Check
                          className={cn(
                            "h-4 w-4 text-orange-600 shrink-0",
                            value === brand.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="truncate font-medium text-sm">{capitalize(brand.name)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {brand.manual_rating > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-[10px] font-bold text-gray-500">
                              {brand.manual_rating}
                            </span>
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>

                {searchValue && !brands.some(b => b.name.toLowerCase() === searchValue.toLowerCase()) && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Ação">
                      <CommandItem
                        onSelect={handleCreate}
                        className="flex items-center gap-2 py-3 cursor-pointer rounded-lg mx-1 my-0.5 text-orange-600 font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Criar nova marca: "{searchValue}"</span>
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
  );

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative group" onClick={() => setOpen(true)}>
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 z-10" />
        <Input
          ref={inputRef}
          value={searchValue}
          readOnly={isMobile}
          onChange={(e) => {
            if (!isMobile) {
              setSearchValue(e.target.value);
              if (!open) setOpen(true);
            }
          }}
          onFocus={() => {
            if (!isMobile && searchValue.length > 0) setOpen(true);
          }}
          placeholder="Selecione a marca..."
          className="pl-10 pr-10 h-11 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-800 rounded-xl transition-all focus:ring-orange-400/20 cursor-pointer"
        />
        {searchValue && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!isMobile ? (
        <Popover open={open && searchValue.length > 0} onOpenChange={setOpen}>
          <PopoverAnchor className="absolute top-0 left-0 w-full h-full pointer-events-none" />
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {renderCommandList()}
          </PopoverContent>
        </Popover>
      ) : (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[80vh]">
            <DrawerHeader className="text-left border-b border-muted pb-4 mb-2">
              <DrawerTitle className="text-base font-bold flex items-center gap-2">
                <Tag className="h-4 w-4 text-orange-600" />
                Selecionar Marca
              </DrawerTitle>
            </DrawerHeader>
            <div className="pb-8">
              {renderCommandList()}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}

