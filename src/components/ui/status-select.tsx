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
  { value: "ativa", label: "Ativa", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/40 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/50" },
  { value: "pendente", label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/40 dark:text-amber-200 border-amber-200 dark:border-amber-500/50" },
  { value: "planejada", label: "Planejada", className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/40 dark:text-cyan-200 border-cyan-200 dark:border-cyan-500/50" },
  { value: "concluida", label: "Concluída", className: "bg-blue-100 text-blue-700 dark:bg-blue-600/40 dark:text-blue-100 border-blue-200 dark:border-blue-500/50" },
  { value: "finalizada", label: "Finalizada", className: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/40 dark:text-fuchsia-200 border-fuchsia-200 dark:border-fuchsia-500/50" },
  { value: "cancelada", label: "Cancelada", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/40 dark:text-rose-200 border-rose-200 dark:border-rose-500/50" },
  { value: "expirada", label: "Expirada", className: "bg-red-100 text-red-700 dark:bg-red-500/40 dark:text-red-200 border-red-200 dark:border-red-500/50" },
];

// Status para pedidos
export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: "pendente", label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/40 dark:text-amber-200 border-amber-200 dark:border-amber-500/50" },
  { value: "confirmado", label: "Confirmado", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/40 dark:text-blue-100 border-blue-200 dark:border-blue-500/50" },
  { value: "enviado", label: "Enviado", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/40 dark:text-indigo-200 border-indigo-200 dark:border-indigo-500/50" },
  { value: "entregue", label: "Entregue", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/40 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/50" },
  { value: "cancelado", label: "Cancelado", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/40 dark:text-rose-200 border-rose-200 dark:border-rose-500/50" },
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
              {currentOption.label}
              <ChevronDown className="h-3 w-3 opacity-60" />
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
