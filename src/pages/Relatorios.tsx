import React, { useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  FileText, TrendingUp, Users, ShoppingCart, AlertTriangle, RefreshCw, Calendar,
  ArrowUpDown, Clock, CheckCircle2, XCircle, MinusCircle,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PeriodDialog } from "@/components/reports/layout";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { useRelatorioData } from "@/hooks/useRelatorioData";
import { useDatePeriod } from "@/hooks/useDatePeriod";

// ── Formatadores ────────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

// ── Tooltip customizado do gráfico ──────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className="text-brand font-bold">{formatCurrency(payload[0]?.value || 0)}</p>
      {payload[1] && (
        <p className="text-muted-foreground">{payload[1].value} cotações</p>
      )}
    </div>
  );
}

// ── Skeleton de linha de tabela ─────────────────────────────────────────────────

function TableRowSkeleton({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

// ── Skeleton de card mobile ──────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
      <Skeleton className="h-7 w-7 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

// ── Taxa resposta — ícone colorido ───────────────────────────────────────────────

function RespostaIcon({ taxa }: { taxa: number }) {
  if (taxa >= 80) return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
  if (taxa >= 50) return <MinusCircle className="h-3.5 w-3.5 text-amber-500" />;
  return <XCircle className="h-3.5 w-3.5 text-red-500" />;
}

// ── Componente principal ────────────────────────────────────────────────────────

export default function Relatorios() {
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);

  const {
    startDate, endDate,
    setStartDate, setEndDate,
    applyPreset, dateRangeText,
    loading: loadingPeriod, refreshing,
    refresh,
  } = useDatePeriod();

  const {
    isLoading,
    economiaTotal,
    cotacoesComComparacao,
    cotacoesSemComparacao,
    fornecedoresAtivos,
    totalCotacoes,
    economiaPorMes,
    variacaoProdutos,
    rankingFornecedores,
  } = useRelatorioData({ startDate, endDate });

  const isMobile = useIsMobile();

  const handleApplyPreset = useCallback((days: number) => {
    applyPreset(days);
    setIsPeriodOpen(false);
  }, [applyPreset]);

  const loading = isLoading || loadingPeriod;

  return (
    <PageWrapper>
      <div className={cn(ds.layout.container.page)}>

        {/* ── Cabeçalho ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-border mb-6">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex p-2.5 rounded-xl border bg-card border-border">
              <FileText className="h-5 w-5 text-brand" />
            </div>
            <h1 className="text-[18px] font-bold text-foreground leading-tight">Relatórios</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPeriodOpen(true)}
              className="gap-2 text-xs font-medium h-9"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{dateRangeText}</span>
              <span className="sm:hidden">Período</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={refreshing}
              className="h-9 w-9"
              title="Atualizar dados"
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* ── Hero — economia total ──────────────────────────────────────────── */}
        <Card className="mb-6 border-brand/20 bg-gradient-to-br from-brand/5 to-transparent">
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-10 w-56" />
                <div className="flex gap-6 pt-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-1">Economia gerada cotando no período</p>
                <div className="flex flex-wrap items-baseline gap-3 mb-4">
                  <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                    {formatCurrency(economiaTotal)}
                  </span>
                  {economiaTotal > 0 && (
                    <Badge className="hidden sm:inline-flex bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      ao comparar fornecedores
                    </Badge>
                  )}
                </div>

                {/* Sub-métricas */}
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span><strong className="text-foreground">{totalCotacoes}</strong> cotações</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span><strong className="text-foreground">{cotacoesComComparacao}</strong> com comparação de preços</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span><strong className="text-foreground">{fornecedoresAtivos}</strong> fornecedores ativos</span>
                  </div>
                </div>

                {/* Alerta de oportunidade perdida */}
                {cotacoesSemComparacao > 0 && (
                  <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-amber-800 dark:text-amber-400 text-sm">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      <strong>{cotacoesSemComparacao}</strong> {cotacoesSemComparacao === 1 ? "cotação foi feita" : "cotações foram feitas"} com apenas 1 fornecedor respondendo — sem comparação de preços possível.
                    </span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Grid: gráfico + tabela de produtos ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Economia por mês */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">Economia por mês (R$)</CardTitle>
              <p className="text-xs text-muted-foreground">Últimos 6 meses — quanto você economizou comparando fornecedores</p>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Skeleton className="h-full w-full rounded-lg" />
                </div>
              ) : economiaPorMes.every(m => m.economia === 0) ? (
                <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <TrendingUp className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Nenhuma economia registrada no período</p>
                  <p className="text-xs opacity-70">Cote com 2+ fornecedores por produto para gerar comparação</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={economiaPorMes} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" opacity={0.3} vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="economia" radius={[6, 6, 0, 0]} name="Economia">
                      {economiaPorMes.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.economia > 0 ? "#3b82f6" : "#e4e4e7"}
                          className={entry.economia > 0 ? "" : "dark:fill-zinc-700"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Produtos com maior variação de preço */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-foreground">Produtos com maior variação de preço</CardTitle>
              <p className="text-xs text-muted-foreground">Onde cotar com vários fornecedores mais vale a pena</p>
            </CardHeader>
            <CardContent className="pt-0 px-0">
              {isLoading ? (
                <div>
                  {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
                </div>
              ) : variacaoProdutos.length === 0 ? (
                <div className="h-[220px] flex flex-col items-center justify-center text-muted-foreground gap-2 px-6">
                  <ArrowUpDown className="h-8 w-8 opacity-30" />
                  <p className="text-sm text-center">Não há dados suficientes para calcular variação</p>
                  <p className="text-xs opacity-70 text-center">Necessário pelo menos 2 fornecedores respondendo ao mesmo produto</p>
                </div>
              ) : isMobile ? (
                /* Mobile: produto + faixa de preço inline, badge de variação à direita */
                <div>
                  {variacaoProdutos.map((p, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 px-4 py-3 border-b border-border/50">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-foreground text-sm truncate" title={p.produto}>{p.produto}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {p.numFornecedores} fornecedores · {formatCurrency(p.precoMin)} → {formatCurrency(p.precoMax)}
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          "text-xs font-bold shrink-0 mt-0.5",
                          p.variacaoPercent >= 20
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : p.variacaoPercent >= 10
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}
                      >
                        {formatPercent(p.variacaoPercent)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop: tabela completa com colunas min/máx */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mín</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Máx</th>
                        <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Variação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variacaoProdutos.map((p, i) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground truncate max-w-[160px]" title={p.produto}>{p.produto}</div>
                            <div className="text-xs text-muted-foreground">{p.numFornecedores} fornecedores · {p.cotacoes} {p.cotacoes === 1 ? "cotação" : "cotações"}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">{formatCurrency(p.precoMin)}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">{formatCurrency(p.precoMax)}</td>
                          <td className="px-4 py-3 text-right">
                            <Badge
                              className={cn(
                                "text-xs font-bold",
                                p.variacaoPercent >= 20
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : p.variacaoPercent >= 10
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              )}
                            >
                              {formatPercent(p.variacaoPercent)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Ranking de fornecedores ────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Ranking de fornecedores</CardTitle>
            <p className="text-xs text-muted-foreground">Ordenado por economia gerada — quem oferece os menores preços</p>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            {isLoading ? (
              <div>
                {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : rankingFornecedores.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Users className="h-8 w-8 opacity-30" />
                <p className="text-sm">Nenhum fornecedor encontrado no período</p>
              </div>
            ) : isMobile ? (
              /* Mobile: cada fornecedor como card compacto */
              <div>
                {rankingFornecedores.map((f, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-border/50">
                    {/* Posição */}
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                      {i + 1}
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground text-sm truncate">{f.nome}</div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShoppingCart className="h-3 w-3" />
                          {f.cotacoes} {f.cotacoes === 1 ? "cotação" : "cotações"}
                        </span>
                        <span className="flex items-center gap-1 text-xs">
                          <RespostaIcon taxa={f.taxaResposta} />
                          <span className={cn(
                            "font-medium",
                            f.taxaResposta >= 80 ? "text-green-600 dark:text-green-400"
                              : f.taxaResposta >= 50 ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                          )}>
                            {formatPercent(f.taxaResposta)} resp.
                          </span>
                        </span>
                        {f.tempoMedio !== null && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {f.tempoMedio.toFixed(1)}d
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Economia gerada — destaque */}
                    <div className="text-right shrink-0">
                      {f.economiaGerada > 0 ? (
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(f.economiaGerada)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      <div className="text-[10px] text-muted-foreground mt-0.5">economia</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop: tabela completa */
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fornecedor</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cotações</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Taxa resposta</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Economia gerada</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tempo médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingFornecedores.map((f, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 text-muted-foreground font-medium text-xs">{i + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">{f.nome}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{f.cotacoes}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "font-semibold",
                            f.taxaResposta >= 80 ? "text-green-600 dark:text-green-400"
                              : f.taxaResposta >= 50 ? "text-amber-600 dark:text-amber-400"
                              : "text-red-600 dark:text-red-400"
                          )}>
                            {formatPercent(f.taxaResposta)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {f.economiaGerada > 0 ? (
                            <span className="font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(f.economiaGerada)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {f.tempoMedio !== null ? (
                            <span className="flex items-center justify-end gap-1 text-muted-foreground text-xs">
                              <Clock className="h-3 w-3" />
                              {f.tempoMedio.toFixed(1)}d
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <PeriodDialog
        isOpen={isPeriodOpen}
        onOpenChange={setIsPeriodOpen}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApplyPreset={handleApplyPreset}
      />
    </PageWrapper>
  );
}
