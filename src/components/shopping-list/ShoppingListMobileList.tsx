import { useEffect, useRef } from "react";
import { ShoppingListMobileCard } from "./ShoppingListMobileCard";
import { Loader2 } from "lucide-react";
import type { ShoppingListItemMobile } from "@/hooks/mobile/useShoppingListMobile";

interface ShoppingListMobileListProps {
  items: ShoppingListItemMobile[];
  isLoading: boolean;
  selectedItems: Set<string>;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (data: any) => Promise<void>;
  onEdit?: (item: ShoppingListItemMobile) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

export function ShoppingListMobileList({
  items,
  isLoading,
  selectedItems,
  onToggleSelection,
  onDelete,
  onUpdate,
  onEdit,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: ShoppingListMobileListProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    if (!fetchNextPage || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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
        <ShoppingListMobileCard
          key={item.id}
          item={item}
          isSelected={selectedItems.has(item.id)}
          onToggleSelection={onToggleSelection}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={observerTarget} className="flex items-center justify-center py-4">
          {isFetchingNextPage && (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          )}
        </div>
      )}

      {/* Fim da lista */}
      {!hasNextPage && items.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Fim da lista • {items.length} {items.length === 1 ? 'item' : 'itens'}
          </p>
        </div>
      )}
    </div>
  );
}
