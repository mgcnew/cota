import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ViewPedidoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedido: any;
}

export default function ViewPedidoDialog({ open, onOpenChange, pedido }: ViewPedidoDialogProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "outline",
      processando: "default",
      confirmado: "secondary", 
      entregue: "secondary",
      cancelado: "destructive"
    };
    
    const labels = {
      pendente: "Pendente",
      processando: "Processando",
      confirmado: "Confirmado",
      entregue: "Entregue",
      cancelado: "Cancelado"
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Detalhes do Pedido {pedido?.id}</DialogTitle>
            {pedido && getStatusBadge(pedido.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Fornecedor</p>
              <p className="font-medium">{pedido?.fornecedor}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-medium text-lg">{pedido?.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data do Pedido</p>
              <p className="font-medium">{pedido?.dataPedido}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Entrega</p>
              <p className="font-medium">{pedido?.dataEntrega}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Itens do Pedido</h3>
            {pedido?.detalhesItens ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedido.detalhesItens.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.produto}</TableCell>
                      <TableCell className="text-right">{item.quantidade}</TableCell>
                      <TableCell className="text-right">
                        R$ {item.valorUnitario.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {(item.quantidade * item.valorUnitario).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="space-y-2">
                {pedido?.produtos.map((produto: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="text-sm">{index + 1}.</span>
                    <span>{produto}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {pedido?.observacoes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Observações</h3>
                <p className="text-sm text-muted-foreground">{pedido.observacoes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
