import { Building2, Users, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { useUserCompanies } from "@/hooks/useUserCompanies";
import { useCorporateGroup } from "@/hooks/useCorporateGroup";
import { useUserRole } from "@/hooks/useUserRole";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function SuperAdminDashboard() {
  const { isOwner, isLoading: roleLoading } = useUserRole();
  const { companies, isLoading: companiesLoading } = useUserCompanies();
  const { group, isLoading: groupLoading } = useCorporateGroup();

  if (roleLoading || companiesLoading || groupLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  const activeCompanies = companies.filter(c => c.subscription_status === 'active');
  const totalCompanies = companies.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Painel Super-Admin</h2>
        <p className="text-muted-foreground">
          Visão geral de todas as empresas do grupo corporativo
        </p>
      </div>

      {group && (
        <Card>
          <CardHeader>
            <CardTitle>Grupo Corporativo: {group.name}</CardTitle>
            {group.description && (
              <CardDescription>{group.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Empresas no Grupo</p>
                <p className="text-2xl font-bold">{group.companies_count}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Desconto Aplicado</p>
                <p className="text-2xl font-bold text-green-600">
                  {group.calculated_discount}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {group.companies_count >= 10 && "Desconto máximo atingido!"}
                  {group.companies_count >= 5 && group.companies_count < 10 && "Adicione mais 5 empresas para 30% de desconto"}
                  {group.companies_count >= 3 && group.companies_count < 5 && "Adicione mais empresas para 20% de desconto"}
                  {group.companies_count >= 2 && group.companies_count < 3 && "Adicione mais empresas para 15% de desconto"}
                  {group.companies_count < 2 && "Adicione mais empresas para descontos progressivos"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Empresas"
          value={totalCompanies.toString()}
          icon={Building2}
        />
        <MetricCard
          title="Empresas Ativas"
          value={activeCompanies.length.toString()}
          icon={TrendingUp}
        />
        <MetricCard
          title="Desconto Atual"
          value={`${group?.calculated_discount || 0}%`}
          icon={Package}
        />
        <MetricCard
          title="Máximo de Empresas"
          value={group?.max_companies.toString() || "10"}
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Empresas do Grupo</CardTitle>
          <CardDescription>
            Todas as empresas vinculadas ao seu grupo corporativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{company.name}</p>
                  </div>
                  {company.cnpj && (
                    <p className="text-sm text-muted-foreground">CNPJ: {company.cnpj}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={company.subscription_status === 'active' ? 'default' : 'secondary'}>
                    {company.subscription_status}
                  </Badge>
                  <Badge variant="outline">
                    {company.subscription_plan}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
