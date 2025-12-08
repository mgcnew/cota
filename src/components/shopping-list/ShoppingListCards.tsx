import { useCallback } from "react";
import { ShoppingListCard } from "./ShoppingListCard";
import { VirtualList } from "@/components/responsive/VirtualList";
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

// Virtualization threshold - use VirtualList for lists > 20 items
const VIRTUALIZATION_THRESHOLD = 20;
// Estimated card height for virtualization
const CARD_HEIGHT = 220;

export function ShoppingListCards({
  items,
  isLoading,
  selectedItems,
  onToggleSelection,
  onDelete,
  onEdit,
  onUpdate,
}: ShoppingListCardsProps) {
  // Handler for quantity updates from stepper
  const handleUpdateQuantity = useCallback(async (id: string, quantity: number) => {
    await onUpdate({ id, quantity });
  }, [onUpdate]);

  // Memoized render function for VirtualList
  const renderItem = useCallback((item: ShoppingListItem, index: number, style: React.CSSProperties) => (
    <div style={style} className="pb-3">
      <ShoppingListCard
        key={item.id}
        item={item}
        isSelected={selectedItems.has(item.id)}
        onToggleSelection={onToggleSelection}
        onDelete={onDelete}
        onEdit={onEdit}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </div>
  ), [selectedItems, onToggleSelection, onDelete, onEdit, handleUpdateQuantity]);
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

  // Use virtualization for long lists (> 20 items) - Requirements: 13.5
  if (items.length > VIRTUALIZATION_THRESHOLD) {
    return (
      <VirtualList
        items={items}
        itemHeight={CARD_HEIGHT}
        threshold={VIRTUALIZATION_THRESHOLD}
        height={600}
        overscan={3}
        renderItem={renderItem}
        className="scrollbar-thin"
      />
    );
  }

  // Regular grid for smaller lists
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
          onUpdateQuantity={handleUpdateQuantity}
        />
      ))}
    </div>
  );
}
