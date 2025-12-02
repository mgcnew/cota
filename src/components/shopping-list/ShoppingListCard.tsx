import { memo } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShoppingListItem } from "@/hooks/useShoppingList";

interface ShoppingListCardProps {
  item: ShoppingListItem;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (item: ShoppingListItem) => void;
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
}: ShoppingListCardProps) {
  const config = priorityConfig[item.priority];
  const PriorityIcon = config.icon;

  return (
    <div
      className={cn(
        "group relative rounded-xl border-l-4 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 overflow-hidden transition-all duration-200 hover:shadow-md",
        config.accent,
        isSelected && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900"
      )}
    >
      <div className="p-4">
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
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {item.product_name}
                  </h3>
                  {item.category && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
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

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Quantidade</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {item.quantity}{" "}
                  <span className="text-gray-400 font-normal text-sm">{item.unit}</span>
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Preço Est.</p>
                <p
                  className={cn(
                    "font-semibold",
                    item.estimated_price
                      ? "text-green-600 dark:text-green-400"
                      : "text-gray-400"
                  )}
                >
                  {item.estimated_price ? `R$ ${item.estimated_price.toFixed(2)}` : "-"}
                </p>
              </div>
            </div>

            {/* Notes */}
            {item.notes && (
              <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-200 line-clamp-2">
                  {item.notes}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {new Date(item.created_at).toLocaleDateString("pt-BR")}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit?.(item)}
                  className="h-8 px-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Deseja remover este item?")) {
                      onDelete(item.id);
                    }
                  }}
                  className="h-8 px-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
