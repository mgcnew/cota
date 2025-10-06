import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Package, DollarSign, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ConvertToOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: {
    id: string;
    produto: string;
    quantidade: string;
  };
  supplier: {
    id: string;
    name: string;
  };
  products: Array<{
    id: string;
    name: string;
    quantity: string;
    value: number;
  }>;
  totalValue: number;
  onConfirm: (deliveryDate: string, observations?: string) => void;
  isLoading?: boolean;
}

export default function ConvertToOrderDialog({
  open,
  onOpenChange,
  quote,
  supplier,
  products,
  totalValue,
  onConfirm,
  isLoading
}: ConvertToOrderDialogProps) {
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");

  const handleConfirm = () => {
    if (!deliveryDate) {
      return;
    }
    onConfirm(deliveryDate, observations);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 text-white shadow-lg">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-900 to-emerald-800 bg-clip-text text-transparent">
                Converter para Pedido
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Confirme os dados antes de criar o pedido
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quote Summary */}
          <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-blue-50/60 to-indigo-50/40">
            <div className="flex items-center gap-3 mb-3">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Cotação Selecionada</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium text-gray-600">Produto: </span>
                <span className="text-gray-900 font-semibold">{quote.produto}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-gray-600">Quantidade: </span>
                <span className="text-gray-900 font-semibold">{quote.quantidade}</span>
              </p>
            </div>
          </Card>

          {/* Supplier */}
          <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-green-50/60 to-emerald-50/40">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Fornecedor Selecionado</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600">Melhor Preço</Badge>
              <span className="font-semibold text-gray-900">{supplier.name}</span>
            </div>
          </Card>

          {/* Products Table */}
          <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-purple-50/60 to-pink-50/40">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Produtos e Valores</h3>
            </div>
            <div className="rounded-lg overflow-hidden border border-purple-200/60">
              <table className="w-full">
                <thead className="bg-purple-100/80">
                  <tr>
                    <th className="p-2 text-left text-sm font-semibold text-gray-700">Produto</th>
                    <th className="p-2 text-left text-sm font-semibold text-gray-700">Qtd</th>
                    <th className="p-2 text-right text-sm font-semibold text-gray-700">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white/80">
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-purple-100">
                      <td className="p-2 text-sm text-gray-900">{product.name}</td>
                      <td className="p-2 text-sm text-gray-700">{product.quantity}</td>
                      <td className="p-2 text-sm text-right font-semibold text-gray-900">
                        R$ {product.value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-green-100 to-emerald-100">
                  <tr>
                    <td colSpan={2} className="p-3 text-sm font-bold text-gray-900">
                      Valor Total do Pedido
                    </td>
                    <td className="p-3 text-right text-lg font-bold text-green-700">
                      R$ {totalValue.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Delivery Date Input */}
          <div className="space-y-2">
            <Label htmlFor="deliveryDate" className="flex items-center gap-2 font-semibold">
              <Calendar className="h-4 w-4 text-blue-600" />
              Data de Entrega *
            </Label>
            <Input
              id="deliveryDate"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={minDateString}
              required
              className="border-blue-200 focus:border-blue-400"
            />
            {!deliveryDate && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Campo obrigatório
              </p>
            )}
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observations" className="font-semibold">
              Observações Adicionais
            </Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Adicione informações relevantes sobre o pedido..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!deliveryDate || isLoading}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Criando Pedido...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar e Criar Pedido
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
