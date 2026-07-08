import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Truck, DollarSign, BarChart3 } from 'lucide-react';

import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { MobileMetricCard } from '@/components/dashboard/MobileMetricCard';
import { MobileMetricRibbon } from '@/components/dashboard/MobileMetricRibbon';
import { useIsMobileDevice } from '@/hooks/use-mobile-device';
import { formatCurrency } from '@/utils/formatters';

interface QuoteStat {
  id: string;
  dataFim: string;
}

interface DashboardActionRowProps {
  prontasParaDecisao: QuoteStat[];
  vencendo: QuoteStat[];
  pedidosEmTransito: number;
  economiaGerada: number;
  /** Variação real vs. mês anterior (%), já calculada em useDashboard. */
  economiaCrescimento?: number;
  /** Série real dos últimos 3 meses (2 meses atrás → mês anterior → mês atual). */
  economiaSparkline?: number[];
}

export const DashboardActionRow = memo(({
  prontasParaDecisao,
  vencendo,
  pedidosEmTransito,
  economiaGerada,
  economiaCrescimento,
  economiaSparkline,
}: DashboardActionRowProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobileDevice();

  const economiaTrend = economiaCrescimento !== undefined
    ? {
        value: `${economiaCrescimento >= 0 ? "+" : ""}${economiaCrescimento}%`,
        label: "vs mês anterior",
        type: (economiaCrescimento > 0 ? "positive" : economiaCrescimento < 0 ? "negative" : "neutral") as const,
      }
    : undefined;

  // ── MOBILE: Horizontal scrolling ribbon ────────────────────────────
  if (isMobile) {
    return (
      <div className="mb-6">
        <MobileMetricRibbon>
          {/* 1. Ação Necessária */}
          <MobileMetricCard
            title="Ação Necessária"
            value={prontasParaDecisao.length}
            subtitle="Cotações prontas p/ decisão"
            icon={CheckCircle2}
            variant="default"
            pulse={prontasParaDecisao.length > 0}
            isEmpty={prontasParaDecisao.length === 0}
            onClick={
              prontasParaDecisao.length > 0
                ? () => navigate('/dashboard/compras?tab=cotacoes&filter=prontas')
                : undefined
            }
          />

          {/* 2. Vencendo */}
          <MobileMetricCard
            title="Vencendo Hoje"
            value={vencendo.length}
            subtitle="Cotações expirando em breve"
            icon={AlertTriangle}
            variant="warning"
            pulse={vencendo.length > 0}
            isEmpty={vencendo.length === 0}
            onClick={
              vencendo.length > 0
                ? () => navigate('/dashboard/compras?tab=cotacoes&filter=vencendo')
                : undefined
            }
          />

          {/* 3. Pedidos em Trânsito */}
          <MobileMetricCard
            title="Em Trânsito"
            value={pedidosEmTransito}
            subtitle="Pedidos aguardando entrega"
            icon={Truck}
            variant="info"
            isEmpty={pedidosEmTransito === 0}
            onClick={
              pedidosEmTransito > 0
                ? () => navigate('/dashboard/compras?tab=pedidos')
                : undefined
            }
          />

          {/* 4. Economia do Mês */}
          <MobileMetricCard
            title="Economia do Mês"
            value={formatCurrency(economiaGerada)}
            subtitle="Nas cotações fechadas"
            icon={DollarSign}
            variant="success"
          />
        </MobileMetricRibbon>
      </div>
    );
  }

// ── DESKTOP: Grid 4 colunas (layout original) ───────────────────────
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      <DashboardStatCard
        title="Ação Necessária"
        value={prontasParaDecisao.length}
        subtitle="Cotações prontas para decisão"
        icon={CheckCircle2}
        variant="default"
        pulse={prontasParaDecisao.length > 0}
        onClick={prontasParaDecisao.length > 0 ? () => navigate('/dashboard/compras?tab=cotacoes&filter=prontas') : undefined}
      />

      <DashboardStatCard
        title="Vencendo Hoje"
        value={vencendo.length}
        subtitle="Cotações expirando em breve"
        icon={AlertTriangle}
        variant="warning"
        pulse={vencendo.length > 0}
        onClick={vencendo.length > 0 ? () => navigate('/dashboard/compras?tab=cotacoes&filter=vencendo') : undefined}
      />

      <DashboardStatCard
        title="Pedidos em Trânsito"
        value={pedidosEmTransito}
        subtitle="Aguardando entrega"
        icon={Truck}
        variant="info"
        pulse={pedidosEmTransito > 0}
        onClick={pedidosEmTransito > 0 ? () => navigate('/dashboard/compras?tab=pedidos') : undefined}
      />

      <DashboardStatCard
        title="Economia do Mês"
        value={formatCurrency(economiaGerada)}
        subtitle={economiaTrend ? undefined : "Nas cotações fechadas"}
        trend={economiaTrend}
        sparklineData={economiaSparkline}
        icon={DollarSign}
        variant="success"
        onClick={() => navigate('/dashboard/relatorios')}
      />
    </div>
  );
});
