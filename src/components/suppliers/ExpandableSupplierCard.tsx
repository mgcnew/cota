import * as React from "react";
import { memo, useCallback } from "react";
import { 
  Building2, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Edit, 
  Trash2, 
  MessageCircle, 
  Eye, 
  Phone, 
  Mail, 
  MapPin,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { capitalize } from "@/lib/text-utils";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

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

/**
 * ExpandableSupplierCard - Redesigned Floating Supplier Card for Mobile
 * Aligned with Procurement & Products premium design system.
 */
export const ExpandableSupplierCard = memo(function ExpandableSupplierCard({
  supplier,
  onEdit,
  onDelete,
  onWhatsApp,
  onAddQuote,
  onViewHistory,
  renderRating,
}: ExpandableSupplierCardProps): JSX.Element {
  
  const formatLimitBRL = (input: string) => {
    if (!input) return "R$ 0,00";
    const hasK = /k/i.test(input);
    const numeric = parseFloat(input.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const value = hasK ? numeric * 1000 : numeric;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Ativo";
      case "inactive": return "Inat.";
      case "pending": return "Pend.";
      default: return status;
    }
  };

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(supplier);
  }, [onEdit, supplier]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(supplier);
  }, [onDelete, supplier]);

  const handleWhatsApp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onWhatsApp(supplier);
  }, [onWhatsApp, supplier]);

  const handleAddQuote = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onAddQuote?.(supplier);
  }, [onAddQuote, supplier]);

  const handleView = () => {
    onViewHistory?.(supplier);
  };

  return (
    <div 
      onClick={handleView}
      className={cn(
        "group relative overflow-hidden transition-all duration-300",
        "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md",
        "rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50",
        "shadow-sm hover:shadow-md hover:border-brand/30 dark:hover:border-brand/30",
        "active:scale-[0.98] cursor-pointer"
      )}
    >
      <div className="p-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-brand/10 dark:bg-brand/20 flex items-center justify-center flex-shrink-0 border border-brand/10">
              <Building2 className="h-5 w-5 text-brand" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                {capitalize(supplier.name)}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {capitalize(supplier.contact)}
              </p>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">
              Limite
            </span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {formatLimitBRL(supplier.limit)}
            </span>
          </div>
        </div>

        {/* Status and Analytics Row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={supplier.status} 
              customLabel={getStatusLabel(supplier.status)}
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider h-auto"
            />
            {renderRating(supplier.rating)}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-500/70" />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {supplier.totalQuotes}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500/70" />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                {supplier.avgPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <div className="flex-1 flex gap-2">
            <Button
              onClick={handleWhatsApp}
              variant="outline"
              className={cn(
                "flex-1 h-11 rounded-xl",
                "text-emerald-600 dark:text-emerald-400",
                "border-emerald-100 dark:border-emerald-900/30",
                "bg-emerald-50/50 dark:bg-emerald-900/10",
                "hover:bg-emerald-100 dark:hover:bg-emerald-900/20",
                "font-bold text-xs px-2"
              )}
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              Zap
            </Button>

            <Button
              onClick={handleAddQuote}
              variant="default"
              className={cn(
                "flex-1 h-11 rounded-xl bg-brand hover:bg-brand/90 text-zinc-950 font-bold text-xs"
              )}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Cotação
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleEdit}
              variant="outline"
              size="icon"
              className={cn(
                "h-11 w-11 rounded-xl border-zinc-200 dark:border-zinc-800",
                "text-zinc-600 dark:text-zinc-400 hover:text-brand hover:border-brand",
                "bg-zinc-50/50 dark:bg-zinc-800/30"
              )}
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleDelete}
              variant="outline"
              size="icon"
              className={cn(
                "h-11 w-11 rounded-xl border-zinc-200 dark:border-zinc-800",
                "text-red-500 hover:text-red-600 hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20",
                "bg-zinc-50/50 dark:bg-zinc-800/30"
              )}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ExpandableSupplierCard;
