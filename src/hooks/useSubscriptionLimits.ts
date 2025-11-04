import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserRole } from "./useUserRole";

export interface SubscriptionLimits {
  canAddUser: boolean;
  canAddProduct: boolean;
  canAddSupplier: boolean;
  currentUsers: number;
  currentProducts: number;
  currentSuppliers: number;
  maxUsers: number;
  maxProducts: number;
  maxSuppliers: number;
  isLoading: boolean;
}

export function useSubscriptionLimits(): SubscriptionLimits {
  const { user } = useAuth();
  const { data: company } = useCompany();
  const { isOwner } = useUserRole();

  // Lista de emails conhecidos de owners do sistema (para casos especiais)
  const ownerEmails = ['mgc.info.new@gmail.com'];
  const userIsOwner = isOwner === true || (user?.email && ownerEmails.includes(user.email.toLowerCase().trim()));

  const { data: limits, isLoading } = useQuery({
    queryKey: ["subscription-limits", company?.id],
    enabled: Boolean(company?.id && user?.id),
    queryFn: async () => {
      if (!company?.id || !user?.id) {
        return {
          currentUsers: 0,
          currentProducts: 0,
          currentSuppliers: 0,
          maxUsers: 5,
          maxProducts: 100,
          maxSuppliers: 50,
        };
      }

      // Obter limites do plano
      const { data: planFeatures } = await supabase
        .from("plan_features")
        .select("*")
        .eq("plan_name", company.subscription_plan || "basic")
        .single();

      const maxUsers = planFeatures?.max_users ?? 5;
      const maxProducts = planFeatures?.max_products ?? 100;
      const maxSuppliers = planFeatures?.max_suppliers ?? 50;

      // Contar recursos atuais
      const [usersResult, productsResult, suppliersResult] = await Promise.all([
        supabase
          .from("company_users")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
        supabase
          .from("suppliers")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
      ]);

      const currentUsers = usersResult.count ?? 0;
      const currentProducts = productsResult.count ?? 0;
      const currentSuppliers = suppliersResult.count ?? 0;

      return {
        currentUsers,
        currentProducts,
        currentSuppliers,
        maxUsers: maxUsers === -1 ? Infinity : maxUsers,
        maxProducts: maxProducts === -1 ? Infinity : maxProducts,
        maxSuppliers: maxSuppliers === -1 ? Infinity : maxSuppliers,
      };
    },
  });

  // Owners não têm limites - sempre permitir adicionar recursos
  const canAddUser = userIsOwner ? true : (limits ? limits.currentUsers < limits.maxUsers : false);
  const canAddProduct = userIsOwner ? true : (limits ? limits.currentProducts < limits.maxProducts : false);
  const canAddSupplier = userIsOwner ? true : (limits ? limits.currentSuppliers < limits.maxSuppliers : false);

  return {
    canAddUser,
    canAddProduct,
    canAddSupplier,
    currentUsers: limits?.currentUsers ?? 0,
    currentProducts: limits?.currentProducts ?? 0,
    currentSuppliers: limits?.currentSuppliers ?? 0,
    maxUsers: limits?.maxUsers ?? 5,
    maxProducts: limits?.maxProducts ?? 100,
    maxSuppliers: limits?.maxSuppliers ?? 50,
    isLoading,
  };
}


