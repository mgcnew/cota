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
  { value: "ativa", label: "Ativa", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  { value: "pendente", label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  { value: "planejada", label: "Planejada", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  { value: "concluida", label: "Concluída", className: "bg-primary/10 text-primary border-primary/20" },
  { value: "finalizada", label: "Finalizada", className: "bg-primary/10 text-primary border-primary/20" },
  { value: "cancelada", label: "Cancelada", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
];

// Status para pedidos
export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: "pendente", label: "Pendente", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" },
  { value: "confirmado", label: "Confirmado", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  { value: "enviado", label: "Enviado", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800" },
  { value: "entregue", label: "Entregue", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" },
  { value: "cancelado", label: "Cancelado", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800" },
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
