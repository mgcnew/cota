import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';
import type { 
  PackagingQuoteDisplay, 
  PackagingSupplierDisplay,
  PackagingComparison 
} from '@/types/packaging';

// Global flag to prevent multiple subscriptions across hook instances
let isRealtimeSubscribed = false;
let globalChannel: ReturnType<typeof supabase.channel> | null = null;

export function usePackagingQuotes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ==========================================
  // REALTIME SUBSCRIPTION
  // Listen for changes in packaging quotes/items
  // ==========================================
  useEffect(() => {
    // Prevent multiple components from creating duplicate listeners
    if (isRealtimeSubscribed) return;
    
    console.log("🔄 Realtime: Ativando canais de escuta para EMBALAGENS...");
    isRealtimeSubscribed = true;
    
    globalChannel = supabase
      .channel('packaging-quotes-realtime-global')
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'packaging_quotes' }, (payload: any) => {
        console.log("⚡ Realtime Update [packaging_quotes]:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ['packaging-quotes'] });
      })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'packaging_quote_items' }, (payload: any) => {
        console.log("⚡ Realtime Update [packaging_quote_items]:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ['packaging-quotes'] });
      })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'packaging_quote_suppliers' }, (payload: any) => {
        console.log("⚡ Realtime Update [packaging_quote_suppliers]:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ['packaging-quotes'] });
      })
      .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'packaging_supplier_items' }, (payload: any) => {
        console.log("⚡ Realtime Update [packaging_supplier_items]:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ['packaging-quotes'] });
      })
      .subscribe((status) => {
        console.log("📡 Packaging Realtime Status:", status);
      });

    return () => {
      // In a real app we might want to clean this up when ALL components unmount,
      // but for SPA keeping it alive is fine, or we could just leave it.
      // We will only let it unsubscribe if we want to reset it.
    };
  }, [queryClient]);

  const { data: quotes = [], isLoading, error } = useQuery({
    queryKey: ['packaging-quotes'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar cotações com itens e fornecedores
      const { data: quotesData, error: quotesError } = await (supabase
        .from('packaging_quotes' as any)
        .select(`
          *,
          packaging_quote_items(*),
          packaging_quote_suppliers(*)
        `)
        .order('created_at', { ascending: false }) as any);

      if (quotesError) {
        console.error('Erro ao buscar cotações de embalagens:', quotesError);
        throw quotesError;
      }

      if (!quotesData || quotesData.length === 0) {
        return [];
      }

      // Buscar todos os supplier_items
      const { data: supplierItems, error: siError } = await (supabase
        .from('packaging_supplier_items' as any)
        .select('*') as any);

      if (siError) {
        console.warn('Erro ao buscar itens de fornecedores:', siError);
      }

      // Transformar para formato de exibição
      const quotesDisplay: PackagingQuoteDisplay[] = quotesData.map((quote: any) => {
        const items = quote.packaging_quote_items || [];
        const suppliers = quote.packaging_quote_suppliers || [];
        const quoteSupplierItems = (supplierItems || []).filter((si: any) => si.quote_id === quote.id);

        // Mapear fornecedores com seus itens
        const fornecedores: PackagingSupplierDisplay[] = suppliers.map((s: any) => {
          const supplierItemsList = quoteSupplierItems.filter((si: any) => si.supplier_id === s.supplier_id);
          const custoTotal = supplierItemsList.reduce((sum: number, si: any) => sum + (si.valor_total || 0), 0);

          return {
            id: s.id,
            supplierId: s.supplier_id,
            supplierName: s.supplier_name,
            status: s.status as "pendente" | "respondido",
            dataResposta: s.data_resposta ? (() => {
              const [y, m, d] = s.data_resposta.split('T')[0].split('-').map(Number);
              return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
            })() : null,
            observacoes: s.observacoes,
            itens: supplierItemsList.map((si: any) => ({
              id: si.id,
              packagingId: si.packaging_id,
              packagingName: si.packaging_name,
              valorTotal: si.valor_total,
              unidadeVenda: si.unidade_venda,
              quantidadeVenda: si.quantidade_venda,
              quantidadeUnidadesEstimada: si.quantidade_unidades_estimada,
              gramatura: si.gramatura,
              dimensoes: si.dimensoes,
              custoPorUnidade: si.custo_por_unidade,
            })),
            custoTotalEstimado: custoTotal,
            access_token: s.access_token,
          };
        });

        // Calcular melhor preço
        const fornecedoresComPreco = fornecedores.filter(f => f.custoTotalEstimado > 0);
        const melhorValor = fornecedoresComPreco.length > 0 
          ? Math.min(...fornecedoresComPreco.map(f => f.custoTotalEstimado))
          : 0;
        const melhorFornecedor = fornecedores.find(f => f.custoTotalEstimado === melhorValor);

        // Calcular economia
        let economia = "0%";
        if (fornecedoresComPreco.length >= 2) {
          const valores = fornecedoresComPreco.map(f => f.custoTotalEstimado);
          const max = Math.max(...valores);
          const min = Math.min(...valores);
          economia = max > 0 ? `${(((max - min) / max) * 100).toFixed(1)}%` : "0%";
        }

        return {
          id: quote.id,
          status: quote.status,
          dataInicio: (() => {
            const [y, m, d] = quote.data_inicio.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
          })(),
          dataFim: (() => {
            const [y, m, d] = quote.data_fim.split('-').map(Number);
            return new Date(y, m - 1, d).toLocaleDateString('pt-BR');
          })(),
          observacoes: quote.observacoes,
          itens: items.map((item: any) => ({
            id: item.id,
            packagingId: item.packaging_id,
            packagingName: item.packaging_name,
            quantidadeNecessaria: item.quantidade_necessaria,
          })),
          fornecedores,
          melhorPreco: melhorValor > 0 ? formatCurrency(melhorValor) : '-',
          melhorFornecedor: melhorFornecedor?.supplierName || '-',
          economia,
        };
      });

      return quotesDisplay;
    },
  });

  const addQuote = useMutation({
    mutationFn: async (data: {
      dataInicio: Date;
      dataFim: Date;
      observacoes?: string;
      itens: { packagingId: string; packagingName: string; quantidadeNecessaria?: number }[];
      fornecedoresIds: string[];
      fornecedoresNomes: { [id: string]: string };
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar company_id do usuário via company_users
      const { data: companyUser } = await supabase
        .from('company_users')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (!companyUser?.company_id) throw new Error('Empresa não encontrada');

      // Criar cotação
      const { data: quote, error: quoteError } = await (supabase
        .from('packaging_quotes' as any)
        .insert({
          company_id: companyUser.company_id,
          status: 'ativa',
          data_inicio: data.dataInicio.toISOString().split('T')[0],
          data_fim: data.dataFim.toISOString().split('T')[0],
          observacoes: data.observacoes || null,
        })
        .select()
        .single() as any);

      if (quoteError) throw quoteError;

      // Criar itens da cotação
      if (data.itens.length > 0) {
        const { error: itemsError } = await (supabase
          .from('packaging_quote_items' as any)
          .insert(
            data.itens.map(item => ({
              quote_id: quote.id,
              packaging_id: item.packagingId,
              packaging_name: item.packagingName,
              quantidade_necessaria: item.quantidadeNecessaria || null,
            }))
          ) as any);

        if (itemsError) throw itemsError;
      }

      // Criar fornecedores da cotação
      if (data.fornecedoresIds.length > 0) {
        const { error: suppliersError } = await (supabase
          .from('packaging_quote_suppliers' as any)
          .insert(
            data.fornecedoresIds.map(supplierId => ({
              quote_id: quote.id,
              supplier_id: supplierId,
              supplier_name: data.fornecedoresNomes[supplierId] || 'Fornecedor',
              status: 'pendente',
            }))
          ) as any);

        if (suppliersError) throw suppliersError;

        // Criar registros de supplier_items para cada combinação
        const supplierItemsToInsert = [];
        for (const supplierId of data.fornecedoresIds) {
          for (const item of data.itens) {
            supplierItemsToInsert.push({
              quote_id: quote.id,
              supplier_id: supplierId,
              packaging_id: item.packagingId,
              packaging_name: item.packagingName,
            });
          }
        }

        if (supplierItemsToInsert.length > 0) {
          const { error: siError } = await (supabase
            .from('packaging_supplier_items' as any)
            .insert(supplierItemsToInsert) as any);

          if (siError) console.warn('Erro ao criar supplier_items:', siError);
        }
      }

      return quote;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['packaging-quotes'] });
      toast({ title: 'Cotação de embalagem criada com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar cotação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateSupplierItem = useMutation({
    mutationFn: async (data: {
      quoteId: string;
      supplierId: string;
      packagingId: string;
      valorTotal: number;
      unidadeVenda: string;
      quantidadeVenda: number;
      quantidadeUnidadesEstimada: number;
      gramatura?: number;
      dimensoes?: string;
    }) => {
      // Calcular custo por unidade
      const custoPorUnidade = data.quantidadeUnidadesEstimada > 0 
        ? data.valorTotal / data.quantidadeUnidadesEstimada 
        : null;

      console.log('Atualizando supplier_item:', {
        quoteId: data.quoteId,
        supplierId: data.supplierId,
        packagingId: data.packagingId,
        valorTotal: data.valorTotal,
        custoPorUnidade
      });

      // Primeiro, verificar se o registro existe
      const { data: existingItem, error: selectError } = await (supabase
        .from('packaging_supplier_items' as any)
        .select('id')
        .eq('quote_id', data.quoteId)
        .eq('supplier_id', data.supplierId)
        .eq('packaging_id', data.packagingId)
        .maybeSingle() as any);

      if (selectError) {
        console.error('Erro ao buscar supplier_item:', selectError);
        throw selectError;
      }

      console.log('Registro existente:', existingItem);

      if (existingItem) {
        // Atualizar registro existente
        const { error: updateError, data: updatedData } = await (supabase
          .from('packaging_supplier_items' as any)
          .update({
            valor_total: data.valorTotal,
            unidade_venda: data.unidadeVenda,
            quantidade_venda: data.quantidadeVenda,
            quantidade_unidades_estimada: data.quantidadeUnidadesEstimada,
            gramatura: data.gramatura || null,
            dimensoes: data.dimensoes || null,
            custo_por_unidade: custoPorUnidade,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingItem.id)
          .select() as any);

        if (updateError) {
          console.error('Erro ao atualizar supplier_item:', updateError);
          throw updateError;
        }
        console.log('Registro atualizado:', updatedData);
      } else {
        // Buscar o nome da embalagem
        const { data: quoteItem } = await (supabase
          .from('packaging_quote_items' as any)
          .select('packaging_name')
          .eq('quote_id', data.quoteId)
          .eq('packaging_id', data.packagingId)
          .single() as any);

        // Criar novo registro
        const { error: insertError, data: insertedData } = await (supabase
          .from('packaging_supplier_items' as any)
          .insert({
            quote_id: data.quoteId,
            supplier_id: data.supplierId,
            packaging_id: data.packagingId,
            packaging_name: quoteItem?.packaging_name || '',
            valor_total: data.valorTotal,
            unidade_venda: data.unidadeVenda,
            quantidade_venda: data.quantidadeVenda,
            quantidade_unidades_estimada: data.quantidadeUnidadesEstimada,
            gramatura: data.gramatura || null,
            dimensoes: data.dimensoes || null,
            custo_por_unidade: custoPorUnidade,
          })
          .select() as any);

        if (insertError) {
          console.error('Erro ao inserir supplier_item:', insertError);
          throw insertError;
        }
        console.log('Registro inserido:', insertedData);
      }

      // Atualizar status do fornecedor para "respondido"
      const { error: supplierError } = await (supabase
        .from('packaging_quote_suppliers' as any)
        .update({
          status: 'respondido',
          data_resposta: new Date().toISOString(),
        })
        .eq('quote_id', data.quoteId)
        .eq('supplier_id', data.supplierId) as any);

      if (supplierError) {
        console.error('Erro ao atualizar status do fornecedor:', supplierError);
      }
    },
    onSuccess: async () => {
      // Usar refetchQueries para forçar atualização imediata
      await queryClient.refetchQueries({ queryKey: ['packaging-quotes'] });
      toast({ title: 'Valor atualizado com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar valor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateQuoteStatus = useMutation({
    mutationFn: async ({ quoteId, status }: { quoteId: string; status: string }) => {
      const { error } = await (supabase
        .from('packaging_quotes' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', quoteId) as any);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['packaging-quotes'] });
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (quoteId: string) => {
      // Remover itens associados em ordem reversa para evitar falha de chave estrangeira (FK Constraint)
      
      // 1. Remover vinculo em possíveis orders
      await (supabase.from('packaging_orders' as any).update({ quote_id: null }).eq('quote_id', quoteId) as any);
      
      // 2. Remover supplier items
      await (supabase.from('packaging_supplier_items' as any).delete().eq('quote_id', quoteId) as any);
      
      // 3. Remover quote suppliers
      await (supabase.from('packaging_quote_suppliers' as any).delete().eq('quote_id', quoteId) as any);
      
      // 4. Remover quote items
      await (supabase.from('packaging_quote_items' as any).delete().eq('quote_id', quoteId) as any);

      // 5. Por fim, excluir a cotação
      const { error } = await (supabase
        .from('packaging_quotes' as any)
        .delete()
        .eq('id', quoteId) as any);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['packaging-quotes'] });
      toast({ title: 'Cotação excluída com sucesso!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir cotação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Função para gerar comparativo de preços
  const getComparison = (quote: PackagingQuoteDisplay): PackagingComparison[] => {
    const comparisons: PackagingComparison[] = [];

    for (const item of quote.itens) {
      const fornecedoresComPreco: PackagingComparison['fornecedores'] = [];

      for (const fornecedor of quote.fornecedores) {
        const supplierItem = fornecedor.itens.find(si => si.packagingId === item.packagingId);
        
        if (supplierItem && supplierItem.custoPorUnidade && supplierItem.custoPorUnidade > 0) {
          fornecedoresComPreco.push({
            supplierId: fornecedor.supplierId,
            supplierName: fornecedor.supplierName,
            valorTotal: supplierItem.valorTotal || 0,
            unidadeVenda: supplierItem.unidadeVenda || '',
            quantidadeVenda: supplierItem.quantidadeVenda || 0,
            quantidadeUnidades: supplierItem.quantidadeUnidadesEstimada || 0,
            custoPorUnidade: supplierItem.custoPorUnidade,
            gramatura: supplierItem.gramatura,
            dimensoes: supplierItem.dimensoes,
            isMelhorPreco: false,
            diferencaPercentual: 0,
          });
        }
      }

      // Calcular melhor preço e diferenças
      if (fornecedoresComPreco.length > 0) {
        const menorCusto = Math.min(...fornecedoresComPreco.map(f => f.custoPorUnidade));
        
        fornecedoresComPreco.forEach(f => {
          f.isMelhorPreco = f.custoPorUnidade === menorCusto;
          f.diferencaPercentual = menorCusto > 0 
            ? ((f.custoPorUnidade - menorCusto) / menorCusto) * 100 
            : 0;
        });

        // Ordenar por custo
        fornecedoresComPreco.sort((a, b) => a.custoPorUnidade - b.custoPorUnidade);
      }

      comparisons.push({
        packagingId: item.packagingId,
        packagingName: item.packagingName,
        fornecedores: fornecedoresComPreco,
      });
    }

    return comparisons;
  };

  // Adicionar fornecedor à cotação
  const addQuoteSupplier = useMutation({
    mutationFn: async (data: { quoteId: string; supplierId: string; supplierName: string }) => {
      // Adicionar fornecedor
      const { error: supplierError } = await (supabase
        .from('packaging_quote_suppliers' as any)
        .insert({
          quote_id: data.quoteId,
          supplier_id: data.supplierId,
          supplier_name: data.supplierName,
          status: 'pendente',
        }) as any);

      if (supplierError) throw supplierError;

      // Buscar itens da cotação para criar supplier_items
      const { data: quoteItems } = await (supabase
        .from('packaging_quote_items' as any)
        .select('packaging_id, packaging_name')
        .eq('quote_id', data.quoteId) as any);

      if (quoteItems && quoteItems.length > 0) {
        const supplierItemsToInsert = quoteItems.map((item: any) => ({
          quote_id: data.quoteId,
          supplier_id: data.supplierId,
          packaging_id: item.packaging_id,
          packaging_name: item.packaging_name,
        }));

        await (supabase
          .from('packaging_supplier_items' as any)
          .insert(supplierItemsToInsert) as any);
      }
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['packaging-quotes'] });
      toast({ title: 'Fornecedor adicionado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao adicionar fornecedor', description: error.message, variant: 'destructive' });
    },
  });

  // Remover fornecedor da cotação
  const removeQuoteSupplier = useMutation({
    mutationFn: async (data: { quoteId: string; supplierId: string }) => {
      // Remover supplier_items primeiro
      await (supabase
        .from('packaging_supplier_items' as any)
        .delete()
        .eq('quote_id', data.quoteId)
        .eq('supplier_id', data.supplierId) as any);

      // Remover fornecedor
      const { error } = await (supabase
        .from('packaging_quote_suppliers' as any)
        .delete()
        .eq('quote_id', data.quoteId)
        .eq('supplier_id', data.supplierId) as any);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['packaging-quotes'] });
      toast({ title: 'Fornecedor removido!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover fornecedor', description: error.message, variant: 'destructive' });
    },
  });

  // Adicionar embalagem à cotação
  const addQuoteItem = useMutation({
    mutationFn: async (data: { quoteId: string; packagingId: string; packagingName: string }) => {
      // Adicionar item
      const { error: itemError } = await (supabase
        .from('packaging_quote_items' as any)
        .insert({
          quote_id: data.quoteId,
          packaging_id: data.packagingId,
          packaging_name: data.packagingName,
        }) as any);

      if (itemError) throw itemError;

      // Buscar fornecedores da cotação para criar supplier_items
      const { data: quoteSuppliers } = await (supabase
        .from('packaging_quote_suppliers' as any)
        .select('supplier_id')
        .eq('quote_id', data.quoteId) as any);

      if (quoteSuppliers && quoteSuppliers.length > 0) {
        const supplierItemsToInsert = quoteSuppliers.map((s: any) => ({
          quote_id: data.quoteId,
          supplier_id: s.supplier_id,
          packaging_id: data.packagingId,
          packaging_name: data.packagingName,
        }));

        await (supabase
          .from('packaging_supplier_items' as any)
          .insert(supplierItemsToInsert) as any);
      }
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['packaging-quotes'] });
      toast({ title: 'Embalagem adicionada!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao adicionar embalagem', description: error.message, variant: 'destructive' });
    },
  });

  // Remover embalagem da cotação
  const removeQuoteItem = useMutation({
    mutationFn: async (data: { quoteId: string; packagingId: string }) => {
      // Remover supplier_items primeiro
      await (supabase
        .from('packaging_supplier_items' as any)
        .delete()
        .eq('quote_id', data.quoteId)
        .eq('packaging_id', data.packagingId) as any);

      // Remover item
      const { error } = await (supabase
        .from('packaging_quote_items' as any)
        .delete()
        .eq('quote_id', data.quoteId)
        .eq('packaging_id', data.packagingId) as any);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['packaging-quotes'] });
      toast({ title: 'Embalagem removida!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover embalagem', description: error.message, variant: 'destructive' });
    },
  });

  return {
    quotes,
    isLoading,
    error,
    addQuote,
    updateSupplierItem,
    updateQuoteStatus,
    deleteQuote,
    getComparison,
    addQuoteSupplier,
    removeQuoteSupplier,
    addQuoteItem,
    removeQuoteItem,
  };
}
