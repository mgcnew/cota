import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { memo, useCallback, useRef } from "react";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  containerClassName?: string;
}

export const SearchInput = memo(function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Buscar...",
  containerClassName,
  className,
  ...props
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  }, [onChange, onClear]);

  return (
    <div className={cn("relative group w-full", containerClassName)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-brand transition-colors duration-200 pointer-events-none z-10" />

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-10 pl-10 pr-9 rounded-xl",
          "bg-white dark:bg-card",
          "border border-border/60 dark:border-white/8",
          "text-sm text-foreground placeholder:text-muted-foreground/40",
          "shadow-sm",
          "transition-all duration-200",
          "outline-none",
          "focus:border-brand/50 focus:ring-2 focus:ring-brand/15 focus:shadow-[0_0_0_3px_hsl(var(--brand)/0.08)]",
          "hover:border-border dark:hover:border-white/15",
          className
        )}
        {...props}
      />

      {value && (
        <button
          onClick={handleClear}
          type="button"
          className={cn(
            "absolute right-2.5 top-1/2 -translate-y-1/2",
            "w-5 h-5 rounded-md flex items-center justify-center",
            "text-muted-foreground/40 hover:text-foreground hover:bg-muted/60",
            "transition-all duration-150 active:scale-90"
          )}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
});
