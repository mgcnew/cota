import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { 
  Package, Building2, Eye, CheckCircle2, ShoppingCart, Trash2, 
  DollarSign, ChevronDown, ChevronUp, MoreVertical
} from "lucide-react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { PackagingQuoteDisplay } from "@/types/packaging";

interface MobilePackagingQuoteCardProps {
  quote: PackagingQuoteDisplay;
  quoteNumber: number;
  onManage: (quote: PackagingQuoteDisplay) => void;
  onDelete: (quote: PackagingQuoteDisplay) => void;
  onConvertToOrder: (quote: PackagingQuoteDisplay) => void;
}

export const MobilePackagingQuoteCard = memo(function MobilePackagingQuoteCard({
  quote,
  quoteNumber,
  onManage,
  onDelete,
  onConvertToOrder
}: MobilePackagingQuoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getQuoteStatus = (quote: PackagingQuoteDisplay) => {
    const respondidos = quote.fornecedores.filter(f => f.status === "respondido").length;
    const total = quote.fornecedores.length;
    const isPronta = quote.status === "ativa" && respondidos === total && total > 0;
    return { respondidos, total, isPronta };
  };

  const { respondidos, total, isPronta } = getQuoteStatus(quote);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        "bg-white dark:bg-gray-800/50 rounded-xl border shadow-sm overflow-hidden transition-all duration-200",
        isPronta 
          ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800' 
          : 'border-gray-200 dark:border-gray-700/50'
      )}
    >
      <div className="p-4 pb-2">
        {isPronta && (
          <div className="flex items-center gap-1.5 mb-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase">Pronta para decisão</span>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
              isPronta 
                ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700' 
                : 'bg-gray-100 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600/30'
            )}>
              {isPronta ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                <CapitalizedText>
                  {quote.itens.map(i => i.packagingName).join(', ') || 'Sem itens'}
                </CapitalizedText>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                #{quoteNumber.toString().padStart(4, '0')} • {quote.dataInicio} - {quote.dataFim}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <Badge variant={quote.status === "ativa" ? "default" : "secondary"}>
            {quote.status}
          </Badge>
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full",
            respondidos === total && total > 0
              ? 'bg-emerald-50 dark:bg-emerald-900/20'
              : 'bg-blue-50 dark:bg-blue-900/20'
          )}>
            <Building2 className={cn(
              "h-3 w-3",
              respondidos === total && total > 0
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-blue-500 dark:text-blue-400'
            )} />
            <span className={cn(
              "font-semibold text-xs",
              respondidos === total && total > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-blue-600 dark:text-blue-400'
            )}>
              {respondidos}/{total}
            </span>
          </div>
          {quote.melhorPreco !== '-' && (
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700">
              <DollarSign className="h-3 w-3 mr-1" />
              {quote.melhorPreco}
            </Badge>
          )}
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <CollapsibleTrigger asChild>
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700/30 text-xs text-muted-foreground active:bg-gray-100 dark:active:bg-gray-700/50 touch-target min-h-[44px]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              <span>Menos detalhes</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              <span>Mais detalhes</span>
            </>
          )}
        </button>
      </CollapsibleTrigger>

      {/* Expandable Actions */}
      <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
        <div className="p-4 pt-0 space-y-3 border-t border-gray-200 dark:border-gray-700/30 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="grid grid-cols-2 gap-2 pt-3">
            <Button 
              size="sm" 
              variant="outline" 
              className={cn(
                "h-10 touch-target active:scale-95 transition-transform",
                isPronta ? "col-span-1" : "col-span-2"
              )}
              onClick={() => onManage(quote)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Gerenciar
            </Button>
            
            {isPronta && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-10 touch-target active:scale-95 transition-transform text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                onClick={() => onConvertToOrder(quote)}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Converter
              </Button>
            )}

            <Button 
              size="sm" 
              variant="outline" 
              className="h-10 touch-target text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 active:scale-95 transition-transform col-span-2"
              onClick={() => onDelete(quote)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});