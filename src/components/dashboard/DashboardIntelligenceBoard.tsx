import { memo } from 'react';
import { Trophy, History } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CapitalizedText } from '@/components/ui/capitalized-text';

interface SupplierStats {
  name: string;
  quotes: number;
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

const STATUS_CONFIG: Record<string, { dot: string; label: string }> = {
  ativa:      { dot: "bg-blue-500",    label: "Em andamento" },
  planejada:  { dot: "bg-purple-500",  label: "Planejada"    },
  finalizada: { dot: "bg-emerald-500", label: "Finalizada"   },
  concluida:  { dot: "bg-emerald-500", label: "Concluída"    },
  pendente:   { dot: "bg-amber-500",   label: "Pendente"     },
};

const RANK_COLORS = ["bg-amber-400", "bg-zinc-400", "bg-orange-600/70"];

export const DashboardIntelligenceBoard = memo(({
  topSuppliers,
  recentQuotes,
  onViewAllActivities,
}: DashboardIntelligenceBoardProps) => {

  return (
    <div className="flex flex-col gap-4 lg:h-full">

      {/* Top Parceiros */}
      <Card className="bg-card border border-border rounded-lg shadow-sm flex flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Top Parceiros
          </span>
        </div>

        <div className="p-3 space-y-0">
          {topSuppliers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Dados insuficientes no período.
            </p>
          ) : (
            topSuppliers.slice(0, 3).map((supplier, idx) => (
              <div key={idx} className="flex items-center gap-2.5 px-1 py-2.5 hover:bg-accent/50 rounded-md transition-colors">
                <span className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0",
                  RANK_COLORS[idx] ?? "bg-zinc-300"
                )}>
                  {idx + 1}
                </span>
                <p className="text-[13px] font-medium text-foreground truncate flex-1">
                  <CapitalizedText>{supplier.name}</CapitalizedText>
                </p>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-foreground">{supplier.quotes} vitórias</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {(supplier.economiaPercentual || 0).toFixed(1)}% eco.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Radar de Operações */}
      <Card className="bg-card border border-border rounded-lg shadow-sm flex flex-col lg:flex-1">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-muted-foreground" />
            Atividade Recente
          </span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs text-brand font-medium"
            onClick={onViewAllActivities}
          >
            Ver todas
          </Button>
        </div>

        <div className="p-3 space-y-0">
          {recentQuotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Sem histórico recente.
            </p>
          ) : (
            recentQuotes.slice(0, 6).map((quote, idx) => {
              const s = STATUS_CONFIG[quote.status?.toLowerCase()] ?? { dot: "bg-zinc-400", label: "Atualizado" };
              const hasPrice = quote.bestPrice && quote.bestPrice !== 'Sem ofertas';

              return (
                <div key={idx} className="flex items-center gap-2.5 px-1 py-2 hover:bg-accent/50 rounded-md transition-colors">
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0 mt-px", s.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate leading-none">
                      <CapitalizedText>{quote.product}</CapitalizedText>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.label}{quote.supplier ? ` · ${quote.supplier}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {hasPrice && (
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {quote.bestPrice}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">{quote.date}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

    </div>
  );
});
