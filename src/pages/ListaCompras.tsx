import { useState, useMemo } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ShoppingCart, PackagePlus } from "lucide-react";
import { useMobile } from "@/contexts/MobileProvider";
import { useShoppingList } from "@/hooks/useShoppingList";
import { useShoppingListMobile } from "@/hooks/mobile/useShoppingListMobile";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { MobileSearchWithAction } from "@/components/mobile/MobileSearchWithAction";
import { AddProductToListDialog } from "@/components/shopping-list/AddProductToListDialog";
import { ShoppingListTable } from "@/components/shopping-list/ShoppingListTable";
import { ShoppingListMobileList } from "@/components/shopping-list/ShoppingListMobileList";
import AddPedidoDialog from "@/components/forms/AddPedidoDialog";
import { usePedidos } from "@/hooks/usePedidos";
import { useToast } from "@/hooks/use-toast";

export default function ListaCompras() {
  const isMobile = useMobile();
  const { toast } = useToast();
  const { refetch: refetchPedidos } = usePedidos();
  
  // Hooks condicionais
  const desktopList = useShoppingList();
  const mobileList = useShoppingListMobile();
  
  const {
    items: desktopItems,
    isLoading: desktopLoading,
    deleteItem: desktopDelete,
    deleteMultipleItems: desktopDeleteMultiple,
    updateItem: desktopUpdate,
  } = desktopList;
  
  const {
    items: mobileItems,
    isLoading: mobileLoading,
    search: mobileSearch,
    setSearch: setMobileSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: mobileRefetch,
    deleteItem: mobileDelete,
    deleteMultipleItems: mobileDeleteMultiple,
    updateItem: mobileUpdate,
  } = mobileList;
  
  // Usar dados apropriados baseado no dispositivo
  const items = isMobile ? mobileItems : desktopItems;
  const isLoading = isMobile ? mobileLoading : desktopLoading;
  const deleteItem = isMobile ? mobileDelete : desktopDelete;
  const deleteMultipleItems = isMobile ? mobileDeleteMultiple : desktopDeleteMultiple;
  const updateItem = isMobile ? mobileUpdate : desktopUpdate;
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Atualizar busca mobile
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (isMobile && setMobileSearch) {
      setMobileSearch(value);
    }
  };

  // Filtrar itens no desktop
  const filteredItems = isMobile 
    ? items 
    : items.filter(item => 
        item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  // Toggle seleção de item
  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Selecionar todos
  const selectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  // Produtos selecionados para criar pedido
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

  // Criar pedido com itens selecionados
  const handleCreateOrder = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para criar um pedido",
        variant: "destructive",
      });
      return;
    }

    // Abrir modal de criar pedido
    setShowOrderDialog(true);
  };

  // Deletar itens selecionados
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
      <div className="page-container">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
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

            {!isMobile && (
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-64 lg:w-80"
                />
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Busca Mobile */}
        {isMobile && (
          <div className="mb-4">
            <Input
              placeholder="Buscar produtos..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-11 text-base"
            />
          </div>
        )}

        {/* Ações em massa */}
        {selectedItems.size > 0 && (
          <div className="mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between gap-3">
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

        {/* Lista/Tabela */}
        {isMobile ? (
          <PullToRefresh onRefresh={async () => { await mobileRefetch(); }}>
            <ShoppingListMobileList
              items={filteredItems}
              isLoading={isLoading}
              selectedItems={selectedItems}
              onToggleSelection={toggleItemSelection}
              onDelete={async (id) => { await deleteItem.mutateAsync(id); }}
              onUpdate={async (data) => { await updateItem.mutateAsync(data); }}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </PullToRefresh>
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

        {/* Dialog Adicionar Produto */}
        <AddProductToListDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />

        {/* Dialog Criar Pedido */}
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
