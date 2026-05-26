/**
 * Orchestrator hook for the "cotações" domain.
 *
 * Internally composed of:
 *  - cotacoes/useCotacoesQuery       — data fetch + mapping
 *  - cotacoes/useCotacoesRealtime    — supabase realtime side effect
 *  - cotacoes/useCotacoesMutations   — all mutations (CRUD, conversion)
 *
 * The public shape returned here is unchanged from the legacy single-file
 * version so existing consumers keep working without edits.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useCotacoesQuery } from "./cotacoes/useCotacoesQuery";
import { useCotacoesRealtime } from "./cotacoes/useCotacoesRealtime";
import { useCotacoesMutations } from "./cotacoes/useCotacoesMutations";
import { markMutationComplete } from "./cotacoes/_dedup";

export type { FornecedorParticipante, SupplierItemWithPricing, Quote } from "./cotacoes/types";

export function useCotacoes() {
  const queryClient = useQueryClient();
  useCotacoesRealtime();

  const { data: cotacoes = [], isLoading } = useCotacoesQuery();
  const m = useCotacoesMutations();

  return {
    cotacoes,
    isLoading,
    refetch: async () => {
      await queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
      // Marking complete AFTER invalidation prevents realtime from triggering
      // a redundant second fetch.
      markMutationComplete();
    },
    updateSupplierProductValue: m.updateSupplierProductValue,
    // Backwards-compat alias kept from the legacy hook.
    updateQuoteItemPrice: m.updateSupplierProductValue,
    deleteQuote: m.deleteQuote,
    removeSupplierProduct: m.removeSupplierProduct,
    updateQuote: m.updateQuote,
    updateQuoteStatus: m.updateQuoteStatus,
    convertToOrder: m.convertToOrder,
    addQuoteItem: m.addQuoteItem,
    removeQuoteItem: m.removeQuoteItem,
    addQuoteSupplier: m.addQuoteSupplier,
    removeQuoteSupplier: m.removeQuoteSupplier,
    updateQuoteItemQuantity: m.updateQuoteItemQuantity,
    isUpdating:
      m.updateSupplierProductValue.isPending ||
      m.deleteQuote.isPending ||
      m.updateQuote.isPending ||
      m.updateQuoteStatus.isPending ||
      m.convertToOrder.isPending ||
      m.addQuoteItem.isPending ||
      m.removeQuoteItem.isPending ||
      m.addQuoteSupplier.isPending ||
      m.removeQuoteSupplier.isPending ||
      m.updateQuoteItemQuantity.isPending ||
      m.removeSupplierProduct.isPending,
  };
}
