import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { PricingUnit, normalizePrice } from '@/utils/priceNormalization';
import { formatLocalDate } from '@/lib/utils';

export interface FornecedorParticipante {
  id: string;
  nome: string;
  valorOferecido: number;
  dataResposta: string | null;
  observacoes: string;
  status: "pendente" | "respondido";
  accessToken?: string;
}

// Interface for supplier item with pricing metadata
export interface SupplierItemWithPricing {
  id: string;
  quote_id: string;
  supplier_id: string;
  product_id: string;
  product_name: string;
  valor_oferecido: number | null;
  unidade_preco: PricingUnit | null;
  fator_conversao: number | null;
  quantidade_por_embalagem: number | null;
  brand_id: string | null;
  brand_name: string | null;
  brand_rating: number | null;
  updated_by_type: 'comprador' | 'fornecedor' | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
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
  fornecedoresParticipantes: FornecedorParticipante[];
}

/**
 * Determines the default pricing unit based on product's base unit
 * Requirements: 5.5 - Default to product's base unit when not specified
 */
function getDefaultPricingUnit(productUnit?: string): PricingUnit {
  if (!productUnit) return 'un';
  
  const normalizedUnit = productUnit.toLowerCase().trim();
  const weightUnits = ['kg', 'g', 'mg', 'ton', 'tonelada'];
  
  if (weightUnits.includes(normalizedUnit)) {
    return 'kg';
  }
  
  return 'un';
}

// Global flag to prevent multiple subscriptions across hook instances
let isRealtimeSubscribed = false;
let globalChannel: ReturnType<typeof supabase.channel> | null = null;

// Phase 2: Deduplication guard — tracks when the last local mutation completed
// If realtime fires within this window, we skip the invalidation (mutation already handled it)
let lastMutationTimestamp = 0;
const DEDUP_WINDOW_MS = 1500;

function markMutationComplete() {
  lastMutationTimestamp = Date.now();
}

function shouldSkipRealtimeInvalidation(): boolean {
  return (Date.now() - lastMutationTimestamp) < DEDUP_WINDOW_MS;
}

export function useCotacoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // ==========================================
  // REALTIME SUBSCRIPTION (Phase 2: with dedup guard)
  // Listen for changes in quotes, suppliers and prices
  // ==========================================
  useEffect(() => {
    // Prevent multiple components from creating duplicate listeners
    if (isRealtimeSubscribed) return;

    console.log("🔄 Realtime: Ativando canais de escuta...");
    isRealtimeSubscribed = true;

    const handleRealtimeEvent = (table: string, payload: any) => {
      if (shouldSkipRealtimeInvalidation()) {
        console.log(`⏭️ Realtime [${table}]: Skipped (mutation just completed)`);
        return;
      }
      console.log(`⚡ Realtime Update [${table}]:`, payload.eventType);
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
    };
    
    // Inscreve-se apenas uma vez para todos os canais relevantes
    globalChannel = supabase
      .channel('quotes-realtime-global')
      .on('postgres_changes' as any, { event: '*', table: 'quotes' }, (payload: any) => handleRealtimeEvent('quotes', payload))
      .on('postgres_changes' as any, { event: '*', table: 'quote_items' }, (payload: any) => handleRealtimeEvent('quote_items', payload))
      .on('postgres_changes' as any, { event: '*', table: 'quote_suppliers' }, (payload: any) => handleRealtimeEvent('quote_suppliers', payload))
      .on('postgres_changes' as any, { event: '*', table: 'quote_supplier_items' }, (payload: any) => handleRealtimeEvent('quote_supplier_items', payload))
      .subscribe((status) => {
        console.log("📡 Realtime Status:", status);
      });

    return () => {
      // Keep it alive globally to prevent thrashing
    };
  }, [queryClient]);

  const { data: cotacoes = [], isLoading } = useQuery({
    queryKey: ['cotacoes'],
    queryFn: async () => {
      try {
        // Fetch quotes with related data (last 6 months only)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const dateFilter = sixMonthsAgo.toISOString().split('T')[0];

        const { data: quotesData, error: quotesError } = await supabase
          .from("quotes")
          .select(`
            *,
            quote_items(*),
            quote_suppliers(*, access_token)
          `)
          .gte('created_at', dateFilter)
          .order("created_at", { ascending: false });

        if (quotesError) {
          console.error("❌ Error fetching quotes:", quotesError);
          // MOSTRE UM ALERT FEIO E GIGANTE SE HOUVER ERRO DE SQL
          alert("ERRO NO BANCO DE DADOS: " + (quotesError.message || JSON.stringify(quotesError)));
          throw quotesError;
        }

        if (!quotesData || quotesData.length === 0) {
          console.log("✅ No quotes found");
          return [];
        }

        console.log(`✅ Fetched ${quotesData.length} quotes`);

        // Fetch all quote_supplier_items separately with pricing metadata
        // Requirements: 1.4 - Include unidade_preco, fator_conversao, quantidade_por_embalagem
        // Try to fetch with new columns first, fallback to basic columns if they don't exist
        let supplierItemsData: any[] | null = null;
        let supplierItemsError: any = null;

        // Get quote IDs to filter supplier items
        const quoteIds = quotesData.map(q => q.id);

        try {
          // Buscar supplier_items apenas das cotações carregadas, ordenados por updated_at
          const result = await supabase
            .from("quote_supplier_items")
            .select(`
              id,
              quote_id,
              supplier_id,
              product_id,
              product_name,
              valor_oferecido,
              valor_inicial,
              price_history,
              unidade_preco,
              fator_conversao,
              quantidade_por_embalagem,
              brand_id,
              brands(name, manual_rating),
              updated_by_type,
              created_at
            `)
            .in('quote_id', quoteIds)
            .order('created_at', { ascending: false });
          supplierItemsData = result.data;
          supplierItemsError = result.error;
        } catch (e) {
          console.warn("⚠️ Error fetching with new columns, trying fallback:", e);
        }

        // Fallback: if error (columns might not exist), try without new columns
        if (supplierItemsError) {
          console.warn("⚠️ Pricing columns may not exist, fetching without them:", supplierItemsError.message);
          const fallbackResult = await supabase
            .from("quote_supplier_items")
            .select(`
              id,
              quote_id,
              supplier_id,
              product_id,
              product_name,
              valor_oferecido,
              updated_by_type,
              created_at
            `)
            .in('quote_id', quoteIds)
            .order('created_at', { ascending: false });
          
          if (fallbackResult.error) {
            console.error("❌ Error fetching supplier items (fallback):", fallbackResult.error);
            throw fallbackResult.error;
          }
          
          // Add null values for missing columns
          supplierItemsData = (fallbackResult.data || []).map(item => ({
            ...item,
            unidade_preco: null,
            fator_conversao: null,
            quantidade_por_embalagem: null,
            updated_by_type: item.updated_by_type || null
          }));
        }

        console.log(`✅ Fetched ${supplierItemsData?.length || 0} supplier items`);

      const cotacoesCompletas = (quotesData || []).map((quote, index) => {
        const items = Array.isArray(quote.quote_items) ? quote.quote_items : [];
        const suppliers = Array.isArray(quote.quote_suppliers) ? quote.quote_suppliers : [];

        // Get supplier items for this quote with safety checks
        // Map to SupplierItemWithPricing type including pricing metadata
        const quoteSupplierItems: SupplierItemWithPricing[] = Array.isArray(supplierItemsData)
          ? supplierItemsData
              .filter(item => item?.quote_id === quote.id)
              .map(item => ({
                id: item.id,
                quote_id: item.quote_id,
                supplier_id: item.supplier_id,
                product_id: item.product_id,
                product_name: item.product_name,
                valor_oferecido: item.valor_oferecido,
                valor_inicial: item.valor_inicial,
                price_history: item.price_history || [],
                unidade_preco: item.unidade_preco as PricingUnit | null,
                fator_conversao: item.fator_conversao,
                quantidade_por_embalagem: item.quantidade_por_embalagem,
                brand_id: item.brand_id,
                brand_name: item.brands?.name,
                brand_rating: item.brands?.manual_rating,
                updated_by_type: item.updated_by_type,
                created_at: item.created_at,
                updated_at: item.updated_at
              }))
          : [];

        const fornecedoresParticipantes: FornecedorParticipante[] = suppliers.map(s => {
          // Get all values offered by this supplier for all products with safety checks
          const supplierValues = quoteSupplierItems
            .filter(item => item?.supplier_id === s?.supplier_id)
            .map(item => Number(item?.valor_oferecido) || 0)
            .filter(val => val > 0);

          const totalValue = supplierValues.reduce((sum, val) => sum + val, 0);

          if (!s.access_token) {
             console.warn(`[Supabase DEBUG] Fornecedor sem access_token carregado. Fornecedor: ${s.supplier_name}, ID: ${s.id || s.supplier_id}`);
             console.log('[Supabase DEBUG] Objeto Inteiro fornecido pelo Supabase:', s);
          } else {
             console.log(`[Supabase DEBUG] ✅ Token OK para ${s.supplier_name}: ${s.access_token}`);
          }

          return {
            id: s.supplier_id,
            nome: s.supplier_name,
            phone: s.supplier_phone || "", // Se tiver phone na tabela quote_suppliers
            valorOferecido: totalValue,
            dataResposta: s.data_resposta ? new Date(s.data_resposta).toLocaleDateString("pt-BR") : null,
            observacoes: s.observacoes || "",
            status: s.status as "pendente" | "respondido",
            accessToken: s.access_token
          };
        });

        const valoresRespondidos = fornecedoresParticipantes
          .filter(f => f.valorOferecido > 0)
          .map(f => f.valorOferecido);
        
        const melhorValor = valoresRespondidos.length > 0 ? Math.min(...valoresRespondidos) : 0;
        const fornecedorMelhorPreco = fornecedoresParticipantes.find(f => f.valorOferecido === melhorValor);

        // Calcular economia real usando quote_supplier_items
        const calcularEconomia = () => {
          if (!quoteSupplierItems || quoteSupplierItems.length < 2) {
            return "0%";
          }

          // Agrupar por produto
          const produtosMap = new Map();
          quoteSupplierItems.forEach((item: any) => {
            if (!produtosMap.has(item.product_id)) {
              produtosMap.set(item.product_id, []);
            }
            if (item.valor_oferecido > 0) {
              produtosMap.get(item.product_id).push(item.valor_oferecido);
            }
          });

          let economiaTotal = 0;
          let valorTotal = 0;

          produtosMap.forEach((valores) => {
            if (valores.length >= 2) {
              const max = Math.max(...valores);
              const min = Math.min(...valores);
              economiaTotal += max - min;
              valorTotal += max;
            }
          });

          return valorTotal > 0 
            ? `${((economiaTotal / valorTotal) * 100).toFixed(1)}%`
            : "0%";
        };

        const produtosLista = items
          .map(item => item.product_name || "Produto");

        const produtosTexto = items
          .map(item => `${item.product_name} (${item.quantidade}${item.unidade})`)
          .join(", ");

        let produtoResumo = produtosLista[0] || "Sem produtos";
        if (produtosLista.length > 1) {
          produtoResumo = `${produtosLista[0]}...`;
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

        // Funçao auxiliar para formatar data sem offset UTC
        const formatLocal = (dateStr: string) => {
          if (!dateStr) return "-";
          const [y, m, d] = dateStr.split('-').map(Number);
          const date = new Date(y, m - 1, d);
          return format(date, "dd/MM/yyyy");
        };

        return {
          id: quote.id,
          produto: produtosTexto || "Sem produtos",
          produtoResumo,
          produtosLista,
          quantidade: `${items.length || 0} produto(s)`,
          status: quote.status,
          statusReal,
          dataInicio: formatLocal(quote.data_inicio),
          dataFim: formatLocal(quote.data_fim),
          dataPlanejada: quote.data_planejada,
          fornecedores: fornecedoresParticipantes.length,
          melhorPreco: melhorValor > 0 ? `R$ ${melhorValor.toFixed(2)}` : "R$ 0.00",
          melhorFornecedor: fornecedorMelhorPreco?.nome || "Aguardando",
          economia: calcularEconomia(),
          fornecedoresParticipantes,
          _raw: quote,
          _supplierItems: quoteSupplierItems
        };
      });

      return cotacoesCompletas;
      } catch (error) {
        console.error("❌ Fatal error in useCotacoes:", error);
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 min — dados ficam frescos por pouco tempo
    refetchOnMount: 'always', // Sempre busca dados frescos ao navegar para a aba
  });

  // Mutation to update supplier value for a specific product
  // Phase 1: Optimistic Updates — UI updates instantly, syncs in background
  // Requirements: 1.3, 4.2 - Accept and save pricing unit metadata
  const updateSupplierProductValue = useMutation({
    mutationFn: async ({ 
      quoteId, 
      supplierId, 
      productId, 
      newValue,
      unidadePreco,
      fatorConversao,
      quantidadePorEmbalagem,
      brandId
    }: { 
      quoteId: string; 
      supplierId: string; 
      productId: string; 
      newValue: number;
      unidadePreco?: PricingUnit;
      fatorConversao?: number;
      quantidadePorEmbalagem?: number;
      brandId?: string;
    }) => {
      console.log('🔄 Atualizando valor do fornecedor:', {
        quoteId, supplierId, productId, newValue, unidadePreco, fatorConversao, quantidadePorEmbalagem, brandId
      });

      // Check quote status first
      const { data: quote, error: quoteStatusError } = await supabase
        .from("quotes")
        .select("status")
        .eq("id", quoteId)
        .single();
      
      if (quoteStatusError) throw quoteStatusError;
      if (quote?.status === 'finalizada') {
        throw new Error("Esta cotação já está finalizada e não pode ser alterada.");
      }

      // First check if record exists
      const { data: existing, error: selectError } = await supabase
        .from("quote_supplier_items")
        .select("id")
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId)
        .eq("product_id", productId)
        .maybeSingle();

      if (selectError) {
        console.error('❌ Erro ao buscar registro existente:', selectError);
        throw selectError;
      }

      console.log('📋 Registro existente:', existing);

      if (existing) {
        // Encontrar valor inicial e histórico se existir
        const { data: recordData } = await supabase
          .from("quote_supplier_items")
          .select("valor_inicial, valor_oferecido, price_history")
          .eq("id", existing.id)
          .single();

        let valorInicial = recordData?.valor_inicial;
        
        // Se ainda não tem valor inicial e o valor novo é válido (>0)
        if (!valorInicial && newValue > 0) {
          valorInicial = recordData?.valor_oferecido > 0 ? recordData?.valor_oferecido : newValue;
        }

        const oldValor = Number(recordData?.valor_oferecido) || 0;
        let newHistory = Array.isArray(recordData?.price_history) ? [...recordData.price_history] : [];
        
        // Se o valor anterior era maior que zero e é diferente do novo, salva no histórico
        if (oldValor > 0 && Math.abs(oldValor - newValue) > 0.001) {
          // Evitar duplicatas consecutivas no histórico se o valor for o mesmo
          const lastHistoryEntry = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
          if (!lastHistoryEntry || Math.abs(lastHistoryEntry.new_value - newValue) > 0.001) {
            newHistory.push({
              old_value: oldValor,
              new_value: newValue,
              date: new Date().toISOString(),
              by: 'comprador' // Manual updates in this hook are always by the buyer
            });
          }
        }

        // Update existing record with pricing metadata and history
        const { data: updatedData, error } = await supabase
          .from("quote_supplier_items")
          .update({
            valor_oferecido: newValue,
            valor_inicial: valorInicial,
            price_history: newHistory,
            unidade_preco: unidadePreco ?? null,
            fator_conversao: fatorConversao ?? null,
            // Only overwrite quantidade_por_embalagem if explicitly provided
            // This prevents buyer edits from erasing supplier-provided values
            ...(quantidadePorEmbalagem !== undefined ? { quantidade_por_embalagem: quantidadePorEmbalagem } : {}),
            brand_id: brandId ?? null,
            updated_by_type: 'comprador'
          })
          .eq("id", existing.id)
          .select();

        if (error) {
          console.error('❌ Erro ao atualizar registro:', error);
          throw error;
        }
        console.log('✅ Registro atualizado:', updatedData);
      } else {
        // Get product name and base unit for default pricing unit
        const { data: productData } = await supabase
          .from("products")
          .select("name, unit")
          .eq("id", productId)
          .single();

        // Determine default pricing unit based on product's base unit
        // Requirements: 5.5 - Default to product's base unit
        const defaultUnidadePreco = getDefaultPricingUnit(productData?.unit);

        // Create new record with pricing metadata
        const { data: insertedData, error } = await supabase
          .from("quote_supplier_items")
          .insert({
            quote_id: quoteId,
            supplier_id: supplierId,
            product_id: productId,
            product_name: productData?.name || "Produto",
            valor_oferecido: newValue,
            valor_inicial: newValue, // Primeiro valor inserido é o inicial
            unidade_preco: unidadePreco ?? defaultUnidadePreco,
            fator_conversao: fatorConversao ?? null,
            quantidade_por_embalagem: quantidadePorEmbalagem ?? null,
            brand_id: brandId ?? null,
            updated_by_type: 'comprador'
          })
          .select();

        if (error) {
          console.error('❌ Erro ao inserir registro:', error);
          throw error;
        }
        console.log('✅ Registro inserido:', insertedData);
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

      if (statusError) {
        console.error('❌ Erro ao atualizar status do fornecedor:', statusError);
        throw statusError;
      }
      console.log('✅ Status do fornecedor atualizado');
    },
    // Phase 1: Optimistic update — update cache BEFORE server responds
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['cotacoes'] });

      // Snapshot the previous value for rollback
      const previousCotacoes = queryClient.getQueryData(['cotacoes']);

      // Optimistically update the cache
      queryClient.setQueryData(['cotacoes'], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((cotacao: any) => {
          if (cotacao.id !== variables.quoteId) return cotacao;

          // Update _supplierItems with new value
          const updatedSupplierItems = (cotacao._supplierItems || []).map((item: any) => {
            if (item.supplier_id === variables.supplierId && item.product_id === variables.productId) {
              return { ...item, valor_oferecido: variables.newValue };
            }
            return item;
          });

          // Update fornecedoresParticipantes totals
          const updatedParticipantes = (cotacao.fornecedoresParticipantes || []).map((f: any) => {
            if (f.id !== variables.supplierId) return f;
            // Recalculate total for this supplier
            const supplierValues = updatedSupplierItems
              .filter((si: any) => si.supplier_id === variables.supplierId)
              .map((si: any) => Number(si.valor_oferecido) || 0)
              .filter((v: number) => v > 0);
            const totalValue = supplierValues.reduce((sum: number, val: number) => sum + val, 0);
            return { ...f, valorOferecido: totalValue, status: 'respondido' as const };
          });

          // Recalculate melhorPreco
          const allValues = updatedParticipantes
            .map((f: any) => f.valorOferecido)
            .filter((v: number) => v > 0);
          const melhorValor = allValues.length > 0 ? Math.min(...allValues) : 0;
          const melhorFornecedor = updatedParticipantes.find((f: any) => f.valorOferecido === melhorValor);

          return {
            ...cotacao,
            _supplierItems: updatedSupplierItems,
            fornecedoresParticipantes: updatedParticipantes,
            melhorPreco: melhorValor > 0 ? `R$ ${melhorValor.toFixed(2)}` : "R$ 0.00",
            melhorFornecedor: melhorFornecedor?.nome || "Aguardando",
          };
        });
      });

      return { previousCotacoes };
    },
    onSuccess: () => {
      // Phase 2: Mark mutation as complete to prevent realtime double-fetch
      markMutationComplete();
      // Non-blocking background sync to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      toast({
        title: "Valor atualizado",
        description: "O valor oferecido foi atualizado com sucesso.",
      });
    },
    onError: (error: any, _variables, context) => {
      // Phase 1: Rollback to previous state on error
      if (context?.previousCotacoes) {
        queryClient.setQueryData(['cotacoes'], context.previousCotacoes);
      }
      console.error('❌ Erro na mutation:', error);
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
      // 1. Remove the link from orders to this quote first
      // This prevents the foreign key constraint error
      await supabase
        .from("orders")
        .update({ quote_id: null })
        .eq("quote_id", quoteId);

      // 2. Delete related quote data
      await supabase.from("quote_items").delete().eq("quote_id", quoteId);
      await supabase.from("quote_suppliers").delete().eq("quote_id", quoteId);
      await supabase.from("quote_supplier_items").delete().eq("quote_id", quoteId);
      
      // 3. Finally delete the quote itself
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);

      if (error) throw error;
    },
    onSuccess: () => {
      markMutationComplete();
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

  // Mutation to remove a specific product from a supplier in a quote
  const removeSupplierProduct = useMutation({
    mutationFn: async ({ 
      quoteId, 
      supplierId, 
      productId 
    }: { 
      quoteId: string; 
      supplierId: string; 
      productId: string; 
    }) => {
      console.log('🗑️ Removendo item do fornecedor:', { quoteId, supplierId, productId });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check quote status first
      const { data: quote, error: statusError } = await supabase
        .from("quotes")
        .select("status")
        .eq("id", quoteId)
        .single();
      
      if (statusError) throw statusError;
      if (quote?.status === 'finalizada') {
        throw new Error("Esta cotação já está finalizada e não pode ser alterada.");
      }

      const { error } = await supabase
        .from("quote_supplier_items")
        .delete()
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId)
        .eq("product_id", productId);

      if (error) {
        console.error('❌ Erro ao remover item:', error);
        throw error;
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['cotacoes'] });
      const previousCotacoes = queryClient.getQueryData(['cotacoes']);

      queryClient.setQueryData(['cotacoes'], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((cotacao: any) => {
          if (cotacao.id !== variables.quoteId) return cotacao;

          const updatedSupplierItems = (cotacao._supplierItems || []).filter((item: any) => 
            !(item.supplier_id === variables.supplierId && item.product_id === variables.productId)
          );

          const updatedParticipantes = (cotacao.fornecedoresParticipantes || []).map((f: any) => {
            if (f.id !== variables.supplierId) return f;
            const supplierValues = updatedSupplierItems
              .filter((si: any) => si.supplier_id === variables.supplierId)
              .map((si: any) => Number(si.valor_oferecido) || 0)
              .filter((v: number) => v > 0);
            const totalValue = supplierValues.reduce((sum: number, val: number) => sum + val, 0);
            return { ...f, valorOferecido: totalValue };
          });

          return {
            ...cotacao,
            _supplierItems: updatedSupplierItems,
            fornecedoresParticipantes: updatedParticipantes
          };
        });
      });

      return { previousCotacoes };
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      toast({
        title: "Item removido",
        description: "O produto foi removido deste fornecedor.",
      });
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousCotacoes) {
        queryClient.setQueryData(['cotacoes'], context.previousCotacoes);
      }
      toast({
        title: "Erro ao remover",
        description: error.message || "Não foi possível remover o item",
        variant: "destructive",
      });
    }
  });

  // Mutation to update quote
  const updateQuote = useMutation({
    mutationFn: async ({ quoteId, data }: { quoteId: string; data: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check quote status first
      const { data: quote, error: quoteStatusError } = await supabase
        .from("quotes")
        .select("status")
        .eq("id", quoteId)
        .single();
      
      if (quoteStatusError) throw quoteStatusError;
      if (quote?.status === 'finalizada') {
        throw new Error("Esta cotação já está finalizada e não pode ser editada.");
      }

      // Update quote
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          data_inicio: formatLocalDate(data.dataInicio),
          data_fim: formatLocalDate(data.dataFim),
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
      markMutationComplete();
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
        productQuantities?: Record<string, number>;
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

      // Buscar TODOS os valores cotados por todos os fornecedores para calcular economia
      const { data: allSupplierItems, error: allItemsError } = await supabase
        .from("quote_supplier_items")
        .select("*")
        .eq("quote_id", quoteId);

      if (allItemsError) throw allItemsError;

      const createdOrderIds: string[] = [];
      let totalValueAllOrders = 0;
      let totalEconomiaEstimada = 0;

      // Loop through each supplier order
      for (const order of orders) {
        const { supplierId, productIds, productQuantities, deliveryDate, observations } = order;

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

        // Calculate total value and economia for this order
        let totalValue = 0;
        let economiaEstimada = 0;
        let diferencaPrecoTotal = 0;

        // Preparar itens com dados de economia
        const orderItemsWithEconomia = quoteData.quote_items
          .filter((item: any) => productIds.includes(item.product_id))
          .map((item: any) => {
            const supplierItem = supplierItems.find((si: any) => si.product_id === item.product_id);
            const valorEscolhido = supplierItem?.valor_oferecido || 0;
            const valorInicialVencedor = Number(supplierItem?.valor_inicial) || valorEscolhido;
            const unidadePreco = (supplierItem?.unidade_preco || item.unidade || 'un') as PricingUnit;
            
            const requestedQuantity = productQuantities?.[item.product_id];
            const quantidadeOriginal = parseFloat(item.quantidade?.toString().replace(',', '.') || '0') || 1;
            const quantidade = requestedQuantity !== undefined ? requestedQuantity : quantidadeOriginal;
            
            // Usar o utilitário de normalização para o valor escolhido
            const normalizedEscolhido = normalizePrice({
              valorOferecido: valorEscolhido,
              unidadePreco: unidadePreco,
              fatorConversao: supplierItem?.fator_conversao || supplierItem?.quantidade_por_embalagem || undefined,
              quantidadePorEmbalagem: supplierItem?.quantidade_por_embalagem || undefined,
            }, quantidade, item.unidade || 'un');

            // Usar o utilitário de normalização para o valor inicial (se houver)
            const normalizedInicial = normalizePrice({
              valorOferecido: valorInicialVencedor,
              unidadePreco: unidadePreco,
              fatorConversao: supplierItem?.fator_conversao || supplierItem?.quantidade_por_embalagem || undefined,
              quantidadePorEmbalagem: supplierItem?.quantidade_por_embalagem || undefined,
            }, quantidade, item.unidade || 'un');

            // Economia estimada = diferença entre os totais normalizados
            const economiaItem = normalizedInicial.valorTotal - normalizedEscolhido.valorTotal;
            economiaEstimada += economiaItem;
            
            // Valor total do item no pedido (já normalizado para refletir o custo real)
            const itemTotalPrice = normalizedEscolhido.valorTotal;
            totalValue += itemTotalPrice;
            
            return {
              order_id: '', // será preenchido depois
              product_id: item.product_id,
              product_name: item.product_name,
              quantity: quantidade,
              unit: item.unidade || 'un',
              unit_price: valorEscolhido,
              total_price: itemTotalPrice,
              // Novos campos para economia
              quantidade_pedida: quantidade,
              unidade_pedida: item.unidade || 'un',
              quantidade_entregue: null, // será preenchido na entrega
              unidade_entregue: null,
              valor_unitario_cotado: valorEscolhido,
              maior_valor_cotado: valorInicialVencedor,
              brand_id: supplierItem?.brand_id || null,
              quantidade_por_embalagem: supplierItem?.quantidade_por_embalagem || null
            };
          });

        totalValueAllOrders += totalValue;
        totalEconomiaEstimada += economiaEstimada;

        // Calcular diferença média por kg/un
        const diferencaMedia = orderItemsWithEconomia.length > 0 
          ? diferencaPrecoTotal / orderItemsWithEconomia.length 
          : 0;

        // Verificar se já existe um pedido PENDENTE para este fornecedor
        const { data: existingOrder, error: queryError } = await supabase
          .from("orders")
          .select("id, total_value, economia_estimada, observations")
          .eq("company_id", companyData.company_id)
          .eq("supplier_id", supplierId)
          .eq("status", "pendente")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (queryError) throw queryError;

        let currentOrderId = '';

        if (existingOrder) {
          // Mesclar observações se existirem
          let mergedObservations = existingOrder.observations || '';
          if (observations && observations !== '') {
            mergedObservations = mergedObservations ? `${mergedObservations} | ${observations}` : observations;
          }

          // Atualizar pedido pendente existente
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .update({
              total_value: (existingOrder.total_value || 0) + totalValue,
              economia_estimada: (existingOrder.economia_estimada || 0) + economiaEstimada,
              observations: mergedObservations || null,
            })
            .eq("id", existingOrder.id)
            .select()
            .single();

          if (orderError) throw orderError;
          currentOrderId = orderData.id;
        } else {
          // Create the order with quote_id and economia
          const { data: orderData, error: orderError } = await supabase
            .from("orders")
            .insert({
              company_id: companyData.company_id,
              supplier_id: supplierId,
              supplier_name: supplierData.name,
              total_value: totalValue,
              order_date: format(new Date(), 'yyyy-MM-dd'),
              delivery_date: deliveryDate,
              status: "pendente",
              observations: observations || null,
              // Novos campos
              quote_id: quoteId,
              economia_estimada: economiaEstimada,
              economia_real: 0, // será calculado na entrega
              diferenca_preco_kg: diferencaMedia,
            })
            .select()
            .single();

          if (orderError) throw orderError;
          currentOrderId = orderData.id;
        }

        // Add to created list only if it's new, though returning all involved orders is fine
        if (!createdOrderIds.includes(currentOrderId)) {
          createdOrderIds.push(currentOrderId);
        }

        // Create order items with economia data
        const orderItems = orderItemsWithEconomia.map(item => ({
          ...item,
          order_id: currentOrderId,
        }));

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

      return { orderIds: createdOrderIds, totalValue: totalValueAllOrders, economiaEstimada: totalEconomiaEstimada };
    },
    onSuccess: (data) => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      // Force-clear pedidos cache (including localStorage persistence) so the orders tab
      // always fetches fresh data after a conversion, even if it wasn't mounted
      queryClient.removeQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidosStats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      const count = data.orderIds.length;
      const economiaMsg = data.economiaEstimada > 0 
        ? ` | Economia estimada: R$ ${data.economiaEstimada.toFixed(2)}`
        : '';
      toast({
        title: count > 1 ? "Pedidos criados!" : "Pedido criado!",
        description: count > 1 
          ? `${count} pedidos criados - Total: R$ ${data.totalValue.toFixed(2)}${economiaMsg}`
          : `Pedido criado - R$ ${data.totalValue.toFixed(2)}${economiaMsg}`
      });
    },
    onError: (error: any) => {
      console.error("Erro ao converter cotação:", error);
      toast({
        title: "Erro ao converter",
        description: error?.message || "Não foi possível converter a cotação em pedido.",
        variant: "destructive"
      });
    }
  });

  // Mutation to update quote status only
  const updateQuoteStatus = useMutation({
    mutationFn: async ({ quoteId, status }: { quoteId: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check quote status first
      const { data: quote, error: quoteStatusError } = await supabase
        .from("quotes")
        .select("status")
        .eq("id", quoteId)
        .single();
      
      if (quoteStatusError) throw quoteStatusError;
      if (quote?.status === 'finalizada') {
        throw new Error("Esta cotação já está finalizada e seu status não pode ser alterado.");
      }

      const { error } = await supabase
        .from("quotes")
        .update({ status })
        .eq("id", quoteId);

      if (error) throw error;
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
    },
    onError: (error) => {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    }
  });

  // Mutation to add product to quote
  const addQuoteItem = useMutation({
    mutationFn: async ({ quoteId, productId, productName, quantidade, unidade }: { quoteId: string; productId: string; productName: string; quantidade: number; unidade: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check quote status first
      const { data: quote, error: statusError } = await supabase
        .from("quotes")
        .select("status")
        .eq("id", quoteId)
        .single();
      
      if (statusError) throw statusError;
      if (quote?.status === 'finalizada') {
        throw new Error("Esta cotação já está finalizada e não pode ser alterada.");
      }

      const { error } = await supabase
        .from("quote_items")
        .insert([{ quote_id: quoteId, product_id: productId, product_name: productName, quantidade: String(quantidade), unidade }]);

      if (error) throw error;
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      toast({ title: "Produto adicionado à cotação!" });
    },
    onError: (error) => {
      console.error("Erro ao adicionar produto:", error);
      toast({ title: "Erro ao adicionar produto", variant: "destructive" });
    }
  });

  // Mutation to remove product from quote
  const removeQuoteItem = useMutation({
    mutationFn: async ({ quoteId, productId }: { quoteId: string; productId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check quote status first
      const { data: quote, error: statusError } = await supabase
        .from("quotes")
        .select("status")
        .eq("id", quoteId)
        .single();
      
      if (statusError) throw statusError;
      if (quote?.status === 'finalizada') {
        throw new Error("Esta cotação já está finalizada e não pode ser alterada.");
      }

      // Remove from quote_items
      const { error } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId)
        .eq("product_id", productId);

      if (error) throw error;

      // Also remove any supplier values for this product
      await supabase
        .from("quote_supplier_items")
        .delete()
        .eq("quote_id", quoteId)
        .eq("product_id", productId);
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      toast({ title: "Produto removido da cotação!" });
    },
    onError: (error) => {
      console.error("Erro ao remover produto:", error);
      toast({ title: "Erro ao remover produto", variant: "destructive" });
    }
  });

  // Mutation to add supplier to quote
  const addQuoteSupplier = useMutation({
    mutationFn: async ({ quoteId, supplierId, supplierName }: { quoteId: string; supplierId: string; supplierName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check quote status first
      const { data: quote, error: statusError } = await supabase
        .from("quotes")
        .select("status")
        .eq("id", quoteId)
        .single();
      
      if (statusError) throw statusError;
      if (quote?.status === 'finalizada') {
        throw new Error("Esta cotação já está finalizada e não pode ser alterada.");
      }

      const { error } = await supabase
        .from("quote_suppliers")
        .insert({ quote_id: quoteId, supplier_id: supplierId, supplier_name: supplierName, status: 'pendente' });

      if (error) throw error;
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      toast({ title: "Fornecedor adicionado à cotação!" });
    },
    onError: (error) => {
      console.error("Erro ao adicionar fornecedor:", error);
      toast({ title: "Erro ao adicionar fornecedor", variant: "destructive" });
    }
  });

  // Mutation to remove supplier from quote
  const removeQuoteSupplier = useMutation({
    mutationFn: async ({ quoteId, supplierId }: { quoteId: string; supplierId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check quote status first
      const { data: quote, error: statusError } = await supabase
        .from("quotes")
        .select("status")
        .eq("id", quoteId)
        .single();
      
      if (statusError) throw statusError;
      if (quote?.status === 'finalizada') {
        throw new Error("Esta cotação já está finalizada e não pode ser alterada.");
      }

      // Remove from quote_suppliers
      const { error } = await supabase
        .from("quote_suppliers")
        .delete()
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId);

      if (error) throw error;

      // Also remove any supplier values for this supplier
      await supabase
        .from("quote_supplier_items")
        .delete()
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId);
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      toast({ title: "Fornecedor removido da cotação!" });
    },
    onError: (error) => {
      console.error("Erro ao remover fornecedor:", error);
      toast({ title: "Erro ao remover fornecedor", variant: "destructive" });
    }
  });
  // Mutation to update product quantity/unit in quote
  const updateQuoteItemQuantity = useMutation({
    mutationFn: async ({ quoteId, productId, quantidade, unidade }: { quoteId: string; productId: string; quantidade: number; unidade: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Check quote status first
      const { data: quote, error: statusError } = await supabase
        .from("quotes")
        .select("status")
        .eq("id", quoteId)
        .single();
      
      if (statusError) throw statusError;
      if (quote?.status === 'finalizada') {
        throw new Error("Esta cotação já está finalizada e não pode ser alterada.");
      }

      const { error } = await supabase
        .from("quote_items")
        .update({ 
          quantidade: String(quantidade), 
          unidade 
        })
        .eq("quote_id", quoteId)
        .eq("product_id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      toast({ title: "Quantidade atualizada!" });
    },
    onError: (error: any) => {
      console.error("Erro ao atualizar quantidade:", error);
      toast({ title: "Erro ao atualizar quantidade", description: error.message, variant: "destructive" });
    }
  });



  return {
    cotacoes,
    isLoading,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      // Mark mutation complete AFTER invalidation resolves
      // This prevents Realtime from triggering a redundant second fetch
      markMutationComplete();
    },
    updateSupplierProductValue,
    updateQuoteItemPrice: updateSupplierProductValue,
    deleteQuote,
    removeSupplierProduct,
    updateQuote,
    updateQuoteStatus,
    convertToOrder,
    addQuoteItem,
    removeQuoteItem,
    addQuoteSupplier,
    removeQuoteSupplier,
    updateQuoteItemQuantity,
    isUpdating: updateSupplierProductValue.isPending || 
      deleteQuote.isPending || 
      updateQuote.isPending || 
      updateQuoteStatus.isPending || 
      convertToOrder.isPending || 
      addQuoteItem.isPending || 
      removeQuoteItem.isPending || 
      addQuoteSupplier.isPending || 
      removeQuoteSupplier.isPending ||
      updateQuoteItemQuantity.isPending ||
      removeSupplierProduct.isPending,
  };
}
