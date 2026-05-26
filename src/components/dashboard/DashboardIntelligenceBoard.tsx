import { memo } from 'react';
import { Trophy, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      <Card className="p-0">
        <div className="px-4 py-3 border-b border-border dark:border-white/5 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            Top Parceiros
          </span>
        </div>
        <CardContent className="p-0">
          {topSuppliers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              Dados insuficientes no período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Parceiro</TableHead>
                  <TableHead className="text-right">Vitórias</TableHead>
                  <TableHead className="text-right">Eco.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSuppliers.slice(0, 3).map((supplier, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <span className={cn(
                        "w-5 h-5 rounded-full inline-flex items-center justify-center text-[9px] font-bold text-white",
                        RANK_COLORS[idx] ?? "bg-muted-foreground"
                      )}>
                        {idx + 1}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      <CapitalizedText>{supplier.name}</CapitalizedText>
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-foreground">
                      {supplier.quotes}
                    </TableCell>
                    <TableCell className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {(supplier.economiaPercentual || 0).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Atividade Recente */}
      <Card className="p-0 flex flex-col lg:flex-1">
        <div className="px-4 py-3 border-b border-border dark:border-white/5 flex items-center justify-between">
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
        <CardContent className="p-0">
          {recentQuotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              Sem histórico recente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Melhor Preço</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQuotes.slice(0, 6).map((quote, idx) => {
                  const s = STATUS_CONFIG[quote.status?.toLowerCase()] ?? { dot: "bg-muted-foreground", label: "Atualizado" };
                  const hasPrice = quote.bestPrice && quote.bestPrice !== 'Sem ofertas';
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-[13px]">
                        <CapitalizedText>{quote.product}</CapitalizedText>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
                          {s.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {hasPrice ? quote.bestPrice : '—'}
                      </TableCell>
                      <TableCell className="text-right text-[11px] text-muted-foreground">
                        {quote.date}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

    </div>
  );
});
