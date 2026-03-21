import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusSelect, QUOTE_STATUS_OPTIONS } from "@/components/ui/status-select";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { 
  ClipboardList, CheckCircle2, AlertTriangle, Building2, MoreVertical, 
  Eye, ShoppingCart, Trash2, ChevronDown, ChevronUp, Calendar, DollarSign
} from "lucide-react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
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

export const MobileQuoteCard = memo(function MobileQuoteCard({
  cotacao,
  cotacaoNumero,
  onView,
  onManage,
  onDelete,
  onUpdateStatus,
  isUpdating
}: MobileQuoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Helper para verificar status especial da cotação
  const getQuoteSpecialStatus = (cotacao: Quote) => {
    const fornecedoresRespondidos = cotacao.fornecedoresParticipantes?.filter(f => f.status === "respondido").length || 0;
    const totalFornecedores = cotacao.fornecedoresParticipantes?.length || 0;
    const isProntaParaDecisao = cotacao.statusReal === "ativa" && totalFornecedores > 0 && fornecedoresRespondidos === totalFornecedores;
    
    const hoje = new Date();
    const em48h = new Date(hoje.getTime() + 48 * 60 * 60 * 1000);
    const dataFim = new Date(cotacao.dataFim.split('/').reverse().join('-'));
    const isVencendo = cotacao.statusReal === "ativa" && dataFim <= em48h && dataFim >= hoje;
    
    return { isProntaParaDecisao, isVencendo, fornecedoresRespondidos, totalFornecedores };
  };

  const { isProntaParaDecisao, isVencendo, fornecedoresRespondidos, totalFornecedores } = getQuoteSpecialStatus(cotacao);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        "bg-white dark:bg-gray-800/50 rounded-xl border p-3 shadow-sm overflow-hidden transition-all duration-200",
        isProntaParaDecisao 
          ? 'border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-200 dark:ring-emerald-800' 
          : isVencendo 
            ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800'
            : 'border-gray-200 dark:border-gray-700/30'
      )}
    >
      {/* Indicador de status especial */}
      {isProntaParaDecisao && (
        <div className="flex items-center gap-1.5 mb-2 text-emerald-600 dark:text-emerald-400 px-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold uppercase">Pronta para decisão</span>
        </div>
      )}
      {isVencendo && !isProntaParaDecisao && (
        <div className="flex items-center gap-1.5 mb-2 text-amber-600 dark:text-amber-400 px-1">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="text-[10px] font-semibold uppercase">Vencendo em breve</span>
        </div>
      )}
      
      <div className="flex items-start justify-between gap-3 mb-2 px-1">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            isProntaParaDecisao 
              ? 'bg-emerald-100 dark:bg-emerald-900/30' 
              : 'bg-teal-100 dark:bg-teal-900/30'
          )}>
            {isProntaParaDecisao ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <ClipboardList className="h-5 w-5 text-teal-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">
              <CapitalizedText>{cotacao.produtoResumo || cotacao.produto}</CapitalizedText>
            </p>
            <p className="text-xs text-muted-foreground">#{cotacaoNumero.toString().padStart(4, '0')}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2 px-1">
        <StatusSelect
          value={cotacao.status}
          options={QUOTE_STATUS_OPTIONS}
          onChange={(newStatus) => onUpdateStatus(cotacao.id, newStatus)}
          isLoading={isUpdating}
          disabled={cotacao.status === 'finalizada'}
        />
        <Badge variant="outline" className={cn(
          "text-xs",
          fornecedoresRespondidos === totalFornecedores && totalFornecedores > 0
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700'
            : ''
        )}>
          <Building2 className="h-3 w-3 mr-1" />{fornecedoresRespondidos}/{totalFornecedores}
        </Badge>
      </div>

      <div className="flex justify-between text-xs px-1 mb-2">
        <span className="text-muted-foreground flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          Melhor: <span className="font-semibold text-green-600 dark:text-green-400">{cotacao.melhorPreco || 'R$ 0,00'}</span>
        </span>
        <span className={cn(
          "flex items-center gap-1",
          isVencendo ? 'text-amber-600 font-semibold' : 'text-muted-foreground'
        )}>
          <Calendar className="h-3 w-3" />
          Fim: {cotacao.dataFim || '-'}
        </span>
      </div>

      {/* Expand/Collapse Button */}
      <CollapsibleTrigger asChild>
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700/30 text-xs text-muted-foreground active:bg-gray-100 dark:active:bg-gray-700/50 touch-target min-h-[44px] mt-2 rounded-b-lg"
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
        <div className="p-3 pt-0 space-y-3 border-t border-gray-200 dark:border-gray-700/30 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="grid grid-cols-2 gap-2 pt-3">
            {(cotacao.status === "concluida" || cotacao.status === "finalizada") ? (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-10 touch-target active:scale-95 transition-transform col-span-2"
                onClick={() => onView(cotacao)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Resumo
              </Button>
            ) : (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={cn(
                    "h-10 touch-target active:scale-95 transition-transform",
                    isProntaParaDecisao ? "col-span-1" : "col-span-2"
                  )}
                  onClick={() => onManage(cotacao)}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Negociar Cotação
                </Button>
                
                {isProntaParaDecisao && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-10 touch-target active:scale-95 transition-transform text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                    onClick={() => onManage(cotacao)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Converter
                  </Button>
                )}

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-10 touch-target text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 active:scale-95 transition-transform col-span-2"
                  onClick={() => onDelete(cotacao)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});