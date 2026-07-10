import * as React from "react";
import { memo, useCallback } from "react";
import {
  Building2,
  FileText,
  TrendingUp,
  Edit,
  Trash2,
  MessageCircle,
  MoreVertical,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { capitalize } from "@/lib/text-utils";
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  contact: string;
  limit: string;
  activeQuotes: number;
  totalQuotes: number;
  avgPrice: string;
  lastOrder: string;
  rating: number;
  status: "active" | "inactive" | "pending";
  phone?: string;
  email?: string;
  address?: string;
}

interface ExpandableSupplierCardProps {
  supplier: Supplier;
  onEdit?: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onWhatsApp: (supplier: Supplier) => void;
  onAddQuote?: (supplier: Supplier) => void;
  onViewHistory?: (supplier: Supplier) => void;
  renderRating: (rating: number) => React.ReactNode;
}

// Acento como BORDA-esquerda do card (sem elemento absoluto + overflow-hidden,
// que criava camada de máscara e corrompia em GPU Mali).
const ACCENT_BORDER: Record<string, string> = {
  active:   "border-l-emerald-500",
  inactive: "border-l-zinc-300 dark:border-l-zinc-700",
  pending:  "border-l-amber-500",
};

const formatLimitBRL = (input: string) => {
  if (!input) return "R$ 0,00";
  const hasK = /k/i.test(input);
  const numeric = parseFloat(input.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
  const value = hasK ? numeric * 1000 : numeric;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export const ExpandableSupplierCard = memo(function ExpandableSupplierCard({
  supplier,
  onEdit,
  onDelete,
  onWhatsApp,
  onAddQuote,
  onViewHistory,
  renderRating,
}: ExpandableSupplierCardProps): JSX.Element {
  const accentBorder = ACCENT_BORDER[supplier.status] ?? "border-l-zinc-300 dark:border-l-zinc-700";

  const handleEdit      = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onEdit?.(supplier);       }, [onEdit,       supplier]);
  const handleDelete    = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onDelete(supplier);       }, [onDelete,     supplier]);
  const handleWhatsApp  = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onWhatsApp(supplier);     }, [onWhatsApp,   supplier]);
  const handleAddQuote  = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onAddQuote?.(supplier);   }, [onAddQuote,   supplier]);

  return (
    <div
      onClick={() => onViewHistory?.(supplier)}
      className={cn(
        "rounded-xl border border-border dark:border-white/10 border-l-[3px] bg-card p-3.5 active:scale-[0.99] transition-transform cursor-pointer",
        accentBorder
      )}
    >
        {/* Top row: icon + name + limit + menu */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 border border-border dark:border-white/5">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
              {capitalize(supplier.name)}
            </p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {capitalize(supplier.contact) || "—"}
            </p>
          </div>

          <div className="text-right shrink-0 mr-1">
            <p className="text-[13px] font-bold text-foreground tabular-nums">
              {formatLimitBRL(supplier.limit)}
            </p>
            <p className="text-[10px] text-muted-foreground/60">limite</p>
          </div>

          {/* Secondary actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all shrink-0 touch-manipulation"
                onClick={e => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleEdit} className="gap-2">
                <Edit className="h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Info row: status + rating + stats */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border dark:border-white/5">
          <StatusBadge status={supplier.status} className="text-[10px] h-5 px-2 shrink-0" />
          <div className="shrink-0">{renderRating(supplier.rating)}</div>
          <div className="flex items-center gap-3 ml-auto text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span className="font-medium">{supplier.totalQuotes} cot.</span>
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="font-medium">{supplier.avgPrice}</span>
            </span>
          </div>
        </div>

        {/* Primary CTA row */}
        <div className="flex gap-2 mt-2.5">
          <Button
            onClick={handleWhatsApp}
            variant="outline"
            size="sm"
            className="flex-1 h-9 rounded-lg text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 font-semibold text-xs gap-1.5"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
          <Button
            onClick={handleAddQuote}
            size="sm"
            className="flex-1 h-9 rounded-lg bg-brand hover:bg-brand/90 text-white dark:text-zinc-950 font-semibold text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Nova Cotação
          </Button>
        </div>
    </div>
  );
});

export default ExpandableSupplierCard;
