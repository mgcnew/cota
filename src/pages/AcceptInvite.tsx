import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signUp } = useAuth();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  useEffect(() => {
    if (!token) {
      setError("Token de convite inválido");
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      // Get invitation details
      const { data: inviteData, error: inviteError } = await supabase
        .from("company_invitations")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .single();

      if (inviteError || !inviteData) {
        setError("Convite não encontrado ou expirado");
        setLoading(false);
        return;
      }

      // Check if expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError("Este convite expirou");
        setLoading(false);
        return;
      }

      // Get company details
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", inviteData.company_id)
        .single();

      if (companyError || !companyData) {
        setError("Empresa não encontrada");
        setLoading(false);
        return;
      }

      setInvitation(inviteData);
      setCompany(companyData);
      setLoading(false);
    } catch (err) {
      console.error("Error loading invitation:", err);
      setError("Erro ao carregar convite");
      setLoading(false);
    }
  };

  const handleAcceptInvite = async (data: SignupForm) => {
    if (!invitation || !company) return;

    setAccepting(true);
    try {
      // If user is not logged in, create account
      if (!user) {
        const { error: signUpError } = await signUp(data.email, data.password);
        
        if (signUpError) {
          toast.error("Erro ao criar conta", {
            description: signUpError.message,
          });
          setAccepting(false);
          return;
        }

        // Wait a bit for the account to be created
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        toast.error("Erro na autenticação");
        setAccepting(false);
        return;
      }

      // Add user to company
      const { error: companyUserError } = await supabase
        .from("company_users")
        .insert({
          company_id: invitation.company_id,
          user_id: currentUser.id,
          invited_by: invitation.invited_by,
        });

      if (companyUserError) throw companyUserError;

      // Set user role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: currentUser.id,
          company_id: invitation.company_id,
          role: invitation.role,
        });

      if (roleError) throw roleError;

      // Update invitation status
      const { error: updateError } = await supabase
        .from("company_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      if (updateError) throw updateError;

      toast.success("Convite aceito!", {
        description: `Bem-vindo à ${company.name}`,
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Error accepting invite:", err);
      toast.error("Erro ao aceitar convite", {
        description: err.message || "Tente novamente mais tarde",
      });
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-center">Convite Inválido</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/auth")} className="w-full">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-center">Você foi convidado!</CardTitle>
          <CardDescription className="text-center">
            Aceite o convite para se juntar à empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Company Info */}
          <div className="p-4 rounded-lg bg-muted space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{company?.name}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <p>Email: {invitation?.email}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Função: <span className="font-medium text-foreground">
                {invitation?.role === "admin" ? "Administrador" : "Membro"}
              </span>
            </div>
          </div>

          {/* Signup Form or Accept Button */}
          {user ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Você já está autenticado como {user.email}
              </p>
              <Button 
                onClick={() => handleAcceptInvite({ email: user.email || "", password: "", confirmPassword: "" })} 
                className="w-full"
                disabled={accepting}
              >
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aceitando convite...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aceitar Convite
                  </>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handleAcceptInvite)} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Crie uma conta para aceitar o convite
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={invitation?.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={accepting}>
                {accepting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Criar Conta e Aceitar Convite
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
