import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Fornecedor {
  fornecedor: string;
  score: number;
  cotacoes: number;
  economia: string;
  tempo: string;
}

interface TendenciaMensal {
  mes: string;
  cotacoes: number;
  economia: number;
  valor?: number;
}

interface PerformanceChartsProps {
  performanceFornecedores: Fornecedor[];
  tendenciasMensais: TendenciaMensal[];
}

export function PerformanceCharts({
  performanceFornecedores,
  tendenciasMensais,
}: PerformanceChartsProps) {
  // Top 5 fornecedores
  const topFornecedores = performanceFornecedores.slice(0, 5);

  // Cores para os gráficos
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

  // Dados para pizza chart - distribuição de scores
  const pieData = topFornecedores.map((f, index) => ({
    name: f.fornecedor.substring(0, 20) + (f.fornecedor.length > 20 ? '...' : ''),
    value: f.score,
    color: COLORS[index % COLORS.length],
  }));

  // Dados para economia total por fornecedor
  const economiaData = topFornecedores.map(f => {
    const economiaNum = parseFloat(f.economia.replace('%', '')) || 0;
    return {
      fornecedor: f.fornecedor.substring(0, 15) + (f.fornecedor.length > 15 ? '...' : ''),
      economia: economiaNum,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">
          Análise de Performance
        </h2>
        <p className="text-sm text-muted-foreground">
          Visualizações detalhadas de métricas e tendências
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativo de Fornecedores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Top 5 Fornecedores - Score de Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topFornecedores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis 
                  type="category" 
                  dataKey="fornecedor" 
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar 
                  dataKey="score" 
                  radius={[0, 4, 4, 0]}
                  name="Score"
                >
                  {topFornecedores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pizza Chart - Distribuição de Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Distribuição de Performance - Top 5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => [`Score: ${value.toFixed(1)}`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendência Mensal - Cotações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Evolução Mensal - Número de Cotações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendenciasMensais}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cotacoes"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Cotações"
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tendência Mensal - Economia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Evolução Mensal - Taxa de Economia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={tendenciasMensais}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="mes" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="economia"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="Taxa de Economia (%)"
                  dot={{ fill: 'hsl(var(--chart-2))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Taxa de Resposta */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Taxa de Resposta por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topFornecedores}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="fornecedor" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Bar 
                  dataKey="score" 
                  radius={[4, 4, 0, 0]}
                  name="Score de Performance"
                >
                  {topFornecedores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Novo Gráfico - Economia Total por Fornecedor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Economia Alcançada por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={economiaData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="fornecedor" 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Legend />
                <Bar 
                  dataKey="economia" 
                  radius={[4, 4, 0, 0]}
                  name="Taxa de Economia (%)"
                >
                  {economiaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
