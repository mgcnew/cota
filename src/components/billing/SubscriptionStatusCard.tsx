import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { 
  CreditCard, 
  Users, 
  Package, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUp
} from "lucide-react";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useCompany } from "@/hooks/useCompany";
import { Skeleton } from "@/components/ui/skeleton";

export function SubscriptionStatusCard() {
  const subscriptionStatus = useSubscriptionGuard();
  const subscriptionLimits = useSubscriptionLimits();
  const { data: company } = useCompany();

  if (subscriptionLimits.isLoading || !company) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (subscriptionStatus.isTrial) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">Trial</Badge>;
    }
    if (subscriptionStatus.isExpired) {
      return <Badge variant="destructive">Expirado</Badge>;
    }
    if (subscriptionStatus.isSuspended) {
      return <Badge variant="destructive">Suspenso</Badge>;
    }
    return <Badge className="bg-green-500">Ativo</Badge>;
  };

  const getPlanBadge = () => {
    const plan = company?.subscription_plan || "basic";
    const planNames: Record<string, string> = {
      basic: "Basic",
      professional: "Professional",
      enterprise: "Enterprise",
    };
    return planNames[plan] || plan;
  };

  const calculateUsage = (current: number, max: number) => {
    if (max === Infinity) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const usersUsage = calculateUsage(subscriptionLimits.currentUsers, subscriptionLimits.maxUsers);
  const productsUsage = calculateUsage(subscriptionLimits.currentProducts, subscriptionLimits.maxProducts);
  const suppliersUsage = calculateUsage(subscriptionLimits.currentSuppliers, subscriptionLimits.maxSuppliers);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Status da Assinatura
            </CardTitle>
            <CardDescription className="mt-1">
              Gerencie seu plano e acompanhe seu uso
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            <Badge variant="outline">{getPlanBadge()}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status e Expiração */}
        {subscriptionStatus.isTrial && subscriptionStatus.daysUntilExpiry !== null && (
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {subscriptionStatus.daysUntilExpiry} {subscriptionStatus.daysUntilExpiry === 1 ? "dia" : "dias"} restantes
              </span>
            </div>
            {subscriptionStatus.daysUntilExpiry <= 3 && (
              <Link to="/pricing">
                <Button size="sm" variant="outline" className="text-xs">
                  Assinar Agora
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Uso de Recursos */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Uso de Recursos</h4>
          
          {/* Usuários */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Usuários</span>
              </div>
              <span className="font-medium">
                {subscriptionLimits.currentUsers} / {subscriptionLimits.maxUsers === Infinity ? "∞" : subscriptionLimits.maxUsers}
              </span>
            </div>
            <Progress 
              value={usersUsage} 
              className="h-2"
            />
            {usersUsage >= 80 && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {usersUsage >= 100 ? "Limite atingido" : "Próximo do limite"}
              </p>
            )}
          </div>

          {/* Produtos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>Produtos</span>
              </div>
              <span className="font-medium">
                {subscriptionLimits.currentProducts} / {subscriptionLimits.maxProducts === Infinity ? "∞" : subscriptionLimits.maxProducts}
              </span>
            </div>
            <Progress 
              value={productsUsage} 
              className="h-2"
            />
            {productsUsage >= 80 && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {productsUsage >= 100 ? "Limite atingido" : "Próximo do limite"}
              </p>
            )}
          </div>

          {/* Fornecedores */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>Fornecedores</span>
              </div>
              <span className="font-medium">
                {subscriptionLimits.currentSuppliers} / {subscriptionLimits.maxSuppliers === Infinity ? "∞" : subscriptionLimits.maxSuppliers}
              </span>
            </div>
            <Progress 
              value={suppliersUsage} 
              className="h-2"
            />
            {suppliersUsage >= 80 && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                {suppliersUsage >= 100 ? "Limite atingido" : "Próximo do limite"}
              </p>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2 pt-2 border-t">
          <Link to="/pricing">
            <Button className="w-full gradient-primary">
              <ArrowUp className="mr-2 h-4 w-4" />
              {subscriptionStatus.isTrial ? "Assinar Plano" : "Fazer Upgrade"}
            </Button>
          </Link>
          <Link to="/dashboard/configuracoes">
            <Button variant="outline" className="w-full">
              Gerenciar Assinatura
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

