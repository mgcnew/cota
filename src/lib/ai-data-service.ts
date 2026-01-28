import { supabase } from "@/integrations/supabase/client";

/**
 * Service to provide unified data access for the AI assistant.
 * Handles fetching context from multiple modules.
 */
export const AIDataService = {
  /**
   * Fetches comprehensive context for the AI.
   * Can be filtered or full based on needs.
   */
  async getFullContext() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch all relevant data in parallel for performance
    const [
      { data: products },
      { data: suppliers },
      { data: quotes },
      { data: orders },
      { data: stockCounts },
      { data: activityLogs },
      { data: packagingQuotes },
      { data: packagingOrders }
    ] = await Promise.all([
      supabase.from("products").select("*").limit(1000),
      supabase.from("suppliers").select("*").limit(500),
      supabase.from("quotes").select("*, quote_items(*), quote_suppliers(*)").order("created_at", { ascending: false }).limit(200),
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200),
      supabase.from("stock_counts").select("*, stock_count_items(*)").order("created_at", { ascending: false }).limit(50),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("packaging_quotes").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("packaging_orders").select("*").order("created_at", { ascending: false }).limit(100)
    ]);

    return {
      products: products || [],
      suppliers: suppliers || [],
      quotes: quotes || [],
      orders: orders || [],
      stockCounts: stockCounts || [],
      activityLogs: activityLogs || [],
      packaging: {
        quotes: packagingQuotes || [],
        orders: packagingOrders || []
      },
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email
      }
    };
  },

  /**
   * Search for specific data to provide more targeted context
   */
  async searchContext(query: string) {
    // Basic search implementation for products and suppliers
    const [
      { data: products },
      { data: suppliers }
    ] = await Promise.all([
      supabase.from("products").select("*").ilike("name", `%${query}%`).limit(10),
      supabase.from("suppliers").select("*").ilike("name", `%${query}%`).limit(10)
    ]);

    return { products, suppliers };
  }
};
