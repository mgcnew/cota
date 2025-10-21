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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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

  // Dados para radar chart (normalizar scores para 0-100)
  const radarData = topFornecedores.map(f => {
    const tempoNumerico = parseFloat(f.tempo.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    return {
      fornecedor: f.fornecedor.substring(0, 15) + (f.fornecedor.length > 15 ? '...' : ''),
      'Score Geral': f.score,
      'Taxa Resposta': f.score, // usando score como proxy
      'Rapidez': Math.max(0, 100 - (tempoNumerico * 10)), // Inverter e normalizar tempo
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
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                  name="Score"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Radar Chart - Análise Multidimensional */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Análise Multidimensional - Top 5
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid className="stroke-muted" />
                <PolarAngleAxis 
                  dataKey="fornecedor" 
                  tick={{ fontSize: 11 }}
                />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  name="Métricas"
                  dataKey="Score Geral"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
              </RadarChart>
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
        <Card className="lg:col-span-2">
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
                  fill="hsl(var(--chart-3))" 
                  radius={[4, 4, 0, 0]}
                  name="Score de Performance"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
