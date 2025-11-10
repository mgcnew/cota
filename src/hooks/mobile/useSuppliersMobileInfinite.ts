import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseSmart } from './useSupabaseSmart';

export interface SupplierMobile {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive" | "pending";
  // Campos opcionais para compatibilidade com desktop
  limit?: string;
  activeQuotes?: number;
  totalQuotes?: number;
  avgPrice?: string;
  lastOrder?: string;
  rating?: number;
  address?: string;
}

export interface UseSuppliersMobileOptions {
  searchQuery?: string;
  statusFilter?: "all" | "active" | "inactive" | "pending";
}

/**
 * Hook otimizado para fornecedores mobile com infinite scroll
 * 
 * Características:
 * - Infinite scroll com useInfiniteQuery
 * - Paginação server-side (limit 20)
 * - Filtros server-side (search, status)
 * - Campos essenciais apenas
 * - Cache agressivo (5 minutos)
 * - Mutations (create, update, delete)
 */
export function useSuppliersMobileInfinite(options: UseSuppliersMobileOptions = {}) {
  const { searchQuery = '', statusFilter = 'all' } = options;
  const supabaseSmart = useSupabaseSmart();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Memoizar limit
  const limit = useMemo(() => supabaseSmart.getLimit(), [supabaseSmart]);

  // Infinite query para carregar páginas progressivamente
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['suppliers-mobile-infinite', searchQuery, statusFilter, limit],
    queryFn: async ({ pageParam = 0 }) => {
      const page = typeof pageParam === 'number' ? pageParam : 0;
      const from = page * limit;
      const to = from + limit - 1;

      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Query otimizada - apenas campos essenciais
      let query = supabase
        .from('suppliers')
        .select('id, name, contact, phone, email', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar busca se houver
      const searchTerm = searchQuery?.trim() || '';
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Aplicar range para paginação
      query = query.range(from, to);

      const { data: suppliersData, error: suppliersError, count } = await query;

      if (suppliersError) throw suppliersError;

      if (!suppliersData || suppliersData.length === 0) {
        return {
          data: [],
          nextPage: undefined,
          total: count || 0,
        };
      }

      // Mapear dados e adicionar status padrão (sempre "active" como no useSuppliers)
      const suppliersWithStatus = suppliersData.map(s => ({
        ...s,
        status: "active" as const,
      }));

      // Aplicar filtro de status após buscar (já que não existe no banco)
      let filteredData = suppliersWithStatus;
      if (statusFilter && statusFilter !== 'all') {
        filteredData = suppliersWithStatus.filter(s => s.status === statusFilter);
      }

      // Calcular próxima página
      const hasMore = to < (count || 0) - 1;
      const nextPage = hasMore ? page + 1 : undefined;

      return {
        data: filteredData as SupplierMobile[],
        nextPage,
        total: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Flatten suppliers de todas as páginas com deduplicação
  const suppliers = useMemo(() => {
    if (!data?.pages) return [];
    
    // Usar Map para garantir unicidade por ID
    const uniqueSuppliers = new Map<string, SupplierMobile>();
    
    data.pages.forEach((page) => {
      page.data.forEach((supplier) => {
        uniqueSuppliers.set(supplier.id, supplier);
      });
    });
    
    return Array.from(uniqueSuppliers.values());
  }, [data?.pages]);

  // Mutation create
  const createSupplier = useMutation({
    mutationFn: async (newSupplier: Omit<SupplierMobile, 'id' | 'status'> & { company_id: string }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([newSupplier])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-mobile-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ 
        title: "Fornecedor criado", 
        description: "O fornecedor foi adicionado com sucesso." 
      });
    },
    onError: (err: Error) => {
      toast({ 
        title: "Erro ao criar fornecedor", 
        description: err.message, 
        variant: "destructive" 
      });
    },
  });

  // Mutation update
  const updateSupplier = useMutation({
    mutationFn: async ({ 
      supplierId, 
      data: updateData 
    }: { 
      supplierId: string; 
      data: Partial<Omit<SupplierMobile, 'id' | 'status'>> 
    }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updateData)
        .eq('id', supplierId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-mobile-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ 
        title: "Fornecedor atualizado", 
        description: "O fornecedor foi atualizado com sucesso." 
      });
    },
    onError: (err: Error) => {
      toast({ 
        title: "Erro ao atualizar fornecedor", 
        description: err.message, 
        variant: "destructive" 
      });
    },
  });

  // Mutation delete
  const deleteSupplier = useMutation({
    mutationFn: async (supplierId: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);
      if (error) throw error;
      return supplierId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-mobile-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ 
        title: "Fornecedor excluído", 
        description: "O fornecedor foi excluído com sucesso." 
      });
    },
    onError: (err: Error) => {
      toast({ 
        title: "Erro ao excluir fornecedor", 
        description: err.message, 
        variant: "destructive" 
      });
    },
  });

  return {
    suppliers,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    error: error as Error | null,
    refetch,
    createSupplier: createSupplier.mutateAsync,
    updateSupplier: updateSupplier.mutateAsync,
    deleteSupplier: deleteSupplier.mutateAsync,
    isUpdating: createSupplier.isPending || updateSupplier.isPending || deleteSupplier.isPending,
  };
}
