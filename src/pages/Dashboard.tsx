import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Legend, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Package, Building2, FileText, ShoppingCart, DollarSign, Users, Calendar, ArrowUpRight, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();
  const { toast } = useToast();

  // Estados para dados reais
  const [metrics, setMetrics] = useState({
    cotacoesAtivas: 0,
    fornecedores: 0,
    economiaGerada: 0,
    produtosCotados: 0
  });
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [topSuppliers, setTopSuppliers] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user) {
      loadDashboardData();
    }
  }, [session]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Buscar cotações
      const { data: quotes, error: quotesError } = await supabase
        .from("quotes")
        .select(`
          *,
          quote_items(*),
          quote_suppliers(*)
        `)
        .order("created_at", { ascending: false });

      if (quotesError) throw quotesError;

      // Buscar fornecedores
      const { data: suppliers, error: suppliersError } = await supabase
        .from("suppliers")
        .select("*");

      if (suppliersError) throw suppliersError;

      // Buscar produtos
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("*");

      if (productsError) throw productsError;

      // Buscar pedidos
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("order_date", { ascending: false });

      if (ordersError) throw ordersError;

      // Calcular métricas
      const cotacoesAtivas = quotes?.filter(q => q.status === 'ativa').length || 0;
      const fornecedoresCount = suppliers?.length || 0;
      
      // Calcular economia total
      let economiaTotal = 0;
      quotes?.forEach((quote: any) => {
        if (quote.quote_suppliers && quote.quote_suppliers.length >= 2) {
          const valores = quote.quote_suppliers
            .filter((qs: any) => qs.valor_oferecido > 0)
            .map((qs: any) => qs.valor_oferecido);
          
          if (valores.length >= 2) {
            const melhorPreco = Math.min(...valores);
            const piorPreco = Math.max(...valores);
            economiaTotal += piorPreco - melhorPreco;
          }
        }
      });

      // Produtos únicos cotados
      const produtosUnicos = new Set();
      quotes?.forEach((quote: any) => {
        quote.quote_items?.forEach((item: any) => {
          produtosUnicos.add(item.product_id);
        });
      });

      setMetrics({
        cotacoesAtivas,
        fornecedores: fornecedoresCount,
        economiaGerada: economiaTotal,
        produtosCotados: produtosUnicos.size
      });

      // Preparar cotações recentes
      const recentQuotesData = quotes?.slice(0, 4).map((quote: any) => {
        const melhorOferta = quote.quote_suppliers
          ?.filter((qs: any) => qs.valor_oferecido > 0)
          .sort((a: any, b: any) => a.valor_oferecido - b.valor_oferecido)[0];

        const firstItem = quote.quote_items?.[0];

        return {
          id: quote.id.substring(0, 8),
          product: firstItem?.product_name || "Produto",
          quantity: firstItem?.quantidade || "0",
          bestPrice: melhorOferta ? `R$ ${melhorOferta.valor_oferecido.toFixed(2)}` : "Sem ofertas",
          supplier: melhorOferta?.supplier_name || "-",
          date: new Date(quote.created_at).toLocaleDateString('pt-BR'),
          status: quote.status
        };
      }) || [];

      setRecentQuotes(recentQuotesData);

      // Top fornecedores
      const supplierStats = new Map();
      quotes?.forEach((quote: any) => {
        quote.quote_suppliers?.forEach((qs: any) => {
          if (!supplierStats.has(qs.supplier_id)) {
            supplierStats.set(qs.supplier_id, {
              name: qs.supplier_name,
              quotes: 0,
              totalValue: 0,
              count: 0
            });
          }
          const stats = supplierStats.get(qs.supplier_id);
          stats.quotes += 1;
          if (qs.valor_oferecido > 0) {
            stats.totalValue += qs.valor_oferecido;
            stats.count += 1;
          }
        });
      });

      const topSuppliersData = Array.from(supplierStats.values())
        .sort((a, b) => b.quotes - a.quotes)
        .slice(0, 4)
        .map(supplier => ({
          name: supplier.name,
          quotes: supplier.quotes,
          avgPrice: supplier.count > 0 ? `R$ ${(supplier.totalValue / supplier.count).toFixed(2)}` : "R$ 0.00",
          savings: "0%" // Simplificado por enquanto
        }));

      setTopSuppliers(topSuppliersData);

      // Dados mensais dos últimos 6 meses
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const now = new Date();
      const monthlyDataArray = [];

      for (let i = 5; i >= 0; i--) {
        const mesData = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mesNome = meses[mesData.getMonth()];
        const mesInicio = new Date(mesData.getFullYear(), mesData.getMonth(), 1);
        const mesFim = new Date(mesData.getFullYear(), mesData.getMonth() + 1, 0);

        const quotesDoMes = quotes?.filter((q: any) => {
          const dataInicio = new Date(q.data_inicio);
          return dataInicio >= mesInicio && dataInicio <= mesFim;
        }) || [];

        let economiaDoMes = 0;
        quotesDoMes.forEach((quote: any) => {
          if (quote.quote_suppliers && quote.quote_suppliers.length >= 2) {
            const valores = quote.quote_suppliers
              .filter((qs: any) => qs.valor_oferecido > 0)
              .map((qs: any) => qs.valor_oferecido);
            
            if (valores.length >= 2) {
              const melhorPreco = Math.min(...valores);
              const piorPreco = Math.max(...valores);
              economiaDoMes += piorPreco - melhorPreco;
            }
          }
        });

        monthlyDataArray.push({
          month: mesNome,
          economia: economiaDoMes,
          cotacoes: quotesDoMes.length
        });
      }

      setMonthlyData(monthlyDataArray);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
          value={metrics.cotacoesAtivas.toString()} 
          icon={FileText} 
          variant="default"
        />
        <MetricCard 
          title="Fornecedores" 
          value={metrics.fornecedores.toString()} 
          icon={Building2} 
          variant="info"
        />
        <MetricCard 
          title="Economia Gerada" 
          value={`R$ ${metrics.economiaGerada.toFixed(2)}`} 
          icon={DollarSign} 
          variant="success"
        />
        <MetricCard 
          title="Produtos Cotados" 
          value={metrics.produtosCotados.toString()} 
          icon={Package} 
          variant="warning"
        />
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