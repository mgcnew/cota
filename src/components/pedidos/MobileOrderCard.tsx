import { memo } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { capitalize } from "@/lib/text-utils";
import { 
  ShoppingCart, Trash2, Package, Truck, MoreVertical, Clock, CheckCircle, XCircle 
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
  return <Icon className="h-4 w-4" />;
};

const abbreviateSupplierName = (name: string, maxLength: number = 25) => {
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
 * 
 * Uses React.memo to prevent unnecessary re-renders when parent component updates
 * but the order data hasn't changed.
 * 
 * Requirements: 5.2
 */
export const MobileOrderCard = memo(function MobileOrderCard({
  pedido,
  onManage,
  onDelete,
  className,
}: MobileOrderCardProps) {
  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 p-4 shadow-sm",
        // Touch-optimized: min 44px touch targets
        "touch-manipulation",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 flex items-center justify-center flex-shrink-0 border border-orange-200/50">
            {getStatusIcon(pedido.status)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {capitalize(abbreviateSupplierName(pedido.fornecedor))}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              #{pedido.id.substring(0, 8)}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* Touch target: min 44x44px */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-11 w-11 flex-shrink-0 touch-target"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => onManage(pedido)}
              className="min-h-[44px] cursor-pointer"
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> 
              Gerenciar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(pedido)} 
              className="text-red-600 min-h-[44px] cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" /> 
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <StatusBadge status={pedido.status} />
        <span className="text-xs text-muted-foreground">{pedido.dataPedido}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Package className="h-3.5 w-3.5 text-orange-600" />
          <span className="text-gray-500 dark:text-gray-400">Itens:</span>
          <span className="font-semibold text-gray-900 dark:text-white">{pedido.itens}</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-3.5 w-3.5 text-blue-600" />
          <span className="text-gray-500 dark:text-gray-400">Entrega:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {pedido.dataEntrega || '-'}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Valor Total</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-lg">
          {pedido.total}
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if these change
  return (
    prevProps.pedido.id === nextProps.pedido.id &&
    prevProps.pedido.status === nextProps.pedido.status &&
    prevProps.pedido.total === nextProps.pedido.total &&
    prevProps.pedido.itens === nextProps.pedido.itens &&
    prevProps.pedido.dataEntrega === nextProps.pedido.dataEntrega &&
    prevProps.pedido.fornecedor === nextProps.pedido.fornecedor
  );
});

export default MobileOrderCard;
