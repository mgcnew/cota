import { useEffect, startTransition } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoginForm } from "@/components/auth/LoginForm";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { usePrefetch, prefetchDashboard } from "@/hooks/usePrefetch";
import { cn } from "@/lib/utils";
import { designSystem as ds } from "@/styles/design-system";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Sanitize redirect: only allow internal absolute paths (no protocol, no //)
  const raw = searchParams.get("redirect");
  const redirectTo = raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/dashboard";

  useEffect(() => {
    if (user) {
      startTransition(() => {
        navigate(redirectTo, { replace: true });
      });
    }
  }, [user, navigate, redirectTo]);

  usePrefetch(prefetchDashboard, 1500);

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
      <header className="relative z-10 border-b border-border dark:border-white/5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <BrandLogo className="h-8" />
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center relative z-10 px-6 py-12">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className={cn("text-2xl tracking-tight", ds.typography.weight.extrabold, ds.colors.text.primary)}>
              Acessar Sistema
            </h1>
            <p className={cn("text-sm", ds.typography.weight.medium, ds.colors.text.muted)}>
              Entre com suas credenciais para continuar
            </p>
          </div>

          {/* Form card */}
          <div className="rounded-2xl border border-border dark:border-white/5 bg-white dark:bg-zinc-900/50 p-6 shadow-sm">
            <LoginForm onSuccess={() => navigate(redirectTo, { replace: true })} />
          </div>

          {/* Footer */}
          <p className={cn("text-center text-xs leading-relaxed", ds.typography.weight.medium, ds.colors.text.muted)}>
            Problemas com o acesso? Fale com o administrador do sistema.
          </p>
        </div>
      </main>
    </div>
  );
}
