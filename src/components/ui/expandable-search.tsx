import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
};

interface ExpandableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  accentColor?: keyof typeof accentColors;
  className?: string;
  expandedWidth?: string;
}

export function ExpandableSearch({
  value,
  onChange,
  placeholder = "Buscar...",
  accentColor = "teal",
  className,
  expandedWidth = "w-64",
}: ExpandableSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const colors = accentColors[accentColor];
  const shouldStayExpanded = isFocused || value.length > 0;

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!value) {
          setIsExpanded(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const handleExpand = () => {
    setIsExpanded(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <motion.div
        initial={false}
        animate={{
          width: isExpanded || shouldStayExpanded ? "100%" : "40px",
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={cn(
          "relative flex items-center h-10 rounded-xl overflow-hidden",
          "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
          "border-2 border-gray-200/60 dark:border-gray-700/60",
          "shadow-sm transition-shadow duration-200",
          isExpanded || shouldStayExpanded
            ? cn(
                expandedWidth,
                colors.focusBorder,
                colors.focusRing,
                "focus-within:ring-2 hover:shadow-md"
              )
            : cn(
                "w-10 cursor-pointer",
                colors.hoverBorder,
                colors.bgHover,
                "hover:shadow-md"
              )
        )}
        onMouseEnter={() => !shouldStayExpanded && setIsExpanded(true)}
        onMouseLeave={() => !shouldStayExpanded && setIsExpanded(false)}
        onClick={() => !isExpanded && handleExpand()}
      >
        {/* Search Icon */}
        <div
          className={cn(
            "absolute left-3 top-1/2 transform -translate-y-1/2 z-10 transition-colors duration-200",
            isExpanded || shouldStayExpanded
              ? colors.iconColor
              : "text-gray-400 dark:text-gray-500"
          )}
        >
          <Search className="h-4 w-4" />
        </div>

        {/* Input */}
        <AnimatePresence>
          {(isExpanded || shouldStayExpanded) && (
            <motion.input
              ref={inputRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className={cn(
                "w-full h-full pl-10 pr-8 bg-transparent",
                "text-sm text-gray-900 dark:text-white",
                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                "focus:outline-none"
              )}
            />
          )}
        </AnimatePresence>

        {/* Clear Button */}
        <AnimatePresence>
          {value && (isExpanded || shouldStayExpanded) && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClear}
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2",
                "p-1 rounded-full transition-colors duration-150",
                "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                "hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

