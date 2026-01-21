import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type AppRole = 'owner' | 'admin' | 'member';

export function useUserRole() {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<AppRole | null> => {
      if (!user?.id) return null;

      try {
        // Primeiro tenta buscar da tabela user_roles
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error);
          // Se houver erro, tenta usar a função SECURITY DEFINER
          const { data: roleData, error: funcError } = await supabase
            .rpc('get_user_role', { _user_id: user.id });
          
          if (!funcError && roleData) {
            return roleData as AppRole;
          }
          return 'member';
        }

        if (data?.role) {
          return data.role as AppRole;
        }

        // Fallback: tenta usar a função SECURITY DEFINER
        const { data: roleData, error: funcError } = await supabase
          .rpc('get_user_role', { _user_id: user.id });
        
        if (!funcError && roleData) {
          return roleData as AppRole;
        }

        return 'member';
      } catch (error) {
        console.error("Error in useUserRole:", error);
        return 'member';
      }
    },
  });

  const isAdmin = role === 'admin' || role === 'owner';
  const isOwner = role === 'owner';

  return {
    role,
    isAdmin,
    isOwner,
    isLoading,
    canViewSensitiveData: isAdmin, // Only admin and owner can see sensitive supplier data
  };
}
