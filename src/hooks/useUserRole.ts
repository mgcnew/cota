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

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data?.role as AppRole || 'member';
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
