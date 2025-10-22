import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, Building2, Calendar, DollarSign, Truck, FileText, Clock, MapPin, Phone, User, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-4 py-3 border-b bg-card flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <ShoppingCart className="h-4 w-4 text-primary flex-shrink-0" />
              <DialogTitle className="text-base font-semibold truncate">Pedido #{pedido?.id}</DialogTitle>
            </div>
            {pedido && getStatusBadge(pedido.status)}
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full overflow-hidden">
          <Tabs defaultValue="detalhes" className="w-full flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-3 m-3 mb-0">
              <TabsTrigger value="detalhes" className="text-xs">Detalhes</TabsTrigger>
              <TabsTrigger value="itens" className="text-xs">Itens</TabsTrigger>
              <TabsTrigger value="entrega" className="text-xs">Entrega</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
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

            <TabsContent value="itens" className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
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
                            <td className="p-2 text-right">{item.quantidade}</td>
                            <td className="p-2 text-right">R$ {item.valorUnitario.toFixed(2)}</td>
                            <td className="p-2 text-right font-semibold">
                              R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
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

            <TabsContent value="entrega" className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2 mb-2">
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

          <div className="px-3 py-2 border-t bg-card flex-shrink-0 flex justify-end gap-2">
            <Button onClick={() => setOpen(false)} size="sm" className="text-xs">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}