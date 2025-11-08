# ✅ GUIA: VERIFICAR COMPONENTES REACT NO LOVABLE

## 📋 PASSO A PASSO RÁPIDO

### 1. Verificar se os arquivos existem

No Lovable: **Code → File Explorer**

Verifique se estes arquivos existem:

#### Hooks:
- [ ] `src/hooks/useSubscriptionGuard.tsx`
- [ ] `src/hooks/useSubscriptionLimits.ts`

#### Componentes:
- [ ] `src/components/billing/SubscriptionBlocked.tsx`
- [ ] `src/components/billing/LimitAlert.tsx`

---

### 2. Se algum arquivo NÃO existir:

**Opção A: Copiar do GitHub (Mais Fácil)**
1. Vá em: https://github.com/revoltos4820/cotaja
2. Navegue até o arquivo que falta
3. Copie o código completo
4. No Lovable: **Code → New File**
5. Cole o código

**Opção B: Criar Manualmente**
- Siga os passos abaixo para criar cada arquivo

---

## 📝 CRIAR ARQUIVOS MANUALMENTE (SE NECESSÁRIO)

### Arquivo 1: `src/hooks/useSubscriptionGuard.tsx`

No Lovable: **Code → New File → `src/hooks/useSubscriptionGuard.tsx`**

Copie este código:
```typescript
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
```

---

### Arquivo 2: `src/hooks/useSubscriptionLimits.ts`

No Lovable: **Code → New File → `src/hooks/useSubscriptionLimits.ts`**

Copie este código:
```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { useAuth } from "@/components/auth/AuthProvider";

export interface SubscriptionLimits {
  canAddUser: boolean;
  canAddProduct: boolean;
  canAddSupplier: boolean;
  currentUsers: number;
  currentProducts: number;
  currentSuppliers: number;
  maxUsers: number;
  maxProducts: number;
  maxSuppliers: number;
  isLoading: boolean;
}

export function useSubscriptionLimits(): SubscriptionLimits {
  const { user } = useAuth();
  const { data: company } = useCompany();

  const { data: limits, isLoading } = useQuery({
    queryKey: ["subscription-limits", company?.id],
    enabled: Boolean(company?.id && user?.id),
    queryFn: async () => {
      if (!company?.id || !user?.id) {
        return {
          currentUsers: 0,
          currentProducts: 0,
          currentSuppliers: 0,
          maxUsers: 5,
          maxProducts: 100,
          maxSuppliers: 50,
        };
      }

      // Obter limites do plano
      const { data: planFeatures } = await supabase
        .from("plan_features")
        .select("*")
        .eq("plan_name", company.subscription_plan || "basic")
        .single();

      const maxUsers = planFeatures?.max_users ?? 5;
      const maxProducts = planFeatures?.max_products ?? 100;
      const maxSuppliers = planFeatures?.max_suppliers ?? 50;

      // Contar recursos atuais
      const [usersResult, productsResult, suppliersResult] = await Promise.all([
        supabase
          .from("company_users")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
        supabase
          .from("suppliers")
          .select("id", { count: "exact", head: true })
          .eq("company_id", company.id),
      ]);

      const currentUsers = usersResult.count ?? 0;
      const currentProducts = productsResult.count ?? 0;
      const currentSuppliers = suppliersResult.count ?? 0;

      return {
        currentUsers,
        currentProducts,
        currentSuppliers,
        maxUsers: maxUsers === -1 ? Infinity : maxUsers,
        maxProducts: maxProducts === -1 ? Infinity : maxProducts,
        maxSuppliers: maxSuppliers === -1 ? Infinity : maxSuppliers,
      };
    },
  });

  return {
    canAddUser: limits ? limits.currentUsers < limits.maxUsers : false,
    canAddProduct: limits ? limits.currentProducts < limits.maxProducts : false,
    canAddSupplier: limits ? limits.currentSuppliers < limits.maxSuppliers : false,
    currentUsers: limits?.currentUsers ?? 0,
    currentProducts: limits?.currentProducts ?? 0,
    currentSuppliers: limits?.currentSuppliers ?? 0,
    maxUsers: limits?.maxUsers ?? 5,
    maxProducts: limits?.maxProducts ?? 100,
    maxSuppliers: limits?.maxSuppliers ?? 50,
    isLoading,
  };
}
```

---

### Arquivo 3: `src/components/billing/SubscriptionBlocked.tsx`

No Lovable: **Code → New File → `src/components/billing/SubscriptionBlocked.tsx`**

**Importante:** Primeiro crie a pasta `billing` se não existir.

Copie este código:
```typescript
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
```

---

### Arquivo 4: `src/components/billing/LimitAlert.tsx`

No Lovable: **Code → New File → `src/components/billing/LimitAlert.tsx`**

Copie este código:
```typescript
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LimitAlertProps {
  resource: "users" | "products" | "suppliers";
  current: number;
  max: number;
  onUpgrade?: () => void;
}

export function LimitAlert({ resource, current, max, onUpgrade }: LimitAlertProps) {
  const navigate = useNavigate();
  
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  if (!isNearLimit) return null;

  const resourceNames = {
    users: "usuários",
    products: "produtos",
    suppliers: "fornecedores",
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate("/pricing");
    }
  };

  return (
    <Alert variant={isAtLimit ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isAtLimit ? "Limite Atingido" : "Limite Próximo"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p>
          Você está usando {current} de {max === Infinity ? "ilimitado" : max} {resourceNames[resource]}.
          {isAtLimit && " Não é possível adicionar mais."}
          {isNearLimit && !isAtLimit && " Considere fazer upgrade do plano."}
        </p>
        {isAtLimit && (
          <Button 
            onClick={handleUpgrade} 
            className="mt-3"
            size="sm"
          >
            <ArrowUp className="mr-2 h-4 w-4" />
            Fazer Upgrade
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
```

---

## ✅ CHECKLIST FINAL

Após criar/verificar todos os arquivos:

- [ ] `useSubscriptionGuard.tsx` existe e está funcionando
- [ ] `useSubscriptionLimits.ts` existe e está funcionando
- [ ] `SubscriptionBlocked.tsx` existe e está funcionando
- [ ] `LimitAlert.tsx` existe e está funcionando
- [ ] Não há erros de importação
- [ ] Não há erros de lint

---

## 🐛 SE DER ERRO:

**Erro de importação:**
- Verifique se `useCompany` existe em `src/hooks/useCompany.ts`
- Verifique se `useAuth` existe em `src/components/auth/AuthProvider.tsx`

**Erro de componente UI:**
- Verifique se os componentes shadcn/ui estão instalados (Card, Button, Alert, Badge)

**Pasta não existe:**
- No Lovable: **Code → New Folder → `src/components/billing`**

---

**Quando terminar, me avise e vamos para a próxima fase!**






