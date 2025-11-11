import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";

export interface ShoppingListItemMobile {
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

const PAGE_SIZE = 15;

export function useShoppingListMobile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  // Infinite query para lista de compras
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["shopping-list-mobile", search],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("shopping_list")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search.trim()) {
        query = query.or(`product_name.ilike.%${search}%,notes.ilike.%${search}%`);
      }

      const { data: items, error, count } = await query;

      if (error) {
        console.error("Error fetching shopping list:", error);
        throw error;
      }

      return {
        items: (items || []) as ShoppingListItemMobile[],
        nextPage: items && items.length === PAGE_SIZE ? pageParam + 1 : null,
        totalCount: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 30000,
    gcTime: 300000,
  });

  // Achatar dados de páginas
  const items = useMemo(() => {
    if (!data?.pages) return [];
    const allItems = data.pages.flatMap((page) => page.items);
    // Remover duplicados
    const uniqueMap = new Map();
    allItems.forEach((item) => uniqueMap.set(item.id, item));
    return Array.from(uniqueMap.values());
  }, [data?.pages]);

  const totalCount = data?.pages[0]?.totalCount || 0;

  // Adicionar item
  const addItem = useMutation({
    mutationFn: async (itemData: AddShoppingListItemData) => {
      const { data, error } = await supabase
        .from("shopping_list")
        .insert({
          ...itemData,
          priority: itemData.priority || "medium",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list-mobile"] });
      toast({
        title: "Produto adicionado",
        description: "Item adicionado à lista de compras",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar",
        description: error.message || "Não foi possível adicionar",
        variant: "destructive",
      });
    },
  });

  // Atualizar item
  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
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
      queryClient.invalidateQueries({ queryKey: ["shopping-list-mobile"] });
      toast({
        title: "Item atualizado",
        description: "Item atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar",
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
      queryClient.invalidateQueries({ queryKey: ["shopping-list-mobile"] });
      toast({
        title: "Item removido",
        description: "Item removido da lista",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message || "Não foi possível remover",
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
      queryClient.invalidateQueries({ queryKey: ["shopping-list-mobile"] });
      toast({
        title: "Itens removidos",
        description: `${ids.length} ${ids.length === 1 ? 'item removido' : 'itens removidos'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover",
        description: error.message || "Não foi possível remover",
        variant: "destructive",
      });
    },
  });

  return {
    items,
    isLoading,
    totalCount,
    search,
    setSearch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    addItem,
    updateItem,
    deleteItem,
    deleteMultipleItems,
  };
}
