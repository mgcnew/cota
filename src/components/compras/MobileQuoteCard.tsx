import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ClipboardList, CheckCircle, AlertCircle, Building2,
  Trash2, Calendar, Eye, MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Quote } from "@/hooks/useCotacoes";

interface MobileQuoteCardProps {
  cotacao: Quote;
  cotacaoNumero: number;
  onView: (quote: Quote) => void;
  onManage: (quote: Quote) => void;
  onDelete: (quote: Quote) => void;
  onUpdateStatus: (quoteId: string, status: string) => void;
  isUpdating?: boolean;
}

const STATUS_ACCENT: Record<string, string> = {
  pronta:   "bg-emerald-500",
  vencendo: "bg-amber-500",
  ativa:    "bg-blue-500",
  concluida:"bg-zinc-400",
  finalizada:"bg-zinc-400",
  pendente: "bg-amber-400",
};

export const MobileQuoteCard = memo(function MobileQuoteCard({
  cotacao,
  cotacaoNumero,
  onView,
  onManage,
  onDelete,
}: MobileQuoteCardProps) {

  const specialStatus = useMemo(() => {
    const fornecedoresRespondidos = cotacao.fornecedoresParticipantes?.filter(f => f.status === "respondido").length || 0;
    const totalFornecedores = cotacao.fornecedoresParticipantes?.length || 0;
    const isProntaParaDecisao = cotacao.statusReal === "ativa" && totalFornecedores > 0 && fornecedoresRespondidos === totalFornecedores;

    const hoje = new Date();
    const em48h = new Date(hoje.getTime() + 48 * 60 * 60 * 1000);
    const [df, mf, yf] = cotacao.dataFim.split(/[\/-]/).map(Number);
    const dataFim = new Date(yf, mf - 1, df);
    const isVencendo = cotacao.statusReal === "ativa" && dataFim <= em48h && dataFim >= hoje;

    return { isProntaParaDecisao, isVencendo, fornecedoresRespondidos, totalFornecedores };
  }, [cotacao]);

  const { isProntaParaDecisao, isVencendo, fornecedoresRespondidos, totalFornecedores } = specialStatus;
  const isClosed = cotacao.status === "concluida" || cotacao.status === "finalizada";

  const accentKey = isProntaParaDecisao ? "pronta"
    : isVencendo ? "vencendo"
    : isClosed   ? "concluida"
    : cotacao.statusReal || cotacao.status || "ativa";
  const accent = STATUS_ACCENT[accentKey] ?? "bg-blue-500";

  const ctaLabel = isClosed
    ? "Resumo da Decisão"
    : isProntaParaDecisao
      ? "Fechar Cotação"
      : "Negociar Cotação";

  const ctaIcon = isClosed
    ? <Eye className="h-3.5 w-3.5" />
    : <ClipboardList className="h-3.5 w-3.5" />;

  const handleCTA = () => isClosed ? onView(cotacao) : onManage(cotacao);

  return (
    <div className="relative bg-card border border-border dark:border-white/5 rounded-xl overflow-hidden shadow-sm">
      {/* Left accent border by status */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl", accent)} />

      {/* Pulse dot for urgent states */}
      {(isProntaParaDecisao || isVencendo) && (
        <div className={cn(
          "absolute top-3 right-10 w-2 h-2 rounded-full",
          isProntaParaDecisao ? "bg-emerald-500" : "bg-amber-500",
          "animate-pulse"
        )} />
      )}

      <div className="pl-4 pr-3 py-3">
        {/* Top row: product name + price + menu */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate leading-tight">
              <CapitalizedText>{cotacao.produtoResumo || cotacao.produto}</CapitalizedText>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              #{cotacaoNumero.toString().padStart(4, "0")}
            </p>
          </div>

          <div className="text-right shrink-0 mr-1">
            <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {cotacao.melhorPreco || "—"}
            </p>
            <p className="text-[10px] text-muted-foreground/60">melhor preço</p>
          </div>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-all shrink-0 touch-manipulation">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onView(cotacao)} className="gap-2">
                <Eye className="h-4 w-4" /> Ver Resumo
              </DropdownMenuItem>
              {!isClosed && (
                <DropdownMenuItem onClick={() => onManage(cotacao)} className="gap-2">
                  <ClipboardList className="h-4 w-4" /> Gerenciar
                </DropdownMenuItem>
              )}
              {!isClosed && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(cotacao)}
                    className="gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
                  >
                    <Trash2 className="h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Info row: status + suppliers + deadline */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border dark:border-white/5">
          <StatusBadge status={cotacao.statusReal || cotacao.status} className="text-[10px] h-5 px-2 shrink-0" />
          <div className="flex items-center gap-3 ml-auto text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              <span className="font-medium">{fornecedoresRespondidos}/{totalFornecedores}</span>
            </span>
            <span className={cn(
              "flex items-center gap-1",
              isVencendo && "text-amber-500 font-semibold"
            )}>
              {isVencendo
                ? <AlertCircle className="h-3 w-3" />
                : <Calendar className="h-3 w-3" />
              }
              <span>{cotacao.dataFim || "—"}</span>
            </span>
          </div>
        </div>

        {/* Primary CTA */}
        <Button
          size="sm"
          onClick={handleCTA}
          className={cn(
            "w-full mt-2.5 h-9 rounded-lg font-semibold text-xs gap-1.5",
            isProntaParaDecisao
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : isVencendo
                ? "bg-amber-500 hover:bg-amber-600 text-white"
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
}, (prev, next) =>
  prev.cotacao.id        === next.cotacao.id        &&
  prev.cotacao.status    === next.cotacao.status    &&
  prev.cotacao.statusReal=== next.cotacao.statusReal&&
  prev.cotacao.melhorPreco===next.cotacao.melhorPreco&&
  prev.cotacao.fornecedores===next.cotacao.fornecedores&&
  prev.cotacao.dataFim   === next.cotacao.dataFim   &&
  prev.cotacaoNumero     === next.cotacaoNumero
);
