import { useEffect, useState, startTransition } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { SubscriptionBlocked } from "@/components/billing/SubscriptionBlocked";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const subscriptionStatus = useSubscriptionGuard();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      startTransition(() => {
        setShouldRedirect(true);
      });
    }
  }, [loading, user]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirecionar para login se não autenticado
  if (shouldRedirect) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Bloquear acesso se assinatura não está ativa
  // Mas permitir acesso enquanto está carregando (para evitar bloqueio prematuro)
  if (!subscriptionStatus.canAccess && !subscriptionStatus.reason?.includes("Carregando")) {
    console.log('🔒 ProtectedRoute: Bloqueando acesso', subscriptionStatus);
    return <SubscriptionBlocked status={subscriptionStatus} />;
  }

  // Se ainda está carregando, mostrar loading
  if (subscriptionStatus.reason?.includes("Carregando")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando assinatura...</p>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo protegido se autenticado e com assinatura ativa
  return <>{children}</>;
}
