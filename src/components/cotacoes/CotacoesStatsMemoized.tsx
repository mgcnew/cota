import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, DollarSign, Building2 } from 'lucide-react';

interface StatsData {
  porStatus: {
    ativas: number;
    pendentes: number;
    concluidas: number;
    expiradas: number;
    planejadas: number;
  };
  percentualAtivas: number;
  pendentesMais24h: number;
  economiaFormatada: string;
  totalFornecedoresUnicos: number;
  mediaFornecedores: number;
}

interface CotacoesStatsMemoizedProps {
  stats: StatsData;
}

/**
 * Cards de estatísticas memoizados
 * - Evita re-renders quando stats não mudam
 * - Componente separado para melhor performance
 */
export const CotacoesStatsMemoized = memo<CotacoesStatsMemoizedProps>(
  function CotacoesStatsMemoized({ stats }) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Ativas */}
        <Card className="bg-teal-600 dark:bg-[#1C1F26] border border-teal-500/30 dark:border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-700/50 dark:bg-gray-800">
                <FileText className="h-4 w-4 text-white dark:text-gray-400" />
              </div>
              <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
                Ativas
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-white">
                {stats.porStatus.ativas}
              </span>
              {stats.percentualAtivas > 0 && (
                <Badge className="bg-teal-700/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
                  {stats.percentualAtivas}%
                </Badge>
              )}
            </div>
            <div className="text-xs text-white/80 mt-2.5 pt-2.5 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span>Cotações ativas:</span>
                <span className="font-medium text-white">{stats.porStatus.ativas}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Pendentes */}
        <Card className="bg-primary dark:bg-[#1C1F26] border border-primary/30 dark:border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/50 dark:bg-gray-800">
                <Calendar className="h-4 w-4 text-white dark:text-gray-400" />
              </div>
              <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
                Pendentes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            <div className="flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-white">
                {stats.porStatus.pendentes}
              </span>
              {stats.pendentesMais24h > 0 && (
                <Badge className="bg-primary/60 text-white font-medium border-0 px-2 py-0.5 text-xs">
                  ⚠ {stats.pendentesMais24h}
                </Badge>
              )}
            </div>
            <div className="text-xs text-white/80 mt-2.5 pt-2.5 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span>Aguardando resposta:</span>
                <span className="font-medium text-white">{stats.porStatus.pendentes}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Economia */}
        <Card className="bg-green-600 dark:bg-[#1C1F26] border border-green-500/30 dark:border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-green-700/50 dark:bg-gray-800">
                <DollarSign className="h-4 w-4 text-white dark:text-gray-400" />
              </div>
              <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
                Economia Total
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            <div className="text-2xl font-bold text-white">
              {stats.economiaFormatada}
            </div>
            <div className="text-xs text-white/80 mt-2.5 pt-2.5 border-t border-white/10">
              <span>Economia acumulada</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Fornecedores */}
        <Card className="bg-purple-600 dark:bg-[#1C1F26] border border-purple-500/30 dark:border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-700/50 dark:bg-gray-800">
                <Building2 className="h-4 w-4 text-white dark:text-gray-400" />
              </div>
              <CardTitle className="text-sm font-medium text-white dark:text-gray-300">
                Fornecedores
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            <div className="text-2xl font-bold text-white">
              {stats.totalFornecedoresUnicos}
            </div>
            <div className="text-xs text-white/80 mt-2.5 pt-2.5 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span>Média por cotação:</span>
                <span className="font-medium text-white">{stats.mediaFornecedores}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  },
  // Comparador - só re-renderiza se stats mudarem
  (prevProps, nextProps) => {
    return (
      prevProps.stats.porStatus.ativas === nextProps.stats.porStatus.ativas &&
      prevProps.stats.porStatus.pendentes === nextProps.stats.porStatus.pendentes &&
      prevProps.stats.economiaFormatada === nextProps.stats.economiaFormatada &&
      prevProps.stats.totalFornecedoresUnicos === nextProps.stats.totalFornecedoresUnicos
    );
  }
);
