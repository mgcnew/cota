import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PricingUnit, normalizePrice } from "@/utils/priceNormalization";
import { formatLocalDate } from "@/lib/utils";
import { friendlyError } from "@/lib/errors";
import { markMutationComplete } from "./_dedup";

/**
 * Maps a product's base unit to the default pricing unit used when none is
 * provided by the supplier.
 */
function getDefaultPricingUnit(productUnit?: string): PricingUnit {
  if (!productUnit) return "un";
  const normalized = productUnit.toLowerCase().trim();
  return ["kg", "g", "mg", "ton", "tonelada"].includes(normalized) ? "kg" : "un";
}

async function assertQuoteEditable(quoteId: string): Promise<void> {
  const { data, error } = await supabase
    .from("quotes")
    .select("status")
    .eq("id", quoteId)
    .single();
  if (error) throw error;
  if (data?.status === "finalizada") {
    throw new Error("Esta cotação já está finalizada e não pode ser alterada.");
  }
}

export function useCotacoesMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateSupplierProductValue = useMutation({
    mutationFn: async ({
      quoteId,
      supplierId,
      productId,
      newValue,
      unidadePreco,
      fatorConversao,
      quantidadePorEmbalagem,
      brandId,
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
      await assertQuoteEditable(quoteId);

      const { data: existing, error: selectError } = await supabase
        .from("quote_supplier_items")
        .select("id")
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId)
        .eq("product_id", productId)
        .maybeSingle();
      if (selectError) throw selectError;

      if (existing) {
        const { data: recordData } = await supabase
          .from("quote_supplier_items")
          .select("valor_inicial, valor_oferecido, price_history")
          .eq("id", existing.id)
          .single();

        let valorInicial = recordData?.valor_inicial;
        if (!valorInicial && newValue > 0) {
          valorInicial = recordData?.valor_oferecido > 0 ? recordData?.valor_oferecido : newValue;
        }
        const oldValor = Number(recordData?.valor_oferecido) || 0;
        const newHistory = Array.isArray(recordData?.price_history) ? [...recordData.price_history] : [];
        if (oldValor > 0 && Math.abs(oldValor - newValue) > 0.001) {
          const last = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
          if (!last || Math.abs(last.new_value - newValue) > 0.001) {
            newHistory.push({
              old_value: oldValor,
              new_value: newValue,
              date: new Date().toISOString(),
              by: "comprador",
            });
          }
        }

        const { error } = await supabase
          .from("quote_supplier_items")
          .update({
            valor_oferecido: newValue,
            valor_inicial: valorInicial,
            price_history: newHistory,
            unidade_preco: unidadePreco ?? null,
            fator_conversao: fatorConversao ?? null,
            // Only overwrite when explicitly provided — otherwise buyer edits would
            // erase values that the supplier filled in on the portal.
            ...(quantidadePorEmbalagem !== undefined ? { quantidade_por_embalagem: quantidadePorEmbalagem } : {}),
            brand_id: brandId ?? null,
            updated_by_type: "comprador",
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data: productData } = await supabase
          .from("products")
          .select("name, unit")
          .eq("id", productId)
          .single();
        const defaultUnidadePreco = getDefaultPricingUnit(productData?.unit);

        const { error } = await supabase
          .from("quote_supplier_items")
          .insert({
            quote_id: quoteId,
            supplier_id: supplierId,
            product_id: productId,
            product_name: productData?.name || "Produto",
            valor_oferecido: newValue,
            valor_inicial: newValue,
            unidade_preco: unidadePreco ?? defaultUnidadePreco,
            fator_conversao: fatorConversao ?? null,
            quantidade_por_embalagem: quantidadePorEmbalagem ?? null,
            brand_id: brandId ?? null,
            updated_by_type: "comprador",
          });
        if (error) throw error;
      }

      const { error: statusError } = await supabase
        .from("quote_suppliers")
        .update({
          status: "respondido",
          data_resposta: new Date().toISOString().split("T")[0],
        })
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId);
      if (statusError) throw statusError;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["cotacoes"] });
      const previousCotacoes = queryClient.getQueryData(["cotacoes"]);

      queryClient.setQueryData(["cotacoes"], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((cotacao: any) => {
          if (cotacao.id !== variables.quoteId) return cotacao;
          const updatedSupplierItems = (cotacao._supplierItems || []).map((it: any) =>
            it.supplier_id === variables.supplierId && it.product_id === variables.productId
              ? { ...it, valor_oferecido: variables.newValue }
              : it
          );
          const updatedParticipantes = (cotacao.fornecedoresParticipantes || []).map((f: any) => {
            if (f.id !== variables.supplierId) return f;
            const totalValue = updatedSupplierItems
              .filter((si: any) => si.supplier_id === variables.supplierId)
              .map((si: any) => Number(si.valor_oferecido) || 0)
              .filter((v: number) => v > 0)
              .reduce((sum: number, v: number) => sum + v, 0);
            return { ...f, valorOferecido: totalValue, status: "respondido" as const };
          });
          const allValues = updatedParticipantes.map((f: any) => f.valorOferecido).filter((v: number) => v > 0);
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
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      toast({ title: "Valor atualizado", description: "O valor oferecido foi atualizado com sucesso." });
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousCotacoes) {
        queryClient.setQueryData(["cotacoes"], context.previousCotacoes);
      }
      const f = friendlyError(error, "Erro ao atualizar");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  const deleteQuote = useMutation({
    mutationFn: async (quoteId: string) => {
      // Detach orders that reference this quote first, otherwise the cascade FK
      // would block the delete on the parent row.
      await supabase.from("orders").update({ quote_id: null }).eq("quote_id", quoteId);
      await supabase.from("quote_items").delete().eq("quote_id", quoteId);
      await supabase.from("quote_suppliers").delete().eq("quote_id", quoteId);
      await supabase.from("quote_supplier_items").delete().eq("quote_id", quoteId);
      const { error } = await supabase.from("quotes").delete().eq("id", quoteId);
      if (error) throw error;
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      toast({ title: "Cotação excluída", description: "A cotação foi excluída com sucesso." });
    },
    onError: (error: any) => {
      const f = friendlyError(error, "Erro ao excluir");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  const removeSupplierProduct = useMutation({
    mutationFn: async ({ quoteId, supplierId, productId }: { quoteId: string; supplierId: string; productId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      await assertQuoteEditable(quoteId);
      const { error } = await supabase
        .from("quote_supplier_items")
        .delete()
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId)
        .eq("product_id", productId);
      if (error) throw error;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["cotacoes"] });
      const previousCotacoes = queryClient.getQueryData(["cotacoes"]);
      queryClient.setQueryData(["cotacoes"], (old: any[] | undefined) => {
        if (!old) return old;
        return old.map((cotacao: any) => {
          if (cotacao.id !== variables.quoteId) return cotacao;
          const updatedSupplierItems = (cotacao._supplierItems || []).filter(
            (it: any) => !(it.supplier_id === variables.supplierId && it.product_id === variables.productId)
          );
          const updatedParticipantes = (cotacao.fornecedoresParticipantes || []).map((f: any) => {
            if (f.id !== variables.supplierId) return f;
            const totalValue = updatedSupplierItems
              .filter((si: any) => si.supplier_id === variables.supplierId)
              .map((si: any) => Number(si.valor_oferecido) || 0)
              .filter((v: number) => v > 0)
              .reduce((sum: number, v: number) => sum + v, 0);
            return { ...f, valorOferecido: totalValue };
          });
          return { ...cotacao, _supplierItems: updatedSupplierItems, fornecedoresParticipantes: updatedParticipantes };
        });
      });
      return { previousCotacoes };
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      toast({ title: "Item removido", description: "O produto foi removido deste fornecedor." });
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousCotacoes) {
        queryClient.setQueryData(["cotacoes"], context.previousCotacoes);
      }
      const f = friendlyError(error, "Erro ao remover");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  const updateQuote = useMutation({
    mutationFn: async ({ quoteId, data }: { quoteId: string; data: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      await assertQuoteEditable(quoteId);

      const { error: quoteError } = await supabase
        .from("quotes")
        .update({
          data_inicio: formatLocalDate(data.dataInicio),
          data_fim: formatLocalDate(data.dataFim),
          observacoes: data.observacoes || null,
          status: data.status,
        })
        .eq("id", quoteId);
      if (quoteError) throw quoteError;

      await supabase.from("quote_items").delete().eq("quote_id", quoteId);
      const quoteItemsData = data.produtos.map((p: any) => ({
        quote_id: quoteId,
        product_id: p.produtoId,
        product_name: p.produtoNome,
        quantidade: p.quantidade,
        unidade: p.unidade,
      }));
      const { error: itemsError } = await supabase.from("quote_items").insert(quoteItemsData);
      if (itemsError) throw itemsError;

      if (data.fornecedoresIds && data.fornecedoresIds.length > 0) {
        await supabase.from("quote_suppliers").delete().eq("quote_id", quoteId);
        const { data: suppliersData } = await supabase
          .from("suppliers")
          .select("id, name")
          .in("id", data.fornecedoresIds);
        const quoteSuppliersData = data.fornecedoresIds.map((supplierId: string) => {
          const supplier = suppliersData?.find((s) => s.id === supplierId);
          return {
            quote_id: quoteId,
            supplier_id: supplierId,
            supplier_name: supplier?.name || "Desconhecido",
            status: "pendente",
          };
        });
        const { error: suppliersError } = await supabase.from("quote_suppliers").insert(quoteSuppliersData);
        if (suppliersError) throw suppliersError;
      }
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      toast({ title: "Cotação atualizada", description: "A cotação foi atualizada com sucesso." });
    },
    onError: (error: any) => {
      const f = friendlyError(error, "Erro ao atualizar");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  const convertToOrder = useMutation({
    mutationFn: async ({
      quoteId,
      orders,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();
      if (!companyData) throw new Error("Empresa não encontrada");

      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select("*, quote_items (*)")
        .eq("id", quoteId)
        .single();
      if (quoteError) throw quoteError;

      const createdOrderIds: string[] = [];
      let totalValueAllOrders = 0;
      let totalEconomiaEstimada = 0;

      for (const order of orders) {
        const { supplierId, productIds, productQuantities, deliveryDate, observations } = order;

        const { data: supplierData, error: supplierError } = await supabase
          .from("suppliers")
          .select("*")
          .eq("id", supplierId)
          .single();
        if (supplierError) throw supplierError;

        const { data: supplierItems, error: supplierItemsError } = await supabase
          .from("quote_supplier_items")
          .select("*")
          .eq("quote_id", quoteId)
          .eq("supplier_id", supplierId)
          .in("product_id", productIds);
        if (supplierItemsError) throw supplierItemsError;

        let totalValue = 0;
        let economiaEstimada = 0;

        const orderItemsWithEconomia = quoteData.quote_items
          .filter((it: any) => productIds.includes(it.product_id))
          .map((it: any) => {
            const supplierItem = supplierItems.find((si: any) => si.product_id === it.product_id);
            const valorEscolhido = supplierItem?.valor_oferecido || 0;
            const valorInicialVencedor = Number(supplierItem?.valor_inicial) || valorEscolhido;
            const unidadePreco = (supplierItem?.unidade_preco || it.unidade || "un") as PricingUnit;

            const requestedQuantity = productQuantities?.[it.product_id];
            const quantidadeOriginal = parseFloat(it.quantidade?.toString().replace(",", ".") || "0") || 1;
            const quantidade = requestedQuantity !== undefined ? requestedQuantity : quantidadeOriginal;

            const normalizedEscolhido = normalizePrice(
              {
                valorOferecido: valorEscolhido,
                unidadePreco,
                fatorConversao: supplierItem?.fator_conversao || supplierItem?.quantidade_por_embalagem || undefined,
                quantidadePorEmbalagem: supplierItem?.quantidade_por_embalagem || undefined,
              },
              quantidade,
              it.unidade || "un"
            );
            const normalizedInicial = normalizePrice(
              {
                valorOferecido: valorInicialVencedor,
                unidadePreco,
                fatorConversao: supplierItem?.fator_conversao || supplierItem?.quantidade_por_embalagem || undefined,
                quantidadePorEmbalagem: supplierItem?.quantidade_por_embalagem || undefined,
              },
              quantidade,
              it.unidade || "un"
            );

            economiaEstimada += normalizedInicial.valorTotal - normalizedEscolhido.valorTotal;
            totalValue += normalizedEscolhido.valorTotal;

            return {
              order_id: "",
              product_id: it.product_id,
              product_name: it.product_name,
              quantity: quantidade,
              unit: it.unidade || "un",
              unit_price: valorEscolhido,
              total_price: normalizedEscolhido.valorTotal,
              quantidade_pedida: quantidade,
              unidade_pedida: it.unidade || "un",
              quantidade_entregue: null,
              unidade_entregue: null,
              valor_unitario_cotado: valorEscolhido,
              maior_valor_cotado: valorInicialVencedor,
              brand_id: supplierItem?.brand_id || null,
              quantidade_por_embalagem: supplierItem?.quantidade_por_embalagem || null,
            };
          });

        totalValueAllOrders += totalValue;
        totalEconomiaEstimada += economiaEstimada;

        // Always create a new order on conversion. Merging into an existing
        // pendente order led to silent disappearance from the orders list.
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            company_id: companyData.company_id,
            supplier_id: supplierId,
            supplier_name: supplierData.name,
            total_value: totalValue,
            order_date: format(new Date(), "yyyy-MM-dd"),
            delivery_date: deliveryDate,
            status: "pendente",
            observations: observations || null,
            quote_id: quoteId,
            economia_estimada: economiaEstimada,
            economia_real: 0,
            diferenca_preco_kg: 0,
          })
          .select()
          .single();
        if (orderError) throw orderError;

        const currentOrderId = orderData.id;
        if (!createdOrderIds.includes(currentOrderId)) createdOrderIds.push(currentOrderId);

        const { error: orderItemsError } = await supabase
          .from("order_items")
          .insert(orderItemsWithEconomia.map((it) => ({ ...it, order_id: currentOrderId })));
        if (orderItemsError) throw orderItemsError;
      }

      const { error: updateError } = await supabase
        .from("quotes")
        .update({ status: "finalizada" })
        .eq("id", quoteId);
      if (updateError) throw updateError;

      return {
        orderIds: createdOrderIds,
        totalValue: totalValueAllOrders,
        economiaEstimada: totalEconomiaEstimada,
      };
    },
    onSuccess: (data) => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      // Force-clear the pedidos cache (localStorage persist included) so the
      // orders tab sees the new rows even if it hasn't mounted yet.
      queryClient.removeQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      queryClient.invalidateQueries({ queryKey: ["pedidosStats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      const count = data.orderIds.length;
      const economiaMsg = data.economiaEstimada > 0 ? ` | Economia estimada: R$ ${data.economiaEstimada.toFixed(2)}` : "";
      toast({
        title: count > 1 ? "Pedidos criados!" : "Pedido criado!",
        description:
          count > 1
            ? `${count} pedidos criados - Total: R$ ${data.totalValue.toFixed(2)}${economiaMsg}`
            : `Pedido criado - R$ ${data.totalValue.toFixed(2)}${economiaMsg}`,
      });
    },
    onError: (error: any) => {
      const f = friendlyError(error, "Erro ao converter");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  const updateQuoteStatus = useMutation({
    mutationFn: async ({ quoteId, status }: { quoteId: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      await assertQuoteEditable(quoteId);
      const { error } = await supabase.from("quotes").update({ status }).eq("id", quoteId);
      if (error) throw error;
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
    },
    onError: (error: any) => {
      const f = friendlyError(error, "Erro");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  const addQuoteItem = useMutation({
    mutationFn: async ({
      quoteId,
      productId,
      productName,
      quantidade,
      unidade,
    }: {
      quoteId: string;
      productId: string;
      productName: string;
      quantidade: number;
      unidade: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      await assertQuoteEditable(quoteId);
      const { error } = await supabase
        .from("quote_items")
        .insert([{ quote_id: quoteId, product_id: productId, product_name: productName, quantidade: String(quantidade), unidade }]);
      if (error) throw error;
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      toast({ title: "Produto adicionado à cotação!" });
    },
    onError: (error: any) => {
      const f = friendlyError(error, "Erro ao adicionar produto");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  const removeQuoteItem = useMutation({
    mutationFn: async ({ quoteId, productId }: { quoteId: string; productId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      await assertQuoteEditable(quoteId);
      const { error } = await supabase
        .from("quote_items")
        .delete()
        .eq("quote_id", quoteId)
        .eq("product_id", productId);
      if (error) throw error;
      await supabase
        .from("quote_supplier_items")
        .delete()
        .eq("quote_id", quoteId)
        .eq("product_id", productId);
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      toast({ title: "Produto removido da cotação!" });
    },
    onError: (error: any) => {
      const f = friendlyError(error, "Erro ao remover produto");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  const addQuoteSupplier = useMutation({
    mutationFn: async ({ quoteId, supplierId, supplierName }: { quoteId: string; supplierId: string; supplierName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      await assertQuoteEditable(quoteId);
      const { error } = await supabase
        .from("quote_suppliers")
        .insert({ quote_id: quoteId, supplier_id: supplierId, supplier_name: supplierName, status: "pendente" });
      if (error) throw error;
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      toast({ title: "Fornecedor adicionado à cotação!" });
    },
    onError: (error: any) => {
      const f = friendlyError(error, "Erro ao adicionar fornecedor");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  const removeQuoteSupplier = useMutation({
    mutationFn: async ({ quoteId, supplierId }: { quoteId: string; supplierId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      await assertQuoteEditable(quoteId);
      const { error } = await supabase
        .from("quote_suppliers")
        .delete()
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId);
      if (error) throw error;
      await supabase
        .from("quote_supplier_items")
        .delete()
        .eq("quote_id", quoteId)
        .eq("supplier_id", supplierId);
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      toast({ title: "Fornecedor removido da cotação!" });
    },
    onError: (error: any) => {
      const f = friendlyError(error, "Erro ao remover fornecedor");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  const updateQuoteItemQuantity = useMutation({
    mutationFn: async ({
      quoteId,
      productId,
      quantidade,
      unidade,
    }: {
      quoteId: string;
      productId: string;
      quantidade: number;
      unidade: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      await assertQuoteEditable(quoteId);
      const { error } = await supabase
        .from("quote_items")
        .update({ quantidade: String(quantidade), unidade })
        .eq("quote_id", quoteId)
        .eq("product_id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      markMutationComplete();
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      toast({ title: "Quantidade atualizada!" });
    },
    onError: (error: any) => {
      const f = friendlyError(error, "Erro ao atualizar quantidade");
      toast({ title: f.title, description: f.description, variant: "destructive" });
    },
  });

  return {
    updateSupplierProductValue,
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
  };
}
