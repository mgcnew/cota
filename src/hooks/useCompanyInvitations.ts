import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";

export interface CompanyInvitation {
  id: string;
  company_id: string;
  email: string;
  role: "owner" | "admin" | "member";
  invited_by: string;
  status: "pending" | "accepted" | "expired";
  token: string;
  expires_at: string;
  created_at: string;
}

export function useCompanyInvitations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["company-invitations", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<CompanyInvitation[]> => {
      if (!user?.id) return [];

      // Get company_id first
      const { data: companyUserData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!companyUserData) return [];

      // Get all pending invitations from the company
      const { data, error } = await supabase
        .from("company_invitations")
        .select("*")
        .eq("company_id", companyUserData.company_id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as CompanyInvitation[];
    },
  });

  const sendInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "admin" | "member" }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Get company_id
      const { data: companyUserData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!companyUserData) throw new Error("Empresa não encontrada");

      // Generate unique token
      const token = crypto.randomUUID();
      
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      const { error } = await supabase
        .from("company_invitations")
        .insert({
          company_id: companyUserData.company_id,
          email,
          role,
          invited_by: user.id,
          token,
          expires_at: expiresAt.toISOString(),
          status: "pending",
        });

      if (error) throw error;

      return { email, token };
    },
    onSuccess: ({ email }) => {
      queryClient.invalidateQueries({ queryKey: ["company-invitations"] });
      toast({
        title: "Convite enviado",
        description: `Um convite foi enviado para ${email}.`,
      });
    },
    onError: (error: any) => {
      console.error("Error sending invitation:", error);
      if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Este email já foi convidado.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível enviar o convite.",
          variant: "destructive",
        });
      }
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("company_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-invitations"] });
      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error canceling invitation:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o convite.",
        variant: "destructive",
      });
    },
  });

  return {
    invitations,
    isLoading,
    sendInvitation: sendInvitation.mutate,
    cancelInvitation: cancelInvitation.mutate,
    isSendingInvitation: sendInvitation.isPending,
  };
}
