import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, Package, Sparkles, CheckCircle, Building2, Loader2, FileBox, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ds } from "@/styles/design-system"; // Using ds alias as per previous files
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";

interface CreateStockCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { orderId?: string; notes?: string }) => Promise<void>;
  isLoading: boolean;
  availableOrders: any[];
  loadingOrders: boolean;
  loadOrders: () => void;
  trigger?: React.ReactNode;
}

export function CreateStockCountDialog({
  open,
  onOpenChange,
  onCreate,
  isLoading,
  availableOrders,
  loadingOrders,
  loadOrders,
  trigger
}: CreateStockCountDialogProps) {
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
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

  // Header Component (Shared)
  const Header = (
    <div className={ds.components.modal.header}>
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg border", ds.colors.surface.card, ds.colors.border.subtle)}>
          <ClipboardList className={cn("h-4 w-4", ds.colors.text.primary)} />
        </div>
        <DialogTitle className={cn(ds.typography.size.lg, ds.typography.weight.bold, ds.colors.text.primary)}>
          Nova Contagem
        </DialogTitle>
      </div>
    </div>
  );

  // Content Component (Shared)
  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      {Header}
      
      <div className={cn(ds.components.modal.body, "flex-1 overflow-y-auto custom-scrollbar space-y-4 p-4")}>
        {/* Seção: Tipo de Contagem */}
        <div className={cn(ds.components.card.flat, "p-4 space-y-4")}>
          <h3 className={cn(ds.typography.size.xs, ds.typography.weight.bold, "uppercase tracking-wider flex items-center gap-2", ds.colors.text.muted)}>
            <span className="w-1 h-4 bg-brand/20 rounded-full"></span>
            Tipo de Contagem
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCountType("from_order")}
              className={cn(
                "relative p-4 rounded-xl border text-left transition-all duration-200",
                countType === "from_order"
                  ? "border-brand bg-brand/5 dark:bg-brand/10"
                  : "border-border hover:border-brand/50 bg-card hover:bg-accent/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                  countType === "from_order"
                    ? "bg-brand text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  <Package className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold text-sm",
                    countType === "from_order" ? "text-brand-foreground" : "text-foreground"
                  )}>
                    A partir de Pedido
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Importa itens do pedido
                  </p>
                </div>
                {countType === "from_order" && (
                  <CheckCircle className="w-5 h-5 text-brand flex-shrink-0" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCountType("from_scratch")}
              className={cn(
                "relative p-4 rounded-xl border text-left transition-all duration-200",
                countType === "from_scratch"
                  ? "border-brand bg-brand/5 dark:bg-brand/10"
                  : "border-border hover:border-brand/50 bg-card hover:bg-accent/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                  countType === "from_scratch"
                    ? "bg-brand text-white"
                    : "bg-muted text-muted-foreground"
                )}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-semibold text-sm",
                    countType === "from_scratch" ? "text-brand-foreground" : "text-foreground"
                  )}>
                    Contagem Livre
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sem vínculo com pedido
                  </p>
                </div>
                {countType === "from_scratch" && (
                  <CheckCircle className="w-5 h-5 text-brand flex-shrink-0" />
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Order Selection */}
        {countType === "from_order" && (
          <div className={cn(ds.components.card.flat, "p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200")}>
            <h3 className={cn(ds.typography.size.xs, ds.typography.weight.bold, "uppercase tracking-wider flex items-center gap-2", ds.colors.text.muted)}>
              <span className="w-1 h-4 bg-brand/20 rounded-full"></span>
              Selecionar Pedido
            </h3>
            
            {loadingOrders ? (
              <div className="flex items-center justify-center py-6 bg-muted/20 rounded-lg border border-border border-dashed">
                <Loader2 className="h-5 w-5 animate-spin text-brand mr-2" />
                <span className="text-sm text-muted-foreground">Carregando...</span>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="flex flex-col items-center py-6 bg-muted/20 rounded-lg border border-border border-dashed text-center">
                <FileBox className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum pedido disponível</p>
                <p className="text-xs text-muted-foreground/70">Use contagem livre</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border max-h-[180px] overflow-auto bg-card custom-scrollbar">
                <div className="p-1.5 space-y-1">
                  {availableOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all",
                        selectedOrderId === order.id
                          ? "bg-brand/10 border border-brand/20"
                          : "hover:bg-accent border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                        selectedOrderId === order.id
                          ? "bg-brand text-white"
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground">
                          {order.supplier_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.order_date), "dd/MM/yyyy")}
                        </p>
                      </div>
                      {selectedOrderId === order.id && (
                        <CheckCircle className="w-4 h-4 text-brand flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div className={cn(ds.components.card.flat, "p-4 space-y-4")}>
          <h3 className={cn(ds.typography.size.xs, ds.typography.weight.bold, "uppercase tracking-wider flex items-center gap-2", ds.colors.text.muted)}>
            <span className="w-1 h-4 bg-brand/20 rounded-full"></span>
            Observações
          </h3>
          <Textarea
            placeholder="Adicione observações opcionais sobre esta contagem..."
            value={countNotes}
            onChange={(e) => setCountNotes(e.target.value)}
            rows={2}
            className={cn(ds.components.input.root, "resize-none text-sm min-h-[80px]")}
          />
        </div>
      </div>

      {/* Footer */}
      <div className={ds.components.modal.footer}>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className={ds.components.button.secondary}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleCreate}
          disabled={isLoading || (countType === "from_order" && !selectedOrderId)}
          className={ds.components.button.primary}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ArrowRight className="h-4 w-4 mr-2" />
              Criar Contagem
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Mobile Drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent
          className="rounded-t-2xl pb-8 overflow-hidden flex flex-col p-0 bg-background border-t border-border"
          style={{
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '90vh',
            paddingBottom: keyboardOffset > 0 ? 0 : 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={ds.components.modal.content}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
