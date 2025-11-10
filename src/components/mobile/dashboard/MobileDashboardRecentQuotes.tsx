import { memo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentQuote {
  id: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  created_at: string;
}

interface MobileDashboardRecentQuotesProps {
  quotes: RecentQuote[];
  isLoading?: boolean;
  onLoadQuotes: () => void;
}

/**
 * Lista de cotações recentes - otimizada mobile
 * 
 * Features:
 * - Carregamento lazy (só quando expandir)
 * - Lista simples sem virtualização (max 5 itens)
 * - Cards compactos
 * - Navegação direta
 */
export const MobileDashboardRecentQuotes = memo<MobileDashboardRecentQuotesProps>(
  function MobileDashboardRecentQuotes({ quotes, isLoading, onLoadQuotes }) {
    const navigate = useNavigate();
    const [expanded, setExpanded] = useState(false);

    const handleExpand = useCallback(() => {
      if (!expanded && quotes.length === 0) {
        onLoadQuotes();
      }
      setExpanded(!expanded);
    }, [expanded, quotes.length, onLoadQuotes]);

    const getStatusBadge = (status: string) => {
      const configs = {
        ativa: { variant: 'default' as const, label: 'Ativa' },
        concluida: { variant: 'secondary' as const, label: 'Concluída' },
        pendente: { variant: 'outline' as const, label: 'Pendente' },
        expirada: { variant: 'destructive' as const, label: 'Expirada' },
      };
      const config = configs[status as keyof typeof configs] || { variant: 'outline' as const, label: status };
      return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
      <Card className="mb-6 bg-white dark:bg-[#1C1F26] border border-gray-200/80 dark:border-gray-700/30">
        <CardHeader 
          className="pb-3 cursor-pointer" 
          onClick={handleExpand}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Cotações Recentes
            </CardTitle>
            <ChevronRight 
              className={`h-5 w-5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} 
            />
          </div>
        </CardHeader>

        {expanded && (
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : quotes.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                Nenhuma cotação recente
              </div>
            ) : (
              <div className="space-y-2">
                {quotes.map((quote) => (
                  <div
                    key={quote.id}
                    onClick={() => navigate('/dashboard/cotacoes')}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        #{quote.id.substring(0, 8)}
                      </span>
                      {getStatusBadge(quote.status)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="h-3 w-3" />
                      {format(new Date(quote.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/dashboard/cotacoes');
              }}
            >
              Ver Todas as Cotações
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }
);
