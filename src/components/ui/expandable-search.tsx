import { useState, useRef, useEffect, memo, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const accentColors = {
  teal: {
    border: "border-teal-300/70 dark:border-teal-600/70",
    focusBorder: "focus-within:border-teal-400 dark:focus-within:border-teal-500",
    focusRing: "focus-within:ring-teal-200/50 dark:focus-within:ring-teal-800/50",
    hoverBorder: "hover:border-teal-300/70 dark:hover:border-teal-600/70",
    iconColor: "text-teal-600 dark:text-teal-400",
    bgHover: "hover:bg-teal-50 dark:hover:bg-teal-900/20",
  },
  orange: {
    border: "border-orange-300/70 dark:border-orange-600/70",
    focusBorder: "focus-within:border-orange-400 dark:focus-within:border-orange-500",
    focusRing: "focus-within:ring-orange-200/50 dark:focus-within:ring-orange-800/50",
    hoverBorder: "hover:border-orange-300/70 dark:hover:border-orange-600/70",
    iconColor: "text-orange-600 dark:text-orange-400",
    bgHover: "hover:bg-orange-50 dark:hover:bg-orange-900/20",
  },
  blue: {
    border: "border-blue-300/70 dark:border-blue-600/70",
    focusBorder: "focus-within:border-blue-400 dark:focus-within:border-blue-500",
    focusRing: "focus-within:ring-blue-200/50 dark:focus-within:ring-blue-800/50",
    hoverBorder: "hover:border-blue-300/70 dark:hover:border-blue-600/70",
    iconColor: "text-blue-600 dark:text-blue-400",
    bgHover: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
  },
  purple: {
    border: "border-purple-300/70 dark:border-purple-600/70",
    focusBorder: "focus-within:border-purple-400 dark:focus-within:border-purple-500",
    focusRing: "focus-within:ring-purple-200/50 dark:focus-within:ring-purple-800/50",
    hoverBorder: "hover:border-purple-300/70 dark:hover:border-purple-600/70",
    iconColor: "text-purple-600 dark:text-purple-400",
    bgHover: "hover:bg-purple-50 dark:hover:bg-purple-900/20",
  },
  amber: {
    border: "border-amber-300/70 dark:border-amber-600/70",
    focusBorder: "focus-within:border-amber-400 dark:focus-within:border-amber-500",
    focusRing: "focus-within:ring-amber-200/50 dark:focus-within:ring-amber-800/50",
    hoverBorder: "hover:border-amber-300/70 dark:hover:border-amber-600/70",
    iconColor: "text-amber-600 dark:text-amber-400",
    bgHover: "hover:bg-amber-50 dark:hover:bg-amber-900/20",
  },
  gray: {
    border: "border-gray-300/70 dark:border-gray-600/70",
    focusBorder: "focus-within:border-gray-400 dark:focus-within:border-gray-500",
    focusRing: "focus-within:ring-gray-200/50 dark:focus-within:ring-gray-800/50",
    hoverBorder: "hover:border-gray-300/70 dark:hover:border-gray-600/70",
    iconColor: "text-gray-600 dark:text-gray-400",
    bgHover: "hover:bg-gray-50 dark:hover:bg-gray-900/20",
  },
};

interface ExpandableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accentColor?: keyof typeof accentColors;
  className?: string;
  expandedWidth?: string;
  "data-search-input"?: boolean;
}

export const ExpandableSearch = memo(function ExpandableSearch({
  value,
  onChange,
  placeholder = "Buscar...",
  accentColor = "teal",
  className,
  expandedWidth = "w-64",
  "data-search-input": dataSearchInput,
}: ExpandableSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = accentColors[accentColor];
  const shouldStayExpanded = isFocused || value.length > 0;
  const isOpen = isExpanded || shouldStayExpanded;

  // Handle click outside to collapse - usando passive event listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!value) {
          setIsExpanded(false);
        }
      }
    };

    // Usar touchstart no mobile para melhor responsividade
    document.addEventListener("mousedown", handleClickOutside, { passive: true });
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [value]);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleMouseEnter = useCallback(() => !shouldStayExpanded && setIsExpanded(true), [shouldStayExpanded]);
  const handleMouseLeave = useCallback(() => !shouldStayExpanded && setIsExpanded(false), [shouldStayExpanded]);
  const handleClick = useCallback(() => !isExpanded && handleExpand(), [isExpanded, handleExpand]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "relative flex items-center h-10 rounded-xl overflow-hidden",
          "bg-white/80 dark:bg-gray-800/80",
          "border-2 border-gray-200/60 dark:border-gray-700/60",
          "shadow-sm transition-[width] duration-150",
          isOpen
            ? cn(
                expandedWidth,
                colors.focusBorder,
                colors.focusRing,
                "focus-within:ring-2"
              )
            : cn(
                "w-10 cursor-pointer",
                colors.hoverBorder,
                colors.bgHover
              )
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Search Icon */}
        <div
          className={cn(
            "flex items-center justify-center z-10 transition-colors duration-100",
            isOpen 
              ? cn("absolute left-3 top-1/2 transform -translate-y-1/2", colors.iconColor)
              : "w-full h-full text-gray-400 dark:text-gray-500"
          )}
        >
          <Search className="h-4 w-4" />
        </div>

        {/* Input */}
        {isOpen && (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            data-search-input={dataSearchInput || undefined}
            className={cn(
              "w-full h-full pl-10 pr-8 bg-transparent",
              "text-sm text-gray-900 dark:text-white",
              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
              "focus:outline-none"
            )}
          />
        )}

        {/* Clear Button */}
        {value && isOpen && (
          <button
            onClick={handleClear}
            className={cn(
              "absolute right-2 top-1/2 transform -translate-y-1/2",
              "p-1 rounded-full transition-colors duration-100",
              "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-gray-700"
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

