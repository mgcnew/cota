import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SupplierOrderHistoryItem {
  id: string;
  orderDate: string;
  deliveryDate: string | null;
  status: string;
  totalValue: number;
  observations?: string | null;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export function useSupplierOrderHistory(supplierId: string) {
  return useQuery({
    queryKey: ["supplier-order-history", supplierId],
    enabled: Boolean(supplierId),
    queryFn: async (): Promise<SupplierOrderHistoryItem[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          supplier_id,
          order_date,
          delivery_date,
          status,
          total_value,
          observations,
          order_items (
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq("supplier_id", supplierId)
        .order("order_date", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map((order) => ({
        id: order.id,
        orderDate: order.order_date,
        deliveryDate: order.delivery_date,
        status: order.status,
        totalValue: Number(order.total_value) || 0,
        observations: order.observations,
        items:
          order.order_items?.map((item: any) => ({
            productName: item.product_name || "Produto",
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unit_price) || 0,
            totalPrice: Number(item.total_price) || 0,
          })) ?? [],
      }));
    },
  });
}
