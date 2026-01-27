import { memo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Package,
  Clock,
  Minus,
  ArrowUp,
  Zap,
  Calendar,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem } from "@/styles/design-system";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import type { ShoppingListItem } from "@/hooks/useShoppingList";

interface ShoppingListCardProps {
  item: ShoppingListItem;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (item: ShoppingListItem) => void;
  onUpdateQuantity?: (id: string, quantity: number) => Promise<void>;
}

const priorityConfig = {
  low: {
    label: "Baixa",
    icon: Clock,
    color: "text-gray-600 dark:text-gray-400",
    badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    accent: "border-l-gray-400",
  },
  medium: {
    label: "Média",
    icon: Minus,
    color: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    accent: "border-l-blue-500",
  },
  high: {
    label: "Alta",
    icon: ArrowUp,
    color: "text-orange-600 dark:text-orange-400",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    accent: "border-l-orange-500",
  },
  urgent: {
    label: "Urgente",
    icon: Zap,
    color: "text-red-600 dark:text-red-400",
    badge: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800",
    accent: "border-l-red-500",
  },
};

export const ShoppingListCard = memo(function ShoppingListCard({
  item,
  isSelected,
  onToggleSelection,
  onDelete,
  onEdit,
  onUpdateQuantity,
}: ShoppingListCardProps) {
  const config = priorityConfig[item.priority];
  const PriorityIcon = config.icon;
  const [localQuantity, setLocalQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Touch-friendly quantity stepper handlers
  const handleIncrement = async () => {
    const newQuantity = localQuantity + 1;
    setLocalQuantity(newQuantity);
    if (onUpdateQuantity) {
      setIsUpdating(true);
      try {
        await onUpdateQuantity(item.id, newQuantity);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const handleDecrement = async () => {
    if (localQuantity <= 1) return;
    const newQuantity = localQuantity - 1;
    setLocalQuantity(newQuantity);
    if (onUpdateQuantity) {
      setIsUpdating(true);
      try {
        await onUpdateQuantity(item.id, newQuantity);
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className={cn(
        "group relative rounded-xl border-l-4 bg-card border border-border overflow-hidden transition-all duration-200 hover:shadow-md",
        config.accent,
        isSelected && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900"
      )}
    >
      <div className="p-4 pb-2">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-0.5">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(item.id)}
              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {item.product_name}
                  </h3>
                  {item.category && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.category}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className={cn("gap-1 flex-shrink-0", config.badge)}>
                <PriorityIcon className="w-3 h-3" />
                {config.label}
              </Badge>
            </div>

            {/* Details Grid with Touch-Friendly Stepper */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Touch-friendly quantity stepper - min 44x44px touch targets */}
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-xs text-muted-foreground mb-1.5">Quantidade</p>
                <div className="flex items-center justify-between gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDecrement}
                    disabled={localQuantity <= 1 || isUpdating}
                    className="h-11 w-11 min-w-[44px] min-h-[44px] rounded-lg border-border hover:bg-muted active:scale-95 transition-transform touch-manipulation"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center">
                    <span className="font-bold text-lg text-foreground">
                      {localQuantity}
                    </span>
                    <span className="text-muted-foreground font-normal text-xs ml-1">{item.unit}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleIncrement}
                    disabled={isUpdating}
                    className="h-11 w-11 min-w-[44px] min-h-[44px] rounded-lg border-border hover:bg-muted active:scale-95 transition-transform touch-manipulation"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-2.5">
                <p className="text-xs text-muted-foreground mb-0.5">Preço Est.</p>
                <div className={cn(
                  "px-2 py-0.5 rounded-md inline-block",
                  item.estimated_price ? "bg-emerald-50/50 dark:bg-emerald-900/10" : ""
                )}>
                  <p
                    className={cn(
                      "font-bold",
                      item.estimated_price
                        ? designSystem.colors.text.price
                        : "text-muted-foreground"
                    )}
                  >
                    {item.estimated_price ? `R$ ${item.estimated_price.toFixed(2)}` : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <CollapsibleTrigger asChild>
        <button
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-muted/30 border-t border-border text-xs text-muted-foreground active:bg-muted/50 touch-target min-h-[44px]"
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
        <div className="p-4 pt-0 space-y-3 border-t border-border bg-muted/20">
          
          {/* Notes */}
          {item.notes && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-200/50 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                {item.notes}
              </p>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pb-2">
            <Calendar className="w-3 h-3" />
            Criado em {new Date(item.created_at).toLocaleDateString("pt-BR")}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(item)}
              className="h-10 touch-target active:scale-95 transition-transform"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm("Deseja remover este item?")) {
                  onDelete(item.id);
                }
              }}
              className="h-10 touch-target text-red-600 hover:text-red-700 hover:bg-red-500/10 border-red-200/50 active:scale-95 transition-transform"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
