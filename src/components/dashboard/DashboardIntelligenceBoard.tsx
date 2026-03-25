import { memo } from 'react';
import { Trophy, TrendingUp, History, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { designSystem } from '@/styles/design-system';
import { cn } from '@/lib/utils';
import { CapitalizedText } from '@/components/ui/capitalized-text';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SupplierStats {
  name: string;
  quotes: number; // total wins
  economiaPercentual?: number;
}

interface ActivityItem {
  id: string;
  product?: string;
  supplier?: string;
  bestPrice?: string;
  status: string;
  date: string;
  offers?: { supplier: string; price: number }[];
}

interface DashboardIntelligenceBoardProps {
  topSuppliers: SupplierStats[];
  recentQuotes: ActivityItem[];
  onViewAllActivities: () => void;
}

export const DashboardIntelligenceBoard = memo(({ 
  topSuppliers, 
  recentQuotes, 
  onViewAllActivities 
}: DashboardIntelligenceBoardProps) => {

  const processStatus = (status: string) => {
    switch(status.toLowerCase()) {
      case 'ativa': return { color: "bg-blue-500", label: "Cotação em andamento" };
      case 'planejada': return { color: "bg-purple-500", label: "Cotação planejada" };
      case 'finalizada': 
      case 'concluida': return { color: "bg-emerald-500", label: "Cotação finalizada" };
      case 'pendente': return { color: "bg-amber-500", label: "Aguardando fornecedores" };
      default: return { color: "bg-zinc-400", label: "Atualização de status" };
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 1. Ranking de Parceiros */}
      <Card className={cn(designSystem.components.card.root, "flex flex-col")}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className={cn(designSystem.typography.size.sm, designSystem.typography.weight.bold, "flex items-center gap-2")}>
            <Trophy className="w-4 h-4 text-amber-500" />
            Top Parceiros do Mês
          </h2>
          <TrendingUp className="w-4 h-4 text-muted-foreground opacity-50" />
        </div>
        <div className="p-4 space-y-4">
          {topSuppliers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Dados insuficientes no período.</p>
          ) : (
            topSuppliers.slice(0, 3).map((supplier, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                      idx === 0 ? "bg-amber-500 shadow-sm" : idx === 1 ? "bg-zinc-400" : "bg-orange-700/60"
                    )}>
                      {idx + 1}
                    </span>
                    <p className={cn(designSystem.typography.size.sm, designSystem.typography.weight.semibold, "truncate max-w-[120px]")}>
                      <CapitalizedText>{supplier.name}</CapitalizedText>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(designSystem.typography.size.sm, designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
                      {supplier.quotes} vitórias
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={cn(designSystem.typography.size.xs, designSystem.colors.text.muted)}>
                    Economia média gerada
                  </span>
                  <span className={cn(designSystem.typography.size.xs, designSystem.typography.weight.bold, "text-emerald-500")}>
                    {(supplier.economiaPercentual || 0).toFixed(1)}%
                  </span>
                </div>
                
                {idx < Math.min(topSuppliers.length, 3) - 1 && (
                  <div className="border-t border-border/50 my-1" />
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 2. Resumo de Atividades Recentes */}
      <Card className={cn(designSystem.components.card.root, "flex flex-col flex-1")}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className={cn(designSystem.typography.size.sm, designSystem.typography.weight.bold, "flex items-center gap-2")}>
            <History className="w-4 h-4 text-zinc-400" />
            Radar de Operações
          </h2>
          <Button 
            variant="link" 
            className="text-primary p-0 h-auto text-xs"
            onClick={onViewAllActivities}
          >
            Ver todas
          </Button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto max-h-[290px] custom-scrollbar relative pl-6">
          {/* Vertical line connecting timeline dots */}
          <div className="absolute left-[21px] top-6 bottom-6 w-px bg-border/40 z-0" />

          <div className="space-y-5 relative z-10">
            {recentQuotes.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Sem histórico recente.</p>
            ) : (
              recentQuotes.slice(0, 4).map((quote, idx) => {
                const badge = processStatus(quote.status);
                
                return (
                  <div key={idx} className="flex gap-3 sm:gap-4 group">
                    {/* Dot - Visible on all screens now but carefully positioned */}
                    <div className="relative mt-2 flex items-center justify-center shrink-0 w-[8px] h-[8px] z-20">
                      <div className={cn("absolute w-3 h-3 rounded-full border-2 border-background shadow-sm", badge.color)} />
                    </div>
                    
                    <div className="flex-1 border bg-muted/20 border-border/50 rounded-lg p-3.5 group-hover:bg-muted/40 transition-colors shadow-sm min-w-0">
                      <div className="flex flex-wrap items-center justify-between mb-2 gap-2">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider", quote.status === 'ativa' ? 'text-blue-500' : quote.status === 'finalizada' ? 'text-emerald-500' : 'text-zinc-500')}>
                          {badge.label}
                        </span>
                        <span className={cn(designSystem.typography.size.xs, designSystem.colors.text.muted, "shrink-0 ml-auto")}>
                          {quote.date}
                        </span>
                      </div>
                      
                      <p className={cn(designSystem.typography.size.sm, designSystem.typography.weight.bold, designSystem.colors.text.primary, "truncate")}>
                        <CapitalizedText>{quote.product}</CapitalizedText>
                      </p>
                      
                      <div className={cn(designSystem.typography.size.xs, designSystem.colors.text.secondary, "mt-2 flex items-center justify-between gap-2")}>
                        <div className="flex-1 truncate flex items-center gap-2">
                          {quote.bestPrice !== 'Sem ofertas' ? (
                            <>
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                {quote.bestPrice}
                              </span>
                              <span className="text-muted-foreground truncate max-w-[120px] hidden sm:inline">
                                com {quote.supplier}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">Aguardando ofertas...</span>
                          )}
                        </div>
                        
                        {quote.offers && quote.offers.length > 0 && (
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className="p-2 rounded-full hover:bg-muted/80 text-primary cursor-help transition-colors border border-primary/20 bg-primary/5 shrink-0">
                                  <Info className="h-4 w-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top" align="end" className="p-0 border-border shadow-2xl min-w-[200px] overflow-hidden">
                                <div className="px-3 py-2 border-b border-border bg-emerald-500/5">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Comparativo Global</p>
                                </div>
                                <div className="p-1.5 space-y-0.5">
                                  {quote.offers.map((offer, i) => (
                                    <div key={i} className={cn("flex items-center justify-between gap-4 px-2 py-1.5 rounded-md text-[11px]", i === 0 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm" : "text-muted-foreground hover:bg-muted/30")}>
                                      <span className="truncate max-w-[130px]">{offer.supplier}</span>
                                      <span className="font-mono tabular-nums">R$ {offer.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                  ))}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Card>
    </div>
  );
});
