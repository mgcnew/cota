import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Truck, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CapitalizedText } from '@/components/ui/capitalized-text';

interface QuoteItem {
  id: string;
  produtoResumo?: string;
  produto?: string;
  dataFim: string;
  status: string;
  fornecedores?: string;
  melhorPreco?: string;
  statusReal?: string;
}

interface OrderItem {
  id: string;
  supplier_name: string;
  total_value: number;
  status: string;
  order_date: string;
  items?: any[];
}

interface DashboardOperationsBoardProps {
  activeQuotes: QuoteItem[];
  pendingOrders: OrderItem[];
}

export const DashboardOperationsBoard = memo(({ activeQuotes, pendingOrders }: DashboardOperationsBoardProps) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('quotes');

  return (
    <Card className="bg-card border border-border rounded-lg shadow-sm h-full flex flex-col">
      <Tabs value={tab} onValueChange={setTab} className="h-full flex flex-col">

        {/* Header com tabs */}
        <div className="px-4 pt-3 pb-0 border-b border-border shrink-0">
          <TabsList className="h-8 bg-transparent p-0 gap-4 w-full justify-start rounded-none border-none shadow-none">
            <TabsTrigger
              value="quotes"
              className="h-8 px-0 pb-2 text-xs font-semibold rounded-none border-b-2 border-transparent bg-transparent shadow-none
                         text-muted-foreground data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
              Cotações Ativas
              {activeQuotes.length > 0 && (
                <span className="ml-1.5 text-[10px] font-bold bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">
                  {activeQuotes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="h-8 px-0 pb-2 text-xs font-semibold rounded-none border-b-2 border-transparent bg-transparent shadow-none
                         text-muted-foreground data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <Truck className="h-3.5 w-3.5 mr-1.5" />
              Entregas Pendentes
              {pendingOrders.length > 0 && (
                <span className="ml-1.5 text-[10px] font-bold bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">

          <TabsContent value="quotes" className="m-0 space-y-1.5">
            {activeQuotes.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                label="Nenhuma cotação ativa"
                action={{ label: "Criar cotação", onClick: () => navigate('/dashboard/compras?tab=cotacoes') }}
              />
            ) : (
              activeQuotes.map(quote => (
                <div
                  key={quote.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors group"
                >
                  <div className="p-1.5 bg-brand/10 text-brand rounded-md shrink-0">
                    <ClipboardList className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate leading-none">
                      <CapitalizedText>{quote.produtoResumo || quote.produto}</CapitalizedText>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Vence {quote.dataFim} · {quote.fornecedores} resp.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2.5">
                    {quote.melhorPreco && (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hidden sm:block">
                        {quote.melhorPreco}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => navigate(`/dashboard/compras?tab=cotacoes&manageQuote=${quote.id}`)}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="orders" className="m-0 space-y-1.5">
            {pendingOrders.length === 0 ? (
              <EmptyState
                icon={Package}
                label="Nenhuma entrega pendente"
                action={{ label: "Ver histórico", onClick: () => navigate('/dashboard/compras?tab=pedidos') }}
              />
            ) : (
              pendingOrders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-accent/50 transition-colors group"
                >
                  <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md shrink-0">
                    <Truck className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-foreground truncate leading-none">
                      <CapitalizedText>{order.supplier_name}</CapitalizedText>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(order.order_date).toLocaleDateString('pt-BR')} · {order.items?.length || 0} itens
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-foreground hidden sm:block">
                      R$ {order.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => navigate(`/dashboard/compras?tab=pedidos&receiveOrder=${order.id}`)}
                    >
                      Ver
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

        </div>
      </Tabs>
    </Card>
  );
});

function EmptyState({
  icon: Icon,
  label,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/25 mb-2" />
      <p className="text-xs text-muted-foreground">{label}</p>
      {action && (
        <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs text-brand" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
