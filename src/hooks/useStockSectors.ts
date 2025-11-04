import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';

export interface StockSector {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useStockSectors() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sectors = [], isLoading, error } = useQuery({
    queryKey: ['stock-sectors'],
    queryFn: async () => {
      if (!user) throw new Error('Usuário não autenticado');

      // Obter company_id do usuário
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!companyUser) throw new Error('Empresa não encontrada');

      const { data, error: fetchError } = await supabase
        .from('stock_sectors')
        .select('*')
        .eq('company_id', companyUser.company_id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      return data as StockSector[];
    },
    enabled: !!user,
    staleTime: 60000, // 1 minuto - setores mudam raramente
    gcTime: 600000, // 10 minutos
  });

  const createSector = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Obter company_id do usuário
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!companyUser) throw new Error('Empresa não encontrada');

      const { data: sector, error: insertError } = await supabase
        .from('stock_sectors')
        .insert({
          company_id: companyUser.company_id,
          name: data.name,
          description: data.description,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return sector;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-sectors'] });
      toast({
        title: 'Setor criado',
        description: 'O setor foi criado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar setor',
        description: error.message || 'Não foi possível criar o setor.',
        variant: 'destructive',
      });
    },
  });

  const updateSector = useMutation({
    mutationFn: async ({
      id,
      name,
      description,
      is_active,
    }: {
      id: string;
      name?: string;
      description?: string;
      is_active?: boolean;
    }) => {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { data, error } = await supabase
        .from('stock_sectors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-sectors'] });
      toast({
        title: 'Setor atualizado',
        description: 'O setor foi atualizado com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar setor',
        description: error.message || 'Não foi possível atualizar o setor.',
        variant: 'destructive',
      });
    },
  });

  const deleteSector = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('stock_sectors')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-sectors'] });
      toast({
        title: 'Setor excluído',
        description: 'O setor foi excluído com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir setor',
        description: error.message || 'Não foi possível excluir o setor.',
        variant: 'destructive',
      });
    },
  });

  return {
    sectors,
    activeSectors: sectors.filter(s => s.is_active),
    isLoading,
    error,
    createSector,
    updateSector,
    deleteSector,
  };
}

