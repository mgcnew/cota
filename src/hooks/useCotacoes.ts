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
      // OPTIMIZED: Single query with joins instead of N+1 queries
      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select(`
          *,
          quote_items(*),
          quote_suppliers(*)
        `)
        .order("created_at", { ascending: false });

      if (quotesError) throw quotesError;

      const cotacoesCompletas = (quotesData || []).map((quote, index) => {
        const items = quote.quote_items || [];
        const suppliers = quote.quote_suppliers || [];

        const fornecedoresParticipantes: FornecedorParticipante[] = suppliers.map(s => ({
          id: s.supplier_id,
          nome: s.supplier_name,
          valorOferecido: Number(s.valor_oferecido) || 0,
          dataResposta: s.data_resposta ? new Date(s.data_resposta).toLocaleDateString("pt-BR") : null,
          observacoes: s.observacoes || "",
          status: s.status as "pendente" | "respondido"
        }));

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
          _raw: quote
        };
      });

      return cotacoesCompletas;
    },
  });

  // Mutation to update supplier value
  const updateSupplierValue = useMutation({
    mutationFn: async ({ quoteId, supplierId, newValue }: { quoteId: string; supplierId: string; newValue: number }) => {
      const { error } = await supabase
        .from("quote_suppliers")
        .update({
          valor_oferecido: newValue,
          data_resposta: new Date().toISOString().split('T')[0],
          status: 'respondido'
        })
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId);

      if (error) throw error;
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

  return {
    cotacoes,
    isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['cotacoes'] }),
    updateSupplierValue: updateSupplierValue.mutate,
    deleteQuote: deleteQuote.mutate,
    updateQuote: updateQuote.mutate,
    isUpdating: updateSupplierValue.isPending || deleteQuote.isPending || updateQuote.isPending,
  };
}
