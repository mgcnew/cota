import { ShoppingListCard } from "./ShoppingListCard";
import { Loader2, ShoppingBasket } from "lucide-react";
import type { ShoppingListItem } from "@/hooks/useShoppingList";

interface ShoppingListCardsProps {
  items: ShoppingListItem[];
  isLoading: boolean;
  selectedItems: Set<string>;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (data: any) => Promise<void>;
  onEdit?: (item: ShoppingListItem) => void;
}

export function ShoppingListCards({
  items,
  isLoading,
  selectedItems,
  onToggleSelection,
  onDelete,
  onEdit,
}: ShoppingListCardsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Carregando lista...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
          <ShoppingBasket className="w-8 h-8 text-blue-500 dark:text-blue-400" />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Lista vazia
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Adicione produtos para começar sua lista de compras
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
      {items.map((item) => (
        <ShoppingListCard
          key={item.id}
          item={item}
          isSelected={selectedItems.has(item.id)}
          onToggleSelection={onToggleSelection}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
