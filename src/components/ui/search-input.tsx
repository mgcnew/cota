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
          "relative flex items-center h-11 w-full rounded-lg transition-all duration-200 overflow-hidden",
          "bg-white dark:bg-background",
          "border border-zinc-200 dark:border-zinc-800",
          "shadow-sm group-focus-within:shadow-md",
          "group-focus-within:border-zinc-300 dark:group-focus-within:border-zinc-700",
          "group-focus-within:ring-2 group-focus-within:ring-zinc-100 dark:group-focus-within:ring-zinc-900/50"
        )}
      >
        <div className="flex-shrink-0 flex items-center justify-center w-11 h-11 text-zinc-400 dark:text-zinc-500 transition-colors group-focus-within:text-brand">
          <Search className="h-4.5 w-4.5" />
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-full pl-1 pr-3 bg-transparent border-none ring-0 focus:ring-0 focus:outline-none",
            "text-[14px] font-medium text-zinc-900 dark:text-zinc-100",
            "placeholder:text-zinc-400/80 dark:placeholder:text-zinc-500/80",
            className
          )}
          {...props}
        />

        {value && (
          <button
            onClick={handleClear}
            className={cn(
              "p-1.5 mr-2 rounded-lg transition-all duration-200",
              "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200",
              "hover:bg-zinc-100 dark:hover:bg-zinc-800",
              "active:scale-95"
            )}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});
