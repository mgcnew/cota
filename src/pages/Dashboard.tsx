import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TrendingUp, TrendingDown, Package, Building2, FileText, ShoppingCart, DollarSign, Users, Calendar, ArrowUpRight, Plus } from "lucide-react";
export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("30d");

  // Mock data baseado na planilha Excel
  const metrics = [{
    title: "Cotações Ativas",
    value: "24",
    change: "+12%",
    changeType: "positive" as const,
    icon: FileText,
    description: "vs mês anterior"
  }, {
    title: "Fornecedores",
    value: "18",
    change: "+2",
    changeType: "positive" as const,
    icon: Building2,
    description: "novos este mês"
  }, {
    title: "Economia Gerada",
    value: "R$ 15.847",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: DollarSign,
    description: "vs mês anterior"
  }, {
    title: "Produtos Cotados",
    value: "156",
    change: "+5.1%",
    changeType: "positive" as const,
    icon: Package,
    description: "itens únicos"
  }];
  const recentQuotes = [{
    id: "COT-001",
    product: "Coxa com Sobrecoxa",
    quantity: "500kg",
    bestPrice: "R$ 7.60",
    supplier: "Holambra",
    date: "22/09/2025",
    status: "active"
  }, {
    id: "COT-002",
    product: "Filé de Frango",
    quantity: "500kg",
    bestPrice: "R$ 15.84",
    supplier: "Seara",
    date: "22/09/2025",
    status: "completed"
  }, {
    id: "COT-003",
    product: "Linguiça Toscana Aurora",
    quantity: "200kg",
    bestPrice: "R$ 18.49",
    supplier: "Davi",
    date: "17/09/2025",
    status: "pending"
  }, {
    id: "COT-004",
    product: "Contra Filé",
    quantity: "0kg",
    bestPrice: "R$ 36.00",
    supplier: "Silvia",
    date: "18/09/2025",
    status: "completed"
  }];
  const topSuppliers = [{
    name: "Holambra",
    quotes: 8,
    avgPrice: "R$ 7.60",
    savings: "12%"
  }, {
    name: "Seara",
    quotes: 6,
    avgPrice: "R$ 15.84",
    savings: "8%"
  }, {
    name: "Davi",
    quotes: 12,
    avgPrice: "R$ 18.49",
    savings: "15%"
  }, {
    name: "Adriano/Sidio",
    quotes: 5,
    avgPrice: "R$ 8.00",
    savings: "5%"
  }];
  return <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Visão geral do sistema de cotações - {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button variant="outline" size="sm" className="self-start sm:self-auto">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Últimos 30 dias</span>
          <span className="sm:hidden">30 dias</span>
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Cotações Ativas"
          value="24"
          icon={FileText}
          variant="default"
          trend={{ value: "+12%", label: "vs mês anterior", type: "positive" }}
        />
        <MetricCard
          title="Fornecedores"
          value="18"
          icon={Building2}
          variant="info"
          trend={{ value: "+2", label: "novos este mês", type: "positive" }}
        />
        <MetricCard
          title="Economia Gerada"
          value="R$ 15.847"
          icon={DollarSign}
          variant="success"
          trend={{ value: "+8.2%", label: "vs mês anterior", type: "positive" }}
        />
        <MetricCard
          title="Produtos Cotados"
          value="156"
          icon={Package}
          variant="warning"
          trend={{ value: "+5.1%", label: "itens únicos", type: "positive" }}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Recent Quotes */}
        <Card className="lg:col-span-2 card-elevated border-2 border-primary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base md:text-lg font-semibold">Cotações Recentes</CardTitle>
              <Button variant="ghost" size="sm" className="h-8">
                <span className="hidden sm:inline">Ver todas</span>
                <ArrowUpRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentQuotes.map(quote => <div key={quote.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border-2 border-border hover:border-primary/30 hover:bg-muted/30 transition-all gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground text-sm md:text-base truncate">{quote.product}</span>
                      <StatusBadge status={quote.status as any} />
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground">
                      {quote.quantity} • {quote.supplier} • {quote.date}
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <div className="font-semibold text-success text-base md:text-lg">{quote.bestPrice}</div>
                    <div className="text-xs text-muted-foreground">Melhor preço</div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>

        {/* Top Suppliers */}
        <Card className="card-elevated border-2 border-success/10">
          <CardHeader>
            <CardTitle className="text-base md:text-lg font-semibold">Top Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {topSuppliers.map((supplier, index) => <div key={supplier.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold text-white shrink-0 ${
                      index === 0 ? "bg-gradient-warning" : 
                      index === 1 ? "bg-gradient-info" : 
                      "bg-gradient-primary"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground text-sm md:text-base truncate">{supplier.name}</div>
                      <div className="text-xs text-muted-foreground">{supplier.quotes} cotações</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm md:text-base font-bold text-success">-{supplier.savings}</div>
                    <div className="text-xs text-muted-foreground">economia</div>
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="card-elevated border-2 border-info/10">
        <CardHeader>
          <CardTitle className="text-base md:text-lg font-semibold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
            <IconButton icon={FileText} label="Nova Cotação" variant="default" />
            <IconButton icon={Package} label="Adicionar Produto" variant="success" />
            <IconButton icon={Building2} label="Novo Fornecedor" variant="info" />
            <IconButton icon={ShoppingCart} label="Gerar Pedido" variant="warning" />
          </div>
        </CardContent>
      </Card>
    </div>;
}