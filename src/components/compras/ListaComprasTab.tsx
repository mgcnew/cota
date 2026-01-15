import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Plus,
  ShoppingBasket,
  PackagePlus,
  Search,
  Trash2,
  Package,
  X,
} from "lucide-react";
import { useShoppingList } from "@/hooks/useShoppingList";
import { AddProductToListDialog } from "@/components/shopping-list/AddProductToListDialog";
import { EditShoppingListItemDialog } from "@/components/shopping-list/EditShoppingListItemDialog";
import { ShoppingListTable } from "@/components/shopping-list/ShoppingListTable";
import { ShoppingListCards } from "@/components/shopping-list/ShoppingListCards";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import { usePedidos } from "@/hooks/usePedidos";
import { useToast } from "@/hooks/use-toast";
import { ViewToggle } from "@/components/ui/view-toggle";
import { cn } from "@/lib/utils";
import { MetricCard } from "@/components/ui/metric-card";
import { ResponsiveGrid } from "@/components/responsive/ResponsiveGrid";

export default function ListaComprasTab() {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const { toast } = useToast();
  const { refetch: refetchPedidos } = usePedidos();

  // No mobile, sempre usar cards
  useEffect(() => {
    if (isMobile) {
      setViewMode('grid');
    }
  }, [isMobile]);

  const { items, isLoading, deleteItem, deleteMultipleItems, updateItem } =
    useShoppingList();

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

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedItems(prev => {
      if (prev.size === filteredItems.length) {
        return new Set();
      }
      return new Set(filteredItems.map((item) => item.id));
    });
  }, [filteredItems]);

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

  const handleCreateOrder = useCallback(() => {
    if (selectedItems.size === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para criar um pedido",
        variant: "destructive",
      });
      return;
    }
    setShowOrderDialog(true);
  }, [selectedItems.size, toast]);

  const handleDeleteSelected = useCallback(async () => {
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
  }, [selectedItems, deleteMultipleItems]);

  const clearSelection = useCallback(() => setSelectedItems(new Set()), []);

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <ResponsiveGrid gap="sm" config={{ mobile: 2, tablet: 4, desktop: 4 }}>
        <MetricCard
          title="Itens"
          value={stats.total}
          icon={Package}
          variant="info"
        />
        <MetricCard
          title="Urgentes"
          value={stats.urgent}
          icon={ShoppingBasket}
          variant="error"
        />
        <MetricCard
          title="Alta Prioridade"
          value={stats.high}
          icon={ShoppingBasket}
          variant="warning"
        />
        <MetricCard
          title="Total Estimado"
          value={stats.estimatedTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
          icon={ShoppingBasket}
          variant="success"
        />
      </ResponsiveGrid>


      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar produtos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-gray-800/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            onClick={() => setShowAddDialog(true)}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
          {filteredItems.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}
            </Badge>
          )}
          {!isMobile && <ViewToggle view={viewMode} onViewChange={setViewMode} />}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div
          className={cn(
            "p-4 rounded-xl border animate-in fade-in slide-in-from-top-2",
            "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
          )}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {selectedItems.size}
                </span>
              </div>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedItems.size === 1 ? "item selecionado" : "itens selecionados"}
              </span>
              <button
                onClick={clearSelection}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Limpar seleção
              </button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteSelected}
                className="flex-1 sm:flex-none border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover
              </Button>
              <Button
                size="sm"
                onClick={handleCreateOrder}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <PackagePlus className="h-4 w-4 mr-2" />
                Criar Pedido
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Content */}
      {viewMode === "grid" ? (
        <ShoppingListCards
          items={filteredItems}
          isLoading={isLoading}
          selectedItems={selectedItems}
          onToggleSelection={toggleItemSelection}
          onDelete={async (id) => {
            await deleteItem.mutateAsync(id);
          }}
          onUpdate={async (data) => {
            await updateItem.mutateAsync(data);
          }}
          onEdit={(item) => setEditingItem(item)}
        />
      ) : (
        <ShoppingListTable
          items={filteredItems}
          isLoading={isLoading}
          selectedItems={selectedItems}
          onToggleSelection={toggleItemSelection}
          onSelectAll={selectAll}
          onDelete={async (id) => {
            await deleteItem.mutateAsync(id);
          }}
          onUpdate={async (data) => {
            await updateItem.mutateAsync(data);
          }}
        />
      )}

      {/* Dialogs */}
      <AddProductToListDialog open={showAddDialog} onOpenChange={setShowAddDialog} />

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
  );
}
