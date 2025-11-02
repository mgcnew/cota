import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Building2, Calendar, DollarSign, Truck, FileText, Clock, MapPin, Phone, User, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDecimalDisplay } from "@/lib/text-utils";
interface ViewPedidoDialogProps {
  pedido: any;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
export default function ViewPedidoDialog({ pedido, trigger, open: externalOpen, onOpenChange }: ViewPedidoDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const getStatusBadge = (status: string) => {
    const statusMap = {
      pendente: { variant: "outline" as const, label: "Pendente" },
      processando: { variant: "secondary" as const, label: "Processando" },
      confirmado: { variant: "default" as const, label: "Confirmado" },
      entregue: { variant: "default" as const, label: "Entregue" },
      cancelado: { variant: "destructive" as const, label: "Cancelado" }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pendente;
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  const formatCurrency = (value: string | number) => {
    if (typeof value === 'string') {
      // Se já está formatado, retorna como está
      if (value.includes('R$')) return value;
      // Se é um número em string, converte
      const num = parseFloat(value);
      return isNaN(num) ? value : `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    // Se já está formatado (dd/mm/yyyy), retorna como está
    if (dateString && dateString.includes('/')) {
      return dateString;
    }
    // Se não, tenta formatar
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString || '-';
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString || '-';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="w-[90vw] max-w-[520px] h-[85vh] max-h-[700px] overflow-hidden border-0 shadow-2xl rounded-2xl p-0 flex flex-col bg-white dark:bg-gray-900">
        <DialogHeader className="px-2 sm:px-4 py-2 sm:py-3 border-b bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
              <div className="p-1 sm:p-1.5 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm flex-shrink-0">
                <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <DialogTitle className="text-xs sm:text-sm font-semibold truncate">Pedido #{pedido?.id}</DialogTitle>
            </div>
            <div className="hidden sm:block">
              {pedido && getStatusBadge(pedido.status)}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          <Tabs defaultValue="detalhes" className="w-full flex flex-col h-full">
            <div className="px-2 sm:px-3 py-1.5 border-b bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-gray-800 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 rounded-lg p-0.5 shadow-sm border border-gray-200 dark:border-gray-700 h-8">
                <TabsTrigger value="detalhes" className="rounded-md text-[10px] sm:text-xs font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm px-1">
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="itens" className="rounded-md text-[10px] sm:text-xs font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm px-1">
                  Itens
                </TabsTrigger>
                <TabsTrigger value="entrega" className="rounded-md text-[10px] sm:text-xs font-medium transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm px-1">
                  Entrega
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="detalhes" className="flex-1 overflow-y-auto scrollbar-hide p-2 sm:p-4 space-y-2 sm:space-y-2.5">
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Fornecedor</p>
                    <p className="font-semibold text-xs truncate">{pedido?.fornecedor}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                  <DollarSign className="h-3.5 w-3.5 text-success flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Total</p>
                    <p className="font-semibold text-xs text-success truncate">{formatCurrency(pedido?.total)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Data Pedido</p>
                    <p className="font-semibold text-xs truncate">{formatDate(pedido?.dataPedido)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Entrega</p>
                    <p className="font-semibold text-xs truncate">{formatDate(pedido?.dataEntrega)}</p>
                  </div>
                </div>
              </div>

              {(pedido?.numeroNF || pedido?.responsavel || pedido?.formaPagamento) && (
                <div className="grid grid-cols-3 gap-2">
                  {pedido?.numeroNF && (
                    <div className="flex items-center gap-1.5 p-2 border rounded-lg bg-card">
                      <Hash className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">NF</p>
                        <p className="font-semibold text-xs truncate">{pedido.numeroNF}</p>
                      </div>
                    </div>
                  )}

                  {pedido?.responsavel && (
                    <div className="flex items-center gap-1.5 p-2 border rounded-lg bg-card">
                      <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">Responsável</p>
                        <p className="font-semibold text-xs truncate">{pedido.responsavel}</p>
                      </div>
                    </div>
                  )}

                  {pedido?.formaPagamento && (
                    <div className="flex items-center gap-1.5 p-2 border rounded-lg bg-card">
                      <DollarSign className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">Pagamento</p>
                        <p className="font-semibold text-xs truncate">{pedido.formaPagamento}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="itens" className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-1.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {pedido?.detalhesItens?.length || pedido?.produtos?.length || 0} item(s)
                </span>
              </div>

              {pedido?.detalhesItens ? (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="p-2 text-left font-medium">Produto</th>
                          <th className="p-2 text-right font-medium">Qtd</th>
                          <th className="p-2 text-right font-medium">Unit.</th>
                          <th className="p-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedido.detalhesItens.map((item: any, index: number) => (
                          <tr key={index} className="border-b last:border-0 hover:bg-muted/30">
                            <td className="p-2 font-medium">{item.produto}</td>
                            <td className="p-2 text-right">{formatDecimalDisplay(Number(item.quantidade))}</td>
                            <td className="p-2 text-right">R$ {Number(item.valorUnitario).toFixed(2)}</td>
                            <td className="p-2 text-right font-semibold">
                              R$ {(Number(item.quantidade) * Number(item.valorUnitario)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {pedido?.produtos?.map((produto: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                      <div className="w-5 h-5 rounded bg-primary/10 flex items-center justify-center text-primary font-semibold text-[10px] flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="text-xs font-medium truncate">{produto}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="entrega" className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-1.5">
              <div className="grid grid-cols-2 gap-2.5 mb-1.5">
                <div className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Data</p>
                    <p className="font-semibold text-xs truncate">{formatDate(pedido?.dataEntrega)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                  <Truck className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground">Status</p>
                    <div className="mt-0.5">{getStatusBadge(pedido?.status)}</div>
                  </div>
                </div>
              </div>

              {pedido?.enderecoEntrega && (
                <div className="p-2 border rounded-lg bg-card">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground">Endereço</span>
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <p className="font-medium">{pedido.enderecoEntrega.rua}</p>
                    {pedido.enderecoEntrega.numero && <p className="text-muted-foreground">Nº {pedido.enderecoEntrega.numero}</p>}
                    {pedido.enderecoEntrega.complemento && <p className="text-muted-foreground">{pedido.enderecoEntrega.complemento}</p>}
                    <p className="text-muted-foreground">{pedido.enderecoEntrega.bairro} - {pedido.enderecoEntrega.cidade}</p>
                    {pedido.enderecoEntrega.cep && <p className="text-muted-foreground">CEP: {pedido.enderecoEntrega.cep}</p>}
                  </div>
                </div>
              )}

              {(pedido?.contatoEntrega || pedido?.telefoneEntrega) && (
                <div className="grid grid-cols-2 gap-2">
                  {pedido?.contatoEntrega && (
                    <div className="flex items-center gap-1.5 p-2 border rounded-lg bg-card">
                      <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">Contato</p>
                        <p className="font-semibold text-xs truncate">{pedido.contatoEntrega}</p>
                      </div>
                    </div>
                  )}

                  {pedido?.telefoneEntrega && (
                    <div className="flex items-center gap-1.5 p-2 border rounded-lg bg-card">
                      <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">Telefone</p>
                        <p className="font-semibold text-xs truncate">{pedido.telefoneEntrega}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {pedido?.observacoes && (
                <div className="p-2 border rounded-lg bg-card">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground">Observações</span>
                  </div>
                  <p className="text-xs leading-relaxed">{pedido.observacoes}</p>
                </div>
              )}

              {pedido?.timelineEntrega && (
                <div className="p-2 border rounded-lg bg-card">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground">Timeline</span>
                  </div>
                  <div className="space-y-1.5">
                    {pedido.timelineEntrega.map((evento: any, index: number) => (
                      <div key={index} className="flex items-start gap-2 p-1.5 bg-muted/30 rounded">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs">{evento.evento}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(evento.data)} - {evento.hora}</p>
                          {evento.observacao && <p className="text-[10px] text-muted-foreground mt-0.5">{evento.observacao}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="px-4 py-2 border-t bg-gradient-to-r from-slate-50 to-gray-50 dark:from-gray-800 dark:to-gray-800 flex-shrink-0 flex justify-end">
            <Button 
              onClick={() => setOpen(false)} 
              size="sm" 
              variant="outline"
              className="text-xs h-8 px-4 font-medium"
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}