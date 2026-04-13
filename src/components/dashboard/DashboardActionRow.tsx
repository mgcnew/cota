import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Truck, DollarSign } from 'lucide-react';

import { MetricCard } from '@/components/ui/metric-card';
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
}

export const DashboardActionRow = memo(({
  prontasParaDecisao,
  vencendo,
  pedidosEmTransito,
  economiaGerada,
}: DashboardActionRowProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobileDevice();

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
      <MetricCard
        title="Ação Necessária"
        value={prontasParaDecisao.length}
        subtitle="Cotações prontas para decisão"
        icon={CheckCircle2}
        variant="default"
        onClick={prontasParaDecisao.length > 0 ? () => navigate('/dashboard/compras?tab=cotacoes&filter=prontas') : undefined}
        className={prontasParaDecisao.length === 0 ? "opacity-60 grayscale hover:scale-100 hover:shadow-none cursor-default" : ""}
      />

      <MetricCard
        title="Vencendo Hoje"
        value={vencendo.length}
        subtitle="Cotações expirando em breve"
        icon={AlertTriangle}
        variant="warning"
        onClick={vencendo.length > 0 ? () => navigate('/dashboard/compras?tab=cotacoes&filter=vencendo') : undefined}
        className={vencendo.length === 0 ? "opacity-60 grayscale hover:scale-100 hover:shadow-none cursor-default" : ""}
      />

      <MetricCard
        title="Pedidos em Trânsito"
        value={pedidosEmTransito}
        subtitle="Aguardando entrega"
        icon={Truck}
        variant="info"
        onClick={pedidosEmTransito > 0 ? () => navigate('/dashboard/compras?tab=pedidos') : undefined}
        className={pedidosEmTransito === 0 ? "opacity-60 grayscale hover:scale-100 hover:shadow-none cursor-default" : ""}
      />

      <MetricCard
        title="Economia do Mês"
        value={formatCurrency(economiaGerada)}
        subtitle="Nas cotações fechadas"
        icon={DollarSign}
        variant="success"
      />
    </div>
  );
});
