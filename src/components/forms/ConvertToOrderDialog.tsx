import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Package, DollarSign, Building2, CheckCircle2, AlertCircle, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CapitalizedText } from "@/components/ui/capitalized-text";

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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600 dark:bg-blue-500 text-white">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Converter para Pedido
              </DialogTitle>
              <p className="text-xs text-slate-600 dark:text-gray-400 mt-0.5">
                Confirme os dados antes de criar o pedido
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 max-h-[calc(90vh-180px)] overflow-y-auto">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Supplier Info */}
            <Card className="p-3 border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Fornecedor</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 dark:bg-emerald-500 text-white text-xs">Melhor Preço</Badge>
                <CapitalizedText className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {supplier.name}
                </CapitalizedText>
              </div>
            </Card>

            {/* Total Value */}
            <Card className="p-3 border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">Valor Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">R$ {totalValue.toFixed(2)}</p>
            </Card>
          </div>

          {/* Products Table */}
          <Card className="border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-600 dark:text-gray-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Produtos ({products.length})</h3>
              </div>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-gray-800/50 sticky top-0">
                  <tr className="border-b border-slate-200 dark:border-gray-700">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-gray-300">Produto</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-gray-300">Qtd</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-slate-700 dark:text-gray-300">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-3 py-2 text-sm text-slate-900 dark:text-white font-medium">{product.name}</td>
                      <td className="px-3 py-2 text-sm text-slate-600 dark:text-gray-400">{product.quantity}</td>
                      <td className="px-3 py-2 text-sm text-right font-bold text-slate-900 dark:text-white">
                        R$ {product.value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Delivery Date Input */}
          <div className="space-y-2">
            <Label htmlFor="delivery-date" className="text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data de Entrega
            </Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={minDateString}
              className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-700"
              required
            />
            {!deliveryDate && (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Campo obrigatório
              </p>
            )}
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observations" className="text-sm font-semibold text-slate-700 dark:text-gray-300">
              Observações (opcional)
            </Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Adicione informações relevantes sobre o pedido..."
              rows={2}
              className="resize-none dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!deliveryDate || isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
            onClick={handleConfirm}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Criando...
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
