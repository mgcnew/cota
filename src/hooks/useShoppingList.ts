import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/hooks/useCompany";

export interface ShoppingListItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  priority: "low" | "medium" | "high" | "urgent";
  notes?: string;
  category?: string;
  estimated_price?: number;
  created_at: string;
  updated_at: string;
}

export interface AddShoppingListItemData {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  priority?: "low" | "medium" | "high" | "urgent";
  notes?: string;
  category?: string;
  estimated_price?: number;
}

export interface UpdateShoppingListItemData {
  id: string;
  quantity?: number;
  priority?: "low" | "medium" | "high" | "urgent";
  notes?: string;
  estimated_price?: number;
}

export function useShoppingList() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: company } = useCompany();

  // Buscar todos os itens da lista de compras
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["shopping-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shopping_list")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching shopping list:", error);
        throw error;
      }

      return (data || []) as ShoppingListItem[];
    },
  });

  // Adicionar item à lista
  const addItem = useMutation({
    mutationFn: async (itemData: AddShoppingListItemData) => {
      if (!company?.id) {
        throw new Error("Nenhuma empresa selecionada");
      }

      const { data, error } = await supabase
        .from("shopping_list")
        .insert({
          ...itemData,
          company_id: company.id,
          priority: itemData.priority || "medium",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
      toast({
        title: "Produto adicionado",
        description: "Item adicionado à lista de compras com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar",
        description: error.message || "Não foi possível adicionar o item",
        variant: "destructive",
      });
    },
  });

  // Atualizar item
  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateShoppingListItemData) => {
      const { data, error } = await supabase
        .from("shopping_list")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
      toast({
        title: "Item atualizado",
        description: "Item atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o item",
        variant: "destructive",
      });
    },
  });

  // Deletar item
  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shopping_list")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
      toast({
        title: "Item removido",
        description: "Item removido da lista de compras",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message || "Não foi possível remover o item",
        variant: "destructive",
      });
    },
  });

  // Deletar múltiplos itens
  const deleteMultipleItems = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("shopping_list")
        .delete()
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list"] });
      toast({
        title: "Itens removidos",
        description: `${ids.length} ${ids.length === 1 ? 'item removido' : 'itens removidos'} da lista`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message || "Não foi possível remover os itens",
        variant: "destructive",
      });
    },
  });

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
    deleteMultipleItems,
  };
}
