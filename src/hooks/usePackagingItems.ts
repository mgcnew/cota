import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { PackagingItem } from '@/types/packaging';

export function usePackagingItems() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['packaging-items'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await (supabase
        .from('packaging_items' as any)
        .select('*')
        .order('name', { ascending: true }) as any);

      if (error) {
        console.error('Erro ao buscar embalagens:', error);
        throw error;
      }

      return (data || []) as PackagingItem[];
    },
  });

  const addItem = useMutation({
    mutationFn: async (item: Omit<PackagingItem, 'id' | 'company_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar company_id do usuário via company_users
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!companyUser?.company_id) throw new Error('Empresa não encontrada');

      const { data, error } = await (supabase
        .from('packaging_items' as any)
        .insert({
          ...item,
          company_id: companyUser.company_id,
        })
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-items'] });
      toast({ title: 'Embalagem cadastrada com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cadastrar embalagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PackagingItem> & { id: string }) => {
      const { data, error } = await (supabase
        .from('packaging_items' as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single() as any);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-items'] });
      toast({ title: 'Embalagem atualizada com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar embalagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('packaging_items' as any)
        .delete()
        .eq('id', id) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packaging-items'] });
      toast({ title: 'Embalagem excluída com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir embalagem',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    items,
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
  };
}
