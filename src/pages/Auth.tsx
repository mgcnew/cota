import { useState, useEffect, useRef, startTransition } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePrefetch, prefetchDashboard } from "@/hooks/usePrefetch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Package, TrendingUp, Users, Shield, CheckCircle2, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }),
  password: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres" }),
});

const signupSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }),
  password: z.string()
    .min(8, { message: "A senha deve ter no mínimo 8 caracteres" })
    .regex(/[A-Za-z]/, { message: "A senha deve conter pelo menos uma letra" })
    .regex(/[0-9]/, { message: "A senha deve conter pelo menos um número" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Refs for autofocus
  const loginEmailRef = useRef<HTMLInputElement>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      startTransition(() => {
        navigate(redirectTo, { replace: true });
      });
    }
  }, [user, navigate, searchParams]);

  // Autofocus first input field on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      loginEmailRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Prefetch Dashboard
  usePrefetch(prefetchDashboard, 1500);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Credenciais inválidas",
            description: "E-mail ou senha incorretos. Por favor, tente novamente.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao fazer login",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao CotaJá.",
      });
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-950">
      {/* Lado Esquerdo - Informações do Sistema (Premium Dark) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-black border-r border-zinc-800">
        <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-zinc-950 font-bold">
                C
              </div>
              <span className="text-2xl font-extrabold tracking-tighter">CotaJá</span>
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight mb-6">
              O futuro da <br />
              <span className="text-brand">Gestão de Compras</span>
            </h1>
            <p className="text-zinc-400 text-xl font-medium max-w-md leading-relaxed">
              Sistema exclusivo de alta performance para cotações estratégicas e automação de suprimentos.
            </p>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="text-brand font-bold text-2xl">30%</div>
                <p className="text-zinc-500 text-sm font-medium">Economia média em compras</p>
              </div>
              <div className="space-y-2">
                <div className="text-brand font-bold text-2xl">10x</div>
                <p className="text-zinc-500 text-sm font-medium">Mais agilidade no processo</p>
              </div>
            </div>

            <div className="pt-8 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold">
                <Shield className="h-4 w-4 text-brand" />
                SISTEMA DE USO RESTRITO
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário de Autenticação */}
      <div className="flex-1 flex items-center justify-center p-8 bg-zinc-950">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Login</h2>
            <p className="text-zinc-500 font-medium">
              Entre com suas credenciais de acesso ao sistema
            </p>
          </div>

          <div className="space-y-6">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-zinc-300 font-bold text-xs uppercase tracking-widest">E-mail Corporativo</FormLabel>
                      <FormControl>
                        <Input
                          ref={loginEmailRef}
                          type="email"
                          placeholder="nome@empresa.com.br"
                          className="bg-zinc-900 border-zinc-800 text-white h-12 focus:ring-brand focus:border-brand transition-all"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-zinc-300 font-bold text-xs uppercase tracking-widest">Senha de Acesso</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-zinc-900 border-zinc-800 text-white h-12 focus:ring-brand focus:border-brand transition-all"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 font-medium" />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full h-12 bg-brand hover:bg-brand/90 text-zinc-950 font-extrabold text-base transition-all transform active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Autenticando...
                      </>
                    ) : (
                      "Entrar no Sistema"
                    )}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="text-center pt-4">
              <p className="text-zinc-600 text-[13px] font-medium leading-relaxed max-w-[280px] mx-auto">
                Problemas com seu acesso? Entre em contato com o administrador da rede.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
