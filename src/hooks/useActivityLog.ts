import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

type ActivityType = "cotacao" | "pedido" | "fornecedor" | "produto";

interface LogActivityParams {
  tipo: ActivityType;
  acao: string;
  detalhes: string;
  valor?: number;
  economia?: number;
}

export const useActivityLog = () => {
  const { user } = useAuth();

  const logActivity = async ({
    tipo,
    acao,
    detalhes,
    valor,
    economia
  }: LogActivityParams) => {
    if (!user?.id) return;

    try {
      // Get company_id
      const { data: companyData } = await supabase
        .from("company_users")
        .select("company_id")
        .eq("user_id", user.id)
        .single();

      if (!companyData) {
        console.error("Empresa não encontrada");
        return;
      }

      const { error } = await supabase.from("activity_log").insert({
        company_id: companyData.company_id,
        tipo,
        acao,
        detalhes,
        valor: valor || null,
        economia: economia || null
      });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao registrar atividade:", error);
    }
  };

  return { logActivity };
};
