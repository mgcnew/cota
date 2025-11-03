import { useMemo } from "react";
import { useCompany } from "./useCompany";

export interface SubscriptionStatus {
  canAccess: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  isCancelled: boolean;
  daysUntilExpiry: number | null;
  reason: string | null;
}

export function useSubscriptionGuard(): SubscriptionStatus {
  const { data: company, isLoading } = useCompany();

  return useMemo(() => {
    // Se ainda está carregando ou não tem empresa
    if (isLoading || !company) {
      return {
        canAccess: false,
        isTrial: false,
        isExpired: false,
        isSuspended: false,
        isCancelled: false,
        daysUntilExpiry: null,
        reason: "Carregando informações da assinatura...",
      };
    }

    const status = company.subscription_status;
    const expiresAt = company.subscription_expires_at 
      ? new Date(company.subscription_expires_at) 
      : null;
    const now = new Date();

    // Verificar se está suspensa
    if (status === "suspended") {
      return {
        canAccess: false,
        isTrial: false,
        isExpired: false,
        isSuspended: true,
        isCancelled: false,
        daysUntilExpiry: null,
        reason: "Sua assinatura está suspensa. Entre em contato com o suporte para regularizar.",
      };
    }

    // Verificar se está cancelada
    if (status === "cancelled") {
      return {
        canAccess: false,
        isTrial: false,
        isExpired: false,
        isSuspended: false,
        isCancelled: true,
        daysUntilExpiry: null,
        reason: "Sua assinatura foi cancelada. Renove sua assinatura para continuar usando o sistema.",
      };
    }

    // Verificar se trial expirou
    if (status === "trial") {
      if (expiresAt && expiresAt < now) {
        return {
          canAccess: false,
          isTrial: true,
          isExpired: true,
          isSuspended: false,
          isCancelled: false,
          daysUntilExpiry: 0,
          reason: "Seu período de teste expirou. Assine um plano para continuar usando o sistema.",
        };
      }

      // Trial ainda ativo
      const daysLeft = expiresAt 
        ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        canAccess: true,
        isTrial: true,
        isExpired: false,
        isSuspended: false,
        isCancelled: false,
        daysUntilExpiry: daysLeft,
        reason: daysLeft !== null && daysLeft <= 3 
          ? `Seu período de teste expira em ${daysLeft} dia(s). Assine um plano para continuar.`
          : null,
      };
    }

    // Verificar se assinatura ativa expirou
    if (status === "active" && expiresAt && expiresAt < now) {
      return {
        canAccess: false,
        isTrial: false,
        isExpired: true,
        isSuspended: false,
        isCancelled: false,
        daysUntilExpiry: 0,
        reason: "Sua assinatura expirou. Renove sua assinatura para continuar usando o sistema.",
      };
    }

    // Assinatura ativa
    const daysLeft = expiresAt 
      ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      canAccess: true,
      isTrial: false,
      isExpired: false,
      isSuspended: false,
      isCancelled: false,
      daysUntilExpiry: daysLeft,
      reason: null,
    };
  }, [company, isLoading]);
}

