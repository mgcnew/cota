import { ShoppingListCard } from "./ShoppingListCard";
import { Loader2 } from "lucide-react";
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
    onUpdate,
    onEdit,
}: ShoppingListCardsProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12 px-4">
                <p className="text-lg font-medium text-muted-foreground mb-2">
                    Nenhum produto na lista
                </p>
                <p className="text-sm text-muted-foreground">
                    Adicione produtos para começar sua lista de compras
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
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
