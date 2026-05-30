import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Busca a unidade mais recente usada por produto no histórico de
 * cotações e pedidos. Serve de fallback quando o produto não tem
 * unidade cadastrada.
 *
 * Cascata de preenchimento automático:
 *   1. products.unit  (cadastrado no produto)
 *   2. última unidade usada no histórico  ← este hook
 *   3. fallback padrão ("kg" ou "un")
 */
export function useLastUsedUnits() {
  const [lastUsedUnits, setLastUsedUnits] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [quoteRes, orderRes] = await Promise.all([
          supabase
            .from("quote_items")
            .select("product_id, unidade, created_at")
            .not("product_id", "is", null)
            .not("unidade", "is", null)
            .order("created_at", { ascending: false })
            .limit(500),
          supabase
            .from("order_items")
            .select("product_id, unit, created_at")
            .not("product_id", "is", null)
            .not("unit", "is", null)
            .order("created_at", { ascending: false })
            .limit(500),
        ]);

        // Mescla os dois resultados — mais recente vence
        const map: Record<string, { unit: string; date: string }> = {};

        (quoteRes.data || []).forEach((row: any) => {
          if (!row.product_id || !row.unidade) return;
          const prev = map[row.product_id];
          if (!prev || row.created_at > prev.date) {
            map[row.product_id] = { unit: row.unidade, date: row.created_at ?? "" };
          }
        });

        (orderRes.data || []).forEach((row: any) => {
          if (!row.product_id || !row.unit) return;
          const prev = map[row.product_id];
          if (!prev || row.created_at > prev.date) {
            map[row.product_id] = { unit: row.unit, date: row.created_at ?? "" };
          }
        });

        setLastUsedUnits(
          Object.fromEntries(Object.entries(map).map(([id, { unit }]) => [id, unit]))
        );
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  /**
   * Retorna a melhor unidade para um produto:
   * 1. Unidade cadastrada no produto
   * 2. Última usada no histórico
   * 3. Fallback
   */
  const getUnit = useCallback(
    (productId: string, productUnit?: string | null, fallback = "kg"): string => {
      if (productUnit) return productUnit;
      if (productId && lastUsedUnits[productId]) return lastUsedUnits[productId];
      return fallback;
    },
    [lastUsedUnits]
  );

  /**
   * Salva silenciosamente a unidade no cadastro do produto quando ele
   * ainda não tinha unidade — evita ter que buscar o histórico novamente.
   */
  const saveProductUnit = useCallback(
    async (productId: string, unit: string, currentProductUnit?: string | null) => {
      if (!productId || !unit || currentProductUnit) return;
      try {
        await supabase.from("products").update({ unit }).eq("id", productId);
      } catch {
        // silencioso — não é crítico
      }
    },
    []
  );

  return { lastUsedUnits, getUnit, saveProductUnit, isLoading };
}
