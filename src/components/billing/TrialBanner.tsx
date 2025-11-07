import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Clock, CreditCard, AlertTriangle } from "lucide-react";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { useState } from "react";

export function TrialBanner() {
  const subscriptionStatus = useSubscriptionGuard();
  const [dismissed, setDismissed] = useState(false);

  // Não mostrar se não for trial ou se foi dispensado
  if (!subscriptionStatus.isTrial || dismissed || subscriptionStatus.isExpired) {
    return null;
  }

  const daysLeft = subscriptionStatus.daysUntilExpiry ?? 0;
  const isWarning = daysLeft <= 3;
  const isUrgent = daysLeft <= 1;

  if (daysLeft <= 0) {
    return null; // Se expirou, mostrar SubscriptionBlocked em vez disso
  }

  return (
    <Alert 
      variant={isUrgent ? "destructive" : isWarning ? "default" : "default"}
      className={`mb-6 border-2 ${
        isUrgent 
          ? "border-red-500 bg-red-50 dark:bg-red-950/20" 
          : isWarning 
          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
          : "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {isUrgent ? (
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
          ) : (
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          )}
          <div className="flex-1">
            <AlertTitle className="text-base font-semibold">
              {isUrgent 
                ? "⚠️ Seu trial expira hoje!" 
                : isWarning 
                ? `Seu trial expira em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`
                : `Você está em período de teste (${daysLeft} dias restantes)`}
            </AlertTitle>
            <AlertDescription className="mt-1.5">
              {isUrgent 
                ? "Assine um plano agora para continuar usando todas as funcionalidades."
                : isWarning
                ? "Não perca acesso! Assine um plano para continuar usando o sistema."
                : "Teste todas as funcionalidades gratuitamente. Assine um plano quando estiver pronto."}
            </AlertDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/pricing">
            <Button 
              size="sm" 
              className={isUrgent || isWarning ? "gradient-primary" : ""}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Ver Planos
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}





