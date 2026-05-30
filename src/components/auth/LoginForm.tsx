import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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

interface LoginFormProps {
  /** Chamado após autenticação bem-sucedida (ex.: navegar / fechar modal). */
  onSuccess?: () => void;
  /** Foca o campo de e-mail ao montar. */
  autoFocus?: boolean;
}

export function LoginForm({ onSuccess, autoFocus = true }: LoginFormProps) {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("cotapro_remember") === "true");

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem("cotapro_saved_email") || "",
      password: "",
    },
  });

  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => form.setFocus("email"), 100);
    return () => clearTimeout(t);
  }, [autoFocus, form]);

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
        const invalid = error.message.includes("Invalid login credentials");
        toast({
          title: invalid ? "Credenciais inválidas" : "Erro ao fazer login",
          description: invalid ? "E-mail ou senha incorretos. Tente novamente." : error.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Login realizado!", description: "Bem-vindo de volta ao CotaPro." });
      onSuccess?.();
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

  const inputClass = cn(
    "h-11 rounded-lg transition-all",
    "bg-zinc-50 dark:bg-zinc-800/50",
    "border-border dark:border-white/5",
    "focus:ring-2 focus:ring-brand/20 focus:border-brand",
    "placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
  );
  const labelClass = cn("text-[13px]", ds.typography.weight.semibold, ds.colors.text.secondary);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className={labelClass}>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="nome@empresa.com.br"
                  className={inputClass}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage className="text-red-500 text-xs font-medium" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className={labelClass}>Senha</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(inputClass, "pr-10")}
                    {...field}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-red-500 text-xs font-medium" />
            </FormItem>
          )}
        />

        {/* Lembrar e-mail */}
        <label className="flex items-center gap-2 cursor-pointer select-none group">
          <div className="relative">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="sr-only peer"
            />
            <div className={cn(
              "w-4 h-4 rounded border-2 transition-all flex items-center justify-center",
              "border-zinc-300 dark:border-zinc-600",
              "peer-checked:bg-brand peer-checked:border-brand",
              "group-hover:border-zinc-400 dark:group-hover:border-zinc-500"
            )}>
              {rememberMe && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className={cn("text-[13px]", ds.typography.weight.medium, ds.colors.text.muted)}>
            Lembrar meu e-mail
          </span>
        </label>

        <Button
          type="submit"
          className={cn(
            "w-full h-11 rounded-lg text-sm transition-all",
            "bg-brand hover:bg-brand/90 text-white active:scale-[0.98]",
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
  );
}
