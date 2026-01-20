import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuoteStat {
  id: string;
  dataFim: string;
}

interface DashboardAlertsProps {
  prontasParaDecisao: QuoteStat[];
  vencendo: QuoteStat[];
}

export const DashboardAlerts = memo(({ prontasParaDecisao, vencendo }: DashboardAlertsProps) => {
  const navigate = useNavigate();

  if (prontasParaDecisao.length === 0 && vencendo.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Cotações Prontas para Decisão */}
      {prontasParaDecisao.length > 0 && (
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800 transition-smooth hover:shadow-md">
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
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 transition-smooth hover:shadow-md">
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
    </div>
  );
});
