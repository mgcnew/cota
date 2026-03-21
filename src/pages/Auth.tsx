import { useState, useEffect, useRef, startTransition } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { usePrefetch, prefetchDashboard } from "@/hooks/usePrefetch";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }),
  password: z.string().min(8, { message: "A senha deve ter no mínimo 8 caracteres" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem("cotapro_remember") === "true";
  });

  const loginEmailRef = useRef<HTMLInputElement>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem("cotapro_saved_email") || "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get("redirect") || "/dashboard";
      startTransition(() => {
        navigate(redirectTo, { replace: true });
      });
    }
  }, [user, navigate, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loginEmailRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  usePrefetch(prefetchDashboard, 1500);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem("cotapro_remember", "true");
        localStorage.setItem("cotapro_saved_email", data.email);
      } else {
        localStorage.removeItem("cotapro_remember");
        localStorage.removeItem("cotapro_saved_email");
      }

      const { error } = await signIn(data.email, data.password);

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Credenciais inválidas",
            description: "E-mail ou senha incorretos. Tente novamente.",
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
        title: "Login realizado!",
        description: "Bem-vindo de volta ao CotaPro.",
      });
    } catch {
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
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950">
      {/* Background pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px]" />
      </div>

      {/* Top bar with logo */}
      <header className="relative z-10 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link to="/" className="flex items-center">
            <img
              src="/logo-cotapro.png"
              alt="CotaPro"
              className="h-40 -my-[52px] translate-y-1 w-auto object-contain"
            />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-6 py-12">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className={cn(
              "text-2xl tracking-tight",
              ds.typography.weight.extrabold,
              ds.colors.text.primary
            )}>
              Acessar Sistema
            </h1>
            <p className={cn(
              "text-sm",
              ds.typography.weight.medium,
              ds.colors.text.muted
            )}>
              Entre com suas credenciais para continuar
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={cn(
                        "text-[13px]",
                        ds.typography.weight.semibold,
                        ds.colors.text.secondary
                      )}>
                        E-mail
                      </FormLabel>
                      <FormControl>
                        <Input
                          ref={loginEmailRef}
                          type="email"
                          placeholder="nome@empresa.com.br"
                          className={cn(
                            "h-11 rounded-lg transition-all",
                            "bg-zinc-50 dark:bg-zinc-800/50",
                            "border-zinc-200 dark:border-zinc-700",
                            "focus:ring-2 focus:ring-brand/20 focus:border-brand",
                            "placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                          )}
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className={cn(
                        "text-[13px]",
                        ds.typography.weight.semibold,
                        ds.colors.text.secondary
                      )}>
                        Senha
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className={cn(
                              "h-11 rounded-lg pr-10 transition-all",
                              "bg-zinc-50 dark:bg-zinc-800/50",
                              "border-zinc-200 dark:border-zinc-700",
                              "focus:ring-2 focus:ring-brand/20 focus:border-brand",
                              "placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                            )}
                            {...field}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-xs font-medium" />
                    </FormItem>
                  )}
                />

                {/* Remember me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className={cn(
                        "w-4 h-4 rounded border-2 transition-all",
                        "border-zinc-300 dark:border-zinc-600",
                        "peer-checked:bg-brand peer-checked:border-brand",
                        "group-hover:border-zinc-400 dark:group-hover:border-zinc-500",
                        "flex items-center justify-center"
                      )}>
                        {rememberMe && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[13px]",
                      ds.typography.weight.medium,
                      ds.colors.text.muted
                    )}>
                      Lembrar meu e-mail
                    </span>
                  </label>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className={cn(
                    "w-full h-11 rounded-lg text-sm transition-all",
                    "bg-brand hover:bg-brand/90 text-white",
                    "active:scale-[0.98]",
                    ds.typography.weight.bold
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Autenticando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Footer */}
          <p className={cn(
            "text-center text-xs leading-relaxed",
            ds.typography.weight.medium,
            ds.colors.text.muted
          )}>
            Problemas com o acesso? Fale com o administrador do sistema.
          </p>
        </div>
      </main>
    </div>
  );
}
