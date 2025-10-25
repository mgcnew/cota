import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Building2, Package, DollarSign, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export interface SupplierOrderProduct {
  productId: string;
  productName: string;
  quantity: string;
  value: number;
}

export interface SupplierOrder {
  supplierId: string;
  supplierName: string;
  products: SupplierOrderProduct[];
  totalValue: number;
  deliveryDate: string;
  observations: string;
}

interface ConvertToMultipleOrdersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierOrders: SupplierOrder[];
  onConfirm: (orders: SupplierOrder[]) => void;
  isLoading?: boolean;
}

export default function ConvertToMultipleOrdersDialog({
  open,
  onOpenChange,
  supplierOrders,
  onConfirm,
  isLoading
}: ConvertToMultipleOrdersDialogProps) {
  const [orders, setOrders] = useState<SupplierOrder[]>(supplierOrders);

  // Sincronizar state interno quando supplierOrders mudar
  useEffect(() => {
    if (open && supplierOrders.length > 0) {
      console.log('📦 Atualizando orders com', supplierOrders.length, 'fornecedores');
      setOrders(supplierOrders);
    }
  }, [open, supplierOrders]);

  const handleDeliveryDateChange = (supplierId: string, date: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.supplierId === supplierId
          ? { ...order, deliveryDate: date }
          : order
      )
    );
  };

  const handleObservationsChange = (supplierId: string, observations: string) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.supplierId === supplierId
          ? { ...order, observations }
          : order
      )
    );
  };

  const handleConfirm = () => {
    // Validar que todas as datas estão preenchidas
    const missingDates = orders.filter(order => !order.deliveryDate);
    if (missingDates.length > 0) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha a data de entrega para todos os fornecedores.",
        variant: "destructive"
      });
      return;
    }

    onConfirm(orders);
  };

  const totalGeral = orders.reduce((sum, order) => sum + order.totalValue, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Converter em Múltiplos Pedidos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Atenção:</strong> Serão criados <strong>{orders.length}</strong> pedido(s) diferentes, 
              um para cada fornecedor selecionado.
            </p>
          </div>

          {orders.map((order, index) => (
            <Card key={order.supplierId} className="p-4 border-2 border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                {/* Cabeçalho do Fornecedor */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        Pedido {index + 1} - {order.supplierName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {order.products.length} produto(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Valor Total</p>
                    <p className="text-2xl font-bold text-blue-600">
                      R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Lista de Produtos */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Package className="h-4 w-4" />
                    Produtos
                  </div>
                  <div className="space-y-1">
                    {order.products.map(product => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.productName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Quantidade: {product.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            R$ {product.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Data de Entrega */}
                <div className="space-y-2">
                  <Label htmlFor={`delivery-${order.supplierId}`} className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Entrega *
                  </Label>
                  <Input
                    id={`delivery-${order.supplierId}`}
                    type="date"
                    value={order.deliveryDate}
                    onChange={(e) => handleDeliveryDateChange(order.supplierId, e.target.value)}
                    className="w-full"
                    required
                  />
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor={`obs-${order.supplierId}`}>
                    Observações (opcional)
                  </Label>
                  <Textarea
                    id={`obs-${order.supplierId}`}
                    value={order.observations}
                    onChange={(e) => handleObservationsChange(order.supplierId, e.target.value)}
                    placeholder="Adicione observações para este pedido..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </Card>
          ))}

          {/* Resumo Final */}
          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/10 border-2 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total Geral</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Soma de todos os {orders.length} pedidos
                  </p>
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </Card>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Criando pedidos..." : `Criar ${orders.length} Pedido(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
