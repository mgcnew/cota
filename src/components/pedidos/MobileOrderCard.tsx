import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { capitalize } from "@/lib/text-utils";
import { 
  ShoppingCart, Trash2, Package, Truck, MoreVertical, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronUp
} from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible 
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        "bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 overflow-hidden shadow-sm",
        // Touch-optimized: min 44px touch targets + visual feedback (Requirements: 18.5)
        "touch-manipulation touch-feedback",
        className
      )}
    >
      <div className="p-4">
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

      {/* Expand/Collapse Button */}
      <CollapsibleTrigger asChild>
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700/30 text-xs text-muted-foreground active:bg-gray-100 dark:active:bg-gray-700/50 touch-target min-h-[44px]"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              <span>Menos detalhes</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              <span>Mais detalhes</span>
            </>
          )}
        </button>
      </CollapsibleTrigger>

      {/* Expandable Actions */}
      <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
        <div className="p-4 pt-0 space-y-3 border-t border-gray-200 dark:border-gray-700/30">
          <div className="grid grid-cols-2 gap-2 pt-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-10 touch-target active:scale-95 transition-transform"
              onClick={() => onManage(pedido)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Gerenciar
            </Button>
            
            <Button 
              size="sm" 
              variant="outline" 
              className="h-10 touch-target text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 active:scale-95 transition-transform"
              onClick={() => onDelete(pedido)}
              disabled={pedido.status === 'entregue'}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
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
