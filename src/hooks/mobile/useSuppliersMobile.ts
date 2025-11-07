import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useServerPagination, ServerPaginationParams } from './useServerPagination';
import { useMobileQueryConfig } from './useMobileQueryConfig';

export interface SupplierMobile {
  id: string;
  name: string;
  contact?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive" | "pending";
}

/**
 * Hook otimizado para mobile - carrega apenas dados essenciais de fornecedores
 * Usa paginação server-side para melhor performance
 */
export function useSuppliersMobile(searchQuery?: string, statusFilter?: "all" | "active" | "inactive" | "pending", enabled: boolean = true) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query principal com paginação server-side
  const pagination = useServerPagination<SupplierMobile>({
    queryKey: ['suppliers-mobile', searchQuery, statusFilter],
    enabled,
    queryFn: async (params: ServerPaginationParams) => {
      const { page, pageSize } = params;

      // Verificar autenticação
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ useSuppliersMobile: Erro de autenticação', authError);
        throw new Error('Usuário não autenticado');
      }
      
      console.log('✅ useSuppliersMobile: Usuário autenticado', user.id);

      // Query otimizada - apenas campos essenciais
      // NOTA: A tabela suppliers NÃO tem campo 'status' no banco, ele é calculado no código
      console.log('📦 useSuppliersMobile: Buscando fornecedores', { page, pageSize, searchQuery, statusFilter });
      let query = supabase
        .from('suppliers')
        .select('id, name, contact, phone, email', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Aplicar busca se houver
      const searchTerm = searchQuery?.trim() || '';
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // NOTA: Não podemos filtrar por status no banco porque a tabela não tem esse campo
      // O status é sempre "active" no código (ver useSuppliers.ts linha 184)
      // O filtro de status será aplicado depois no mapeamento

      // Aplicar paginação
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar fornecedores mobile:', error);
        throw error;
      }

      console.log('📦 useSuppliersMobile: Resultados recebidos', { 
        dataCount: data?.length || 0, 
        totalCount: count || 0,
        sample: data?.slice(0, 2)
      });

      // Mapear dados e adicionar status padrão (sempre "active" como no useSuppliers)
      const suppliersWithStatus = (data || []).map(s => ({
        ...s,
        status: "active" as const, // Status sempre "active" (como no useSuppliers)
      }));

      // Aplicar filtro de status após buscar (já que não existe no banco)
      let filteredData = suppliersWithStatus;
      if (statusFilter && statusFilter !== 'all') {
        filteredData = suppliersWithStatus.filter(s => s.status === statusFilter);
      }

      console.log('📦 useSuppliersMobile: Dados processados', { 
        originalCount: data?.length || 0,
        filteredCount: filteredData.length,
        statusFilter 
      });

      return { data: filteredData as SupplierMobile[], total: count || 0 };
    },
    initialPageSize: 20, // Menos itens por página no mobile
  });

  const createSupplier = useMutation({
    mutationFn: async (newSupplier: Omit<SupplierMobile, 'id'> & { company_id: string }) => {
      const { data, error } = await supabase.from('suppliers').insert([newSupplier]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: "Fornecedor criado", description: "O fornecedor foi adicionado com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao criar fornecedor", description: err.message, variant: "destructive" });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ supplierId, data }: { supplierId: string; data: Partial<Omit<SupplierMobile, 'id'>> }) => {
      const { data: updatedData, error } = await supabase.from('suppliers').update(data).eq('id', supplierId).select().single();
      if (error) throw error;
      return updatedData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: "Fornecedor atualizado", description: "O fornecedor foi atualizado com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao atualizar fornecedor", description: err.message, variant: "destructive" });
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (supplierId: string) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', supplierId);
      if (error) throw error;
      return supplierId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast({ title: "Fornecedor excluído", description: "O fornecedor foi excluído com sucesso." });
    },
    onError: (err) => {
      toast({ title: "Erro ao excluir fornecedor", description: err.message, variant: "destructive" });
    },
  });

  return {
    suppliers: pagination.data,
    isLoading: pagination.isLoading,
    error: pagination.error,
    pagination: pagination.pagination,
    refetch: pagination.refetch,
    createSupplier: createSupplier.mutateAsync,
    updateSupplier: updateSupplier.mutateAsync,
    deleteSupplier: deleteSupplier.mutateAsync,
  };
}

