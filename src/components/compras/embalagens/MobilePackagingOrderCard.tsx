import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, Eye, CheckCircle2, Truck, Trash2, 
  DollarSign, Calendar, TrendingDown, Package
} from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingOrderDisplay } from "@/types/packaging";

interface MobilePackagingOrderCardProps {
  order: PackagingOrderDisplay;
  orderNumber: number;
  onViewDetails: (order: PackagingOrderDisplay) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onConfirmDelivery: (order: PackagingOrderDisplay) => void;
  onDelete: (orderId: string) => void;
}

/**
 * MobilePackagingOrderCard - Redesigned Premium Floating Card for Packaging Orders
 * Aligned with the application's modern floating-card design system.
 */
export const MobilePackagingOrderCard = memo(function MobilePackagingOrderCard({
  order,
  orderNumber,
  onViewDetails,
  onUpdateStatus,
  onConfirmDelivery,
  onDelete
}: MobilePackagingOrderCardProps) {

  const handleViewDetails = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails(order);
  }, [onViewDetails, order]);

  const handleConfirm = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateStatus(order.id, 'confirmado');
  }, [onUpdateStatus, order.id]);

  const handleConfirmDelivery = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onConfirmDelivery(order);
  }, [onConfirmDelivery, order]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(order.id);
  }, [onDelete, order.id]);

  const isDelivered = order.status === 'entregue';
  const isConfirmed = order.status === 'confirmado';
  const isPending = order.status === 'pendente';

  return (
    <div 
      onClick={() => onViewDetails(order)}
      className={cn(
        ds.components.card.root,
        ds.components.card.interactive,
        "group relative overflow-hidden"
      )}
    >
      <div className="p-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border transition-colors",
              isDelivered 
                ? "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-400"
                : isConfirmed
                ? "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-400"
                : "bg-brand/10 dark:bg-brand/20 border-brand/10 text-brand"
            )}>
              {isDelivered ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : isConfirmed ? (
                <Package className="h-5 w-5" />
              ) : (
                <ShoppingCart className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                <CapitalizedText>{order.supplierName}</CapitalizedText>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                #{orderNumber.toString().padStart(4, '0')} • {order.orderDate}
              </p>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block mb-0.5">
              Valor Total
            </span>
            <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
              {formatCurrency(order.totalValue)}
            </span>
          </div>
        </div>

        {/* Items Pills Row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {order.itens.slice(0, 3).map(item => (
            <Badge 
              key={item.id} 
              variant="secondary" 
              className="bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold px-2 py-0.5 rounded-full border-none"
            >
              <Package className="h-2.5 w-2.5 mr-1 opacity-50" />
              {item.quantidade} {item.packagingName}
            </Badge>
          ))}
          {order.itens.length > 3 && (
            <Badge variant="outline" className="text-[10px] rounded-full border-zinc-200 dark:border-zinc-800 px-2 py-0.5">
              +{order.itens.length - 3} itens
            </Badge>
          )}
        </div>

        {/* Status and Metrics Row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={order.status} 
              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider h-auto"
            />
            {order.deliveryDate && !isDelivered && (
              <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Calendar className="h-3 w-3" />
                {order.deliveryDate}
              </span>
            )}
          </div>
          
          {order.economiaEstimada > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">
                -{formatCurrency(order.economiaEstimada)}
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
          <div className="flex-1 flex gap-2">
            <Button
              onClick={handleViewDetails}
              variant="outline"
              className={cn(
                ds.components.button.base,
                ds.components.button.variants.secondary,
                "flex-1 h-11 rounded-xl font-bold text-xs"
              )}
            >
              <Eye className="h-4 w-4 mr-1.5 opacity-70" />
              Detalhes
            </Button>

            {isPending && (
              <Button
                onClick={handleConfirm}
                className={cn(
                  ds.components.button.base,
                  "flex-1 h-11 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                )}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Confirmar
              </Button>
            )}

            {isConfirmed && (
              <Button
                onClick={handleConfirmDelivery}
                className={cn(
                  ds.components.button.base,
                  "flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
                )}
              >
                <Truck className="h-4 w-4 mr-1.5" />
                Entregue
              </Button>
            )}
          </div>
          
          <Button
            onClick={handleDelete}
            variant="outline"
            size="icon"
            className={cn(
              ds.components.button.base,
              ds.components.button.variants.secondary,
              "h-11 w-11 rounded-xl",
              "text-red-500 hover:text-red-600 hover:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-900/20"
            )}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});