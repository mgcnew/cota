import { useState, useMemo } from 'react';
import { useShoppingList } from '@/hooks/useShoppingList';
import { useToast } from '@/hooks/use-toast';

export function useListaComprasLogic() {
  const { toast } = useToast();
  const { items, isLoading, deleteItem, deleteMultipleItems, updateItem } = useShoppingList();
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.product_name.toLowerCase().includes(query) ||
        (item.notes && item.notes.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = items.length;
    const urgent = items.filter((i) => i.priority === "urgent").length;
    const high = items.filter((i) => i.priority === "high").length;
    const estimatedTotal = items.reduce(
      (acc, i) => acc + (i.estimated_price || 0) * i.quantity,
      0
    );
    return { total, urgent, high, estimatedTotal };
  }, [items]);

  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const clearSelection = () => setSelectedItems(new Set());

  const preSelectedProducts = useMemo(() => {
    return filteredItems
      .filter((item) => selectedItems.has(item.id))
      .map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        estimated_price: item.estimated_price || 0,
      }));
  }, [filteredItems, selectedItems]);

  const handleCreateOrder = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para criar um pedido",
        variant: "destructive",
      });
      return;
    }
    setShowOrderDialog(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;
    if (
      !confirm(
        `Deseja remover ${selectedItems.size} ${selectedItems.size === 1 ? "item" : "itens"} da lista?`
      )
    ) {
      return;
    }
    await deleteMultipleItems.mutateAsync(Array.from(selectedItems));
    setSelectedItems(new Set());
  };

  return {
    items,
    isLoading,
    deleteItem,
    updateItem,
    viewMode,
    setViewMode,
    showAddDialog,
    setShowAddDialog,
    showOrderDialog,
    setShowOrderDialog,
    selectedItems,
    setSelectedItems,
    searchQuery,
    setSearchQuery,
    editingItem,
    setEditingItem,
    filteredItems,
    stats,
    toggleItemSelection,
    selectAll,
    clearSelection,
    preSelectedProducts,
    handleCreateOrder,
    handleDeleteSelected
  };
}
