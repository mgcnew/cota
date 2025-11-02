import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

export interface UserCompany {
  id: string;
  name: string;
  cnpj: string | null;
  subscription_status: string;
  subscription_plan: string;
  corporate_group_id: string | null;
}

export function useUserCompanies() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["user-companies", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<UserCompany[]> => {
      if (!user?.id) return [];

      // Get all companies the user has access to
      const { data: companyUsers, error: companyUsersError } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id);

      if (companyUsersError) throw companyUsersError;
      if (!companyUsers || companyUsers.length === 0) return [];

      const companyIds = companyUsers.map(cu => cu.company_id);

      // Get company details
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("*")
        .in("id", companyIds)
        .order("name");

      if (companiesError) throw companiesError;

      return companiesData || [];
    },
  });

  const switchCompany = useMutation({
    mutationFn: async (companyId: string) => {
      // Store selected company in localStorage
      localStorage.setItem("selected_company_id", companyId);
      
      // Invalidate all queries to refetch with new company context
      queryClient.invalidateQueries();
      
      return companyId;
    },
    onSuccess: (companyId) => {
      const company = companies.find(c => c.id === companyId);
      toast({
        title: "Empresa alterada",
        description: `Agora você está gerenciando: ${company?.name}`,
      });
      
      // Reload the page to refresh all data
      window.location.reload();
    },
    onError: (error) => {
      console.error("Error switching company:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alternar de empresa.",
        variant: "destructive",
      });
    },
  });

  const getCurrentCompanyId = (): string | null => {
    const stored = localStorage.getItem("selected_company_id");
    if (stored && companies.some(c => c.id === stored)) {
      return stored;
    }
    // Default to first company
    return companies[0]?.id || null;
  };

  const currentCompany = companies.find(c => c.id === getCurrentCompanyId());

  return {
    companies,
    currentCompany,
    isLoading,
    switchCompany: switchCompany.mutate,
    getCurrentCompanyId,
    hasMultipleCompanies: companies.length > 1,
  };
}
