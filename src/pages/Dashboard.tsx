import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
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

  const monthlyData = [
    { month: 'Abr', economia: 12500, cotacoes: 18 },
    { month: 'Mai', economia: 14200, cotacoes: 22 },
    { month: 'Jun', economia: 13800, cotacoes: 20 },
    { month: 'Jul', economia: 15100, cotacoes: 24 },
    { month: 'Ago', economia: 14600, cotacoes: 21 },
    { month: 'Set', economia: 15847, cotacoes: 24 }
  ];

  const pieChartData = topSuppliers.map((supplier, index) => ({
    name: supplier.name,
    value: supplier.quotes,
    fill: `hsl(var(--chart-${index + 1}))`
  }));

  const COLORS = [
    'hsl(var(--warning))',
    'hsl(var(--info))',
    'hsl(var(--primary))',
    'hsl(var(--success))'
  ];

  const chartConfig = {
    economia: {
      label: "Economia",
      color: "hsl(var(--success))",
    },
    cotacoes: {
      label: "Cotações",
      color: "hsl(var(--info))",
    },
  };
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
        <MetricCard title="Cotações Ativas" value="24" icon={FileText} variant="default" trend={{
        value: "+12%",
        label: "vs mês anterior",
        type: "positive"
      }} />
        <MetricCard title="Fornecedores" value="18" icon={Building2} variant="info" trend={{
        value: "+2",
        label: "novos este mês",
        type: "positive"
      }} />
        <MetricCard title="Economia Gerada" value="R$ 15.847" icon={DollarSign} variant="success" trend={{
        value: "+8.2%",
        label: "vs mês anterior",
        type: "positive"
      }} />
        <MetricCard title="Produtos Cotados" value="156" icon={Package} variant="warning" trend={{
        value: "+5.1%",
        label: "itens únicos",
        type: "positive"
      }} />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Pie Chart - Top Fornecedores */}
        <Card className="card-elevated border-2 border-primary/10">
          <CardHeader>
            <CardTitle className="text-base md:text-lg font-semibold">Distribuição por Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  {payload[0].name}
                                </span>
                                <span className="font-bold text-foreground">
                                  {payload[0].value} cotações
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Line Chart - Desempenho Mensal */}
        <Card className="card-elevated border-2 border-success/10">
          <CardHeader>
            <CardTitle className="text-base md:text-lg font-semibold">Desempenho Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    yAxisId="left"
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-3 shadow-sm">
                            <div className="grid gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Economia
                                </span>
                                <span className="font-bold text-success">
                                  R$ {payload[0]?.value?.toLocaleString('pt-BR')}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Cotações
                                </span>
                                <span className="font-bold text-info">
                                  {payload[1]?.value}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="economia" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    name="Economia (R$)"
                    dot={{ fill: "hsl(var(--success))" }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="cotacoes" 
                    stroke="hsl(var(--info))" 
                    strokeWidth={2}
                    name="Cotações"
                    dot={{ fill: "hsl(var(--info))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
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
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold text-white shrink-0 ${index === 0 ? "bg-warning" : index === 1 ? "bg-info" : "bg-primary"}`}>
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
    </div>;
}