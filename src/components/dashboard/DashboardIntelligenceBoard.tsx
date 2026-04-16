import { memo } from 'react';
import { Trophy, TrendingUp, History, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { designSystem as ds } from '@/styles/design-system';
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
    <div className="flex flex-col gap-6 lg:h-full">
      {/* 1. Ranking de Parceiros */}
      <Card className={cn(ds.components.card.root, "flex flex-col")}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className={cn(ds.typography.size.sm, ds.typography.weight.bold, "flex items-center gap-2")}>
            <Trophy className="w-4 h-4 text-amber-500" />
            Top Parceiros do Mês
          </h2>
          <TrendingUp className="w-4 h-4 text-muted-foreground opacity-50" />
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          {topSuppliers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Dados insuficientes no período.</p>
          ) : (
            topSuppliers.slice(0, 5).map((supplier, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                      idx === 0 ? "bg-amber-500 shadow-sm" : idx === 1 ? "bg-zinc-400" : "bg-orange-700/60"
                    )}>
                      {idx + 1}
                    </span>
                    <p className={cn(ds.typography.size.sm, ds.typography.weight.semibold, "truncate max-w-[120px]")}>
                      <CapitalizedText>{supplier.name}</CapitalizedText>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary)}>
                      {supplier.quotes} vitórias
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={cn(ds.typography.size.xs, ds.colors.text.muted)}>
                    Economia média gerada
                  </span>
                  <span className={cn(ds.typography.size.xs, ds.typography.weight.bold, "text-emerald-500")}>
                    {(supplier.economiaPercentual || 0).toFixed(1)}%
                  </span>
                </div>
                
                {idx < Math.min(topSuppliers.length, 5) - 1 && (
                  <div className="border-t border-border/50 my-1" />
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* 2. Resumo de Atividades Recentes (Radar) */}
      <Card className={cn(ds.components.card.root, "flex flex-col lg:flex-1")}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className={cn(ds.typography.size.sm, ds.typography.weight.bold, "flex items-center gap-2")}>
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
        <div className="p-3 sm:p-4 space-y-4">
          {recentQuotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Sem histórico recente.</p>
          ) : (
            recentQuotes.slice(0, 6).map((quote, idx) => {
              const badge = processStatus(quote.status);
              
              return (
                <div key={idx} className="flex flex-col gap-1.5 group cursor-default">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", badge.color)} />
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.semibold, "truncate")}>
                        <CapitalizedText>{quote.product}</CapitalizedText>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, "text-emerald-500")}>
                        {quote.bestPrice !== 'Sem ofertas' ? quote.bestPrice : '---'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", 
                        quote.status === 'ativa' ? 'text-blue-500' : 
                        quote.status === 'finalizada' ? 'text-emerald-500' : 
                        'text-zinc-500'
                      )}>
                        {badge.label}
                      </span>
                      {quote.supplier && quote.bestPrice !== 'Sem ofertas' && (
                        <>
                          <span className="text-[10px] text-muted-foreground">•</span>
                          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                            {quote.supplier}
                          </span>
                        </>
                      )}
                    </div>
                    <span className={cn(ds.typography.size.xs, ds.colors.text.muted)}>
                      {quote.date}
                    </span>
                  </div>
                  
                  {idx < Math.min(recentQuotes.length, 6) - 1 && (
                    <div className="border-t border-border/50 my-1" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
});
