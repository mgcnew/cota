import { memo } from 'react';
import { ClipboardList, ShoppingCart, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ActivityItem {
  id: string;
  product?: string;
  supplier?: string;
  bestPrice?: string;
  status: string;
  items?: number;
  total?: string;
}

interface DashboardActivitiesProps {
  recentQuotes: ActivityItem[];
  recentOrders: ActivityItem[];
  onViewAll: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  finalizada: 'bg-emerald-500',
  concluida:  'bg-emerald-500',
  entregue:   'bg-emerald-500',
  ativa:      'bg-blue-500',
  pendente:   'bg-amber-500',
  confirmado: 'bg-blue-500',
};

export const DashboardActivities = memo(({ recentQuotes, recentOrders, onViewAll }: DashboardActivitiesProps) => {
  return (
    <Card className="p-0 h-full flex flex-col shadow-sm">

      {/* Header */}
      <div className="px-4 py-3 border-b border-border dark:border-white/5 flex-shrink-0 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <div className="p-1.5 bg-muted rounded-md">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          Últimas Atividades
        </h2>
        <button
          onClick={onViewAll}
          className="text-xs text-primary font-medium hover:underline transition-smooth"
        >
          Ver todas
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* Cotações Recentes */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
          <ClipboardList className="w-3 h-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Cotações Recentes
          </span>
        </div>
        <CardContent className="p-0">
          {recentQuotes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 px-4">Nenhuma cotação recente</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Melhor Preço</TableHead>
                  <TableHead className="w-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentQuotes.slice(0, 4).map((quote) => (
                  <TableRow key={`q-${quote.id}`}>
                    <TableCell className="font-medium text-[13px]">{quote.product}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{quote.supplier}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {quote.bestPrice || '—'}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "w-2 h-2 rounded-full block mx-auto",
                        STATUS_COLORS[quote.status] || 'bg-muted-foreground'
                      )} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Divisor */}
        <div className="border-t border-border dark:border-white/5 mx-0 my-1" />

        {/* Pedidos Recentes */}
        <div className="px-4 pt-3 pb-1 flex items-center gap-1.5">
          <ShoppingCart className="w-3 h-3 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pedidos Recentes
          </span>
        </div>
        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4 px-4">Nenhum pedido recente</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.slice(0, 4).map((order) => (
                  <TableRow key={`o-${order.id}`}>
                    <TableCell className="font-medium text-[13px]">{order.supplier}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{order.items}</TableCell>
                    <TableCell className="text-right text-xs font-semibold text-foreground">
                      {order.total || '—'}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "w-2 h-2 rounded-full block mx-auto",
                        STATUS_COLORS[order.status] || 'bg-muted-foreground'
                      )} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

      </div>
    </Card>
  );
});
