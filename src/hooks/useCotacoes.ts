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
          id: `COT-${String(index + 1).padStart(3, '0')}`,
          produto: produtosTexto || "Sem produtos",
          quantidade: `${items.length || 0} produto(s)`,
          status: quote.status,
          dataInicio: new Date(quote.data_inicio).toLocaleDateString("pt-BR"),
          dataFim: new Date(quote.data_fim).toLocaleDateString("pt-BR"),
          fornecedores: fornecedoresParticipantes.length,
          melhorPreco: melhorValor > 0 ? `R$ ${melhorValor.toFixed(2)}` : "R$ 0.00",
          melhorFornecedor: fornecedorMelhorPreco?.nome || "Aguardando",
          economia: "0%",
          fornecedoresParticipantes
        };
      });

      return cotacoesCompletas;
    },
  });

  return {
    cotacoes,
    isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['cotacoes'] }),
  };
}
