import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Clock, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubscriptionStatus } from "@/hooks/useSubscriptionGuard";

interface SubscriptionBlockedProps {
  status: SubscriptionStatus;
}

export function SubscriptionBlocked({ status }: SubscriptionBlockedProps) {
  const navigate = useNavigate();

  const getIcon = () => {
    if (status.isSuspended) return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
    if (status.isCancelled) return <XCircle className="h-12 w-12 text-red-500" />;
    if (status.isExpired) return <Clock className="h-12 w-12 text-orange-500" />;
    return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
  };

  const getTitle = () => {
    if (status.isSuspended) return "Assinatura Suspensa";
    if (status.isCancelled) return "Assinatura Cancelada";
    if (status.isExpired && status.isTrial) return "Período de Teste Expirado";
    if (status.isExpired) return "Assinatura Expirada";
    return "Acesso Restrito";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{getIcon()}</div>
          <CardTitle className="text-2xl">{getTitle()}</CardTitle>
          <CardDescription className="mt-2">{status.reason}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status.isTrial && status.isExpired && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <p className="text-sm text-orange-800 dark:text-orange-200">
                Seu período de teste de 14 dias expirou. Escolha um plano para continuar usando todas as funcionalidades.
              </p>
            </div>
          )}

          {status.isSuspended && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Entre em contato com nosso suporte para regularizar sua assinatura.
              </p>
            </div>
          )}

          {status.isCancelled && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                Para renovar sua assinatura, escolha um plano abaixo.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => navigate("/pricing")} 
              className="w-full"
              size="lg"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Ver Planos e Preços
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/dashboard/configuracoes")}
              className="w-full"
            >
              Ir para Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

