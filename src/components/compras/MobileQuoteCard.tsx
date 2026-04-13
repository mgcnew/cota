import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { 
  ClipboardList, CheckCircle, AlertCircle, Building2, 
  Trash2, Calendar, DollarSign, Eye, Clock, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
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

const abbreviateName = (name: string, maxLength: number = 24) => {
  if (name.length <= maxLength) return name;
  const words = name.split(' ');
  if (words.length === 1) return name.substring(0, maxLength - 3) + '...';
  if (words.length >= 2) {
    const abbreviated = `${words[0]} ... ${words[words.length - 1]}`;
    if (abbreviated.length <= maxLength) return abbreviated;
  }
  return name.substring(0, maxLength - 3) + '...';
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

  const getStatusIcon = () => {
    if (isProntaParaDecisao) return <CheckCircle className="h-5 w-5" />;
    if (isVencendo) return <AlertCircle className="h-5 w-5" />;
    return <ClipboardList className="h-5 w-5" />;
  };

  return (
    <div 
      className={cn(
        "bg-white dark:bg-card/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm overflow-hidden touch-manipulation relative",
      )}
    >
      <div className="p-4">
        {/* Header: Product, ID, Price */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                isProntaParaDecisao 
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : isVencendo
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              )}>
                {getStatusIcon()}
              </div>
              {isProntaParaDecisao && (
                <div className="absolute -top-1 -right-1 bg-white dark:bg-background rounded-full">
                  <div className="bg-emerald-500 rounded-full w-3.5 h-3.5 border-2 border-white dark:border-zinc-950 animate-pulse" />
                </div>
              )}
              {isVencendo && !isProntaParaDecisao && (
                <div className="absolute -top-1 -right-1 bg-white dark:bg-background rounded-full">
                  <div className="bg-amber-500 rounded-full w-3.5 h-3.5 border-2 border-white dark:border-zinc-950 animate-pulse" />
                </div>
              )}
            </div>
            
            <div className="min-w-0">
              <h3 className={cn("text-sm truncate", ds.typography.weight.bold, ds.colors.text.primary)}>
                <CapitalizedText>{abbreviateName(cotacao.produtoResumo || cotacao.produto)}</CapitalizedText>
              </h3>
              <p className={cn("text-[10px] uppercase font-mono tracking-tight opacity-70", ds.colors.text.secondary)}>
                #{cotacaoNumero.toString().padStart(4, '0')}
              </p>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className={cn("text-sm", ds.components.dataDisplay.money)}>{cotacao.melhorPreco || 'R$ 0,00'}</div>
            <div className={cn("text-[9px] uppercase tracking-wider", ds.colors.text.muted)}>melhor preço</div>
          </div>
        </div>

        {/* Info Row: Status, Suppliers, Deadline */}
        <div className="flex items-center justify-between mb-4 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-xl p-2.5">
          <StatusBadge status={cotacao.statusReal || cotacao.status} />
          
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-1.5", ds.components.dataDisplay.secondary)}>
              <Building2 className="w-3.5 h-3.5" />
              <span className="font-bold">{fornecedoresRespondidos}/{totalFornecedores}</span>
            </div>
            
            <div className={cn("flex items-center gap-1.5", isVencendo ? "text-amber-500 font-bold" : ds.components.dataDisplay.secondary)}>
              {isVencendo ? <AlertCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
              <span className="text-[11px]">
                {cotacao.dataFim || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isClosed ? (
            <Button 
              className={cn(
                "flex-1 h-10 rounded-xl touch-target active:scale-[0.98] transition-transform",
                ds.components.button.primary
              )}
              onClick={() => onView(cotacao)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Resumo da Decisão
            </Button>
          ) : (
            <Button 
              className={cn(
                "flex-1 h-10 rounded-xl touch-target active:scale-[0.98] transition-transform",
                ds.components.button.primary
              )}
              onClick={() => onManage(cotacao)}
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              {isProntaParaDecisao ? "Fechar Cotação" : "Negociar Cotação"}
            </Button>
          )}
          
          {!isClosed && (
            <Button
              size="icon"
              variant="outline"
              className="h-10 w-10 rounded-xl border-zinc-200 dark:border-zinc-800 text-red-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 touch-target shrink-0"
              onClick={() => onDelete(cotacao)}
              aria-label="Excluir cotação"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.cotacao.id === nextProps.cotacao.id &&
    prevProps.cotacao.status === nextProps.cotacao.status &&
    prevProps.cotacao.statusReal === nextProps.cotacao.statusReal &&
    prevProps.cotacao.melhorPreco === nextProps.cotacao.melhorPreco &&
    prevProps.cotacao.fornecedores === nextProps.cotacao.fornecedores &&
    prevProps.cotacao.dataFim === nextProps.cotacao.dataFim &&
    prevProps.cotacaoNumero === nextProps.cotacaoNumero
  );
});