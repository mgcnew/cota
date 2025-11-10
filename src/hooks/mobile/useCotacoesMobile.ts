import { useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSmart } from './useSupabaseSmart';
import { useToast } from '@/hooks/use-toast';

export interface CotacaoMobile {
  id: string;
  produto: string;
  produtoResumo: string;
  produtosLista: string[];
  quantidade: string;
  status: string;
  statusReal: string;
  dataInicio: string;
  dataFim: string;
  dataPlanejada?: string;
  fornecedores: number;
  melhorPreco: string;
  melhorFornecedor: string;
  economia: string;
  fornecedoresParticipantes: Array<{
    id: string;
    nome: string;
    valorOferecido: number;
    dataResposta: string | null;
    observacoes: string;
    status: "pendente" | "respondido";
  }>;
}

export interface UseCotacoesMobileOptions {
  searchTerm?: string;
  statusFilter?: string;
  supplierFilter?: string;
}

/**
 * Hook otimizado para cotações no mobile com infinite scroll
 * 
 * Características:
 * - Infinite scroll com useInfiniteQuery
 * - Paginação server-side (limit 10)
 * - Filtros server-side (search, status, supplier)
 * - Campos essenciais apenas (sem JOINs pesados inicialmente)
 * - Cache agressivo (5 minutos)
 * - Mutations (delete, update, convertToOrder)
 * - Lazy loading de detalhes
 */
export function useCotacoesMobile(options: UseCotacoesMobileOptions = {}) {
  const { searchTerm = '', statusFilter = 'all', supplierFilter = 'all' } = options;
  const { getLimit, queryConfig, isMobile } = useSupabaseSmart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const limit = getLimit();

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
    queryKey: ['cotacoes-mobile', searchTerm, statusFilter, supplierFilter],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * limit;
      const to = from + limit - 1;

      // Construir query base
      let query = supabase
        .from('quotes')
        .select(`
          id,
          status,
          data_inicio,
          data_fim,
          data_planejada,
          created_at
        `, { count: 'exact' })
        .order('data_planejada', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      // Aplicar filtro de status no servidor
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Aplicar busca por ID no servidor (se for um ID válido)
      if (searchTerm && searchTerm.length > 10) {
        // Tentar buscar por ID (UUIDs têm mais de 10 caracteres)
        query = query.ilike('id', `%${searchTerm}%`);
      }

      // Aplicar range para paginação
      query = query.range(from, to);

      const { data: quotesData, error: quotesError, count } = await query;

      if (quotesError) throw quotesError;

      if (!quotesData || quotesData.length === 0) {
        return {
          data: [],
          nextPage: undefined,
          total: count || 0,
        };
      }

      // Buscar items e suppliers apenas dos IDs retornados
      const quoteIds = quotesData.map(q => q.id);
      
      const [itemsResult, suppliersResult, supplierItemsResult] = await Promise.all([
        supabase
          .from('quote_items')
          .select('quote_id, product_id, product_name, quantidade, unidade')
          .in('quote_id', quoteIds),
        supabase
          .from('quote_suppliers')
          .select('quote_id, supplier_id, supplier_name, status, data_resposta, observacoes')
          .in('quote_id', quoteIds),
        supabase
          .from('quote_supplier_items')
          .select('quote_id, supplier_id, product_id, valor_oferecido')
          .in('quote_id', quoteIds)
      ]);

      // Agrupar por quote_id
      const itemsByQuote = new Map();
      const suppliersByQuote = new Map();
      const supplierItemsByQuote = new Map<string, Map<string, number>>();

      itemsResult.data?.forEach(item => {
        if (!itemsByQuote.has(item.quote_id)) {
          itemsByQuote.set(item.quote_id, []);
        }
        itemsByQuote.get(item.quote_id).push(item);
      });

      suppliersResult.data?.forEach(supplier => {
        if (!suppliersByQuote.has(supplier.quote_id)) {
          suppliersByQuote.set(supplier.quote_id, []);
        }
        suppliersByQuote.get(supplier.quote_id).push(supplier);
      });

      // Agrupar supplier items por quote e supplier
      supplierItemsResult.data?.forEach((item: any) => {
        const key = `${item.quote_id}-${item.supplier_id}`;
        if (!supplierItemsByQuote.has(key)) {
          supplierItemsByQuote.set(key, new Map());
        }
        supplierItemsByQuote.get(key)!.set(item.product_id, item.valor_oferecido || 0);
      });

      // Processar cotações
      const cotacoes: CotacaoMobile[] = quotesData
        .map(quote => {
          const items = itemsByQuote.get(quote.id) || [];
          const suppliers = suppliersByQuote.get(quote.id) || [];

          // Filtrar por busca no cliente (para nomes de produtos que não foram filtrados no servidor)
          if (searchTerm && searchTerm.length <= 10) {
            // Apenas busca client-side para termos curtos (nomes de produtos)
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = items.some((item: any) => 
              item.product_name?.toLowerCase().includes(searchLower)
            );
            
            if (!matchesSearch) return null;
          }

          // Filtrar por fornecedor no cliente se especificado
          if (supplierFilter !== 'all') {
            const matchesSupplier = suppliers.some((s: any) => 
              s.supplier_name?.toLowerCase().includes(supplierFilter.toLowerCase())
            );
            if (!matchesSupplier) return null;
          }

          // Calcular valores oferecidos por fornecedor
          const fornecedoresParticipantes = suppliers.map((s: any) => {
            const key = `${quote.id}-${s.supplier_id}`;
            const supplierItems = supplierItemsByQuote.get(key) || new Map();
            const totalValue = Array.from(supplierItems.values()).reduce((sum, val) => sum + val, 0);

            return {
              id: s.supplier_id,
              nome: s.supplier_name || 'Desconhecido',
              valorOferecido: totalValue,
              dataResposta: s.data_resposta ? new Date(s.data_resposta).toLocaleDateString("pt-BR") : null,
              observacoes: s.observacoes || "",
              status: s.status as "pendente" | "respondido"
            };
          });

          // Calcular melhor preço
          const valoresRespondidos = fornecedoresParticipantes
            .filter(f => f.valorOferecido > 0)
            .map(f => f.valorOferecido);
          
          const melhorValor = valoresRespondidos.length > 0 ? Math.min(...valoresRespondidos) : 0;
          const fornecedorMelhorPreco = fornecedoresParticipantes.find(f => f.valorOferecido === melhorValor);

          // Calcular economia
          const calcularEconomia = () => {
            if (valoresRespondidos.length < 2) return "0%";
            
            const maxValor = Math.max(...valoresRespondidos);
            const minValor = Math.min(...valoresRespondidos);
            const economia = maxValor - minValor;
            
            return maxValor > 0 
              ? `${((economia / maxValor) * 100).toFixed(1)}%`
              : "0%";
          };

          const produtosLista = items.map((item: any) => item.product_name || "Produto");
          const produtosTexto = items
            .map((item: any) => `${item.product_name} (${item.quantidade}${item.unidade})`)
            .join(", ");

          let produtoResumo = produtosLista[0] || "Sem produtos";
          if (produtosLista.length > 1) {
            produtoResumo = produtoResumo + "...";
          }

          // Calcular status real baseado em data_planejada
          let statusReal = quote.status;
          if (quote.data_planejada) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            const planejada = new Date(quote.data_planejada);
            planejada.setHours(0, 0, 0, 0);
            
            if (planejada > hoje && quote.status === 'planejada') {
              statusReal = 'planejada';
            } else if (planejada <= hoje && quote.status === 'planejada') {
              statusReal = 'ativa';
            }
          }

          return {
            id: quote.id,
            produto: produtosTexto || "Sem produtos",
            produtoResumo,
            produtosLista,
            quantidade: `${items.length} produto(s)`,
            status: quote.status,
            statusReal,
            dataInicio: new Date(quote.data_inicio).toLocaleDateString("pt-BR"),
            dataFim: new Date(quote.data_fim).toLocaleDateString("pt-BR"),
            dataPlanejada: quote.data_planejada,
            fornecedores: fornecedoresParticipantes.length,
            melhorPreco: melhorValor > 0 ? `R$ ${melhorValor.toFixed(2)}` : "R$ 0.00",
            melhorFornecedor: fornecedorMelhorPreco?.nome || "Aguardando",
            economia: calcularEconomia(),
            fornecedoresParticipantes,
          };
        })
        .filter((cotacao): cotacao is CotacaoMobile => cotacao !== null);

      // Determinar próxima página
      const nextPage = (count || 0) > to + 1 ? pageParam + 1 : undefined;

      return {
        data: cotacoes,
        nextPage,
        total: count || 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: isMobile,
    ...queryConfig,
  });

  // Mutation to update supplier value for a specific product
  const updateSupplierProductValue = useMutation({
    mutationFn: async ({ 
      quoteId, 
      supplierId, 
      productId, 
      newValue 
    }: { 
      quoteId: string; 
      supplierId: string; 
      productId: string; 
      newValue: number;
    }) => {
      // First check if record exists
      const { data: existing } = await supabase
        .from("quote_supplier_items")
        .select("id")
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("quote_supplier_items")
          .update({
            valor_oferecido: newValue
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Get product name
        const { data: productData } = await supabase
          .from("products")
          .select("name")
          .eq("id", productId)
          .single();

        // Create new record
        const { error } = await supabase
          .from("quote_supplier_items")
          .insert({
            quote_id: quoteId,
            supplier_id: supplierId,
            product_id: productId,
            product_name: productData?.name || "Produto",
            valor_oferecido: newValue
          });

        if (error) throw error;
      }

      // Update supplier status
      const { error: statusError } = await supabase
        .from("quote_suppliers")
        .update({
          status: 'respondido',
          data_resposta: new Date().toISOString().split('T')[0]
        })
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId);

      if (statusError) throw statusError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotacoes-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      toast({
        title: "Valor atualizado",
        description: "O valor oferecido foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar o valor",
        variant: "destructive",
      });
    }
  });

  // Mutation to delete quote
  const deleteQuote = useMutation({
    mutationFn: async (quoteId: string) => {
      // Delete related records first (if not using CASCADE)
      await supabase.from("quote_items").delete().eq("quote_id", quoteId);
      await supabase.from("quote_suppliers").delete().eq("quote_id", quoteId);
      await supabase.from("quote_supplier_items").delete().eq("quote_id", quoteId);
      
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotacoes-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      toast({
        title: "Cotação excluída",
        description: "A cotação foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a cotação",
        variant: "destructive",
      });
    }
  });

  // Mutation to update quote
  const updateQuote = useMutation({
    mutationFn: async ({ quoteId, data }: { quoteId: string; data: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Update quote
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          data_inicio: data.dataInicio.toISOString().split('T')[0],
          data_fim: data.dataFim.toISOString().split('T')[0],
          observacoes: data.observacoes || null,
          status: data.status
        })
        .eq("id", quoteId);

      if (quoteError) throw quoteError;

      // Delete old items
      await supabase.from("quote_items").delete().eq("quote_id", quoteId);

      // Insert new items
      const quoteItemsData = data.produtos.map((p: any) => ({
        quote_id: quoteId,
        product_id: p.produtoId,
        product_name: p.produtoNome,
        quantidade: p.quantidade,
        unidade: p.unidade
      }));

      const { error: itemsError } = await supabase
        .from("quote_items")
        .insert(quoteItemsData);

      if (itemsError) throw itemsError;

      // Update suppliers if changed
      if (data.fornecedoresIds && data.fornecedoresIds.length > 0) {
        await supabase.from("quote_suppliers").delete().eq("quote_id", quoteId);

        const { data: suppliersData } = await supabase
          .from("suppliers")
          .select("id, name")
          .in("id", data.fornecedoresIds);

        const quoteSuppliersData = data.fornecedoresIds.map((supplierId: string) => {
          const supplier = suppliersData?.find(s => s.id === supplierId);
          return {
            quote_id: quoteId,
            supplier_id: supplierId,
            supplier_name: supplier?.name || "Desconhecido",
            status: 'pendente'
          };
        });

        const { error: suppliersError } = await supabase
          .from("quote_suppliers")
          .insert(quoteSuppliersData);

        if (suppliersError) throw suppliersError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotacoes-mobile'] });
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      toast({
        title: "Cotação atualizada",
        description: "A cotação foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível atualizar a cotação",
        variant: "destructive",
      });
    }
  });

  // Convert quote to order(s) - supports multiple suppliers
  const convertToOrder = useMutation({
    mutationFn: async ({
      quoteId,
      orders
    }: {
      quoteId: string;
      orders: Array<{
        supplierId: string;
        productIds: string[];
        deliveryDate: string;
        observations?: string;
      }>;
    }) => {
      // Get the authenticated user's ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get company_id
      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) {
        throw new Error("Empresa não encontrada");
      }

      // Fetch quote details to get quote items
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select("*, quote_items (*)")
        .eq("id", quoteId)
        .single();

      if (quoteError) throw quoteError;

      const createdOrderIds: string[] = [];
      let totalValueAllOrders = 0;

      // Loop through each supplier order
      for (const order of orders) {
        const { supplierId, productIds, deliveryDate, observations } = order;

        // Fetch supplier details
        const { data: supplierData, error: supplierError } = await supabase
          .from("suppliers")
          .select("*")
          .eq("id", supplierId)
          .single();

        if (supplierError) throw supplierError;

        // Fetch supplier items for this quote and supplier
        const { data: supplierItems, error: supplierItemsError } = await supabase
          .from("quote_supplier_items")
          .select("*")
          .eq("quote_id", quoteId)
          .eq("supplier_id", supplierId)
          .in("product_id", productIds);

        if (supplierItemsError) throw supplierItemsError;

        // Calculate total value based on supplier items for these specific products
        const totalValue = supplierItems.reduce((sum, item) => {
          return sum + (item.valor_oferecido || 0);
        }, 0);

        totalValueAllOrders += totalValue;

        // Create the order
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            company_id: companyData.company_id,
            supplier_id: supplierId,
            supplier_name: supplierData.name,
            total_value: totalValue,
            order_date: new Date().toISOString().split('T')[0],
            delivery_date: deliveryDate,
            status: "pendente",
            observations: observations || null
          })
          .select()
          .single();

        if (orderError) throw orderError;

        createdOrderIds.push(orderData.id);

        // Create order items only for the selected products
        const orderItems = quoteData.quote_items
          .filter((item: any) => productIds.includes(item.product_id))
          .map((item: any) => {
            const supplierItem = supplierItems.find((si: any) => si.product_id === item.product_id);
            
            return {
              order_id: orderData.id,
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: parseInt(item.quantidade) || 1,
              unit: item.unidade || 'un',
              unit_price: supplierItem?.valor_oferecido || 0,
              total_price: (supplierItem?.valor_oferecido || 0) * (parseInt(item.quantidade) || 1)
            };
          });

        const { error: orderItemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (orderItemsError) throw orderItemsError;
      }

      // Update quote status to finalizada
      const { error: updateError } = await supabase
        .from("quotes")
        .update({ status: "finalizada" })
        .eq("id", quoteId);

      if (updateError) throw updateError;

      return { orderIds: createdOrderIds, totalValue: totalValueAllOrders };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes-mobile"] });
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      const count = data.orderIds.length;
      toast({
        title: count > 1 ? "Pedidos criados!" : "Pedido criado!",
        description: count > 1 
          ? `${count} pedidos foram criados com sucesso no valor total de R$ ${data.totalValue.toFixed(2)}`
          : `A cotação foi convertida em pedido com sucesso no valor de R$ ${data.totalValue.toFixed(2)}`
      });
    },
    onError: (error) => {
      console.error("Erro ao converter cotação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível converter a cotação em pedido.",
        variant: "destructive"
      });
    }
  });

  // Acumular todas as cotações de todas as páginas com deduplicação
  const cotacoes = useMemo(() => {
    if (!data?.pages) return [];
    
    // Usar Map para garantir unicidade por ID
    const uniqueCotacoes = new Map<string, CotacaoMobile>();
    
    data.pages.forEach((page) => {
      page.data.forEach((cotacao) => {
        uniqueCotacoes.set(cotacao.id, cotacao);
      });
    });
    
    return Array.from(uniqueCotacoes.values());
  }, [data?.pages]);

  return {
    cotacoes,
    isLoading,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    error: error as Error | null,
    updateSupplierProductValue: updateSupplierProductValue.mutate,
    deleteQuote: deleteQuote.mutate,
    updateQuote: updateQuote.mutate,
    convertToOrder: convertToOrder.mutate,
    isUpdating: updateSupplierProductValue.isPending || deleteQuote.isPending || updateQuote.isPending || convertToOrder.isPending,
    refetch,
  };
}

/**
 * Hook para carregar detalhes completos de uma cotação
 * Usado apenas quando modal é aberto
 */
export function useCotacaoDetails(quoteId: string | null, enabled: boolean = false) {
  const { queryConfig } = useSupabaseSmart();

  return useQuery({
    queryKey: ['cotacao-details', quoteId],
    queryFn: async () => {
      if (!quoteId) return null;

      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items(*),
          quote_suppliers(*)
        `)
        .eq('id', quoteId)
        .single();

      if (error) throw error;

      // Buscar supplier items
      const { data: supplierItems } = await supabase
        .from('quote_supplier_items')
        .select('*')
        .eq('quote_id', quoteId);

      return {
        ...data,
        supplier_items: supplierItems || [],
      };
    },
    enabled: enabled && !!quoteId,
    ...queryConfig,
  });
}
