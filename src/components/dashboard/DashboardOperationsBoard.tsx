import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Truck, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    <Card className="p-0 h-full flex flex-col">
      <Tabs value={tab} onValueChange={setTab} className="h-full flex flex-col">

        {/* Header com tabs */}
        <div className="px-4 pt-3 pb-0 border-b border-border dark:border-white/5 shrink-0">
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
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          <TabsContent value="quotes" className="m-0">
            {activeQuotes.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                label="Nenhuma cotação ativa"
                action={{ label: "Criar cotação", onClick: () => navigate('/dashboard/compras?tab=cotacoes') }}
              />
            ) : (
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Vence</TableHead>
                      <TableHead className="text-right">Resp.</TableHead>
                      <TableHead className="text-right">Melhor Preço</TableHead>
                      <TableHead className="w-14" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeQuotes.map(quote => (
                      <TableRow key={quote.id} className="group">
                        <TableCell className="font-medium text-[13px]">
                          <CapitalizedText>{quote.produtoResumo || quote.produto}</CapitalizedText>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{quote.dataFim}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{quote.fornecedores}</TableCell>
                        <TableCell className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {quote.melhorPreco || '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => navigate(`/dashboard/compras?tab=cotacoes&manageQuote=${quote.id}`)}
                          >
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </TabsContent>

          <TabsContent value="orders" className="m-0">
            {pendingOrders.length === 0 ? (
              <EmptyState
                icon={Package}
                label="Nenhuma entrega pendente"
                action={{ label: "Ver histórico", onClick: () => navigate('/dashboard/compras?tab=pedidos') }}
              />
            ) : (
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Itens</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-14" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map(order => (
                      <TableRow key={order.id} className="group">
                        <TableCell className="font-medium text-[13px]">
                          <CapitalizedText>{order.supplier_name}</CapitalizedText>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(order.order_date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {order.items?.length || 0}
                        </TableCell>
                        <TableCell className="text-right text-xs font-semibold text-foreground">
                          R$ {order.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => navigate(`/dashboard/compras?tab=pedidos&receiveOrder=${order.id}`)}
                          >
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
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
