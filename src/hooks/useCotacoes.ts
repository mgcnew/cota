import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FornecedorParticipante {
  id: string;
  nome: string;
  valorOferecido: number;
  dataResposta: string | null;
  observacoes: string;
  status: "pendente" | "respondido";
}

export interface Quote {
  id: string;
  produto: string;
  quantidade: string;
  status: string;
  dataInicio: string;
  dataFim: string;
  fornecedores: number;
  melhorPreco: string;
  melhorFornecedor: string;
  economia: string;
  fornecedoresParticipantes: FornecedorParticipante[];
}

export function useCotacoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cotacoes = [], isLoading } = useQuery({
    queryKey: ['cotacoes'],
    queryFn: async () => {
      try {
        console.log("📊 Fetching quotes...");
        
        // Fetch quotes with related data
        const { data: quotesData, error: quotesError } = await supabase
          .from("quotes")
          .select(`
            *,
            quote_items(*),
            quote_suppliers(*)
          `)
          .order("created_at", { ascending: false });

        if (quotesError) {
          console.error("❌ Error fetching quotes:", quotesError);
          throw quotesError;
        }

        if (!quotesData || quotesData.length === 0) {
          console.log("✅ No quotes found");
          return [];
        }

        console.log(`✅ Fetched ${quotesData.length} quotes`);

        // Fetch all quote_supplier_items separately
        const { data: supplierItemsData, error: supplierItemsError } = await supabase
          .from("quote_supplier_items")
          .select("*");

        if (supplierItemsError) {
          console.error("❌ Error fetching supplier items:", supplierItemsError);
          throw supplierItemsError;
        }

        console.log(`✅ Fetched ${supplierItemsData?.length || 0} supplier items`);

      const cotacoesCompletas = (quotesData || []).map((quote, index) => {
        const items = Array.isArray(quote.quote_items) ? quote.quote_items : [];
        const suppliers = Array.isArray(quote.quote_suppliers) ? quote.quote_suppliers : [];

        // Get supplier items for this quote with safety checks
        const quoteSupplierItems = Array.isArray(supplierItemsData)
          ? supplierItemsData.filter(item => item?.quote_id === quote.id)
          : [];

        const fornecedoresParticipantes: FornecedorParticipante[] = suppliers.map(s => {
          // Get all values offered by this supplier for all products with safety checks
          const supplierValues = quoteSupplierItems
            .filter(item => item?.supplier_id === s?.supplier_id)
            .map(item => Number(item?.valor_oferecido) || 0)
            .filter(val => val > 0);

          // Use the total or average (for now, let's sum all values)
          const totalValue = supplierValues.reduce((sum, val) => sum + val, 0);

          return {
            id: s.supplier_id,
            nome: s.supplier_name,
            valorOferecido: totalValue,
            dataResposta: s.data_resposta ? new Date(s.data_resposta).toLocaleDateString("pt-BR") : null,
            observacoes: s.observacoes || "",
            status: s.status as "pendente" | "respondido"
          };
        });

        const valoresRespondidos = fornecedoresParticipantes
          .filter(f => f.valorOferecido > 0)
          .map(f => f.valorOferecido);
        
        const melhorValor = valoresRespondidos.length > 0 ? Math.min(...valoresRespondidos) : 0;
        const fornecedorMelhorPreco = fornecedoresParticipantes.find(f => f.valorOferecido === melhorValor);

        const produtosTexto = items
          .map(item => `${item.product_name} (${item.quantidade}${item.unidade})`)
          .join(", ");

        return {
          id: quote.id, // Use real UUID instead of index-based ID
          produto: produtosTexto || "Sem produtos",
          quantidade: `${items.length || 0} produto(s)`,
          status: quote.status,
          dataInicio: new Date(quote.data_inicio).toLocaleDateString("pt-BR"),
          dataFim: new Date(quote.data_fim).toLocaleDateString("pt-BR"),
          fornecedores: fornecedoresParticipantes.length,
          melhorPreco: melhorValor > 0 ? `R$ ${melhorValor.toFixed(2)}` : "R$ 0.00",
          melhorFornecedor: fornecedorMelhorPreco?.nome || "Aguardando",
          economia: "0%",
          fornecedoresParticipantes,
          // Add raw data for editing
          _raw: quote,
          // Add supplier items for detailed view
          _supplierItems: quoteSupplierItems
        };
      });

      return cotacoesCompletas;
      } catch (error) {
        console.error("❌ Fatal error in useCotacoes:", error);
        throw error;
      }
    },
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
      
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);

      if (error) throw error;
    },
    onSuccess: () => {
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

  // Convert quote to order mutation
  const convertToOrder = useMutation({
    mutationFn: async ({ 
      quoteId, 
      supplierId, 
      deliveryDate, 
      observations 
    }: { 
      quoteId: string; 
      supplierId: string; 
      deliveryDate: string;
      observations?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Fetch quote data (without quote_supplier_items)
      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select(`
          *,
          quote_items(*),
          quote_suppliers(*)
        `)
        .eq("id", quoteId)
        .single();

      if (quoteError) throw quoteError;
      if (!quoteData) throw new Error("Cotação não encontrada");

      // 2. Fetch quote_supplier_items separately
      const { data: supplierItemsData, error: supplierItemsError } = await supabase
        .from("quote_supplier_items")
        .select("*")
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId);

      if (supplierItemsError) throw supplierItemsError;
      if (!supplierItemsData || supplierItemsData.length === 0) {
        throw new Error("Nenhum item encontrado para este fornecedor");
      }

      // 3. Get supplier info
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .select("name")
        .eq("id", supplierId)
        .single();

      if (supplierError) throw supplierError;

      // 4. Calculate total value from supplier items
      const totalValue = supplierItemsData.reduce(
        (sum: number, item: any) => sum + (item.valor_oferecido || 0), 
        0
      );

      // 5. Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          supplier_id: supplierId,
          supplier_name: supplierData.name,
          total_value: totalValue,
          status: "pendente",
          order_date: new Date().toISOString().split('T')[0],
          delivery_date: deliveryDate,
          observations: observations ? 
            `Pedido gerado a partir da cotação ${quoteId}. ${observations}` : 
            `Pedido gerado a partir da cotação ${quoteId}`
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 6. Create order items
      const orderItems = supplierItemsData.map((item: any) => {
        const quoteItem = quoteData.quote_items.find((qi: any) => qi.product_id === item.product_id);
        const quantityStr = quoteItem?.quantidade || "1";
        const quantity = parseInt(quantityStr) || 1;
        
        return {
          order_id: orderData.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: quantity,
          unit_price: item.valor_oferecido || 0,
          total_price: item.valor_oferecido || 0
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 7. Update quote status to finalizada
      const { error: updateError } = await supabase
        .from("quotes")
        .update({ status: "finalizada" })
        .eq("id", quoteId);

      if (updateError) throw updateError;

      return { orderId: orderData.id, totalValue };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cotacoes'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast({
        title: "✅ Pedido criado com sucesso!",
        description: `A cotação foi finalizada e o pedido foi gerado no valor de R$ ${data.totalValue.toFixed(2)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao converter cotação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    cotacoes,
    isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['cotacoes'] }),
    updateSupplierProductValue: updateSupplierProductValue.mutate,
    deleteQuote: deleteQuote.mutate,
    updateQuote: updateQuote.mutate,
    convertToOrder: convertToOrder.mutate,
    isUpdating: updateSupplierProductValue.isPending || deleteQuote.isPending || updateQuote.isPending || convertToOrder.isPending,
  };
}
