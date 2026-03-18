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

// Status para cotações
export const QUOTE_STATUS_OPTIONS: StatusOption[] = [
  { value: "ativa", label: "Ativa", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" },
  { value: "pendente", label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30" },
  { value: "planejada", label: "Planejada", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" },
  { value: "concluida", label: "Concluída", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30" },
  { value: "finalizada", label: "Finalizada", className: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border-purple-200 dark:border-purple-500/30" },
  { value: "cancelada", label: "Cancelada", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30" },
  { value: "expirada", label: "Expirada", className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30" },
];

// Status para pedidos
export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: "pendente", label: "Pendente", className: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30" },
  { value: "confirmado", label: "Confirmado", className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" },
  { value: "enviado", label: "Enviado", className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30" },
  { value: "entregue", label: "Entregue", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" },
  { value: "cancelado", label: "Cancelado", className: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30" },
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
  
  const currentOption = options.find(o => o.value === value) || options[0];

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
