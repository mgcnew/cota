import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Building2, Package, DollarSign, ShoppingCart, Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { CapitalizedText } from "@/components/ui/capitalized-text";

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border border-white/20 dark:border-white/10 shadow-2xl rounded-xl !bg-white/80 dark:!bg-gray-950/80 backdrop-blur-xl [&>button]:hidden">
        <DialogHeader className="px-6 py-4 border-b border-white/10 dark:border-white/5 bg-white/20 dark:bg-white/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Converter em Múltiplos Pedidos
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Serão criados {orders.length} pedidos individuais
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-all">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="bg-blue-500/10 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 backdrop-blur-md shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                <strong>Atenção:</strong> Serão criados <strong>{orders.length}</strong> pedido(s) diferentes, 
                um para cada fornecedor selecionado.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {orders.map((order, index) => (
              <Card key={order.supplierId} className="p-0 border border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md shadow-sm rounded-xl overflow-hidden group hover:border-blue-500/30 transition-all">
                <div className="bg-white/10 dark:bg-white/5 px-5 py-4 border-b border-white/10 dark:border-white/5">
                  {/* Cabeçalho do Fornecedor */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform">
                        <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate tracking-tight">
                          Pedido {index + 1} • <CapitalizedText as="span">{order.supplierName}</CapitalizedText>
                        </h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          {order.products.length} produto(s) adicionados
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">Valor do Pedido</p>
                      <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                        R$ {order.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  {/* Lista de Produtos */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest opacity-70">
                      <Package className="h-3.5 w-3.5" />
                      Itens do Pedido
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {order.products.map(product => (
                        <div
                          key={product.productId}
                          className="flex items-center justify-between p-3 bg-white/20 dark:bg-gray-950/20 border border-white/5 rounded-xl group/item hover:bg-white/30 transition-all"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">
                              {product.productName}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                              Quantidade: {product.quantity}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-black text-gray-900 dark:text-white">
                              R$ {product.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Data de Entrega */}
                    <div className="space-y-2">
                      <Label htmlFor={`delivery-${order.supplierId}`} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        Data de Entrega *
                      </Label>
                      <Input
                        id={`delivery-${order.supplierId}`}
                        type="date"
                        value={order.deliveryDate}
                        onChange={(e) => handleDeliveryDateChange(order.supplierId, e.target.value)}
                        className="h-10 bg-white/40 dark:bg-gray-950/40 border-white/20 dark:border-white/10 font-bold text-sm focus:ring-blue-500/20"
                        required
                      />
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                      <Label htmlFor={`obs-${order.supplierId}`} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                        Observações (opcional)
                      </Label>
                      <Textarea
                        id={`obs-${order.supplierId}`}
                        value={order.observations}
                        onChange={(e) => handleObservationsChange(order.supplierId, e.target.value)}
                        placeholder="Observações para este pedido..."
                        className="min-h-[40px] h-10 bg-white/40 dark:bg-gray-950/40 border-white/20 dark:border-white/10 font-medium text-sm focus:ring-blue-500/20 transition-all focus:h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Resumo Final */}
          <div className="p-6 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 dark:from-emerald-600/10 dark:to-teal-600/5 rounded-2xl border border-emerald-500/20 backdrop-blur-md shadow-lg shadow-emerald-500/5 mt-8">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Valor Total de Todos os Pedidos</p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/50 font-bold uppercase tracking-tighter">
                    Consolidado de {orders.length} pedidos individuais
                  </p>
                </div>
              </div>
              <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 dark:border-white/5 bg-white/20 dark:bg-gray-950/20 backdrop-blur-md">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="h-11 px-6 border-white/20 dark:border-white/10 bg-transparent font-bold text-xs uppercase tracking-widest hover:bg-white/10 dark:hover:bg-white/5 transition-all"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="h-11 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Criando pedidos...
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Criar {orders.length} Pedido(s)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
