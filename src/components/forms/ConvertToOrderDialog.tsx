import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Package, DollarSign, Building2, CheckCircle2, AlertCircle, ShoppingCart, Loader2, X } from "lucide-react";
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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden border border-white/20 dark:border-white/10 shadow-2xl rounded-xl !bg-white/80 dark:!bg-gray-950/80 backdrop-blur-xl [&>button]:hidden">
        <DialogHeader className="px-6 py-4 border-b border-white/10 dark:border-white/5 bg-white/20 dark:bg-white/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  Converter para Pedido
                </DialogTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Confirme os dados antes de criar o pedido
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-8 w-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-white/10 dark:hover:bg-white/5 rounded-full transition-all">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[calc(90vh-140px)] overflow-y-auto custom-scrollbar">
          {/* Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Supplier Info */}
            <Card className="p-4 border border-emerald-500/20 dark:border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-500/5 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider opacity-70">Fornecedor</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 dark:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-tighter px-1.5 py-0 h-4">Melhor Preço</Badge>
                </div>
                <CapitalizedText className="font-bold text-base text-gray-900 dark:text-white truncate">
                  {supplier.name}
                </CapitalizedText>
              </div>
            </Card>

            {/* Total Value */}
            <Card className="p-4 border border-blue-500/20 dark:border-blue-500/20 bg-blue-500/10 dark:bg-blue-500/5 backdrop-blur-md shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider opacity-70">Valor Total</span>
              </div>
              <p className="text-3xl font-black text-blue-900 dark:text-blue-100 tracking-tight">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </Card>
          </div>

          {/* Products Table */}
          <Card className="border border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-900/40 overflow-hidden backdrop-blur-md shadow-sm rounded-xl">
            <div className="px-4 py-2.5 border-b border-white/10 dark:border-white/5 bg-white/10 dark:bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider opacity-70">Produtos ({products.length})</h3>
              </div>
            </div>
            <div className="max-h-[220px] overflow-y-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead className="bg-white/5 dark:bg-white/5 sticky top-0 backdrop-blur-md z-10">
                  <tr className="border-b border-white/10 dark:border-white/5">
                    <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Produto</th>
                    <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Qtd</th>
                    <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 dark:divide-white/5">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-white/10 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-medium">{product.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right font-black text-gray-900 dark:text-white">
                        R$ {product.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Delivery Date Input */}
            <div className="space-y-2">
              <Label htmlFor="delivery-date" className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider opacity-70 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                Data de Entrega *
              </Label>
              <div className="relative">
                <Input
                  id="delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={minDateString}
                  className="w-full h-11 bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10 font-bold focus:ring-blue-500/20"
                  required
                />
              </div>
              {!deliveryDate && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-tighter flex items-center gap-1 animate-pulse">
                  <AlertCircle className="h-3 w-3" />
                  Campo obrigatório
                </p>
              )}
            </div>

            {/* Observations */}
            <div className="space-y-2">
              <Label htmlFor="observations" className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider opacity-70">
                Observações (opcional)
              </Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Informações relevantes sobre o pedido..."
                rows={2}
                className="resize-none h-11 bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-white/10 font-medium text-sm focus:ring-blue-500/20 transition-all focus:h-20"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-white/10 dark:border-white/5 bg-white/20 dark:bg-gray-950/20 backdrop-blur-md flex flex-row gap-3 sm:gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 border-white/20 dark:border-white/10 bg-transparent font-bold text-xs uppercase tracking-widest hover:bg-white/10 dark:hover:bg-white/5 transition-all"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!deliveryDate || isLoading}
            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
            onClick={handleConfirm}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Criando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Pedido
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
