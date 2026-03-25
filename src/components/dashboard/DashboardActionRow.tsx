import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, Truck, DollarSign } from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
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
  economiaGerada 
}: DashboardActionRowProps) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      {/* 1. Prontas para Decisão (Alta Prioridade) */}
      <MetricCard
        title="Ação Necessária"
        value={prontasParaDecisao.length}
        subtitle="Cotações prontas para decisão"
        icon={CheckCircle2}
        variant="default"
        onClick={prontasParaDecisao.length > 0 ? () => navigate('/dashboard/compras?tab=cotacoes&filter=prontas') : undefined}
        className={prontasParaDecisao.length === 0 ? "opacity-60 grayscale hover:scale-100 hover:shadow-none cursor-default" : ""}
      />

      {/* 2. Vencendo Hoje */}
      <MetricCard
        title="Vencendo Hoje"
        value={vencendo.length}
        subtitle="Cotações expirando em breve"
        icon={AlertTriangle}
        variant="warning"
        onClick={vencendo.length > 0 ? () => navigate('/dashboard/compras?tab=cotacoes&filter=vencendo') : undefined}
        className={vencendo.length === 0 ? "opacity-60 grayscale hover:scale-100 hover:shadow-none cursor-default" : ""}
      />

      {/* 3. Entregas (Pedidos em andamento) */}
      <MetricCard
        title="Pedidos em Trânsito"
        value={pedidosEmTransito}
        subtitle="Aguardando entrega"
        icon={Truck}
        variant="info"
        onClick={pedidosEmTransito > 0 ? () => navigate('/dashboard/compras?tab=pedidos') : undefined}
        className={pedidosEmTransito === 0 ? "opacity-60 grayscale hover:scale-100 hover:shadow-none cursor-default" : ""}
      />

      {/* 4. Saúde Financeira */}
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
