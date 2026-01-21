import { useState, useEffect } from "react";
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Package, Sparkles, CheckCircle, Building2, Loader2, FileBox, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface CreateStockCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { orderId?: string; notes?: string }) => Promise<void>;
  isLoading: boolean;
  availableOrders: any[];
  loadingOrders: boolean;
  loadOrders: () => void;
}

export function CreateStockCountDialog({
  open,
  onOpenChange,
  onCreate,
  isLoading,
  availableOrders,
  loadingOrders,
  loadOrders
}: CreateStockCountDialogProps) {
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [countType, setCountType] = useState<"from_order" | "from_scratch">("from_order");
  const [countNotes, setCountNotes] = useState("");

  useEffect(() => {
    if (open) {
      loadOrders();
      // Reset state on open
      setSelectedOrderId("");
      setCountNotes("");
      setCountType("from_order");
    }
  }, [open]);

  const handleCreate = async () => {
    await onCreate({
      orderId: countType === "from_order" ? selectedOrderId : undefined,
      notes: countNotes || undefined
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="w-[95vw] max-w-lg p-0 gap-0 overflow-hidden max-h-[90vh] sm:rounded-xl rounded-t-xl">
        {/* Header Compacto */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-4 sm:p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <ResponsiveDialogHeader className="p-0 space-y-0.5 text-left">
                <ResponsiveDialogTitle className="text-lg sm:text-xl font-bold text-white">
                  Nova Contagem
                </ResponsiveDialogTitle>
                <ResponsiveDialogDescription className="text-orange-100 text-xs sm:text-sm">
                  Como deseja criar a contagem?
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-4 sm:p-5 space-y-4">
            {/* Type Selection - Cards Responsivos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCountType("from_order")}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all",
                  countType === "from_order"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    countType === "from_order"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  )}>
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-semibold text-sm",
                      countType === "from_order" ? "text-orange-700 dark:text-orange-300" : "text-gray-900 dark:text-gray-100"
                    )}>
                      A partir de Pedido
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Importa itens do pedido
                    </p>
                  </div>
                  {countType === "from_order" && (
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  )}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCountType("from_scratch")}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all",
                  countType === "from_scratch"
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-orange-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    countType === "from_scratch"
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  )}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-semibold text-sm",
                      countType === "from_scratch" ? "text-orange-700 dark:text-orange-300" : "text-gray-900 dark:text-gray-100"
                    )}>
                      Contagem Livre
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sem vínculo com pedido
                    </p>
                  </div>
                  {countType === "from_scratch" && (
                    <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  )}
                </div>
              </button>
            </div>

            {/* Order Selection */}
            {countType === "from_order" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  Selecionar Pedido
                </Label>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-500 mr-2" />
                    <span className="text-sm text-gray-500">Carregando...</span>
                  </div>
                ) : availableOrders.length === 0 ? (
                  <div className="flex flex-col items-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border text-center">
                    <FileBox className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Nenhum pedido disponível</p>
                    <p className="text-xs text-gray-400">Use contagem livre</p>
                  </div>
                ) : (
                  <div className="rounded-lg border max-h-[180px] overflow-auto">
                    <div className="p-1.5 space-y-1">
                      {availableOrders.map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => setSelectedOrderId(order.id)}
                          className={cn(
                            "w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all",
                            selectedOrderId === order.id
                              ? "bg-orange-100 dark:bg-orange-900/40 border border-orange-300"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            selectedOrderId === order.id
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                          )}>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {order.supplier_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(order.order_date), "dd/MM/yyyy")}
                            </p>
                          </div>
                          {selectedOrderId === order.id && (
                            <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Observações (opcional)</Label>
              <Textarea
                placeholder="Adicione observações..."
                value={countNotes}
                onChange={(e) => setCountNotes(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer Fixo */}
        <div className="p-3 sm:p-4 border-t bg-gray-50 dark:bg-gray-900/50 flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading || (countType === "from_order" && !selectedOrderId)}
            className="flex-1 h-10 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-1.5" />
                Criar
              </>
            )}
          </Button>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
