import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  subscription_status: string;
  subscription_plan: string;
  subscription_expires_at: string | null;
  max_users: number;
}

export function useCompany() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["company", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Company | null> => {
      if (!user?.id) return null;

      // Check if there's a selected company in localStorage
      const selectedCompanyId = localStorage.getItem("selected_company_id");

      let companyId: string;

      if (selectedCompanyId) {
        // Verify user has access to this company
        const { data: hasAccess } = await supabase
          .from("company_users")
          .select("company_id")
          .eq("user_id", user.id)
          .eq("company_id", selectedCompanyId)
          .maybeSingle();

        if (hasAccess) {
          companyId = selectedCompanyId;
        } else {
          // User doesn't have access, get first company
          const { data: companyUserData } = await supabase
            .from("company_users")
            .select("company_id")
            .eq("user_id", user.id)
            .limit(1)
            .single();

          if (!companyUserData) return null;
          companyId = companyUserData.company_id;
          localStorage.setItem("selected_company_id", companyId);
        }
      } else {
        // No selected company, get first one
        const { data: companyUserData, error: companyUserError } = await supabase
          .from("company_users")
          .select("company_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (companyUserError || !companyUserData) {
          console.error("Error fetching company user:", companyUserError);
          return null;
        }

        companyId = companyUserData.company_id;
        localStorage.setItem("selected_company_id", companyId);
      }

      // Get company details
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .single();

      if (companyError || !companyData) {
        console.error("Error fetching company:", companyError);
        return null;
      }

      return {
        id: companyData.id,
        name: companyData.name,
        cnpj: companyData.cnpj,
        subscription_status: companyData.subscription_status || "trial",
        subscription_plan: companyData.subscription_plan || "basic",
        subscription_expires_at: companyData.subscription_expires_at,
        max_users: companyData.max_users || 5,
      };
    },
  });
}
