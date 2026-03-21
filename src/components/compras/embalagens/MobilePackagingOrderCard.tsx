import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CapitalizedText } from "@/components/ui/capitalized-text";
import { 
  ShoppingCart, Eye, CheckCircle2, Truck, Trash2, 
  DollarSign, Calendar, MoreVertical, ChevronDown, ChevronUp, Clock
} from "lucide-react";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import type { PackagingOrderDisplay } from "@/types/packaging";
import { PACKAGING_ORDER_STATUS } from "@/types/packaging";

interface MobilePackagingOrderCardProps {
  order: PackagingOrderDisplay;
  orderNumber: number;
  onViewDetails: (order: PackagingOrderDisplay) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onConfirmDelivery: (order: PackagingOrderDisplay) => void;
  onDelete: (orderId: string) => void;
}

export const MobilePackagingOrderCard = memo(function MobilePackagingOrderCard({
  order,
  orderNumber,
  onViewDetails,
  onUpdateStatus,
  onConfirmDelivery,
  onDelete
}: MobilePackagingOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = PACKAGING_ORDER_STATUS.find(s => s.value === status);
    const colorClasses: Record<string, string> = {
      amber: "bg-amber-100 text-amber-700 border-amber-200",
      blue: "bg-blue-100 text-blue-700 border-blue-200",
      green: "bg-emerald-100 text-emerald-700 border-emerald-200",
      red: "bg-red-100 text-red-700 border-red-200",
    };
    const IconComponent = status === "pendente" ? Clock : status === "confirmado" ? CheckCircle2 : status === "entregue" ? Truck : Clock;
    return (
      <Badge variant="outline" className={cn("text-xs", colorClasses[statusConfig?.color || ""] || "")}>
        <IconComponent className="h-3 w-3 mr-1" />
        {statusConfig?.label || status}
      </Badge>
    );
  };

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 shadow-sm overflow-hidden"
    >
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-100 dark:bg-gray-800/50">
              <ShoppingCart className="h-5 w-5 text-gray-900 dark:text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                <CapitalizedText>{order.supplierName}</CapitalizedText>
              </p>
              <p className="text-xs text-muted-foreground">
                #{orderNumber.toString().padStart(4, '0')} • {order.orderDate}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {order.itens.slice(0, 3).map(item => (
            <Badge key={item.id} variant="secondary" className="text-xs">
              {item.quantidade}x {item.packagingName}
            </Badge>
          ))}
          {order.itens.length > 3 && (
            <Badge variant="outline" className="text-xs">+{order.itens.length - 3} mais</Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {getStatusBadge(order.status)}
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <DollarSign className="h-3 w-3 mr-1" />
            {formatCurrency(order.totalValue)}
          </Badge>
          {order.deliveryDate && (
            <Badge variant="outline" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              {order.deliveryDate}
            </Badge>
          )}
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
        <div className="p-4 pt-0 space-y-3 border-t border-gray-200 dark:border-gray-700/30 bg-gray-50/50 dark:bg-gray-900/20">
          <div className="grid grid-cols-2 gap-2 pt-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-10 touch-target active:scale-95 transition-transform col-span-2"
              onClick={() => onViewDetails(order)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Detalhes
            </Button>

            {order.status === "pendente" && (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-10 touch-target active:scale-95 transition-transform text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                onClick={() => onUpdateStatus(order.id, 'confirmado')}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            )}

            {(order.status === "pendente" || order.status === "confirmado") && (
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                  "h-10 touch-target active:scale-95 transition-transform text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200",
                  order.status === "confirmado" ? "col-span-2" : ""
                )}
                onClick={() => onConfirmDelivery(order)}
              >
                <Truck className="h-4 w-4 mr-2" />
                Marcar Entregue
              </Button>
            )}

            <Button 
              size="sm" 
              variant="outline" 
              className="h-10 touch-target text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 active:scale-95 transition-transform col-span-2"
              onClick={() => onDelete(order.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});