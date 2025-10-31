import { useCompany } from "@/hooks/useCompany";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, Users, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function CompanyInfo() {
  const { data: company, isLoading } = useCompany();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
          <CardDescription>Nenhuma empresa encontrada</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "trial":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "expired":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "enterprise":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      case "professional":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "basic":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Informações da Empresa
        </CardTitle>
        <CardDescription>Detalhes da sua empresa e assinatura</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Nome da Empresa</p>
              <p className="text-lg font-semibold">{company.name}</p>
            </div>
          </div>

          {company.cnpj && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
              <p className="font-mono">{company.cnpj}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Plano
              </p>
              <Badge className={getPlanColor(company.subscription_plan)}>
                {company.subscription_plan === "basic" && "Básico"}
                {company.subscription_plan === "professional" && "Profissional"}
                {company.subscription_plan === "enterprise" && "Enterprise"}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className={getStatusColor(company.subscription_status)}>
                {company.subscription_status === "active" && "Ativo"}
                {company.subscription_status === "trial" && "Período de Teste"}
                {company.subscription_status === "expired" && "Expirado"}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Limite de Usuários
              </p>
              <p className="font-semibold">{company.max_users} usuários</p>
            </div>

            {company.subscription_expires_at && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Expira em
                </p>
                <p className="font-semibold">
                  {new Date(company.subscription_expires_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
