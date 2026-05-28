import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { PricingUnit } from "@/utils/priceNormalization";
import type { FornecedorParticipante, SupplierItemWithPricing } from "./types";

function calcularEconomia(supplierItems: SupplierItemWithPricing[]): string {
  if (!supplierItems || supplierItems.length < 2) return "0%";

  const produtosMap = new Map<string, number[]>();
  supplierItems.forEach((item) => {
    if ((item.valor_oferecido ?? 0) > 0) {
      const arr = produtosMap.get(item.product_id) ?? [];
      arr.push(Number(item.valor_oferecido));
      produtosMap.set(item.product_id, arr);
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

  return valorTotal > 0 ? `${((economiaTotal / valorTotal) * 100).toFixed(1)}%` : "0%";
}

function formatLocal(dateStr: string): string {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return format(date, "dd/MM/yyyy");
}

function computeStatusReal(rawStatus: string, dataPlanejada: string | null): string {
  if (!dataPlanejada) return rawStatus;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const planejada = new Date(dataPlanejada);
  planejada.setHours(0, 0, 0, 0);
  if (rawStatus === "planejada") {
    return planejada > hoje ? "planejada" : "ativa";
  }
  return rawStatus;
}

export function useCotacoesQuery() {
  return useQuery({
    queryKey: ["cotacoes"],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const dateFilter = sixMonthsAgo.toISOString().split("T")[0];

      const { data: quotesData, error: quotesError } = await supabase
        .from("quotes")
        .select(`
          *,
          quote_items(*),
          quote_suppliers(*, access_token)
        `)
        .gte("created_at", dateFilter)
        .order("created_at", { ascending: false });

      if (quotesError) {
        console.error("❌ Error fetching quotes:", quotesError);
        throw quotesError;
      }
      if (!quotesData || quotesData.length === 0) return [];

      const quoteIds = quotesData.map((q) => q.id);

      // Try fetching with the modern columns (pricing metadata + brand).
      // Falls back to a minimal projection if those columns aren't present
      // (happens in older environments where migrations haven't run).
      let supplierItemsData: any[] | null = null;
      let supplierItemsError: any = null;
      try {
        const res = await supabase
          .from("quote_supplier_items")
          .select(`
            id, quote_id, supplier_id, product_id, product_name,
            valor_oferecido, valor_inicial, price_history,
            unidade_preco, fator_conversao, quantidade_por_embalagem,
            brand_id, brands(name, manual_rating),
            updated_by_type, observacoes, created_at
          `)
          .in("quote_id", quoteIds)
          .order("created_at", { ascending: false });
        supplierItemsData = res.data;
        supplierItemsError = res.error;
      } catch (e) {
        console.warn("⚠️ Error fetching with new columns, trying fallback:", e);
      }
      if (supplierItemsError) {
        const fallback = await supabase
          .from("quote_supplier_items")
          .select(`id, quote_id, supplier_id, product_id, product_name, valor_oferecido, updated_by_type, created_at`)
          .in("quote_id", quoteIds)
          .order("created_at", { ascending: false });
        if (fallback.error) throw fallback.error;
        supplierItemsData = (fallback.data ?? []).map((item) => ({
          ...item,
          unidade_preco: null,
          fator_conversao: null,
          quantidade_por_embalagem: null,
          updated_by_type: item.updated_by_type ?? null,
        }));
      }

      return (quotesData ?? []).map((quote) => {
        const items = Array.isArray(quote.quote_items) ? quote.quote_items : [];
        const suppliers = Array.isArray(quote.quote_suppliers) ? quote.quote_suppliers : [];

        const quoteSupplierItems: SupplierItemWithPricing[] = Array.isArray(supplierItemsData)
          ? supplierItemsData
              .filter((it) => it?.quote_id === quote.id)
              .map((it) => ({
                id: it.id,
                quote_id: it.quote_id,
                supplier_id: it.supplier_id,
                product_id: it.product_id,
                product_name: it.product_name,
                valor_oferecido: it.valor_oferecido,
                valor_inicial: it.valor_inicial,
                price_history: it.price_history ?? [],
                unidade_preco: it.unidade_preco as PricingUnit | null,
                fator_conversao: it.fator_conversao,
                quantidade_por_embalagem: it.quantidade_por_embalagem,
                brand_id: it.brand_id,
                brand_name: it.brands?.name,
                brand_rating: it.brands?.manual_rating,
                updated_by_type: it.updated_by_type,
                observacoes: it.observacoes ?? null,
                created_at: it.created_at,
                updated_at: it.updated_at,
              }))
          : [];

        const fornecedoresParticipantes: FornecedorParticipante[] = suppliers.map((s: any) => {
          const supplierValues = quoteSupplierItems
            .filter((it) => it?.supplier_id === s?.supplier_id)
            .map((it) => Number(it?.valor_oferecido) || 0)
            .filter((v) => v > 0);
          const totalValue = supplierValues.reduce((sum, v) => sum + v, 0);

          return {
            id: s.supplier_id,
            nome: s.supplier_name,
            phone: s.supplier_phone || "",
            valorOferecido: totalValue,
            dataResposta: s.data_resposta ? new Date(s.data_resposta).toLocaleDateString("pt-BR") : null,
            observacoes: s.observacoes || "",
            status: s.status as "pendente" | "respondido",
            accessToken: s.access_token,
          };
        });

        const valoresRespondidos = fornecedoresParticipantes
          .filter((f) => f.valorOferecido > 0)
          .map((f) => f.valorOferecido);
        const melhorValor = valoresRespondidos.length > 0 ? Math.min(...valoresRespondidos) : 0;
        const melhorFornecedor = fornecedoresParticipantes.find((f) => f.valorOferecido === melhorValor);

        const produtosLista = items.map((it: any) => it.product_name || "Produto");
        const produtosTexto = items.map((it: any) => `${it.product_name} (${it.quantidade}${it.unidade})`).join(", ");
        const produtoResumo = produtosLista.length > 1 ? `${produtosLista[0]}...` : produtosLista[0] || "Sem produtos";

        return {
          id: quote.id,
          produto: produtosTexto || "Sem produtos",
          produtoResumo,
          produtosLista,
          quantidade: `${items.length || 0} produto(s)`,
          status: quote.status,
          statusReal: computeStatusReal(quote.status, quote.data_planejada),
          dataInicio: formatLocal(quote.data_inicio),
          dataFim: formatLocal(quote.data_fim),
          dataPlanejada: quote.data_planejada,
          fornecedores: fornecedoresParticipantes.length,
          melhorPreco: melhorValor > 0 ? `R$ ${melhorValor.toFixed(2)}` : "R$ 0.00",
          melhorFornecedor: melhorFornecedor?.nome || "Aguardando",
          economia: calcularEconomia(quoteSupplierItems),
          fornecedoresParticipantes,
          _raw: quote,
          _supplierItems: quoteSupplierItems,
        };
      });
    },
    staleTime: 60 * 1000,
    refetchOnMount: "always",
  });
}
