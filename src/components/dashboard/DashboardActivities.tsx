import { memo } from 'react';
import { ClipboardList, ShoppingCart, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

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
  concluida: 'bg-emerald-500',
  entregue: 'bg-emerald-500',
  ativa: 'bg-blue-500',
  pendente: 'bg-amber-500',
  confirmado: 'bg-blue-500',
};

export const DashboardActivities = memo(({ recentQuotes, recentOrders, onViewAll }: DashboardActivitiesProps) => {
  return (
    <Card className="h-full border border-border bg-card shadow-sm flex flex-col transition-smooth hover:shadow-md">
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <div className="p-2 bg-zinc-500 dark:bg-zinc-600 rounded-lg shadow-sm">
              <Clock className="w-4 h-4 text-white" />
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
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {/* Seção de Cotações */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" /> Cotações Recentes
          </h3>
          <div className="space-y-2">
            {recentQuotes.slice(0, 4).map((quote) => (
              <div key={`q-${quote.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-smooth">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex-shrink-0">
                  <ClipboardList className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-foreground truncate" title={quote.product}>{quote.product}</p>
                  <p className="text-xs text-muted-foreground truncate" title={`${quote.supplier} • ${quote.bestPrice}`}>{quote.supplier} • {quote.bestPrice}</p>
                </div>
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", STATUS_COLORS[quote.status] || 'bg-muted-foreground')} />
              </div>
            ))}
            {recentQuotes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">Nenhuma cotação recente</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-3" />

        {/* Seção de Pedidos */}
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" /> Pedidos Recentes
          </h3>
          <div className="space-y-2">
            {recentOrders.slice(0, 4).map((order) => (
              <div key={`o-${order.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-smooth">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-foreground truncate" title={order.supplier}>{order.supplier}</p>
                  <p className="text-xs text-muted-foreground truncate" title={`${order.items} itens • ${order.total}`}>{order.items} itens • {order.total}</p>
                </div>
                <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", STATUS_COLORS[order.status] || 'bg-muted-foreground')} />
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">Nenhum pedido recente</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});
