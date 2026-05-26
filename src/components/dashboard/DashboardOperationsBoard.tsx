import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Truck, AlertCircle, ShoppingCart, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { designSystem as ds } from '@/styles/design-system';
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
    <Card className={cn(ds.components.card.root, "h-full flex flex-col")}>
      <Tabs value={tab} onValueChange={setTab} className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger 
              value="quotes" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Cotações Ativas
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              <Truck className="h-4 w-4 mr-2" />
              Entregas Pendentes
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <TabsContent value="quotes" className="m-0 space-y-3">
            {activeQuotes.length === 0 ? (
              <div className="text-center py-10">
                <ClipboardList className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>
                  Nenhuma cotação ativa.
                </p>
                <Button 
                  variant="link" 
                  className="mt-2 text-brand px-0"
                  onClick={() => navigate('/dashboard/compras?tab=cotacoes')}
                >
                  Criar Cotação
                </Button>
              </div>
            ) : (
              activeQuotes.map(quote => (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border/60 hover:border-brand/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-1.5 bg-brand/10 text-brand rounded-md shrink-0">
                        <ClipboardList className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary, "truncate")}>
                          <CapitalizedText>{quote.produtoResumo || quote.produto}</CapitalizedText>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(ds.typography.size.xs, ds.colors.text.muted)}>
                            {quote.dataFim}
                          </span>
                          <span className={cn(ds.typography.size.xs, ds.colors.text.muted)}>·</span>
                          <span className={cn(ds.typography.size.xs, ds.colors.text.muted)}>
                            {quote.fornecedores} resp.
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, "text-emerald-500")}>
                          {quote.melhorPreco || '—'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => navigate(`/dashboard/compras?tab=cotacoes&manageQuote=${quote.id}`)}
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="orders" className="m-0 space-y-3">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-10">
                <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>
                  Nenhuma entrega pendente.
                </p>
                <Button 
                  variant="link" 
                  className="mt-2 text-brand px-0"
                  onClick={() => navigate('/dashboard/compras?tab=pedidos')}
                >
                  Ver histórico
                </Button>
              </div>
            ) : (
              pendingOrders.map(order => (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card border border-border/60 hover:border-blue-500/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-md shrink-0">
                        <Truck className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn(ds.typography.size.sm, ds.typography.weight.bold, ds.colors.text.primary, "truncate")}>
                          <CapitalizedText>{order.supplier_name}</CapitalizedText>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(ds.typography.size.xs, ds.colors.text.muted)}>
                            {new Date(order.order_date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className={cn(ds.typography.size.xs, ds.colors.text.muted)}>·</span>
                          <span className={cn(ds.typography.size.xs, ds.colors.text.muted)}>
                            {order.items?.length || 0} itens
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className={cn(ds.typography.size.xs, ds.typography.weight.bold, ds.colors.text.primary)}>
                          R$ {order.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
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
