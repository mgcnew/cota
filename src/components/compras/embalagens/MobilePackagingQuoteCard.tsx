import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList, Eye, Trash2, MoreVertical,
  Building2, Calendar, ShoppingCart, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PackagingQuoteDisplay } from "@/types/packaging";

interface MobilePackagingQuoteCardProps {
  quote: PackagingQuoteDisplay;
  quoteNumber: number;
  onManage: (quote: PackagingQuoteDisplay) => void;
  onViewSummary?: (quote: PackagingQuoteDisplay) => void;
  onDelete: (quote: PackagingQuoteDisplay) => void;
  onConvertToOrder: (quote: PackagingQuoteDisplay) => void;
}

const STATUS_ACCENT: Record<string, string> = {
  pronta:   "bg-emerald-500",
  concluida:"bg-zinc-400",
  ativa:    "bg-brand",
  cancelada:"bg-red-400",
};

export const MobilePackagingQuoteCard = memo(function MobilePackagingQuoteCard({
  quote,
  quoteNumber,
  onManage,
  onViewSummary,
  onDelete,
  onConvertToOrder,
}: MobilePackagingQuoteCardProps) {

  const { respondidos, total, isPronta, isClosed } = useMemo(() => {
    const respondidos = quote.fornecedores.filter(f => f.status === "respondido").length;
    const total = quote.fornecedores.length;
    const isPronta = quote.status === "ativa" && respondidos === total && total > 0;
    const isClosed = quote.status === "concluida" || quote.status === "cancelada";
    return { respondidos, total, isPronta, isClosed };
  }, [quote]);

  const accentKey = isPronta ? "pronta" : isClosed ? "concluida" : "ativa";
  const accent = STATUS_ACCENT[accentKey];

  const itemsLabel = quote.itens.length > 0
    ? quote.itens.slice(0, 2).map(i => i.packagingName).join(", ") + (quote.itens.length > 2 ? ` +${quote.itens.length - 2}` : "")
    : "Sem itens";

  const ctaLabel = isClosed
    ? "Resumo da Cotação"
    : isPronta
      ? "Fechar Cotação"
      : "Negociar Cotação";

  const ctaIcon = isClosed
    ? <FileText className="h-3.5 w-3.5" />
    : isPronta
      ? <ShoppingCart className="h-3.5 w-3.5" />
      : <ClipboardList className="h-3.5 w-3.5" />;

  const handleCTA = () => {
    if (isClosed) onViewSummary?.(quote);
    else if (isPronta) onConvertToOrder(quote);
    else onManage(quote);
  };

  return (
    <div className="relative bg-card border border-border dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
      {/* Left accent */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", accent)} />

      {/* Pulse dot for pronta */}
      {isPronta && (
        <div className="absolute top-3 right-10 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      )}

      <div className="pl-4 pr-3 py-3">
        {/* Top row: item names + price + menu */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
              <CapitalizedText>{itemsLabel}</CapitalizedText>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              #{quoteNumber.toString().padStart(4, "0")}
            </p>
          </div>

          <div className="text-right shrink-0 mr-1">
            <p className={cn(
              "text-[13px] font-bold tabular-nums",
              quote.melhorPreco && quote.melhorPreco !== "-"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            )}>
              {quote.melhorPreco && quote.melhorPreco !== "-" ? quote.melhorPreco : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground/60">melhor preço</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all shrink-0 touch-manipulation">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isClosed ? (
                onViewSummary && (
                  <DropdownMenuItem onClick={() => onViewSummary(quote)} className="gap-2">
                    <Eye className="h-4 w-4" /> Ver Resumo
                  </DropdownMenuItem>
                )
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onManage(quote)} className="gap-2">
                    <ClipboardList className="h-4 w-4" /> Negociar
                  </DropdownMenuItem>
                  {isPronta && (
                    <DropdownMenuItem onClick={() => onConvertToOrder(quote)} className="gap-2 text-emerald-600">
                      <ShoppingCart className="h-4 w-4" /> Converter em Pedido
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(quote)} className="gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30">
                    <Trash2 className="h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border dark:border-white/5">
          <StatusBadge
            status={isPronta ? "pronta" : quote.status}
            className="text-[10px] h-5 px-2 shrink-0"
          />
          <div className="flex items-center gap-3 ml-auto text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span className="font-medium">{respondidos}/{total}</span>
            </span>
            {quote.dataFim && quote.dataFim !== "-" && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{quote.dataFim}</span>
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <Button
          size="sm"
          onClick={handleCTA}
          className={cn(
            "w-full mt-2.5 h-9 rounded-lg font-semibold text-xs gap-1.5",
            isPronta
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : isClosed
                ? "bg-muted text-foreground hover:bg-muted/80"
                : "bg-brand hover:bg-brand/90 text-white dark:text-zinc-950"
          )}
        >
          {ctaIcon}
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
});
