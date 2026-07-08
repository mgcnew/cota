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

// Paleta sólida padronizada — mesmo padrão do StatusBadge (pills com fundo cheio,
// texto branco, sem borda).
const SOLID = {
  green: "bg-emerald-600 text-white",
  amber: "bg-amber-500 text-white",
  orange: "bg-orange-500 text-white",
  red: "bg-red-600 text-white",
  blue: "bg-blue-600 text-white",
} as const;

// Status para cotações
export const QUOTE_STATUS_OPTIONS: StatusOption[] = [
  { value: "planejada", label: "Planejada", className: SOLID.amber },
  { value: "ativa", label: "Ativa", className: SOLID.orange },
  { value: "concluida", label: "Concluída", className: SOLID.green },
  { value: "cancelada", label: "Cancelada", className: SOLID.red },
];

// Status para pedidos
export const ORDER_STATUS_OPTIONS: StatusOption[] = [
  { value: "pendente", label: "Pendente", className: SOLID.amber },
  { value: "confirmado", label: "Confirmado", className: SOLID.orange },
  { value: "enviado", label: "Enviado", className: SOLID.blue },
  { value: "entregue", label: "Entregue", className: SOLID.green },
  { value: "cancelado", label: "Cancelada", className: SOLID.red },
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
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-transparent transition-all",
            "hover:brightness-110",
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
              <ChevronDown className="h-3 w-3 opacity-80 ml-auto" />
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
              className={cn("font-bold text-xs border-transparent px-3 py-1", option.className)}
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
