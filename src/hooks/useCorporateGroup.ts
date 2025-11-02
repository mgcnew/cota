import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

export interface CorporateGroup {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  max_companies: number;
  created_at: string;
  updated_at: string;
}

export interface CorporateGroupWithStats extends CorporateGroup {
  companies_count: number;
  calculated_discount: number;
}

export function useCorporateGroup() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: group, isLoading } = useQuery({
    queryKey: ["corporate-group", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<CorporateGroupWithStats | null> => {
      if (!user?.id) return null;

      // Get user's company
      const { data: companyUser } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!companyUser) return null;

      // Get company's corporate group
      const { data: company } = await supabase
        .from("companies")
        .select("corporate_group_id")
        .eq("id", companyUser.company_id)
        .maybeSingle();

      if (!company?.corporate_group_id) return null;

      // Get corporate group details
      const { data: corporateGroup, error } = await supabase
        .from("corporate_groups")
        .select("*")
        .eq("id", company.corporate_group_id)
        .single();

      if (error) throw error;

      // Get companies count in this group
      const { count } = await supabase
        .from("companies")
        .select("*", { count: "exact", head: true })
        .eq("corporate_group_id", company.corporate_group_id);

      // Calculate discount based on companies count
      const calculatedDiscount = 
        (count || 0) >= 10 ? 30 :
        (count || 0) >= 5 ? 20 :
        (count || 0) >= 3 ? 15 :
        (count || 0) >= 2 ? 10 : 0;

      return {
        ...corporateGroup,
        companies_count: count || 0,
        calculated_discount: calculatedDiscount,
      };
    },
  });

  const createGroup = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Get user's company
      const { data: companyUser, error: companyUserError } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companyUserError) throw companyUserError;
      if (!companyUser) throw new Error("User not associated with a company");

      // Create corporate group
      const { data: newGroup, error: groupError } = await supabase
        .from("corporate_groups")
        .insert([data])
        .select()
        .single();

      if (groupError) throw groupError;

      // Associate company with the new group
      const { error: updateError } = await supabase
        .from("companies")
        .update({ corporate_group_id: newGroup.id })
        .eq("id", companyUser.company_id);

      if (updateError) throw updateError;

      return newGroup;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-group"] });
      toast({
        title: "Grupo criado",
        description: "Grupo corporativo criado e associado à sua empresa com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error creating corporate group:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o grupo corporativo.",
        variant: "destructive",
      });
    },
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CorporateGroup> }) => {
      const { error } = await supabase
        .from("corporate_groups")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["corporate-group"] });
      toast({
        title: "Grupo atualizado",
        description: "Grupo corporativo atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error updating corporate group:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o grupo corporativo.",
        variant: "destructive",
      });
    },
  });

  return {
    group,
    isLoading,
    createGroup: createGroup.mutate,
    updateGroup: updateGroup.mutate,
  };
}
