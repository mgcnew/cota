import { PageWrapper } from "@/components/layout/PageWrapper";
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
import { AddProductToListDialog } from "@/components/shopping-list/AddProductToListDialog";
import { EditShoppingListItemDialog } from "@/components/shopping-list/EditShoppingListItemDialog";
import { ShoppingListTable } from "@/components/shopping-list/ShoppingListTable";
import { ShoppingListCards } from "@/components/shopping-list/ShoppingListCards";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import { usePedidos } from "@/hooks/usePedidos";
import { useToast } from "@/hooks/use-toast";
import { ViewToggle } from "@/components/ui/view-toggle";
import { cn } from "@/lib/utils";
import { useListaComprasLogic } from "@/hooks/useListaComprasLogic";

import { ds } from "@/styles/design-system";

export default function ListaCompras() {
  const { toast } = useToast();
  const { refetch: refetchPedidos } = usePedidos();
  
  const {
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
  } = useListaComprasLogic();

  return (
    <PageWrapper>
      <div className="page-container space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Stats Cards - Cores Sólidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Total de Itens - Azul (informação) */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-white/80">Itens</p>
              </div>
            </div>
          </div>

          {/* Urgentes - Vermelho (alerta crítico) */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-base sm:text-lg font-bold">!</span>
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{stats.urgent}</p>
                <p className="text-[10px] sm:text-xs text-white/80">Urgentes</p>
              </div>
            </div>
          </div>

          {/* Alta Prioridade - Âmbar (atenção) */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-base sm:text-lg font-bold">↑</span>
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold">{stats.high}</p>
                <p className="text-[10px] sm:text-xs text-white/80">Alta</p>
              </div>
            </div>
          </div>

          {/* Total Estimado - Verde (dinheiro) */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold">R$</span>
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold truncate">
                  {stats.estimatedTotal.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-[10px] sm:text-xs text-white/80">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand/10 dark:bg-brand/20 border border-brand/20">
              <ShoppingBasket className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h1 className={cn(ds.typography.size["2xl"], "font-bold text-foreground")}>
                Lista de Compras
              </h1>
              <p className={cn(ds.colors.text.secondary, "text-sm mt-0.5")}>
                Organize produtos para comprar no futuro
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowAddDialog(true)}
            className={cn(ds.components.button.primary, "h-11 px-6 shadow-lg shadow-brand/10 w-full sm:w-auto")}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Adicionar Produto</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col gap-3 items-stretch sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-sm"
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

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            {filteredItems.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}
              </Badge>
            )}
            <ViewToggle view={viewMode} onViewChange={setViewMode} className="md:hidden" />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div
            className={cn(
              "p-3 sm:p-4 rounded-lg sm:rounded-xl border animate-in fade-in slide-in-from-top-2",
              "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
            )}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                    {selectedItems.size}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedItems.size === 1 ? "item selecionado" : "itens selecionados"}
                </span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto sm:ml-0"
                >
                  Limpar
                </button>
              </div>
              <div className="flex items-center gap-2 w-full">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteSelected}
                  className="flex-1 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 h-9 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Remover</span>
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateOrder}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-9 text-xs"
                >
                  <PackagePlus className="h-3.5 w-3.5 mr-1.5" />
                  <span className="hidden sm:inline">Criar Pedido</span>
                  <span className="sm:hidden">Pedido</span>
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
