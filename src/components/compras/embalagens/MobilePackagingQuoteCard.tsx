import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Package, Building2, Eye, CheckCircle2, ShoppingCart, Trash2, 
  DollarSign, FileText, ChevronRight, Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import type { PackagingQuoteDisplay } from "@/types/packaging";

interface MobilePackagingQuoteCardProps {
  quote: PackagingQuoteDisplay;
  quoteNumber: number;
  onManage: (quote: PackagingQuoteDisplay) => void;
  onViewSummary?: (quote: PackagingQuoteDisplay) => void;
  onDelete: (quote: PackagingQuoteDisplay) => void;
  onConvertToOrder: (quote: PackagingQuoteDisplay) => void;
}

/**
 * MobilePackagingQuoteCard - Redesigned Premium Floating Card for Packaging Quotes
 * Aligned with the application's modern design system.
 */
export const MobilePackagingQuoteCard = memo(function MobilePackagingQuoteCard({
  quote,
  quoteNumber,
  onManage,
  onViewSummary,
  onDelete,
  onConvertToOrder
}: MobilePackagingQuoteCardProps) {

  const getQuoteStatusInfo = (quote: PackagingQuoteDisplay) => {
    const respondidos = quote.fornecedores.filter(f => f.status === "respondido").length;
    const total = quote.fornecedores.length;
    const isPronta = quote.status === "ativa" && respondidos === total && total > 0;
    return { respondidos, total, isPronta };
  };

  const { respondidos, total, isPronta } = getQuoteStatusInfo(quote);

  const handleManage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onManage(quote);
  }, [onManage, quote]);

  const handleViewSummary = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onViewSummary?.(quote);
  }, [onViewSummary, quote]);

  const handleConvertToOrder = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onConvertToOrder(quote);
  }, [onConvertToOrder, quote]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(quote);
  }, [onDelete, quote]);

  return (
    <div 
      onClick={() => onManage(quote)}
      className={cn(
        ds.components.card.root,
        ds.components.card.interactive,
        "group relative overflow-hidden",
        isPronta && "border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-500/5 shadow-md shadow-emerald-500/5"
      )}
    >
      <div className="p-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors",
              isPronta 
                ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-400"
                : "bg-brand/10 dark:bg-brand/20 border-brand/10 text-brand"
            )}>
              {isPronta ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Package className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-2">
                Cotação #{quoteNumber.toString().padStart(4, '0')}
                {isPronta && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[9px] h-4 px-1.5 font-black uppercase tracking-tighter">
                    Pronta
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3 w-3 opacity-50" />
                Criada em {quote.dataInicio}
              </p>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">
              Melhor Preço
            </span>
            <span className={cn(
              "text-sm font-black transition-colors",
              quote.melhorPreco !== '-' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-600"
            )}>
              {quote.melhorPreco}
            </span>
          </div>
        </div>

        {/* Items Pills Row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {quote.itens.slice(0, 3).map((item, idx) => (
            <Badge 
              key={item.id || idx} 
              variant="secondary" 
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold px-2.5 py-1 rounded-full border-none"
            >
              <Package className="h-2.5 w-2.5 mr-1.5 opacity-50" />
              <CapitalizedText>{item.packagingName}</CapitalizedText>
            </Badge>
          ))}
          {quote.itens.length > 3 && (
            <Badge variant="outline" className="text-[10px] rounded-full border-zinc-200 dark:border-zinc-800 px-2 py-0.5 text-zinc-500">
              +{quote.itens.length - 3} itens
            </Badge>
          )}
          {quote.itens.length === 0 && (
            <span className="text-xs text-zinc-400 italic">Nenhum item adicionado</span>
          )}
        </div>

        {/* Status and Progress Row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={quote.status === 'ativa' && !isPronta ? 'aberta' : quote.status} 
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider h-auto"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border",
              respondidos === total && total > 0 
                ? "bg-brand/5 border-brand/20 text-brand" 
                : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-500"
            )}>
              <Building2 className="h-3.5 w-3.5 opacity-70" />
              <span className="text-[11px] font-bold">
                {respondidos}/{total} fornecedores
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <div className="flex-1 flex gap-2">
            <Button
              onClick={handleManage}
              variant="outline"
              className={cn(
                ds.components.button.base,
                ds.components.button.variants.secondary,
                "flex-1 h-11 rounded-xl",
                "font-bold text-xs"
              )}
            >
              <Eye className="h-4 w-4 mr-1.5 opacity-70" />
              Negociar
            </Button>

            {isPronta && quote.status !== 'concluida' && (
              <Button
                onClick={handleConvertToOrder}
                className={cn(
                  ds.components.button.base,
                  ds.components.button.variants.primary,
                  "flex-1 h-11 rounded-xl font-bold text-xs shadow-md shadow-brand/20"
                )}
              >
                <ShoppingCart className="h-4 w-4 mr-1.5" />
                Converter
              </Button>
            )}

            {quote.status === 'concluida' && onViewSummary && (
              <Button
                onClick={handleViewSummary}
                className={cn(
                  ds.components.button.base,
                  ds.components.button.variants.primary,
                  "flex-1 h-11 rounded-xl font-bold text-xs shadow-md shadow-brand/20"
                )}
              >
                <FileText className="h-4 w-4 mr-1.5" />
                Resumo
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleDelete}
            variant="outline"
            size="icon"
            className={cn(
              ds.components.button.base,
              ds.components.button.variants.secondary,
              "h-11 w-11 rounded-xl",
              "text-red-500 hover:text-red-600 hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20"
            )}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

const CircleCheck = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);