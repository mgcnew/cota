import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Package } from "lucide-react";
import type { ShoppingListItemMobile } from "@/hooks/mobile/useShoppingListMobile";

interface ShoppingListMobileCardProps {
  item: ShoppingListItemMobile;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
}

const priorityConfig = {
  low: { label: "Baixa", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
  medium: { label: "Média", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  high: { label: "Alta", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

export const ShoppingListMobileCard = memo(function ShoppingListMobileCard({
  item,
  isSelected,
  onToggleSelection,
  onDelete,
}: ShoppingListMobileCardProps) {
  const config = priorityConfig[item.priority];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div className="pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(item.id)}
            />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <h3 className="font-semibold text-sm truncate">{item.product_name}</h3>
                </div>
                {item.category && (
                  <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                )}
              </div>
              <Badge className={`${config.color} text-xs flex-shrink-0`}>
                {config.label}
              </Badge>
            </div>

            {/* Detalhes */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quantidade:</span>
                <span className="font-medium">
                  {item.quantity} {item.unit}
                </span>
              </div>
              {item.estimated_price && item.estimated_price > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Preço Est.:</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    R$ {item.estimated_price.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Observações */}
            {item.notes && (
              <div className="mb-3 p-2 bg-muted/50 rounded-md">
                <p className="text-xs text-muted-foreground line-clamp-2">{item.notes}</p>
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
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
                className="flex-1 h-8 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remover
              </Button>
            </div>

            {/* Data */}
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Adicionado em {new Date(item.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
