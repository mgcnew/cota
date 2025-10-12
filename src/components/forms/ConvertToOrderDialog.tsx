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
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-4 p-1">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-violet-600 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-violet-700 text-white shadow-2xl border border-white/20">
                <CheckCircle2 className="h-7 w-7 drop-shadow-lg" />
              </div>
            </div>
            <div className="flex-1">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-700 to-violet-800 bg-clip-text text-transparent drop-shadow-sm">
                Converter para Pedido
              </DialogTitle>
              <p className="text-sm text-slate-600 mt-1 font-medium">
                Confirme os dados antes de criar o pedido
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quote Summary */}
          <Card className="relative p-5 border-0 shadow-2xl bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 border border-cyan-200/50 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-blue-400/10 to-indigo-400/10"></div>
            <div className="relative flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg border border-white/20">
                <Package className="h-6 w-6 drop-shadow-sm" />
              </div>
              <h3 className="font-bold text-lg bg-gradient-to-r from-cyan-700 to-blue-800 bg-clip-text text-transparent">Cotação Selecionada</h3>
            </div>
            <div className="relative space-y-3">
              <p className="text-sm">
                <span className="font-medium text-slate-600">Produto: </span>
                <span className="text-slate-900 font-bold">{quote.produto}</span>
              </p>
              <p className="text-sm">
                <span className="font-medium text-slate-600">Quantidade: </span>
                <span className="text-slate-900 font-bold">{quote.quantidade}</span>
              </p>
            </div>
          </Card>

          {/* Supplier */}
          <Card className="relative p-5 border-0 shadow-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 border border-emerald-200/50 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-teal-400/10 to-green-400/10"></div>
            <div className="relative flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg border border-white/20">
                <Building2 className="h-6 w-6 drop-shadow-sm" />
              </div>
              <h3 className="font-bold text-lg bg-gradient-to-r from-emerald-700 to-teal-800 bg-clip-text text-transparent">Fornecedor Selecionado</h3>
            </div>
            <div className="relative flex items-center gap-3">
              <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border border-white/20 px-3 py-1 font-semibold">✨ Melhor Preço</Badge>
              <span className="font-bold text-slate-900 text-lg">{supplier.name}</span>
            </div>
          </Card>

          {/* Products Table */}
          <Card className="relative p-5 border-0 shadow-2xl bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-100 border border-purple-200/50 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-fuchsia-400/10 to-pink-400/10"></div>
            <div className="relative flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg border border-white/20">
                <DollarSign className="h-6 w-6 drop-shadow-sm" />
              </div>
              <h3 className="font-bold text-lg bg-gradient-to-r from-purple-700 to-fuchsia-800 bg-clip-text text-transparent">Produtos e Valores</h3>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-purple-300/60 shadow-lg">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-100 to-fuchsia-100 border-b border-purple-200">
                  <tr>
                    <th className="p-3 text-left text-sm font-bold text-purple-800">Produto</th>
                    <th className="p-3 text-left text-sm font-bold text-purple-800">Qtd</th>
                    <th className="p-3 text-right text-sm font-bold text-purple-800">Valor</th>
                  </tr>
                </thead>
                <tbody className="bg-white/90 backdrop-blur-sm">
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-purple-200/60 hover:bg-purple-50/50 transition-colors">
                      <td className="p-3 text-sm text-slate-700 font-medium">{product.name}</td>
                      <td className="p-3 text-sm text-slate-700 font-medium">{product.quantity}</td>
                      <td className="p-3 text-sm text-right font-bold text-slate-900">
                        R$ {product.value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-purple-100 to-fuchsia-100">
                  <tr className="border-t-2 border-purple-300">
                    <td colSpan={2} className="p-3 text-sm font-bold text-purple-900">
                      💰 Valor Total do Pedido
                    </td>
                    <td className="p-3 text-right text-lg font-black text-purple-800">
                      R$ {totalValue.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Delivery Date Input */}
          <Card className="relative p-5 border-0 shadow-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-100 border border-orange-200/50 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 via-amber-400/10 to-yellow-400/10"></div>
            <div className="relative flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg border border-white/20">
                <Calendar className="h-6 w-6 drop-shadow-sm" />
              </div>
              <h3 className="font-bold text-lg bg-gradient-to-r from-orange-700 to-amber-800 bg-clip-text text-transparent">📅 Data de Entrega</h3>
            </div>
            <div className="relative">
              <Input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                min={minDateString}
                className="w-full border-2 border-orange-300/60 focus:border-orange-500 focus:ring-orange-400 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg font-semibold text-slate-800 p-3"
                required
              />
              {!deliveryDate && (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                  <AlertCircle className="h-3 w-3" />
                  Campo obrigatório
                </p>
              )}
            </div>
          </Card>

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

        <DialogFooter className="flex gap-4 pt-8 bg-gradient-to-r from-slate-50 to-gray-50 rounded-b-2xl p-6 border-t border-gray-200/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 hover:border-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            ❌ Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!deliveryDate || isLoading}
            className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02] border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            onClick={handleConfirm}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                ⚡ Criando...
              </>
            ) : (
              '✨ Confirmar e Criar Pedido'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
