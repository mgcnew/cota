import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem } from "@/styles/design-system";
import { memo, useCallback } from "react";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  containerClassName?: string;
}

/**
 * Busca Estática Premium - Design Minimalista com Sombra Sutil
 * Substitui o modelo de expansão por um estado fixo e profissional.
 */
export const SearchInput = memo(function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Buscar...",
  containerClassName,
  className,
  ...props
}: SearchInputProps) {
  
  const handleClear = useCallback(() => {
    onChange("");
    onClear?.();
  }, [onChange, onClear]);

  return (
    <div className={cn("relative group w-full", containerClassName)}>
      <div
        className={cn(
          "relative flex items-center h-11 w-full transition-all duration-200",
          "border-b border-border dark:border-white/10",
          "group-focus-within:border-brand"
        )}
      >
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-11 text-muted-foreground/50 transition-colors duration-200 group-focus-within:text-brand">
          <Search className="h-4 w-4" />
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-full pl-1 pr-3 bg-transparent border-none ring-0 focus:ring-0 focus:outline-none",
            "text-[14px] text-foreground",
            "placeholder:text-muted-foreground/40",
            className
          )}
          {...props}
        />

        {value && (
          <button
            onClick={handleClear}
            className={cn(
              "p-1 mr-1 rounded transition-all duration-200",
              "text-muted-foreground/50 hover:text-foreground",
              "active:scale-95"
            )}
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
});

