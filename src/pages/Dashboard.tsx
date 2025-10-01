import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
import { Package, Building2, FileText, DollarSign, Calendar, ArrowUpRight, Loader2, TrendingUp, Users } from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
export default function Dashboard() {
  // OPTIMIZED: Use custom hook with React Query and memoization
  const {
    metrics,
    recentQuotes,
    topSuppliers,
    monthlyData,
    isLoading
  } = useDashboard();
  const pieChartData = useMemo(() => topSuppliers.map((supplier, index) => ({
    name: supplier.name,
    value: supplier.quotes,
    fill: `hsl(var(--chart-${index + 1}))`
  })), [topSuppliers]);
  const COLORS = ['hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--primary))', 'hsl(var(--success))'];
  const chartConfig = {
    economia: {
      label: "Economia",
      color: "hsl(var(--success))"
    },
    cotacoes: {
      label: "Cotações",
      color: "hsl(var(--info))"
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>;
  }
  return <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-4xl text-[#ff4c00]">Dashboard</h1>
          <p className="text-sm text-inherit md:text-lg">
            Visão geral do sistema de cotações - {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Button variant="outline" size="sm" className="self-start sm:self-auto bg-inherit">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Últimos 30 dias</span>
          <span className="sm:hidden">30 dias</span>
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Cotações Ativas" value={metrics.cotacoesAtivas.toString()} icon={FileText} variant="default" />
        <MetricCard title="Fornecedores" value={metrics.fornecedores.toString()} icon={Building2} variant="info" />
        <MetricCard title="Economia Gerada" value={`R$ ${metrics.economiaGerada.toFixed(2)}`} icon={DollarSign} variant="success" />
        <MetricCard title="Produtos Cotados" value={metrics.produtosCotados.toString()} icon={Package} variant="warning" />
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {/* Pie Chart - Top Fornecedores */}
        <Card className="card-gradient-primary group">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base md:text-lg font-semibold">Distribuição por Fornecedores</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} label={({
                  name,
                  percent
                }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={({
                  active,
                  payload
                }) => {
                  if (active && payload && payload.length) {
                    return <div className="rounded-lg border bg-background p-2 shadow-sm">
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
                          </div>;
                  }
                  return null;
                }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Line Chart - Desempenho Mensal */}
        <Card className="card-gradient-success group">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <CardTitle className="text-base md:text-lg font-semibold">Desempenho Mensal</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" className="text-xs" stroke="hsl(var(--muted-foreground))" tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={({
                  active,
                  payload
                }) => {
                  if (active && payload && payload.length) {
                    return <div className="rounded-lg border bg-background p-3 shadow-sm">
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
                          </div>;
                  }
                  return null;
                }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="economia" stroke="hsl(var(--success))" strokeWidth={2} name="Economia (R$)" dot={{
                  fill: "hsl(var(--success))"
                }} />
                  <Line yAxisId="right" type="monotone" dataKey="cotacoes" stroke="hsl(var(--info))" strokeWidth={2} name="Cotações" dot={{
                  fill: "hsl(var(--info))"
                }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Recent Quotes */}
        <Card className="lg:col-span-2 card-gradient-info group">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-info/10 group-hover:bg-info/20 transition-colors">
                  <FileText className="h-4 w-4 text-info" />
                </div>
                <CardTitle className="text-base md:text-lg font-semibold">Cotações Recentes</CardTitle>
              </div>
              <Button variant="ghost" size="sm" className="h-8">
                <span className="hidden sm:inline">Ver todas</span>
                <ArrowUpRight className="h-4 w-4 sm:ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentQuotes.map(quote => <div key={quote.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border-2 border-border hover:border-info/40 hover:bg-gradient-to-r hover:from-info/5 hover:to-transparent hover:shadow-lg hover:scale-[1.01] transition-all duration-300 gap-2 group/item">
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
        <Card className="card-gradient-warning group">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors">
                <Users className="h-4 w-4 text-warning" />
              </div>
              <CardTitle className="text-base md:text-lg font-semibold">Top Fornecedores</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {topSuppliers.map((supplier, index) => <div key={supplier.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-gradient-to-r hover:from-warning/5 hover:to-transparent border border-transparent hover:border-warning/20 hover:shadow-md transition-all duration-300">
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