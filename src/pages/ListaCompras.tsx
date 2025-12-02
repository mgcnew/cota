import { useState, useMemo } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

export default function ListaCompras() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { toast } = useToast();
  const { refetch: refetchPedidos } = usePedidos();

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

  const clearSelection = () => setSelectedItems(new Set());


  return (
    <PageWrapper>
      <div className="page-container space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.total}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Itens na lista</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-red-600 dark:text-red-400">!</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.urgent}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Urgentes</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">↑</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.high}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Alta prioridade</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/50 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <span className="text-sm font-bold text-green-600 dark:text-green-400">R$</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {stats.estimatedTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total estimado</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <PageHeader
          title="Lista de Compras"
          description="Organize produtos para comprar no futuro"
          icon={ShoppingBasket}
          actions={
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Produto
            </Button>
          }
        />

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
            {filteredItems.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}
              </Badge>
            )}
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
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
    </PageWrapper>
  );
}
