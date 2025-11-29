import { useState, useMemo } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ShoppingCart, PackagePlus, Search } from "lucide-react";
import { useShoppingList } from "@/hooks/useShoppingList";
import { AddProductToListDialog } from "@/components/shopping-list/AddProductToListDialog";
import { EditShoppingListItemDialog } from "@/components/shopping-list/EditShoppingListItemDialog";
import { ShoppingListTable } from "@/components/shopping-list/ShoppingListTable";
import { ShoppingListCards } from "@/components/shopping-list/ShoppingListCards";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import { usePedidos } from "@/hooks/usePedidos";
import { useToast } from "@/hooks/use-toast";
import { useResponsiveViewMode } from "@/hooks/useResponsiveViewMode";
import { ViewToggle } from "@/components/ui/view-toggle";

export default function ListaCompras() {
  const { viewMode, setViewMode } = useResponsiveViewMode();
  const { toast } = useToast();
  const { refetch: refetchPedidos } = usePedidos();

  // Unified hook
  const {
    items,
    isLoading,
    deleteItem,
    deleteMultipleItems,
    updateItem,
  } = useShoppingList();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;

    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.product_name.toLowerCase().includes(query) ||
      (item.notes && item.notes.toLowerCase().includes(query))
    );
  }, [items, searchQuery]);

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Select all items
  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  // Products selected for creating an order
  const preSelectedProducts = useMemo(() => {
    return filteredItems
      .filter(item => selectedItems.has(item.id))
      .map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit: item.unit,
        estimated_price: item.estimated_price || 0,
      }));
  }, [filteredItems, selectedItems]);

  // Create order with selected items
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

  // Delete selected items
  const handleDeleteSelected = async () => {
    if (selectedItems.size === 0) return;

    if (!confirm(`Deseja remover ${selectedItems.size} ${selectedItems.size === 1 ? 'item' : 'itens'} da lista?`)) {
      return;
    }

    await deleteMultipleItems.mutateAsync(Array.from(selectedItems));
    setSelectedItems(new Set());
  };

  return (
    <PageWrapper>
      <div className="page-container space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 flex-shrink-0">
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Lista de Compras</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Organize produtos para comprar no futuro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setShowAddDialog(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          </div>
        </div>

        {/* Controls: Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedItems.size} {selectedItems.size === 1 ? 'item selecionado' : 'itens selecionados'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteSelected}
                className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                Remover
              </Button>
              <Button
                size="sm"
                onClick={handleCreateOrder}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <PackagePlus className="h-4 w-4 mr-2" />
                Criar Pedido
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {viewMode === 'grid' ? (
          <ShoppingListCards
            items={filteredItems}
            isLoading={isLoading}
            selectedItems={selectedItems}
            onToggleSelection={toggleItemSelection}
            onDelete={async (id) => { await deleteItem.mutateAsync(id); }}
            onUpdate={async (data) => { await updateItem.mutateAsync(data); }}
            onEdit={(item) => setEditingItem(item)}
          />
        ) : (
          <ShoppingListTable
            items={filteredItems}
            isLoading={isLoading}
            selectedItems={selectedItems}
            onToggleSelection={toggleItemSelection}
            onSelectAll={selectAll}
            onDelete={async (id) => { await deleteItem.mutateAsync(id); }}
            onUpdate={async (data) => { await updateItem.mutateAsync(data); }}
          />
        )}

        {/* Dialogs */}
        <AddProductToListDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />

        <EditShoppingListItemDialog
          item={editingItem}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          onUpdate={async (data) => {
            await updateItem.mutateAsync(data);
            setEditingItem(null);
          }}
        />

        <AddPedidoDialog
          open={showOrderDialog}
          onOpenChange={setShowOrderDialog}
          onAdd={async () => {
            setShowOrderDialog(false);
            setSelectedItems(new Set());
            await refetchPedidos();
            toast({
              title: "Pedido criado com sucesso",
              description: "Os itens da lista foram adicionados ao pedido",
            });
          }}
          preSelectedProducts={preSelectedProducts}
        />
      </div>
    </PageWrapper>
  );
}
