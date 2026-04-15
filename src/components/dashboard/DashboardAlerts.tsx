import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowRight, CalendarClock, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuoteStat {
  id: string;
  dataFim: string;
}

interface SupplierStat {
  id: string;
  name: string;
}

interface DashboardAlertsProps {
  prontasParaDecisao: QuoteStat[];
  vencendo: QuoteStat[];
  scheduledSuppliers?: SupplierStat[];
}

export const DashboardAlerts = memo(({ prontasParaDecisao, vencendo, scheduledSuppliers = [] }: DashboardAlertsProps) => {
  const navigate = useNavigate();
  const [dismissedSuppliers, setDismissedSuppliers] = useState<string[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const key = `dismissed_supplier_alerts_${today}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) setDismissedSuppliers(JSON.parse(stored));
    } catch (err) {
      console.error("Error reading dismissed alerts", err);
    }
  }, []);

  const handleDismiss = (supplierId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const key = `dismissed_supplier_alerts_${today}`;
    const newDismissed = [...dismissedSuppliers, supplierId];
    setDismissedSuppliers(newDismissed);
    try {
      localStorage.setItem(key, JSON.stringify(newDismissed));
    } catch (err) {
      console.error("Error saving dismissed alerts", err);
    }
  };

  const visibleSuppliers = scheduledSuppliers.filter(s => !dismissedSuppliers.includes(s.id));

  if (prontasParaDecisao.length === 0 && vencendo.length === 0 && visibleSuppliers.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Cotações Prontas para Decisão */}
      {prontasParaDecisao.length > 0 && (
        <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 transition-smooth hover:shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">
                {prontasParaDecisao.length} cotação(ões) pronta(s) para decisão
              </h3>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                Todos os fornecedores já responderam
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {prontasParaDecisao.slice(0, 3).map(q => (
                  <span key={q.id} className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                    #{q.id.substring(0, 6)}
                  </span>
                ))}
                {prontasParaDecisao.length > 3 && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">
                    +{prontasParaDecisao.length - 3} mais
                  </span>
                )}
              </div>
            </div>
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white transition-smooth"
              onClick={() => navigate('/dashboard/compras?tab=cotacoes')}
            >
              Ver <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Cotações Vencendo */}
      {vencendo.length > 0 && (
        <Card className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 transition-smooth hover:shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500 shadow-sm">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                {vencendo.length} cotação(ões) vencendo em 48h
              </h3>
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                Prazo expirando em breve
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {vencendo.slice(0, 3).map(q => (
                  <span key={q.id} className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                    #{q.id.substring(0, 6)} • {q.dataFim}
                  </span>
                ))}
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 transition-smooth"
              onClick={() => navigate('/dashboard/compras?tab=cotacoes')}
            >
              Ver <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* Alertas de Fornecedores Agendados */}
      {visibleSuppliers.map(supplier => (
        <Card key={supplier.id} className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 transition-smooth hover:shadow-md relative group">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleDismiss(supplier.id)}
            title="Ignorar hoje"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500 shadow-sm">
              <CalendarClock className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 truncate" title="Dia de Pedido programado">
                Pedido Programado
              </h3>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mt-1 truncate">
                {supplier.name}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Hoje é o dia programado para fechar com este fornecedor.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 transition-smooth flex-1"
                  onClick={() => navigate(`/dashboard/compras?tab=cotacoes&open=new&supplierId=${supplier.id}`)}
                >
                  Nova Cotação
                </Button>
                <Button 
                  size="sm" 
                  className="bg-blue-600 hover:bg-blue-700 text-white transition-smooth flex-1"
                  onClick={() => navigate(`/dashboard/compras?tab=pedidos&open=new&supplierId=${supplier.id}`)}
                >
                  Novo Pedido
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
});
