import { supabase } from '@/integrations/supabase/client';

/**
 * Função utilitária para buscar produtos de forma consistente
 * Garante que todos os formulários usem a mesma estrutura de consulta
 */
export async function fetchUserProducts(userId: string) {
  const chunkSize = 1000;
  let all: any[] = [];
  let offset = 0;

  // Paginação para garantir que todos os produtos sejam carregados
  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })
      .range(offset, offset + chunkSize - 1);

    if (error) {
      console.error('Error fetching products:', error);
      throw error;
    }

    const batch = data || [];
    all = all.concat(batch);

    if (batch.length < chunkSize) break;
    offset += chunkSize;
  }

  return all;
}

/**
 * Função utilitária para buscar fornecedores de forma consistente
 * Garante que todos os formulários usem a mesma estrutura de consulta
 */
export async function fetchUserSuppliers(userId: string) {
  const chunkSize = 1000;
  let all: any[] = [];
  let offset = 0;

  // Paginação para garantir que todos os fornecedores sejam carregados
  while (true) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })
      .range(offset, offset + chunkSize - 1);

    if (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }

    const batch = data || [];
    all = all.concat(batch);

    if (batch.length < chunkSize) break;
    offset += chunkSize;
  }

  return all;
}