import { memo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, Loader2 } from "lucide-react";

export interface StatusOption {
  value: string;
  label: string;
  className: string;
}

// Helper to normalize status strings for matching (remove accents, lowercase)
const normalizeStatus = (s: string) => 
  (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Status para cotações
export const QUOTE_STATUS_OPTIONS: StatusOption[] = [
  { value: "ativa", label: "Ativa", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:bg-emerald-500/20 dark:border-emerald-500/30" },
  { value: "pendente", label: "Pendente", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:bg-amber-500/20 dark:border-amber-500/30" },
  { value: "planejada", label: "Planejada", className: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20 dark:bg-sky-500/20 dark:border-sky-500/30" },
  { value: "concluida", label: "Concluída", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:bg-blue-500/20 dark:border-blue-500/30" },
  { value: "finalizada", label: "Finalizada", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 dark:bg-purple-500/20 dark:border-purple-500/30" },
  { value: "cancelada", label: "Cancelada", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:bg-red-500/20 dark:border-red-500/30" },
  { value: "expirada", label: "Expirada", className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:bg-rose-500/20 dark:border-rose-500/30" },
];

// Status para pedidos
export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: "pendente", label: "Pendente", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:bg-amber-500/20 dark:border-amber-500/30" },
  { value: "confirmado", label: "Confirmado", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 dark:bg-blue-500/20 dark:border-blue-500/30" },
  { value: "enviado", label: "Enviado", className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:bg-indigo-500/20 dark:border-indigo-500/30" },
  { value: "entregue", label: "Entregue", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 dark:bg-emerald-500/20 dark:border-emerald-500/30" },
  { value: "cancelado", label: "Cancelada", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 dark:bg-red-500/20 dark:border-red-500/30" },
];

interface StatusSelectProps {
  value: string;
  options: StatusOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const StatusSelect = memo(function StatusSelect({
  value,
  options,
  onChange,
  disabled = false,
  isLoading = false,
  className,
}: StatusSelectProps) {
  const [open, setOpen] = useState(false);
  
  const currentOption = options.find(o => normalizeStatus(o.value) === normalizeStatus(value || "")) || options[0];

  const handleSelect = (newValue: string) => {
    if (newValue !== value) {
      onChange(newValue);
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled || isLoading}>
        <button
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-all",
            "hover:ring-2 hover:ring-offset-1 hover:ring-gray-300 dark:hover:ring-gray-600",
            "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            currentOption.className,
            className
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full flex-shrink-0",
                currentOption.className.split(" ").find(c => c.startsWith("text-")),
                "bg-current"
              )} />
              {currentOption.label}
              <ChevronDown className="h-3 w-3 opacity-60 ml-auto" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[140px]">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <Badge
              variant="outline"
              className={cn("font-medium text-xs", option.className)}
            >
              {option.label}
            </Badge>
            {option.value === value && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
