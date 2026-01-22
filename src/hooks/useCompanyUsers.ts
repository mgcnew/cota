import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

export interface CompanyUser {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
  email?: string;
  company_id: string;
}

export function useCompanyUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["company-users", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async ({ signal }): Promise<CompanyUser[]> => {
      if (!user?.id) return [];

      // Get company_id first
      const { data: companyUserData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle()
        .abortSignal(signal);

      if (!companyUserData) return [];

      // Get all users from the company with their roles
      const { data: companyUsers, error: companyUsersError } = await supabase
        .from("company_users")
        .select("*")
        .eq("company_id", companyUserData.company_id)
        .order("joined_at", { ascending: false })
        .abortSignal(signal);

      if (companyUsersError) throw companyUsersError;
      if (!companyUsers || companyUsers.length === 0) return [];

      // Get roles from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("company_id", companyUserData.company_id)
        .abortSignal(signal);

      if (rolesError) throw rolesError;

      // Merge company_users with user_roles
      return companyUsers.map((cu) => {
        const roleData = userRoles?.find((r) => r.user_id === cu.user_id);
        return {
          id: cu.id,
          user_id: cu.user_id,
          role: (roleData?.role || "member") as "owner" | "admin" | "member",
          joined_at: cu.joined_at || new Date().toISOString(),
          company_id: cu.company_id,
        };
      });
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Get company_id
      const { data: companyUserData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!companyUserData) throw new Error("Empresa não encontrada");

      // Update or insert role in user_roles table
      const { error } = await supabase
        .from("user_roles")
        .upsert([{
          user_id: userId,
          company_id: companyUserData.company_id,
          role: newRole as "owner" | "admin" | "member",
        }], {
          onConflict: 'user_id,company_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast({
        title: "Função atualizada",
        description: "A função do usuário foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error updating role:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a função do usuário.",
        variant: "destructive",
      });
    },
  });

  const removeUser = useMutation({
    mutationFn: async (userId: string) => {
      // Remove from user_roles first
      const { error: roleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (roleError) throw roleError;

      // Then remove from company_users
      const { error } = await supabase
        .from("company_users")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-users"] });
      toast({
        title: "Usuário removido",
        description: "O usuário foi removido da empresa com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error removing user:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o usuário.",
        variant: "destructive",
      });
    },
  });

  return {
    users,
    isLoading,
    updateRole: updateRole.mutate,
    removeUser: removeUser.mutate,
  };
}
