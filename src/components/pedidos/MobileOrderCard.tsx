import { memo, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { capitalize } from "@/lib/text-utils";
import { 
  ShoppingCart, Trash2, Package, Truck, Clock, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

export interface OrderData {
  id: string;
  fornecedor: string;
  total: string;
  status: string;
  dataPedido: string;
  dataEntrega: string;
  itens: number;
  produtos: string[];
  observacoes: string;
  detalhesItens: Array<{
    produto: string;
    quantidade: number;
    valorUnitario: number;
  }>;
  supplier_id: string | null;
  delivery_date: string;
}

export interface MobileOrderCardProps {
  pedido: OrderData;
  onManage: (pedido: OrderData) => void;
  onDelete: (pedido: OrderData) => void;
  onUpdateStatus?: (pedidoId: string, status: string) => void; 
  className?: string;
}

const getStatusIcon = (status: string) => {
  const icons = { 
    pendente: Clock, 
    processando: Clock, 
    confirmado: CheckCircle, 
    entregue: Truck, 
    cancelado: XCircle 
  };
  const Icon = icons[status as keyof typeof icons] || Clock;
  return <Icon className="h-5 w-5" />;
};

const abbreviateSupplierName = (name: string, maxLength: number = 22) => {
  if (name.length <= maxLength) return name;
  const words = name.split(' ');
  if (words.length === 1) return name.substring(0, maxLength - 3) + '...';
  if (words.length >= 2) {
    const abbreviated = `${words[0]} ... ${words[words.length - 1]}`;
    if (abbreviated.length <= maxLength) return abbreviated;
  }
  return name.substring(0, maxLength - 3) + '...';
};

/**
 * MobileOrderCard - Memoized card component for displaying orders on mobile.
 * Optimized for mobile with direct 'Gerenciar' button and 'Delayed' alert.
 */
export const MobileOrderCard = memo(function MobileOrderCard({
  pedido,
  onManage,
  onDelete,
  className,
}: MobileOrderCardProps) {
  
  // Calculate if the order is delayed
  const isDelayed = useMemo(() => {
    if (pedido.status === 'entregue' || pedido.status === 'cancelado') return false;
    if (!pedido.delivery_date) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delivery = new Date(pedido.delivery_date + 'T00:00:00');
    
    return delivery < today;
  }, [pedido.status, pedido.delivery_date]);

  return (
    <div 
      className={cn(
        "bg-white dark:bg-card/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-sm overflow-hidden touch-manipulation relative",
        isDelayed && "border-l-[4px] border-l-red-500",
        className
      )}
    >
      <div className="p-4">
        {/* Header: Supplier, ID, Total */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                {getStatusIcon(pedido.status)}
              </div>
              {isDelayed && (
                <div className="absolute -top-1 -right-1 bg-white dark:bg-background rounded-full">
                  <div className="bg-red-500 rounded-full w-3.5 h-3.5 border-2 border-white dark:border-zinc-950 animate-pulse" />
                </div>
              )}
            </div>
            
            <div className="min-w-0">
              <h3 className={cn("text-sm truncate", ds.typography.weight.bold, ds.colors.text.primary)}>
                {capitalize(abbreviateSupplierName(pedido.fornecedor))}
              </h3>
              <p className={cn("text-[10px] uppercase font-mono tracking-tight opacity-70", ds.colors.text.secondary)}>#{pedido.id.substring(0, 7)}</p>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className={cn("text-sm", ds.components.dataDisplay.money)}>{pedido.total}</div>
            <div className={cn("text-[9px] uppercase tracking-wider", ds.colors.text.muted)}>{pedido.dataPedido}</div>
          </div>
        </div>

        {/* Info Row: Status, Items, Delivery */}
        <div className="flex items-center justify-between mb-4 bg-zinc-50/80 dark:bg-zinc-800/40 rounded-xl p-2.5">
          <StatusBadge status={pedido.status} />
          
          <div className="flex items-center gap-3">
            <div className={cn("flex items-center gap-1.5", ds.components.dataDisplay.secondary)}>
              <Package className="w-3.5 h-3.5" />
              <span className="font-bold">{pedido.itens}</span>
            </div>
            
            <div className={cn("flex items-center gap-1.5", isDelayed ? "text-red-500 font-bold" : ds.components.dataDisplay.secondary)}>
              {isDelayed ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
              <span className="text-[11px]">
                {isDelayed ? 'Atrasado' : (pedido.dataEntrega || '-')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button 
            className={cn(
              "flex-1 h-10 rounded-xl touch-target active:scale-[0.98] transition-transform",
              ds.components.button.primary
            )}
            onClick={() => onManage(pedido)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Gerenciar Pedido
          </Button>
          
          <Button
            size="icon"
            variant="outline"
            className="h-10 w-10 rounded-xl border-zinc-200 dark:border-zinc-800 text-red-500 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 touch-target shrink-0 disabled:opacity-50"
            onClick={() => onDelete(pedido)}
            disabled={pedido.status === 'entregue'}
            aria-label="Excluir pedido"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.pedido.id === nextProps.pedido.id &&
    prevProps.pedido.status === nextProps.pedido.status &&
    prevProps.pedido.total === nextProps.pedido.total &&
    prevProps.pedido.itens === nextProps.pedido.itens &&
    prevProps.pedido.dataEntrega === nextProps.pedido.dataEntrega &&
    prevProps.pedido.fornecedor === nextProps.pedido.fornecedor &&
    prevProps.pedido.delivery_date === nextProps.pedido.delivery_date
  );
});

export default MobileOrderCard;
