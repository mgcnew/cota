import { useEffect } from "react";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ToastAction } from "@/components/ui/toast";
import React from "react";

const TRIAL_NOTIFICATION_KEY = "trial-notification-dismissed";

export function useTrialNotifications() {
  const subscriptionStatus = useSubscriptionGuard();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Só mostrar notificações se estiver em trial e não tiver expirado
    if (!subscriptionStatus.isTrial || subscriptionStatus.isExpired) {
      return;
    }

    const daysLeft = subscriptionStatus.daysUntilExpiry ?? 0;
    
    // Verificar se notificação já foi mostrada hoje
    const lastNotification = localStorage.getItem(TRIAL_NOTIFICATION_KEY);
    const today = new Date().toDateString();
    
    if (lastNotification === today) {
      return; // Já mostrou hoje
    }

    // Notificar quando restam 3 dias
    if (daysLeft === 3) {
      localStorage.setItem(TRIAL_NOTIFICATION_KEY, today);
      toast({
        title: "Seu trial expira em 3 dias",
        description: "Assine um plano para continuar usando todas as funcionalidades.",
        duration: 8000,
        action: React.createElement(ToastAction, {
          altText: "Ver planos",
          onClick: () => navigate("/pricing"),
        }, "Ver Planos"),
      });
      return;
    }

    // Notificar quando resta 1 dia
    if (daysLeft === 1) {
      localStorage.setItem(TRIAL_NOTIFICATION_KEY, today);
      toast({
        title: "⚠️ Seu trial expira amanhã!",
        description: "Não perca acesso! Assine um plano agora.",
        duration: 10000,
        variant: "destructive",
        action: React.createElement(ToastAction, {
          altText: "Assinar agora",
          onClick: () => navigate("/pricing"),
        }, "Assinar Agora"),
      });
      return;
    }

    // Notificar no dia da expiração (0 dias)
    if (daysLeft === 0) {
      localStorage.setItem(TRIAL_NOTIFICATION_KEY, today);
      toast({
        title: "🚨 Seu trial expira hoje!",
        description: "Assine um plano agora para não perder acesso ao sistema.",
        duration: 15000,
        variant: "destructive",
        action: React.createElement(ToastAction, {
          altText: "Assinar agora",
          onClick: () => navigate("/pricing"),
        }, "Assinar Agora"),
      });
    }
  }, [subscriptionStatus, toast, navigate]);
}

