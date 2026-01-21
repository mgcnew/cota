import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, Package, Calendar, Building2, DollarSign, Truck, Clock, CheckCircle2 } from "lucide-react";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import type { PackagingOrderDisplay } from "@/types/packaging";
import { PACKAGING_ORDER_STATUS } from "@/types/packaging";
import { cn } from "@/lib/utils";

interface PackagingOrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PackagingOrderDisplay | null;
}

export function PackagingOrderDetailsDialog({ open, onOpenChange, order }: PackagingOrderDetailsDialogProps) {
  if (!order) return null;

  const statusConfig = PACKAGING_ORDER_STATUS.find(s => s.value === order.status);
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    green: "bg-emerald-100 text-emerald-700 border-emerald-200",
    red: "bg-red-100 text-red-700 border-red-200",
  };
  const IconComponent = order.status === "pendente" ? Clock : order.status === "confirmado" ? CheckCircle2 : order.status === "entregue" ? Truck : Clock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-purple-600" />
            Detalhes do Pedido
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info do pedido */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />Fornecedor</p>
              <CapitalizedText className="font-semibold">{order.supplierName}</CapitalizedText>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />Data do Pedido</p>
              <p className="font-semibold">{order.orderDate}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" />Previsão de Entrega</p>
              <p className="font-semibold">{order.deliveryDate || '-'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="outline" className={cn("text-xs", colorClasses[statusConfig?.color || ""] || "")}>
                <IconComponent className="h-3 w-3 mr-1" />
                {statusConfig?.label || order.status}
              </Badge>
            </div>
          </div>

          {/* Itens do pedido */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              Itens do Pedido ({order.itens.length})
            </h3>
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Embalagem</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.itens.map((item, index) => (
                    <TableRow key={item.id} className={index % 2 === 0 ? "bg-card" : "bg-muted/30"}>
                      <TableCell>
                        <CapitalizedText className="font-medium">{item.packagingName}</CapitalizedText>
                      </TableCell>
                      <TableCell className="text-center">{item.quantidade}</TableCell>
                      <TableCell className="text-center">{item.unidadeCompra || '-'}</TableCell>
                      <TableCell className="text-right">R$ {item.valorUnitario?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-right font-semibold">R$ {item.valorTotal?.toFixed(2) || '0.00'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Total do Pedido</p>
              <p className="text-2xl font-bold text-emerald-600 flex items-center gap-1">
                <DollarSign className="h-5 w-5" />
                R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Observações */}
          {order.observations && (
            <div className="p-4 bg-muted/30 rounded-xl">
              <p className="text-xs text-muted-foreground mb-1">Observações</p>
              <p className="text-sm">{order.observations}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
