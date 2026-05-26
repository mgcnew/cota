import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { shouldSkipRealtimeInvalidation } from "./_dedup";

// Module-level guard: many components call useCotacoes() simultaneously and
// we only want one realtime channel for the app. The channel stays alive for
// the lifetime of the tab; React component unmount does not close it.
let isRealtimeSubscribed = false;
let globalChannel: ReturnType<typeof supabase.channel> | null = null;

/**
 * Listens to `quotes`, `quote_items`, `quote_suppliers` and
 * `quote_supplier_items` postgres changes and invalidates the `['cotacoes']`
 * query when remote changes arrive. Skips invalidation during the dedup
 * window to avoid double-fetches right after a local mutation.
 */
export function useCotacoesRealtime(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isRealtimeSubscribed) return;
    isRealtimeSubscribed = true;

    const handleRealtimeEvent = (_table: string, _payload: unknown) => {
      if (shouldSkipRealtimeInvalidation()) return;
      queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
    };

    globalChannel = supabase
      .channel("quotes-realtime-global")
      .on("postgres_changes" as any, { event: "*", table: "quotes" }, (p: any) => handleRealtimeEvent("quotes", p))
      .on("postgres_changes" as any, { event: "*", table: "quote_items" }, (p: any) => handleRealtimeEvent("quote_items", p))
      .on("postgres_changes" as any, { event: "*", table: "quote_suppliers" }, (p: any) => handleRealtimeEvent("quote_suppliers", p))
      .on("postgres_changes" as any, { event: "*", table: "quote_supplier_items" }, (p: any) => handleRealtimeEvent("quote_supplier_items", p))
      .subscribe();

    // Intentionally no cleanup: channel persists for the whole session to
    // avoid thrashing when components mount/unmount in quick succession.
    return () => {
      void globalChannel; // referenced to keep linter happy without disposing
    };
  }, [queryClient]);
}
