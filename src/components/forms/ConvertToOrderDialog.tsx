import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const [deliveryDate, setDeliveryDate] = useState("");
  const [observations, setObservations] = useState("");

  const handleConfirm = () => {
    if (!deliveryDate) return;
    onConfirm(deliveryDate, observations);
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  const modalContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border dark:border-white/5 bg-card flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 flex-shrink-0">
            <ShoppingCart className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground leading-none">Converter para Pedido</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Confirme os dados antes de criar o pedido</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 border border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-500/5">
            <div className="flex items-center gap-1.5 mb-2">
              <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[9px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Fornecedor</span>
            </div>
            <Badge className="bg-emerald-600 text-white text-[9px] font-bold mb-1.5 px-1.5 py-0 h-4">Melhor Preço</Badge>
            <CapitalizedText className="font-bold text-sm text-foreground truncate block">
              {supplier.name}
            </CapitalizedText>
          </Card>

          <Card className="p-3 border border-blue-500/20 bg-blue-500/10 dark:bg-blue-500/5">
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-[9px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider">Valor Total</span>
            </div>
            <p className="text-xl font-black text-blue-900 dark:text-blue-100 tracking-tight tabular-nums">
              R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        {/* Products List */}
        <div className="border border-border dark:border-white/5 rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-border dark:border-white/5 bg-muted/30 flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Produtos ({products.length})</span>
          </div>
          <div className="max-h-[180px] overflow-y-auto divide-y divide-border dark:divide-white/5">
            {products.map((product) => (
              <div key={product.id} className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{product.name}</p>
                  <p className="text-[10px] text-muted-foreground">{product.quantity}</p>
                </div>
                <span className="text-xs font-black text-foreground tabular-nums ml-3 flex-shrink-0">
                  R$ {product.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="delivery-date" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-500" />
              Data de Entrega *
            </Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={minDateString}
              className="h-11 font-bold"
              required
            />
            {!deliveryDate && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                <AlertCircle className="h-3 w-3" /> Campo obrigatório
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observations" className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Observações (opcional)
            </Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Informações relevantes..."
              rows={2}
              className="resize-none h-11 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 px-4 py-3 border-t border-border dark:border-white/5 bg-muted/20 flex-shrink-0">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
          className="flex-1 h-11 font-bold text-xs uppercase tracking-widest" disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!deliveryDate || isLoading} onClick={handleConfirm}
          className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest active:scale-[0.98]">
          {isLoading ? (
            <><Loader2 className="animate-spin h-4 w-4 mr-2" />Criando...</>
          ) : (
            <><CheckCircle2 className="h-4 w-4 mr-2" />Confirmar Pedido</>
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh] rounded-t-2xl p-0 overflow-hidden flex flex-col bg-background border-t border-border dark:border-white/5">
          <DrawerTitle className="sr-only">Converter para Pedido</DrawerTitle>
          <DrawerDescription className="sr-only">Confirme os dados antes de criar o pedido</DrawerDescription>
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden border border-border dark:border-white/5 shadow-2xl rounded-xl bg-background [&>button]:hidden">
        <DialogTitle className="sr-only">Converter para Pedido</DialogTitle>
        <DialogDescription className="sr-only">Confirme os dados antes de criar o pedido</DialogDescription>
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
