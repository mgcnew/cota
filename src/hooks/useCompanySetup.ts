import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export const useCompanySetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const checkAndCreateCompany = async () => {
      if (!user?.id || isChecking) return;

      setIsChecking(true);

      try {
        // Check if user already has a company
        const { data: existingCompany, error: checkError } = await supabase
          .from("company_users")
          .select("company_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (checkError) throw checkError;

        // If user already has a company, no need to create one
        if (existingCompany) {
          setIsChecking(false);
          return;
        }

        // Create a new company for the user
        const { data: newCompany, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: `Empresa de ${user.email?.split('@')[0] || 'Usuário'}`,
            subscription_status: 'trial',
            subscription_plan: 'basic',
            max_users: 5
          })
          .select()
          .single();

        if (companyError) throw companyError;

        // Add user to the company
        const { error: companyUserError } = await supabase
          .from("company_users")
          .insert({
            company_id: newCompany.id,
            user_id: user.id,
            invited_by: user.id
          });

        if (companyUserError) throw companyUserError;

        // Set user as owner
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: user.id,
            company_id: newCompany.id,
            role: 'owner'
          });

        if (roleError) throw roleError;

        toast({
          title: "Empresa criada!",
          description: "Sua empresa foi configurada automaticamente.",
        });

      } catch (error: any) {
        console.error("Erro ao configurar empresa:", error);
        toast({
          title: "Erro ao configurar empresa",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsChecking(false);
      }
    };

    checkAndCreateCompany();
  }, [user?.id]);

  return { isChecking };
};
