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
}

export function useCompanyUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["company-users", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<CompanyUser[]> => {
      if (!user?.id) return [];

      // Get company_id first
      const { data: companyUserData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyUserData) return [];

      // Get all users from the company
      const { data, error } = await supabase
        .from("company_users")
        .select("*")
        .eq("company_id", companyUserData.company_id)
        .order("joined_at", { ascending: false });

      if (error) throw error;

      // Get email addresses from auth.users (via RPC or service role)
      // For now, we'll return without emails since we can't query auth.users directly
      return (data || []).map((cu) => ({
        id: cu.id,
        user_id: cu.user_id,
        role: cu.role as "owner" | "admin" | "member",
        joined_at: cu.joined_at || new Date().toISOString(),
      }));
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await supabase
        .from("company_users")
        .update({ role: newRole })
        .eq("user_id", userId);

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
