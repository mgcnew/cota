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
  ArrowUp,
  Calendar
} from "lucide-react";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { useCompany } from "@/hooks/useCompany";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function BillingSection() {
  const subscriptionStatus = useSubscriptionGuard();
  const subscriptionLimits = useSubscriptionLimits();
  const { data: company, isLoading } = useCompany();

  if (isLoading) {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="space-y-6">
      {/* Status da Assinatura */}
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
          {/* Informações do Plano */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Plano Atual</span>
              </div>
              <p className="text-2xl font-bold">{getPlanBadge()}</p>
            </div>
            
            {subscriptionStatus.isTrial && subscriptionStatus.daysUntilExpiry !== null && (
              <div className={`p-4 rounded-lg ${
                subscriptionStatus.daysUntilExpiry <= 3 
                  ? "bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800" 
                  : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium">Dias Restantes</span>
                </div>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {subscriptionStatus.daysUntilExpiry} {subscriptionStatus.daysUntilExpiry === 1 ? "dia" : "dias"}
                </p>
              </div>
            )}
            
            {!subscriptionStatus.isTrial && company?.subscription_expires_at && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Expira em</span>
                </div>
                <p className="text-lg font-semibold">{formatDate(company.subscription_expires_at)}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Uso de Recursos */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Uso de Recursos</h4>
            
            {/* Usuários */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Usuários</span>
                </div>
                <span className="font-semibold">
                  {subscriptionLimits.currentUsers} / {subscriptionLimits.maxUsers === Infinity ? "∞" : subscriptionLimits.maxUsers}
                </span>
              </div>
              <Progress 
                value={usersUsage} 
                className="h-2"
              />
              {usersUsage >= 80 && (
                <p className={`text-xs ${usersUsage >= 100 ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}>
                  {usersUsage >= 100 ? "Limite atingido" : "Próximo do limite"}
                </p>
              )}
            </div>

            {/* Produtos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Produtos</span>
                </div>
                <span className="font-semibold">
                  {subscriptionLimits.currentProducts} / {subscriptionLimits.maxProducts === Infinity ? "∞" : subscriptionLimits.maxProducts}
                </span>
              </div>
              <Progress 
                value={productsUsage} 
                className="h-2"
              />
              {productsUsage >= 80 && (
                <p className={`text-xs ${productsUsage >= 100 ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}>
                  {productsUsage >= 100 ? "Limite atingido" : "Próximo do limite"}
                </p>
              )}
            </div>

            {/* Fornecedores */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Fornecedores</span>
                </div>
                <span className="font-semibold">
                  {subscriptionLimits.currentSuppliers} / {subscriptionLimits.maxSuppliers === Infinity ? "∞" : subscriptionLimits.maxSuppliers}
                </span>
              </div>
              <Progress 
                value={suppliersUsage} 
                className="h-2"
              />
              {suppliersUsage >= 80 && (
                <p className={`text-xs ${suppliersUsage >= 100 ? "text-red-600 dark:text-red-400" : "text-orange-600 dark:text-orange-400"}`}>
                  {suppliersUsage >= 100 ? "Limite atingido" : "Próximo do limite"}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Ações */}
          <div className="flex flex-col gap-2">
            <Link to="/pricing">
              <Button className="w-full gradient-primary">
                <ArrowUp className="mr-2 h-4 w-4" />
                {subscriptionStatus.isTrial ? "Assinar Plano" : "Fazer Upgrade"}
              </Button>
            </Link>
            {subscriptionStatus.reason && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {subscriptionStatus.reason}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

