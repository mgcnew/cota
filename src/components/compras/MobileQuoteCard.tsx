import { memo, useMemo } from "react";
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

// Acento aplicado como BORDA-esquerda do próprio card (sem elemento absoluto +
// overflow-hidden, que criava uma camada de máscara e corrompia em GPU Mali).
const ACCENT_BORDER: Record<string, string> = {
  pronta:    "border-l-emerald-500",
  vencendo:  "border-l-amber-500",
  ativa:     "border-l-blue-500",
  concluida: "border-l-zinc-300 dark:border-l-zinc-700",
  finalizada:"border-l-zinc-300 dark:border-l-zinc-700",
  pendente:  "border-l-amber-400",
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
  const accentBorder = ACCENT_BORDER[accentKey] ?? "border-l-blue-500";

  const ctaLabel = isClosed
    ? "Resumo da Decisão"
    : isProntaParaDecisao
      ? "Fechar Cotação"
      : "Negociar Cotação";

  const ctaIcon = isClosed
    ? <Eye className="h-3.5 w-3.5" />
    : <ClipboardList className="h-3.5 w-3.5" />;

  // CTA sólido só nos estados urgentes (chamam atenção); nos demais, tonalizado
  // (mais limpo/leve visualmente).
  const ctaStyle = isProntaParaDecisao
    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
    : isVencendo
      ? "bg-amber-500 hover:bg-amber-600 text-white"
      : isClosed
        ? "bg-muted/60 hover:bg-muted text-foreground"
        : "bg-brand/10 hover:bg-brand/20 text-brand";

  const handleCTA = () => isClosed ? onView(cotacao) : onManage(cotacao);

  return (
    <div className={cn(
      "rounded-xl border border-border dark:border-white/10 border-l-[3px] bg-card p-3.5",
      accentBorder
    )}>
      {/* Header: produto + melhor preço + menu */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate leading-snug">
            <CapitalizedText>{cotacao.produtoResumo || cotacao.produto}</CapitalizedText>
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
            #{cotacaoNumero.toString().padStart(4, "0")}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
            {cotacao.melhorPreco || "—"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">melhor preço</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="-mr-1 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 active:scale-95 transition-colors shrink-0 touch-manipulation">
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

      {/* Meta: status + fornecedores + prazo */}
      <div className="flex items-center gap-2 mt-3">
        <StatusBadge status={cotacao.statusReal || cotacao.status} className="text-[10px] h-5 px-2 shrink-0" />
        <div className="flex items-center gap-3 ml-auto text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            <span className="font-medium tabular-nums">{fornecedoresRespondidos}/{totalFornecedores}</span>
          </span>
          <span className={cn(
            "flex items-center gap-1",
            isVencendo && "text-amber-600 dark:text-amber-500 font-semibold"
          )}>
            {isVencendo
              ? <AlertCircle className="h-3 w-3" />
              : <Calendar className="h-3 w-3" />
            }
            <span>{cotacao.dataFim || "—"}</span>
          </span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleCTA}
        className={cn(
          "w-full mt-3 h-9 rounded-lg font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors touch-manipulation active:scale-[0.99]",
          ctaStyle
        )}
      >
        {ctaIcon}
        {ctaLabel}
      </button>
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
